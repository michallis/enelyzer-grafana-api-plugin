import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
} from '@grafana/data';
import { getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { lastValueFrom, Observable } from 'rxjs';
import { defaultQuery, EnelyzerDataSourceOptions, EnelyzerQuery, KeyValuePair } from './types';
import { getEndpointById } from './endpoints';

interface FetchResult {
  data: unknown;
}

export class EnelyzerDataSource extends DataSourceApi<EnelyzerQuery, EnelyzerDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<EnelyzerDataSourceOptions>) {
    super(instanceSettings);
  }

  private getProxyRouteName(service: 'energy-efficiency' | 'asset' | 'co2' | 'acl' | 'graph'): string {
    switch (service) {
      case 'energy-efficiency':
        return 'energy';
      case 'asset':
        return 'asset';
      case 'co2':
        return 'co2';
      case 'acl':
        return 'acl';
      case 'graph':
        return 'graph';
    }
  }

  private interpolate(value: string): string {
    return getTemplateSrv().replace(value, undefined, 'glob');
  }

  private buildUrl(
    path: string,
    pathParams: KeyValuePair[],
    queryParams: KeyValuePair[]
  ): string {
    let url = path;

    for (const p of pathParams) {
      if (p.enabled && p.key) {
        url = url.replace(`{${p.key}}`, encodeURIComponent(this.interpolate(p.value)));
      }
    }

    const qs = queryParams
      .filter((p) => p.enabled && p.key && p.value !== '')
      .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(this.interpolate(p.value))}`)
      .join('&');

    return qs ? `${url}?${qs}` : url;
  }

  private buildBody(
    bodyParams: KeyValuePair[],
    bodyRaw: string,
    useRawBody: boolean
  ): object | string | undefined {
    if (useRawBody) {
      try {
        return JSON.parse(this.interpolate(bodyRaw));
      } catch {
        return this.interpolate(bodyRaw);
      }
    }

    const obj: Record<string, unknown> = {};
    for (const p of bodyParams) {
      if (p.enabled && p.key) {
        obj[p.key] = this.interpolate(p.value);
      }
    }
    return Object.keys(obj).length > 0 ? obj : undefined;
  }

  private extractResultData(responseData: unknown, resultPath: string): unknown[] {
    if (!responseData) {
      return [];
    }

    if (!resultPath) {
      return Array.isArray(responseData) ? responseData : [responseData];
    }

    const parts = resultPath.split('.');
    let current: unknown = responseData;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return [];
      }
      current = (current as Record<string, unknown>)[part];
    }

    return Array.isArray(current) ? current : current !== undefined ? [current] : [];
  }

  private responseToDataFrame(
    data: unknown[],
    refId: string,
    alias: string
  ): MutableDataFrame {
    if (data.length === 0) {
      return new MutableDataFrame({ refId, fields: [] });
    }

    const first = data[0];

    if (typeof first !== 'object' || first === null) {
      return new MutableDataFrame({
        refId,
        name: alias || refId,
        fields: [
          {
            name: alias || 'value',
            type: FieldType.string,
            // MutableDataFrame accepts plain arrays directly — no ArrayVector needed
            values: data.map(String),
          },
        ],
      });
    }

    const keys = Object.keys(first as object);
    const frame = new MutableDataFrame({
      refId,
      name: alias || refId,
      fields: keys.map((key) => {
        const sample = (first as Record<string, unknown>)[key];
        let fieldType = FieldType.string;

        if (typeof sample === 'number') {
          fieldType = FieldType.number;
        } else if (typeof sample === 'boolean') {
          fieldType = FieldType.boolean;
        } else if (typeof sample === 'string') {
          const isDate =
            /^\d{4}-\d{2}-\d{2}/.test(sample) && !isNaN(Date.parse(sample));
          fieldType = isDate ? FieldType.time : FieldType.string;
        }

        return { name: key, type: fieldType };
      }),
    });

    for (const row of data) {
      frame.appendRow(keys.map((k) => (row as Record<string, unknown>)[k]));
    }

    return frame;
  }

  // @grafana/data bundles its own rxjs which produces a different Observable type
  // than the top-level rxjs package. Cast through unknown to bridge the two.
  private fetch(options: Parameters<ReturnType<typeof getBackendSrv>['fetch']>[0]): Observable<FetchResult> {
    return getBackendSrv().fetch(options) as unknown as Observable<FetchResult>;
  }

  /**
   * Grafana's fetch() rejects with a structured object, not an Error:
   *   { status: number, statusText: string, data: unknown, config: ... }
   * This helper extracts a readable message from whatever shape is thrown.
   */
  private extractErrorMessage(err: unknown): string {
    if (err === null || err === undefined) {
      return 'Unknown error';
    }
    if (typeof err === 'string') {
      return err;
    }
    if (err instanceof Error) {
      return err.message;
    }
    // Grafana FetchError shape
    const e = err as Record<string, unknown>;
    const status = typeof e['status'] === 'number' ? e['status'] : undefined;
    const statusText = typeof e['statusText'] === 'string' ? e['statusText'] : '';
    const data = e['data'];
    let detail = '';
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>;
      detail = String(d['message'] ?? d['error'] ?? d['detail'] ?? '');
    } else if (typeof data === 'string' && data.length > 0) {
      detail = data;
    }
    if (status !== undefined) {
      return detail
        ? `HTTP ${status} ${statusText}: ${detail}`
        : `HTTP ${status} ${statusText || 'Error'}`;
    }
    // Last resort — try JSON serialization so we at least see the shape
    try {
      return JSON.stringify(err);
    } catch {
      return 'Unknown error';
    }
  }

  async query(options: DataQueryRequest<EnelyzerQuery>): Promise<DataQueryResponse> {
    const frames = await Promise.all(
      options.targets
        .filter((target) => !target.hide && target.endpointId)
        .map(async (target) => {
          const query = { ...defaultQuery, ...target };
          const endpoint = getEndpointById(query.endpointId);

          if (!endpoint) {
            throw new Error(`Unknown endpoint: ${query.endpointId}`);
          }

          const routeName = this.getProxyRouteName(endpoint.service);
          const builtPath = this.buildUrl(endpoint.path, query.pathParams, query.queryParams);
          const url = `api/datasources/proxy/${this.id}/${routeName}${builtPath}`;

          const body = this.buildBody(query.bodyParams, query.bodyRaw, query.useRawBody);

          const response = await lastValueFrom(
            this.fetch({
              url,
              method: endpoint.method,
              data: body,
              headers: { 'Content-Type': 'application/json' },
            })
          );

          const resultPath = query.resultPath || endpoint.resultPath || '';
          const rows = this.extractResultData(response.data, resultPath);
          return this.responseToDataFrame(rows, target.refId, query.alias);
        })
    );

    return { data: frames };
  }

  async testDatasource(): Promise<{ status: string; message: string }> {
    // Guard: warn immediately if any base URL is not configured.
    // When a URL template renders to empty, Grafana proxies to bare "http://"
    // which looks like a connection error rather than a misconfiguration.
    const jd = this.instanceSettings.jsonData as EnelyzerDataSourceOptions;
    const missingUrls: string[] = [];
    if (!jd.energyEfficiencyBaseUrl) { missingUrls.push('Energy Efficiency'); }
    if (!jd.assetBaseUrl)             { missingUrls.push('Asset'); }
    if (!jd.co2BaseUrl)               { missingUrls.push('CO2'); }
    if (!jd.aclBaseUrl)               { missingUrls.push('ACL / Formula'); }
    if (!jd.graphBaseUrl)             { missingUrls.push('Graph'); }
    if (missingUrls.length > 0) {
      return {
        status: 'error',
        message: `Missing base URL(s): ${missingUrls.join(', ')}. Open the datasource config and fill in all five service URLs.`,
      };
    }

    // Each check hits a lightweight endpoint. A 200, 401, 403, 404, or 405 all
    // mean the proxy reached the backend — only network-level failures (502, 503,
    // ECONNREFUSED, status 0) indicate the base URL is unreachable.
    const checks = [
      {
        name: 'Energy Efficiency',
        // POST to query endpoint — no body needed, returns 400/422 not 404
        url: `api/datasources/proxy/${this.id}/energy/v1/entries/query/energy`,
        method: 'POST' as const,
        data: {},
      },
      {
        name: 'Asset',
        url: `api/datasources/proxy/${this.id}/asset/v1/buildings/search`,
        method: 'GET' as const,
      },
      {
        name: 'CO2',
        // /v1/emissions — note: no /api/ prefix on this service
        url: `api/datasources/proxy/${this.id}/co2/v1/emissions`,
        method: 'GET' as const,
      },
    ];

    const results: string[] = [];
    let allOk = true;

    for (const check of checks) {
      try {
        await lastValueFrom(
          this.fetch({ url: check.url, method: check.method, data: check.data })
        );
        results.push(`✓ ${check.name}`);
      } catch (err: unknown) {
        // A 401/403 means the proxy reached the service — auth issue, not config.
        // A 404 on a specific path is also reachable. Only hard failures matter.
        const e = err as Record<string, unknown>;
        const status = typeof e['status'] === 'number' ? e['status'] : 0;
        if (status === 401 || status === 403 || status === 404 || status === 405) {
          // Backend is reachable — auth or path mismatch, not a URL problem
          results.push(`✓ ${check.name} (reachable, HTTP ${status})`);
        } else {
          const msg = this.extractErrorMessage(err);
          results.push(`✗ ${check.name}: ${msg}`);
          allOk = false;
        }
      }
    }

    return {
      status: allOk ? 'success' : 'error',
      message: results.join(' | '),
    };
  }
}
