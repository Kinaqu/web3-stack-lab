# Monitoring

This repo includes a minimal observability stack for the L2 services:

- Prometheus (scrapes metrics)
- Grafana (dashboards)
- node-exporter (disk/CPU/mem)
- postgres-exporter (DB health)

Monitoring configs live in:

infra/monitoring/



## Components & Ports (default)

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3003  (admin/admin on first start unless overridden)

## What we monitor (MVP)

- Service availability (Prometheus `up`)
- L2 RPC health:
  - `l2_rpc_up`
  - `l2_rpc_head`
- Indexer progress:
  - `indexer_indexed_head`
  - `indexer_rpc_head`
  - `indexer_lag_blocks`
- Disk free on `/` (node-exporter)

## Alerts (MVP)

- API down
- Indexer down
- RPC down (or metrics missing)
- Indexer lag high / not progressing
- Disk free < 10%

Alert rules:
infra/monitoring/alerts/alerts.rules.yml


## Dashboard

Grafana dashboard:
- `L2 / L2 Health`

Dashboard JSON:
infra/monitoring/grafana/dashboards/l2-health.json



## Notes

Some charts/alerts rely on custom metrics that are exposed by the API and Indexer.
Those are implemented in:
- `services/api` -> `/metrics` on port 9101
- `services/indexer` -> `/metrics` on port 9102
