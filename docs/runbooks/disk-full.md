# Runbook: Disk full

## Symptoms
- Containers crash / restart loop
- Postgres errors (cannot write)
- Node exporter shows low disk free

## What to check
```bash
df -h
docker system df


Fast recovery

Remove unused docker artifacts:
docker system prune -a


Remove old volumes if safe:
docker volume ls


Deeper fixes

Move chain data to a dedicated disk

Set log rotation

Set retention for metrics/logs

Prevention

Alert: DiskFreeLow

Periodic cleanup