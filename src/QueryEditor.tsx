import React, { ChangeEvent, useCallback } from 'react';
import { QueryEditorProps } from '@grafana/data';
import {
  Button,
  Field,
  FieldSet,
  Input,
  InlineFieldRow,
  InlineField,
  InlineSwitch,
  Select,
  TextArea,
  IconButton,
  Badge,
} from '@grafana/ui';
import { EnelyzerDataSource } from './datasource';
import { defaultQuery, EnelyzerDataSourceOptions, EnelyzerQuery, KeyValuePair } from './types';
import { ENDPOINTS, SERVICE_LABELS } from './endpoints';

type Props = QueryEditorProps<EnelyzerDataSource, EnelyzerQuery, EnelyzerDataSourceOptions>;

const ENDPOINT_OPTIONS = Object.entries(SERVICE_LABELS).flatMap(([service, label]) => [
  {
    label,
    value: '__group__' + service,
    isDisabled: true,
  },
  ...ENDPOINTS.filter((e) => e.service === service).map((e) => ({
    label: e.alias,
    value: e.id,
    description: e.description,
  })),
]);

const EMPTY_PARAM: KeyValuePair = { key: '', value: '', enabled: true };

function ParamTable({
  label,
  rows,
  onChange,
  keyPlaceholder = 'key',
  valuePlaceholder = 'value',
}: {
  label: string;
  rows: KeyValuePair[];
  onChange: (rows: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}) {
  const addRow = () => onChange([...rows, { ...EMPTY_PARAM }]);

  const updateRow = (i: number, field: keyof KeyValuePair, value: string | boolean) => {
    const updated = rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r));
    onChange(updated);
  };

  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i));

  return (
    <FieldSet label={label}>
      {rows.map((row, i) => (
        <InlineFieldRow key={i}>
          <InlineField label="">
            <InlineSwitch
              value={row.enabled}
              onChange={(e) => updateRow(i, 'enabled', e.currentTarget.checked)}
            />
          </InlineField>
          <InlineField label="">
            <Input
              width={20}
              placeholder={keyPlaceholder}
              value={row.key}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateRow(i, 'key', e.currentTarget.value)}
            />
          </InlineField>
          <InlineField label="">
            <Input
              width={32}
              placeholder={valuePlaceholder}
              value={row.value}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateRow(i, 'value', e.currentTarget.value)}
            />
          </InlineField>
          <IconButton name="trash-alt" tooltip="Remove" onClick={() => removeRow(i)} />
        </InlineFieldRow>
      ))}
      <Button variant="secondary" size="sm" icon="plus" onClick={addRow}>
        Add {label}
      </Button>
    </FieldSet>
  );
}

export function QueryEditor({ query, onChange, onRunQuery }: Props) {
  const q = { ...defaultQuery, ...query };

  const selectedEndpoint = ENDPOINTS.find((e) => e.id === q.endpointId);
  const hasBody = selectedEndpoint && ['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method);

  const onEndpointChange = useCallback(
    (id: string) => {
      const endpoint = ENDPOINTS.find((e) => e.id === id);
      if (!endpoint) {
        return;
      }

      const pathParams: KeyValuePair[] = endpoint.params
        .filter((p) => p.in === 'path')
        .map((p) => ({ key: p.name, value: '', enabled: true }));

      const queryParams: KeyValuePair[] = endpoint.params
        .filter((p) => p.in === 'query')
        .map((p) => ({ key: p.name, value: '', enabled: false }));

      const bodyParams: KeyValuePair[] = endpoint.params
        .filter((p) => p.in === 'body')
        .map((p) => ({ key: p.name, value: '', enabled: p.required }));

      onChange({
        ...q,
        endpointId: id,
        pathParams,
        queryParams,
        bodyParams,
        resultPath: endpoint.resultPath || '',
        alias: endpoint.alias,
      });
    },
    [q, onChange]
  );

  return (
    <div>
      <Field
        label="Endpoint"
        description={selectedEndpoint ? selectedEndpoint.description : 'Select a pre-registered API endpoint'}
      >
        <Select
          width={60}
          options={ENDPOINT_OPTIONS}
          value={q.endpointId || null}
          onChange={(v) => {
            if (v.value && !v.value.startsWith('__group__')) {
              onEndpointChange(v.value);
            }
          }}
          placeholder="Select endpoint…"
          noOptionsMessage="No endpoints found"
        />
      </Field>

      {selectedEndpoint && (
        <>
          <InlineFieldRow>
            <InlineField label="Method" disabled>
              <Badge
                text={selectedEndpoint.method}
                color={
                  selectedEndpoint.method === 'GET'
                    ? 'green'
                    : selectedEndpoint.method === 'POST'
                    ? 'blue'
                    : 'orange'
                }
              />
            </InlineField>
            <InlineField label="Path" disabled>
              <Input
                readOnly
                width={50}
                value={selectedEndpoint.path}
              />
            </InlineField>
          </InlineFieldRow>

          {q.pathParams.length > 0 && (
            <ParamTable
              label="Path Parameters"
              rows={q.pathParams}
              keyPlaceholder="parameter name"
              valuePlaceholder="value"
              onChange={(rows) => onChange({ ...q, pathParams: rows })}
            />
          )}

          <ParamTable
            label="Query Parameters"
            rows={q.queryParams}
            keyPlaceholder="parameter name"
            valuePlaceholder="value"
            onChange={(rows) => onChange({ ...q, queryParams: rows })}
          />

          {hasBody && (
            <>
              <InlineFieldRow>
                <InlineField label="Use raw JSON body">
                  <InlineSwitch
                    value={q.useRawBody}
                    onChange={(e) => onChange({ ...q, useRawBody: e.currentTarget.checked })}
                  />
                </InlineField>
              </InlineFieldRow>

              {q.useRawBody ? (
                <Field label="Raw JSON Body">
                  <TextArea
                    rows={6}
                    value={q.bodyRaw}
                    placeholder='{"key": "value"}'
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      onChange({ ...q, bodyRaw: e.currentTarget.value })
                    }
                  />
                </Field>
              ) : (
                <ParamTable
                  label="Body Parameters"
                  rows={q.bodyParams}
                  keyPlaceholder="field name"
                  valuePlaceholder="value"
                  onChange={(rows) => onChange({ ...q, bodyParams: rows })}
                />
              )}
            </>
          )}

          <FieldSet label="Result Extraction">
            <Field
              label="Result Path"
              description="Dot-notation path to the array or value in the response (e.g. data, data.items). Leave blank to use the full response."
            >
              <Input
                width={40}
                placeholder="data"
                value={q.resultPath}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  onChange({ ...q, resultPath: e.currentTarget.value })
                }
                onBlur={onRunQuery}
              />
            </Field>
            <Field
              label="Legend / Alias"
              description="Label used in the Grafana legend. Supports template variables."
            >
              <Input
                width={40}
                placeholder="Auto"
                value={q.alias}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ ...q, alias: e.currentTarget.value })}
                onBlur={onRunQuery}
              />
            </Field>
          </FieldSet>

          <Button onClick={onRunQuery} icon="play">
            Run Query
          </Button>
        </>
      )}
    </div>
  );
}
