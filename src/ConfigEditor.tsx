import React, { ChangeEvent } from 'react';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { Field, Input, SecretInput, Select, FieldSet } from '@grafana/ui';
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
        <Field label="Auth Type">
          <Select
            width={30}
            options={AUTH_OPTIONS}
            value={jsonData.authType || 'bearer'}
            onChange={(v) => onAuthTypeChange(v.value!)}
          />
        </Field>

        {(jsonData.authType === 'bearer' || !jsonData.authType) && (
          <Field label="Bearer Token" description="Token sent as 'Authorization: Bearer <token>' on all requests.">
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
            <Field label="Username">
              <SecretInput
                width={30}
                placeholder="username"
                isConfigured={Boolean(secureJsonFields?.basicUser)}
                value={secureJsonData.basicUser || ''}
                onChange={onSecureChange('basicUser')}
                onReset={onSecureReset('basicUser')}
              />
            </Field>
            <Field label="Password">
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
