# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /plugin

# Install dependencies first (layer-cached separately from source)
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: plugin bundle image ──────────────────────────────────────────────
# This minimal image is used as a Kubernetes init-container to copy the
# built plugin into a shared volume mounted by the Grafana container.
#
# Usage in Kubernetes (init-container pattern):
#
#   initContainers:
#     - name: enprove-enelyzer-datasource
#       image: your-registry/enprove-enelyzer-datasource:latest
#       command: ["cp", "-r", "/plugin/dist", "/plugins/enprove-enelyzer-datasource"]
#       volumeMounts:
#         - name: grafana-plugins
#           mountPath: /plugins
#
#   containers:
#     - name: grafana
#       image: grafana/grafana:latest
#       env:
#         - name: GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS
#           value: enprove-enelyzer-datasource
#       volumeMounts:
#         - name: grafana-plugins
#           mountPath: /var/lib/grafana/plugins
#
FROM alpine:3.19

WORKDIR /plugin

# Copy the entire dist directory, including dist/img/ for the logos
COPY --from=builder /plugin/dist ./dist

# Entrypoint copies the plugin to whatever path is given as $1
# e.g.: docker run --rm -v /host/plugins:/plugins <image> /plugins
ENTRYPOINT ["sh", "-c", "cp -r /plugin/dist \"${1:-/plugins}/enprove-enelyzer-datasource\"", "--"]
