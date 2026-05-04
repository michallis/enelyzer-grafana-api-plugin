import { EndpointDefinition } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINT CATALOG
//
// Single source of truth for all pre-registered API endpoints.
// Users see only the alias and description — never the raw path.
//
// organisation_id NOTE:
//   The JWT forwarded by Grafana contains an "organisations" array, e.g.:
//     "organisations": ["75a01342-...", "e6c0c073-...", "70361904-..."]
//   Use the first (or relevant) value from that array as organisation_id.
//   Because the proxy forwards the JWT automatically when oauthPassThru=true,
//   the backend can also derive it server-side — the path param is still
//   required so the proxy can build the correct URL.
// ─────────────────────────────────────────────────────────────────────────────

const ORG_ID_PARAM = {
  name: 'organisation_id',
  label: 'Organisation ID',
  in: 'path' as const,
  required: true,
  description:
    'Your Enelyzer organisation UUID. Found in the JWT "organisations" array (e.g. 75a01342-ef85-403f-8bd3-c439ad66dc07).',
  type: 'string' as const,
  example: '75a01342-ef85-403f-8bd3-c439ad66dc07',
};

export const ENDPOINTS: EndpointDefinition[] = [

  // ── Energy Efficiency Service ──────────────────────────────────────────────

  {
    id: 'ee-dataset-tags',
    service: 'energy-efficiency',
    alias: 'Dataset Tags',
    description: 'Retrieve all tags associated with a specific dataset.',
    method: 'GET',
    path: '/v1/{organisation_id}/datasets/{dataset_id}/tags',
    resultPath: '',
    params: [
      ORG_ID_PARAM,
      {
        name: 'dataset_id',
        label: 'Dataset ID',
        in: 'path',
        required: true,
        description: 'UUID of the dataset',
        type: 'string',
        example: 'a1b2c3d4-0000-0000-0000-000000000001',
      },
    ],
  },

  {
    id: 'ee-tags-build-query',
    service: 'energy-efficiency',
    alias: 'Build Tag Query',
    description: 'Build and execute a structured query against the tag catalogue for an organisation.',
    method: 'POST',
    path: '/v1/{organisation_id}/tags/build-query',
    resultPath: '',
    params: [
      ORG_ID_PARAM,
      {
        name: 'filter',
        label: 'Filter (JSON)',
        in: 'body',
        required: false,
        description: 'JSON filter object to narrow the tag query',
        type: 'string',
        example: '{"type":"energy"}',
      },
    ],
  },

  {
    id: 'ee-tags-query',
    service: 'energy-efficiency',
    alias: 'Query Tag',
    description: 'Query a single tag or a filtered set of tags for an organisation.',
    method: 'POST',
    path: '/v1/{organisation_id}/tags/query',
    resultPath: '',
    params: [
      ORG_ID_PARAM,
      {
        name: 'filter',
        label: 'Filter (JSON)',
        in: 'body',
        required: false,
        description: 'JSON body filter, e.g. {"ids":["tag-uuid-1","tag-uuid-2"]}',
        type: 'string',
        example: '{"ids":["tag-uuid-1"]}',
      },
    ],
  },

  {
    id: 'ee-tags-search',
    service: 'energy-efficiency',
    alias: 'Search Tags',
    description: 'Filter and search the tag catalogue for an organisation by name, type, or other criteria.',
    method: 'GET',
    path: '/v1/{organisation_id}/tags/search',
    resultPath: '',
    params: [
      ORG_ID_PARAM,
      {
        name: 'q',
        label: 'Search Query',
        in: 'query',
        required: false,
        description: 'Free-text search string',
        type: 'string',
        example: 'electricity',
      },
      {
        name: 'type',
        label: 'Tag Type',
        in: 'query',
        required: false,
        description: 'Filter by tag type',
        type: 'string',
        example: 'energy',
      },
    ],
  },

  {
    id: 'ee-activities-query',
    service: 'energy-efficiency',
    alias: 'Query Activities',
    description: 'Execute a structured query against the activities log.',
    method: 'POST',
    path: '/v1/activities/query',
    resultPath: '',
    params: [
      {
        name: 'filter',
        label: 'Filter (JSON)',
        in: 'body',
        required: false,
        description: 'JSON filter body, e.g. {"from":"2024-01-01","to":"2024-12-31"}',
        type: 'string',
        example: '{"from":"2024-01-01T00:00:00Z","to":"2024-12-31T23:59:59Z"}',
      },
    ],
  },

  {
    id: 'ee-activities-search',
    service: 'energy-efficiency',
    alias: 'Search Activities',
    description: 'Filter and search activities for an organisation.',
    method: 'GET',
    path: '/v1/{organisation_id}/activities/search',
    resultPath: '',
    params: [
      ORG_ID_PARAM,
      {
        name: 'q',
        label: 'Search Query',
        in: 'query',
        required: false,
        description: 'Free-text search string',
        type: 'string',
        example: 'boiler maintenance',
      },
    ],
  },

  {
    id: 'ee-entries-query-energy',
    service: 'energy-efficiency',
    alias: 'Query Energy Entries',
    description: 'Query time-series energy measurement entries.',
    method: 'POST',
    path: '/v1/entries/query/energy',
    resultPath: '',
    params: [
      {
        name: 'from',
        label: 'From (ISO8601)',
        in: 'body',
        required: false,
        description: 'Start of the time range',
        type: 'datetime',
        example: '2024-01-01T00:00:00Z',
      },
      {
        name: 'to',
        label: 'To (ISO8601)',
        in: 'body',
        required: false,
        description: 'End of the time range',
        type: 'datetime',
        example: '2024-12-31T23:59:59Z',
      },
      {
        name: 'tagIds',
        label: 'Tag IDs (JSON array)',
        in: 'body',
        required: false,
        description: 'Array of tag UUIDs to filter by',
        type: 'string',
        example: '["tag-uuid-1","tag-uuid-2"]',
      },
    ],
  },

  {
    id: 'ee-entries-query-intensity',
    service: 'energy-efficiency',
    alias: 'Query Intensity Entries',
    description: 'Query time-series energy intensity (kWh/m²) measurement entries.',
    method: 'POST',
    path: '/v1/entries/query/intensity',
    resultPath: '',
    params: [
      {
        name: 'from',
        label: 'From (ISO8601)',
        in: 'body',
        required: false,
        description: 'Start of the time range',
        type: 'datetime',
        example: '2024-01-01T00:00:00Z',
      },
      {
        name: 'to',
        label: 'To (ISO8601)',
        in: 'body',
        required: false,
        description: 'End of the time range',
        type: 'datetime',
        example: '2024-12-31T23:59:59Z',
      },
      {
        name: 'tagIds',
        label: 'Tag IDs (JSON array)',
        in: 'body',
        required: false,
        description: 'Array of tag UUIDs to filter by',
        type: 'string',
        example: '["tag-uuid-1"]',
      },
    ],
  },

  {
    id: 'ee-entries-tags-dataset-query',
    service: 'energy-efficiency',
    alias: 'Query Entries by Dataset Tags',
    description: 'Query measurement entries grouped or filtered by dataset-level tags.',
    method: 'POST',
    path: '/v1/entries/tags/dataset/query',
    resultPath: '',
    params: [
      {
        name: 'datasetId',
        label: 'Dataset ID',
        in: 'body',
        required: true,
        description: 'UUID of the dataset whose tags are used to filter entries',
        type: 'string',
        example: 'a1b2c3d4-0000-0000-0000-000000000001',
      },
      {
        name: 'from',
        label: 'From (ISO8601)',
        in: 'body',
        required: false,
        description: 'Start of the time range',
        type: 'datetime',
        example: '2024-01-01T00:00:00Z',
      },
      {
        name: 'to',
        label: 'To (ISO8601)',
        in: 'body',
        required: false,
        description: 'End of the time range',
        type: 'datetime',
        example: '2024-12-31T23:59:59Z',
      },
    ],
  },

  {
    id: 'ee-entries-tags-labeled-query',
    service: 'energy-efficiency',
    alias: 'Query Entries by Labeled Tags',
    description: 'Query measurement entries that carry specific human-readable tag labels.',
    method: 'POST',
    path: '/v1/entries/tags/labeled/query',
    resultPath: '',
    params: [
      {
        name: 'labels',
        label: 'Labels (JSON array)',
        in: 'body',
        required: true,
        description: 'Array of label strings to match, e.g. ["electricity","building-a"]',
        type: 'string',
        example: '["electricity","building-a"]',
      },
      {
        name: 'from',
        label: 'From (ISO8601)',
        in: 'body',
        required: false,
        description: 'Start of the time range',
        type: 'datetime',
        example: '2024-01-01T00:00:00Z',
      },
      {
        name: 'to',
        label: 'To (ISO8601)',
        in: 'body',
        required: false,
        description: 'End of the time range',
        type: 'datetime',
        example: '2024-12-31T23:59:59Z',
      },
    ],
  },

  // Legacy placeholder endpoints (kept for backward compatibility)
  {
    id: 'ee-buildings-list',
    service: 'energy-efficiency',
    alias: 'List Buildings (legacy)',
    description: 'Retrieve all buildings with their energy efficiency metadata.',
    method: 'GET',
    path: '/api/v1/buildings',
    resultPath: 'data',
    params: [
      { name: 'page', label: 'Page', in: 'query', required: false, description: 'Page number', type: 'number', example: '1' },
      { name: 'pageSize', label: 'Page Size', in: 'query', required: false, description: 'Results per page', type: 'number', example: '50' },
    ],
  },
  {
    id: 'ee-building-detail',
    service: 'energy-efficiency',
    alias: 'Get Building (legacy)',
    description: 'Retrieve detailed information for a single building by ID.',
    method: 'GET',
    path: '/api/v1/buildings/{buildingId}',
    resultPath: 'data',
    params: [
      { name: 'buildingId', label: 'Building ID', in: 'path', required: true, description: 'Unique identifier of the building', type: 'string', example: 'building-001' },
    ],
  },
  {
    id: 'ee-building-energy-consumption',
    service: 'energy-efficiency',
    alias: 'Building Energy Consumption (legacy)',
    description: 'Time-series energy consumption data for a specific building.',
    method: 'GET',
    path: '/api/v1/buildings/{buildingId}/energy-consumption',
    resultPath: 'data',
    params: [
      { name: 'buildingId', label: 'Building ID', in: 'path', required: true, description: 'Unique identifier', type: 'string', example: 'building-001' },
      { name: 'from', label: 'From (ISO8601)', in: 'query', required: false, description: 'Start of time range', type: 'datetime', example: '2024-01-01T00:00:00Z' },
      { name: 'to', label: 'To (ISO8601)', in: 'query', required: false, description: 'End of time range', type: 'datetime', example: '2024-12-31T23:59:59Z' },
      { name: 'interval', label: 'Interval', in: 'query', required: false, description: 'Aggregation interval', type: 'string', example: '1h' },
    ],
  },
  {
    id: 'ee-meter-readings',
    service: 'energy-efficiency',
    alias: 'Meter Readings (legacy)',
    description: 'Time-series readings for a specific meter.',
    method: 'GET',
    path: '/api/v1/meters/{meterId}/readings',
    resultPath: 'data',
    params: [
      { name: 'meterId', label: 'Meter ID', in: 'path', required: true, description: 'Unique identifier of the meter', type: 'string', example: 'meter-001' },
      { name: 'from', label: 'From (ISO8601)', in: 'query', required: false, description: 'Start of time range', type: 'datetime', example: '2024-01-01T00:00:00Z' },
      { name: 'to', label: 'To (ISO8601)', in: 'query', required: false, description: 'End of time range', type: 'datetime', example: '2024-12-31T23:59:59Z' },
    ],
  },
  {
    id: 'ee-efficiency-analysis',
    service: 'energy-efficiency',
    alias: 'Run Efficiency Analysis (legacy)',
    description: 'Submit an analysis request for a building over a period.',
    method: 'POST',
    path: '/api/v1/buildings/{buildingId}/analysis',
    resultPath: 'data',
    params: [
      { name: 'buildingId', label: 'Building ID', in: 'path', required: true, description: 'Unique identifier', type: 'string', example: 'building-001' },
      { name: 'from', label: 'From (ISO8601)', in: 'body', required: true, description: 'Start of the analysis period', type: 'datetime', example: '2024-01-01T00:00:00Z' },
      { name: 'to', label: 'To (ISO8601)', in: 'body', required: true, description: 'End of the analysis period', type: 'datetime', example: '2024-12-31T23:59:59Z' },
    ],
  },

  // ── Asset Service ──────────────────────────────────────────────────────────

  {
    id: 'asset-facilities-search',
    service: 'asset',
    alias: 'Search Facilities',
    description: 'Filter and search facilities by name, location, or other criteria.',
    method: 'GET',
    path: '/v1/facilities/search',
    resultPath: '',
    params: [
      {
        name: 'q',
        label: 'Search Query',
        in: 'query',
        required: false,
        description: 'Free-text search string',
        type: 'string',
        example: 'warehouse',
      },
      {
        name: 'page',
        label: 'Page',
        in: 'query',
        required: false,
        description: 'Page number for pagination',
        type: 'number',
        example: '1',
      },
      {
        name: 'pageSize',
        label: 'Page Size',
        in: 'query',
        required: false,
        description: 'Number of results per page',
        type: 'number',
        example: '50',
      },
    ],
  },

  {
    id: 'asset-buildings-search',
    service: 'asset',
    alias: 'Search Buildings',
    description: 'Filter and search buildings by name, address, facility, or other criteria.',
    method: 'GET',
    path: '/v1/buildings/search',
    resultPath: '',
    params: [
      {
        name: 'q',
        label: 'Search Query',
        in: 'query',
        required: false,
        description: 'Free-text search string',
        type: 'string',
        example: 'Brussels HQ',
      },
      {
        name: 'facilityId',
        label: 'Facility ID',
        in: 'query',
        required: false,
        description: 'Filter buildings belonging to a specific facility',
        type: 'string',
        example: 'facility-uuid',
      },
      {
        name: 'page',
        label: 'Page',
        in: 'query',
        required: false,
        description: 'Page number for pagination',
        type: 'number',
        example: '1',
      },
      {
        name: 'pageSize',
        label: 'Page Size',
        in: 'query',
        required: false,
        description: 'Number of results per page',
        type: 'number',
        example: '50',
      },
    ],
  },

  // Legacy asset endpoints
  {
    id: 'asset-list',
    service: 'asset',
    alias: 'List Assets (legacy)',
    description: 'Retrieve all registered assets.',
    method: 'GET',
    path: '/api/v1/assets',
    resultPath: 'data',
    params: [
      { name: 'page', label: 'Page', in: 'query', required: false, description: 'Page number', type: 'number', example: '1' },
      { name: 'pageSize', label: 'Page Size', in: 'query', required: false, description: 'Results per page', type: 'number', example: '50' },
      { name: 'type', label: 'Asset Type', in: 'query', required: false, description: 'Filter by asset type', type: 'string', example: 'hvac' },
    ],
  },
  {
    id: 'asset-detail',
    service: 'asset',
    alias: 'Get Asset (legacy)',
    description: 'Retrieve full details for a single asset by ID.',
    method: 'GET',
    path: '/api/v1/assets/{assetId}',
    resultPath: 'data',
    params: [
      { name: 'assetId', label: 'Asset ID', in: 'path', required: true, description: 'Unique identifier', type: 'string', example: 'asset-001' },
    ],
  },
  {
    id: 'asset-search',
    service: 'asset',
    alias: 'Search Assets (legacy)',
    description: 'Full-text search across assets with optional filters.',
    method: 'POST',
    path: '/api/v1/assets/search',
    resultPath: 'data',
    params: [
      { name: 'query', label: 'Search Query', in: 'body', required: false, description: 'Free-text search', type: 'string', example: 'boiler' },
      { name: 'type', label: 'Asset Type', in: 'body', required: false, description: 'Filter by type', type: 'string', example: 'hvac' },
    ],
  },

  // ── CO2 Service ────────────────────────────────────────────────────────────

  {
    id: 'co2-emissions-list',
    service: 'co2',
    alias: 'CO2 Emissions',
    description: 'Time-series CO2 emission data across all sources or filtered.',
    method: 'GET',
    path: '/api/v1/emissions',
    resultPath: 'data',
    params: [
      { name: 'from', label: 'From (ISO8601)', in: 'query', required: false, description: 'Start of the time range', type: 'datetime', example: '2024-01-01T00:00:00Z' },
      { name: 'to', label: 'To (ISO8601)', in: 'query', required: false, description: 'End of the time range', type: 'datetime', example: '2024-12-31T23:59:59Z' },
      { name: 'buildingId', label: 'Building ID', in: 'query', required: false, description: 'Filter by building', type: 'string', example: 'building-001' },
      { name: 'scope', label: 'Scope', in: 'query', required: false, description: 'GHG Protocol scope: 1, 2, or 3', type: 'string', example: '2' },
      { name: 'interval', label: 'Interval', in: 'query', required: false, description: 'Aggregation interval', type: 'string', example: '1d' },
    ],
  },
  {
    id: 'co2-emissions-summary',
    service: 'co2',
    alias: 'CO2 Emissions Summary',
    description: 'Aggregated CO2 totals grouped by source, building, or period.',
    method: 'GET',
    path: '/api/v1/emissions/summary',
    resultPath: 'data',
    params: [
      { name: 'from', label: 'From (ISO8601)', in: 'query', required: false, description: 'Start of the period', type: 'datetime', example: '2024-01-01T00:00:00Z' },
      { name: 'to', label: 'To (ISO8601)', in: 'query', required: false, description: 'End of the period', type: 'datetime', example: '2024-12-31T23:59:59Z' },
      { name: 'groupBy', label: 'Group By', in: 'query', required: false, description: 'building, scope, source, or month', type: 'string', example: 'building' },
    ],
  },
  {
    id: 'co2-factors',
    service: 'co2',
    alias: 'Emission Factors',
    description: 'Retrieve current CO2 emission conversion factors by energy carrier.',
    method: 'GET',
    path: '/api/v1/emission-factors',
    resultPath: 'data',
    params: [
      { name: 'country', label: 'Country Code', in: 'query', required: false, description: 'ISO 3166-1 alpha-2 country code', type: 'string', example: 'NL' },
      { name: 'year', label: 'Year', in: 'query', required: false, description: 'Year for the factors', type: 'number', example: '2024' },
    ],
  },
  {
    id: 'co2-calculate',
    service: 'co2',
    alias: 'Calculate CO2',
    description: 'Calculate CO2 equivalent for a given energy consumption and carrier.',
    method: 'POST',
    path: '/api/v1/emissions/calculate',
    resultPath: 'data',
    params: [
      { name: 'energyKwh', label: 'Energy (kWh)', in: 'body', required: true, description: 'Energy consumption in kWh', type: 'number', example: '10000' },
      { name: 'carrier', label: 'Energy Carrier', in: 'body', required: true, description: 'electricity, gas, or heat', type: 'string', example: 'electricity' },
      { name: 'country', label: 'Country Code', in: 'body', required: false, description: 'ISO 3166-1 alpha-2', type: 'string', example: 'NL' },
    ],
  },
  {
    id: 'co2-targets',
    service: 'co2',
    alias: 'CO2 Reduction Targets',
    description: 'Retrieve defined CO2 reduction targets and progress against them.',
    method: 'GET',
    path: '/api/v1/targets',
    resultPath: 'data',
    params: [
      { name: 'buildingId', label: 'Building ID', in: 'query', required: false, description: 'Filter by building', type: 'string', example: 'building-001' },
    ],
  },
  {
    id: 'co2-reports',
    service: 'co2',
    alias: 'CO2 Reports',
    description: 'List generated CO2 compliance and sustainability reports.',
    method: 'GET',
    path: '/api/v1/reports',
    resultPath: 'data',
    params: [
      { name: 'year', label: 'Year', in: 'query', required: false, description: 'Filter reports by year', type: 'number', example: '2024' },
    ],
  },

  // ── ACL Service (enelyzer-grafana-acl-service) ────────────────────────────

  {
    id: 'acl-formula-query',
    service: 'acl',
    alias: 'Query Formula',
    description: 'Execute a formula query through the Grafana ACL service. Returns computed metric results based on the formula definition.',
    method: 'POST',
    path: '/v1/formula/query',
    resultPath: '',
    params: [
      {
        name: 'formulaId',
        label: 'Formula ID',
        in: 'body',
        required: false,
        description: 'UUID of the formula to evaluate',
        type: 'string',
        example: 'formula-uuid-here',
      },
      {
        name: 'from',
        label: 'From (ISO8601)',
        in: 'body',
        required: false,
        description: 'Start of the evaluation time range',
        type: 'datetime',
        example: '2024-01-01T00:00:00Z',
      },
      {
        name: 'to',
        label: 'To (ISO8601)',
        in: 'body',
        required: false,
        description: 'End of the evaluation time range',
        type: 'datetime',
        example: '2024-12-31T23:59:59Z',
      },
    ],
  },

  // ── Graph Service (enelyzer-rust-graph-service) ────────────────────────────

  {
    id: 'graph-org-tags',
    service: 'graph',
    alias: 'Organisation Graph Tags',
    description: 'Retrieve all graph tags available for an organisation. Used to discover which datasets and tag hierarchies exist in the graph service.',
    method: 'GET',
    path: '/org/{organisation_id}/graphs/tags',
    resultPath: '',
    params: [
      ORG_ID_PARAM,
    ],
  },
];

export const SERVICE_LABELS: Record<string, string> = {
  'energy-efficiency': 'Energy Efficiency',
  asset: 'Asset Management',
  co2: 'CO2 & Emissions',
  acl: 'ACL / Formulas',
  graph: 'Graph Service',
};

export function getEndpointById(id: string): EndpointDefinition | undefined {
  return ENDPOINTS.find((e) => e.id === id);
}

export function getEndpointsByService(service: string): EndpointDefinition[] {
  return ENDPOINTS.filter((e) => e.service === service);
}
