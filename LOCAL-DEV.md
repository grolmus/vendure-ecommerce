# Local dev setup (branch `local/dev-setup`)

Local-only. **Never merge into master or into a ticket branch that gets a PR.**

The two files below are gitignored, so they exist only on this machine — copies are kept
here so they can be restored if the working tree is wiped.

Run the dev server with plain `npm run dev` from `packages/dev-server` (no env prefixes).

## Ports

| service | host port | | service | host port |
|---|---|---|---|---|
| API / dashboard | 3010 | | redis | 6429 |
| vite (dashboard) | 5174 | | elasticsearch | 9250 |
| postgres_16 | 5483 | | keycloak | 9050 |
| postgres_12 | 5482 | | loki | 3150 |
| mariadb | 3406 | | grafana | 3250 |
| mysql_8 / mysql_5 | 3408 / 3405 | | jaeger | 4368 OTLP, 16736 UI |

## `packages/dev-server/.env` (gitignored via `.gitignore:11`)

```
DB=postgres
DB_PORT=5483
API_PORT=3010
VITE_DEV_SERVER_PORT=5174
```

## `docker-compose.override.yml` (gitignored via `.git/info/exclude`)

Keeps `docker-compose.yml` pristine. Compose merges it automatically.

Two gotchas it works around:
- `ports:` must be tagged `!override`, otherwise Compose **appends** to the upstream list and
  the default ports (5432, 3306, 6379, 9200…) stay bound and collide with other projects.
- Upstream caps elasticsearch at `mem_limit: 512M`, which equals the JVM heap — the pinned
  7.10.2 image gets OOM-killed (exit 137). Override raises it to `2g`.

See the file itself for the full contents.
