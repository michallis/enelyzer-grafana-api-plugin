import React, { ChangeEvent } from 'react';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { Field, Input, SecretInput, Select, FieldSet, Switch, InlineField } from '@grafana/ui';
import { EnelyzerDataSourceOptions, EnelyzerSecureJsonData } from './types';

type Props = DataSourcePluginOptionsEditorProps<EnelyzerDataSourceOptions, EnelyzerSecureJsonData>;

const AUTH_OPTIONS = [
  { label: 'Bearer Token', value: 'bearer' },
  { label: 'Basic Auth', value: 'basic' },
  { label: 'No Authentication', value: 'none' },
];

export function ConfigEditor({ options, onOptionsChange }: Props) {
  const { jsonData, secureJsonFields } = options;
  const secureJsonData = (options.secureJsonData || {}) as EnelyzerSecureJsonData;

  const onJsonDataChange = (key: keyof EnelyzerDataSourceOptions) => (e: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: { ...jsonData, [key]: e.currentTarget.value },
    });
  };

  const onAuthTypeChange = (value: string) => {
    onOptionsChange({
      ...options,
      jsonData: { ...jsonData, authType: value as EnelyzerDataSourceOptions['authType'] },
    });
  };

  const onOAuthPassThruChange = (e: React.FormEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: { ...jsonData, oauthPassThru: (e.target as HTMLInputElement).checked },
    });
  };

  const onSecureChange = (key: keyof EnelyzerSecureJsonData) => (e: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      secureJsonData: { ...secureJsonData, [key]: e.currentTarget.value },
    });
  };

  const onSecureReset = (key: keyof EnelyzerSecureJsonData) => () => {
    onOptionsChange({
      ...options,
      secureJsonFields: { ...secureJsonFields, [key]: false },
      secureJsonData: { ...secureJsonData, [key]: '' },
    });
  };

  const oauthPassThru = Boolean(jsonData.oauthPassThru);

  return (
    <div>
      <FieldSet label="Service Base URLs">
        <Field
          label="Energy Efficiency Service"
          description="Base URL of enelyzer-energy-efficiency-service (e.g. http://enelyzer-energy-efficiency-service.enelyzer.svc.cluster.local)"
        >
          <Input
            width={70}
            placeholder="http://enelyzer-energy-efficiency-service.enelyzer.svc.cluster.local"
            value={jsonData.energyEfficiencyBaseUrl || ''}
            onChange={onJsonDataChange('energyEfficiencyBaseUrl')}
          />
        </Field>

        <Field
          label="Asset Service"
          description="Base URL of enelyzer-asset-service (e.g. http://enelyzer-asset-service.enelyzer.svc.cluster.local)"
        >
          <Input
            width={70}
            placeholder="http://enelyzer-asset-service.enelyzer.svc.cluster.local"
            value={jsonData.assetBaseUrl || ''}
            onChange={onJsonDataChange('assetBaseUrl')}
          />
        </Field>

        <Field
          label="CO2 Service"
          description="Base URL of enelyzer-co2-service (e.g. http://enelyzer-co2-service.enelyzer.svc.cluster.local)"
        >
          <Input
            width={70}
            placeholder="http://enelyzer-co2-service.enelyzer.svc.cluster.local"
            value={jsonData.co2BaseUrl || ''}
            onChange={onJsonDataChange('co2BaseUrl')}
          />
        </Field>

        <Field
          label="ACL / Formula Service"
          description="Base URL of enelyzer-grafana-acl-service (e.g. http://enelyzer-grafana-acl-service.enelyzer.svc.cluster.local)"
        >
          <Input
            width={70}
            placeholder="http://enelyzer-grafana-acl-service.enelyzer.svc.cluster.local"
            value={jsonData.aclBaseUrl || ''}
            onChange={onJsonDataChange('aclBaseUrl')}
          />
        </Field>

        <Field
          label="Graph Service"
          description="Base URL of enelyzer-rust-graph-service (e.g. http://enelyzer-rust-graph-service.enelyzer.svc.cluster.local)"
        >
          <Input
            width={70}
            placeholder="http://enelyzer-rust-graph-service.enelyzer.svc.cluster.local"
            value={jsonData.graphBaseUrl || ''}
            onChange={onJsonDataChange('graphBaseUrl')}
          />
        </Field>
      </FieldSet>

      <FieldSet label="Authentication">
        <Field
          label="Forward logged-in user token"
          description={
            oauthPassThru
              ? "The logged-in user's bearer token is forwarded to all Enelyzer services. The static token below is used only as a fallback (e.g. alerting, background queries)."
              : "Enable to forward the Grafana user's OAuth/OIDC bearer token to Enelyzer services. The organisation_id in endpoint paths is derived from the JWT 'organisations' array. Requires Grafana to be configured with OAuth2 or OIDC login."
          }
        >
          <InlineField label="Enabled" transparent>
            <Switch value={oauthPassThru} onChange={onOAuthPassThruChange} />
          </InlineField>
        </Field>

        <Field
          label="Fallback Auth Type"
          description={
            oauthPassThru
              ? 'Used only when no user token is available (e.g. alerting, background queries).'
              : 'Authentication method used for all requests.'
          }
        >
          <Select
            width={30}
            options={AUTH_OPTIONS}
            value={jsonData.authType || 'bearer'}
            onChange={(v) => onAuthTypeChange(v.value!)}
          />
        </Field>

        {(jsonData.authType === 'bearer' || !jsonData.authType) && (
          <Field
            label={oauthPassThru ? 'Fallback Bearer Token' : 'Bearer Token'}
            description={
              oauthPassThru
                ? 'Used as Authorization header only when no forwarded user token is present.'
                : "Token sent as 'Authorization: Bearer <token>' on all requests."
            }
          >
            <SecretInput
              width={60}
              placeholder="Enter bearer token"
              isConfigured={Boolean(secureJsonFields?.apiToken)}
              value={secureJsonData.apiToken || ''}
              onChange={onSecureChange('apiToken')}
              onReset={onSecureReset('apiToken')}
            />
          </Field>
        )}

        {jsonData.authType === 'basic' && (
          <>
            <Field label={oauthPassThru ? 'Fallback Username' : 'Username'}>
              <SecretInput
                width={30}
                placeholder="username"
                isConfigured={Boolean(secureJsonFields?.basicUser)}
                value={secureJsonData.basicUser || ''}
                onChange={onSecureChange('basicUser')}
                onReset={onSecureReset('basicUser')}
              />
            </Field>
            <Field label={oauthPassThru ? 'Fallback Password' : 'Password'}>
              <SecretInput
                width={30}
                placeholder="password"
                isConfigured={Boolean(secureJsonFields?.basicPassword)}
                value={secureJsonData.basicPassword || ''}
                onChange={onSecureChange('basicPassword')}
                onReset={onSecureReset('basicPassword')}
              />
            </Field>
          </>
        )}
      </FieldSet>
    </div>
  );
}
