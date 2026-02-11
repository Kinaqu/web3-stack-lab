# Runbook: Disk Full

## Symptoms
- Containers crash / restart loop
- Postgres errors (cannot write)
- Node exporter shows low disk free

## What to check

Check disk usage:
```bash
df -h
docker system df
```

## Fast recovery

### Remove unused docker artifacts
```bash
docker system prune -a
```

### Remove old volumes if safe
```bash
docker volume ls
```

## Deeper fixes
- Move chain data to a dedicated disk
- Set log rotation
- Set retention for metrics/logs

## Prevention
- Alert: `DiskFreeLow`
- Periodic cleanup