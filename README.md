# Enelyzer Grafana Datasource Plugin

A custom Grafana datasource plugin for the Enelyzer platform. It pre-registers all API endpoints from the three Enelyzer microservices with human-readable aliases, so dashboard builders never need to know API paths, HTTP methods, or response shapes.

---

## Overview

| Service | Base URL config key | Endpoints bundled |
|---|---|---|
| Energy Efficiency | `energyEfficiencyBaseUrl` | List Buildings, Building Energy Consumption, Efficiency Score, Meters, Meter Readings, Efficiency Analysis |
| Asset Management | `assetBaseUrl` | List Assets, Get Asset, Asset Types, Asset History, Asset Telemetry, Search Assets |
| CO2 & Emissions | `co2BaseUrl` | CO2 Emissions, Emissions Summary, Emission Factors, Calculate CO2, Reduction Targets, Reports |

Users pick an endpoint from a dropdown (shown by alias, e.g. *"Building Energy Consumption"*), fill in parameters with helper labels, and click **Run Query** — no API knowledge required.

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 18 |
| npm / pnpm | Any recent version |
| Docker | ≥ 20 (for local dev) |
| Grafana | ≥ 10.0.0 |

---

## Building the Plugin

### 1. Install dependencies

```bash
cd grafana-plugin
npm install
```

### 2. Build for development (with watch)

```bash
npm run dev
```

The compiled plugin is written to `dist/`.

### 3. Build for production

```bash
npm run build
```

This produces a minified, optimised bundle in `dist/`.  
The `dist/` folder is what you ship to Grafana — it contains:

```
dist/
  module.js          # compiled plugin code
  module.js.map
  plugin.json        # plugin metadata
  img/               # icons
```

---

## Local Development with Docker

The `docker-compose.yml` spins up a Grafana instance with the plugin auto-loaded and an anonymous admin session so you can test immediately.

```bash
# 1. Build the plugin first
npm run build

# 2. Start Grafana
docker-compose up

# 3. Open http://localhost:3000
# The Enelyzer datasource is pre-provisioned (see provisioning/datasources/enelyzer.yaml)
```

Grafana runs with `GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=enprove-enelyzer-datasource` so you don't need to sign the plugin during development.

Edit `provisioning/datasources/enelyzer.yaml` to point to your actual service URLs and API token.

---

## Signing the Plugin (required for production)

Grafana requires plugins to be signed unless you explicitly allow unsigned plugins.  
To sign with Grafana's free Community licence:

```bash
# Set your Grafana Cloud API key (from grafana.com > My Account > API Keys)
export GRAFANA_API_KEY=<your-key>

npm run sign
```

This writes a `MANIFEST.txt` into `dist/` and the plugin is then signed.

If you are running a private Grafana instance and do not want to sign, add the plugin ID to `grafana.ini`:

```ini
[plugins]
allow_loading_unsigned_plugins = enprove-enelyzer-datasource
```

---

## Deploying to Kubernetes

### Option A — ConfigMap mount (recommended for small installations)

This approach bundles the built `dist/` into a ConfigMap and mounts it into the Grafana pod.

**Step 1: Build the plugin**

```bash
npm run build
```

**Step 2: Create the ConfigMap from the dist folder**

```bash
kubectl create configmap enelyzer-grafana-plugin \
  --from-file=dist/ \
  -n monitoring \
  --dry-run=client -o yaml | kubectl apply -f -
```

**Step 3: Mount it in your Grafana Deployment**

Add to your Grafana `Deployment` manifest:

```yaml
spec:
  template:
    spec:
      volumes:
        - name: enelyzer-plugin
          configMap:
            name: enelyzer-grafana-plugin

      containers:
        - name: grafana
          # ... existing fields ...
          volumeMounts:
            - name: enelyzer-plugin
              mountPath: /var/lib/grafana/plugins/enprove-enelyzer-datasource
          env:
            - name: GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS
              value: "enprove-enelyzer-datasource"
```

**Step 4: Apply and restart**

```bash
kubectl apply -f grafana-deployment.yaml
kubectl rollout restart deployment/grafana -n monitoring
```

---

### Option B — Init container (recommended for larger clusters / GitOps)

Store the plugin dist in a container image or download it from an artifact store at pod startup.

```yaml
spec:
  template:
    spec:
      initContainers:
        - name: install-enelyzer-plugin
          image: busybox
          command:
            - sh
            - -c
            - |
              wget -qO /tmp/plugin.tar.gz \
                https://your-artifact-store/enelyzer-grafana-plugin-1.0.0.tar.gz && \
              tar -xzf /tmp/plugin.tar.gz -C /plugins/
          volumeMounts:
            - name: grafana-plugins
              mountPath: /plugins

      containers:
        - name: grafana
          volumeMounts:
            - name: grafana-plugins
              mountPath: /var/lib/grafana/plugins
          env:
            - name: GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS
              value: "enprove-enelyzer-datasource"

      volumes:
        - name: grafana-plugins
          emptyDir: {}
```

---

### Provisioning the Datasource via ConfigMap (recommended)

Rather than configuring the datasource through the UI, provision it with a ConfigMap so it is automatically recreated after pod restarts:

```yaml
# grafana-datasource-enelyzer.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-datasource-enelyzer
  namespace: monitoring
  labels:
    grafana_datasource: "1"    # used by the Grafana operator / sidecar
data:
  enelyzer.yaml: |
    apiVersion: 1
    datasources:
      - name: Enelyzer
        type: enprove-enelyzer-datasource
        access: proxy
        isDefault: true
        jsonData:
          energyEfficiencyBaseUrl: http://enelyzer-energy-svc.enelyzer.svc.cluster.local:8080
          assetBaseUrl: http://enelyzer-asset-svc.enelyzer.svc.cluster.local:8080
          co2BaseUrl: http://enelyzer-co2-svc.enelyzer.svc.cluster.local:8080
          authType: bearer
        secureJsonData:
          apiToken: ${ENELYZER_API_TOKEN}
```

Mount this ConfigMap into the Grafana container at `/etc/grafana/provisioning/datasources/`.

Store the token as a Kubernetes Secret and inject it:

```bash
kubectl create secret generic enelyzer-api-token \
  --from-literal=ENELYZER_API_TOKEN=<your-token> \
  -n monitoring
```

Then in the Grafana Deployment:

```yaml
envFrom:
  - secretRef:
      name: enelyzer-api-token
```

---

### Using kube-prometheus-stack / Helm

If you manage Grafana via the `kube-prometheus-stack` or `grafana` Helm chart, add these values:

```yaml
# values.yaml
grafana:
  plugins: []           # no external plugins needed — plugin is mounted manually

  extraConfigmapMounts:
    - name: enelyzer-plugin
      mountPath: /var/lib/grafana/plugins/enprove-enelyzer-datasource
      configMap: enelyzer-grafana-plugin
      readOnly: true

  env:
    GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS: "enprove-enelyzer-datasource"

  extraSecretMounts:
    - name: enelyzer-token
      mountPath: /etc/secrets/enelyzer
      secretName: enelyzer-api-token
      readOnly: true

  datasources:
    datasources.yaml:
      apiVersion: 1
      datasources:
        - name: Enelyzer
          type: enprove-enelyzer-datasource
          access: proxy
          isDefault: true
          jsonData:
            energyEfficiencyBaseUrl: http://enelyzer-energy-svc.enelyzer.svc.cluster.local:8080
            assetBaseUrl: http://enelyzer-asset-svc.enelyzer.svc.cluster.local:8080
            co2BaseUrl: http://enelyzer-co2-svc.enelyzer.svc.cluster.local:8080
            authType: bearer
          secureJsonData:
            apiToken: your-api-token
```

---

## Using the Plugin in Grafana

### 1. Configure the datasource

Go to **Configuration → Data Sources → Add data source → Enelyzer**.

Fill in:
- **Energy Efficiency Service** — base URL of `enelyzer-energy-efficiency-service`
- **Asset Service** — base URL of `enelyzer-asset-service`
- **CO2 Service** — base URL of `enelyzer-co2-service`
- **Auth Type** — Bearer Token (most common), Basic Auth, or None
- **Bearer Token** — your API token

Click **Save & Test**. The plugin will attempt a health check against each service.

### 2. Build a panel

1. Create or edit a dashboard panel.
2. Select **Enelyzer** as the data source.
3. In the **Endpoint** dropdown, pick the data you want — endpoints are grouped by service:
   - *Energy Efficiency* → Building Energy Consumption, Meter Readings, …
   - *Asset Management* → List Assets, Asset Telemetry, …
   - *CO2 & Emissions* → CO2 Emissions, Emissions Summary, …
4. Fill in any **Path Parameters** (e.g. Building ID).
5. Enable optional **Query Parameters** using the toggle on each row (e.g. `from`, `to`, `interval`).
6. For POST endpoints, fill in **Body Parameters** or switch to **Raw JSON Body** for full control.
7. Optionally adjust **Result Path** (dot-notation into the response JSON, e.g. `data.items`).
8. Click **Run Query**.

### 3. Using Grafana template variables

All parameter values support Grafana template variables:

```
${building_id}
$building_id
[[building_id]]
```

This lets you create dashboard variables (e.g. a dropdown of building IDs) and pass them into queries automatically.

---

## Adding / Updating Endpoints

All endpoint definitions live in a single file:

```
src/endpoints.ts
```

Each endpoint entry looks like this:

```typescript
{
  id: 'ee-building-energy-consumption',       // unique ID
  service: 'energy-efficiency',               // which service handles this
  alias: 'Building Energy Consumption',       // label shown in Grafana dropdown
  description: 'Time-series energy data...',  // tooltip description
  method: 'GET',                              // HTTP method
  path: '/api/v1/buildings/{buildingId}/energy-consumption',
  resultPath: 'data',                         // default path into response JSON
  params: [
    {
      name: 'buildingId',           // exact key name sent in the request
      label: 'Building ID',         // label shown in the query editor
      in: 'path',                   // 'path', 'query', or 'body'
      required: true,
      description: 'Unique building identifier',
      type: 'string',
      example: 'building-001',
    },
    // ... more params
  ],
}
```

**To add a new endpoint:**
1. Open `src/endpoints.ts`
2. Append a new object to the `ENDPOINTS` array
3. Run `npm run build`
4. Re-deploy the updated `dist/` to Kubernetes (update the ConfigMap)

---

## Updating Real API Paths

The current endpoint paths are placeholders based on common REST conventions for energy/asset/CO2 services. When your real API specs are available:

1. Open `src/endpoints.ts`
2. For each endpoint, update:
   - `path` → real API path (e.g. `/v2/efficiency/buildings` instead of `/api/v1/buildings`)
   - `params` → real parameter names matching the OpenAPI spec
   - `resultPath` → real path to the data array in the response (e.g. `results` or `items`)
3. Rebuild and redeploy

---

## Project Structure

```
grafana-plugin/
├── src/
│   ├── module.ts          # plugin entry point — wires together datasource + editors
│   ├── datasource.ts      # HTTP logic: builds URLs, calls API, converts response to DataFrames
│   ├── types.ts           # TypeScript interfaces for plugin config and query model
│   ├── endpoints.ts       # ⭐ endpoint catalog — the only file to edit for API changes
│   ├── ConfigEditor.tsx   # datasource config UI (base URLs, auth)
│   ├── QueryEditor.tsx    # per-panel query builder UI
│   └── plugin.json        # Grafana plugin metadata and proxy route declarations
├── .config/
│   └── webpack/
│       └── webpack.config.ts   # build config
├── provisioning/
│   └── datasources/
│       └── enelyzer.yaml       # auto-provision datasource in local dev
├── docker-compose.yml     # local dev environment
├── package.json
├── tsconfig.json
└── README.md
```

---

## Troubleshooting

### "Plugin not found" after deploying to Kubernetes

- Verify the plugin files are mounted at `/var/lib/grafana/plugins/enprove-enelyzer-datasource/`
- Check that `plugin.json` is present in that directory
- Ensure `GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=enprove-enelyzer-datasource` is set
- Restart the Grafana pod after mounting

### "Bad gateway" or connection errors in test

- Verify the service base URLs are reachable from the Grafana pod (use `kubectl exec` to curl them)
- If the APIs are in a separate namespace, use the full cluster DNS: `http://svc-name.namespace.svc.cluster.local:port`
- Check that the Bearer token is valid and not expired

### "Data not showing" in panels

- Open the browser console and check the network tab for the actual API response
- Adjust **Result Path** to match the actual JSON structure (e.g. change `data` to `data.items`)
- Verify parameters are enabled (toggle on each row)

### TypeScript errors during build

```bash
npm run typecheck
```

This gives a cleaner error output than the webpack build.
