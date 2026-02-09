# API Service

HTTP interface over indexed L2 data.

The API reads from Postgres and L2 RPC.

---

## Endpoints

### Health
GET /health



Checks:
- database connection
- RPC connection

---

### Stats
GET /stats


Returns:
- rpcHead
- indexedHead
- lag
- confirmations
- DB counts

Example:
```json
{
  "rpcHead": 1500,
  "indexedHead": 1492,
  "lag": 8,
  "confirmations": 5,
  "db": {
    "blocks": 1493,
    "transactions": 7123
  }
}



Transaction
GET /tx/:hash


Returns indexed transaction.

Fields:

hash

blockNumber

from

to

nonce

value

gas

gasPrice

status


Environment Variables
DATABASE_URL
L2_RPC_URL
PORT
LOG_LEVEL


Architecture Role

The API is read-only.


Postgres → API → Clients



No writes happen here.


Running

docker compose up api


