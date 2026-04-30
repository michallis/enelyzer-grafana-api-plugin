import { DataQuery, DataSourceJsonData } from '@grafana/data';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

export interface EnelyzerQuery extends DataQuery {
  endpointId: string;
  pathParams: KeyValuePair[];
  queryParams: KeyValuePair[];
  bodyParams: KeyValuePair[];
  bodyRaw: string;
  useRawBody: boolean;
  resultPath: string;
  alias: string;
}

export const defaultQuery: Partial<EnelyzerQuery> = {
  endpointId: '',
  pathParams: [],
  queryParams: [],
  bodyParams: [],
  bodyRaw: '',
  useRawBody: false,
  resultPath: '',
  alias: '',
};

export interface EnelyzerDataSourceOptions extends DataSourceJsonData {
  energyEfficiencyBaseUrl: string;
  assetBaseUrl: string;
  co2BaseUrl: string;
  authType: 'bearer' | 'basic' | 'none';
  /**
   * When true, Grafana's data source proxy forwards the logged-in user's
   * OAuth/OIDC bearer token to the backend, overriding the static apiToken.
   * This is the standard Grafana field name recognised by the proxy.
   */
  oauthPassThru: boolean;
}

export interface EnelyzerSecureJsonData {
  apiToken?: string;
  basicUser?: string;
  basicPassword?: string;
}

export interface EndpointParam {
  name: string;
  label: string;
  in: 'path' | 'query' | 'body';
  required: boolean;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'datetime';
  example?: string;
}

export interface EndpointDefinition {
  id: string;
  service: 'energy-efficiency' | 'asset' | 'co2';
  alias: string;
  description: string;
  method: HttpMethod;
  path: string;
  params: EndpointParam[];
  resultPath?: string;
}
