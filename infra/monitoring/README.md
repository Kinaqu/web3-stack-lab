Monitoring

Observability stack for the L2 devnet infrastructure.

This directory contains configuration for:

Prometheus (metrics collection)

Grafana (dashboards)

Alert rules

Datasource provisioning

Monitoring is started from:
infra/services/docker-compose.yml



Structure
monitoring/
├── alerts
│   └── alerts.rules.yml
├── grafana
│   ├── dashboards
│   │   └── l2-health.json
│   └── provisioning
│       ├── dashboards.yml
│       └── datasources.yml
└── prometheus
    └── prometheus.yml


Components
Prometheus

Scrapes metrics from infra services.

Config:
monitoring/prometheus/prometheus.yml


UI:
http://localhost:9090


Scrape targets:

api

indexer

node-exporter

postgres-exporter


Grafana

Visualization + alert dashboards.

Provisioned automatically from:
monitoring/grafana/provisioning


UI:
http://localhost:3003


Default credentials:
admin / admin


Dashboard:
L2 Health



Alerts

Alert rules defined in:
monitoring/alerts/alerts.rules.yml


Current alerts:

APIDown

IndexerDown

L2RPCDown

IndexerLagHigh

IndexerNotProgressing

DiskFreeLow

Alerts are evaluated by Prometheus and shown in Grafana.


Metrics Flow
api/indexer → /metrics
        ↓
    Prometheus
        ↓
     Grafana


System metrics:
node-exporter → Prometheus
postgres-exporter → Prometheus


Start Monitoring

From:
infra/services

Run:
docker compose up -d prometheus grafana node-exporter postgres-exporter


Verify

Prometheus targets:
http://localhost:9090/targets



Grafana:
http://localhost:3003


API metrics:
curl http://localhost:3001/metrics


Indexer metrics:
curl http://localhost:9102/metrics


L2 Health Dashboard

The dashboard tracks:

RPC availability

indexer progress

indexer lag

DB activity

disk usage

host resources

This dashboard represents the operational health of the rollup infra.

Design Goal

This monitoring setup is intentionally minimal but production-like:

service metrics

infra metrics

DB metrics

alert rules

dashboards

The goal is to simulate rollup infra observability, not full production SRE tooling.