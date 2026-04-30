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
          description="Base URL of the enelyzer-energy-efficiency-service (e.g. https://energy.enelyzer.example.com)"
        >
          <Input
            width={60}
            placeholder="https://energy.enelyzer.example.com"
            value={jsonData.energyEfficiencyBaseUrl || ''}
            onChange={onJsonDataChange('energyEfficiencyBaseUrl')}
          />
        </Field>

        <Field
          label="Asset Service"
          description="Base URL of the enelyzer-asset-service (e.g. https://asset.enelyzer.example.com)"
        >
          <Input
            width={60}
            placeholder="https://asset.enelyzer.example.com"
            value={jsonData.assetBaseUrl || ''}
            onChange={onJsonDataChange('assetBaseUrl')}
          />
        </Field>

        <Field
          label="CO2 Service"
          description="Base URL of the enelyzer-co2-service (e.g. https://co2.enelyzer.example.com)"
        >
          <Input
            width={60}
            placeholder="https://co2.enelyzer.example.com"
            value={jsonData.co2BaseUrl || ''}
            onChange={onJsonDataChange('co2BaseUrl')}
          />
        </Field>
      </FieldSet>

      <FieldSet label="Authentication">
        <Field
          label="Forward logged-in user token"
          description={
            oauthPassThru
              ? 'The logged-in user\'s bearer token is forwarded to all Enelyzer services. The static token below is ignored when a user token is present, and used only as a fallback.'
              : 'Enable to forward the Grafana user\'s OAuth/OIDC bearer token to Enelyzer services instead of the static token. Requires Grafana to be configured with OAuth2 or OIDC login.'
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
                ? 'Used as Authorization header only when the user has no forwarded token (e.g. alerting rules, server-side rendering).'
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
