# Next Worker Patch: Seed Import Route

Current live Worker is stable and D1-backed.

Already added:

- `src/seed-data.js`
- `src/importer.js`
- `data/seed_claims_v1.json`
- `database/humanx_d1_schema_v2_upgrade.sql`

Needed route in `src/worker.js`:

```js
import { importSeedData } from './importer.js';
```

Add near other routes:

```js
if (url.pathname === '/api/import-seed' && request.method === 'GET') return json(await importSeedData(env));
```

Expected URL after deploy:

```text
https://humanx.rinkimirikata.com/api/import-seed
```

Expected result:

```json
{
  "ok": true,
  "imported_count": 4,
  "imported": []
}
```

Purpose:

Load structured starter claims, evidence, pressure points and home tests into live D1 without manual typing.

Do not run a destructive overwrite of `src/worker.js` from partial/truncated content.
