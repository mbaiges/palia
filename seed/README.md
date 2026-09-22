# Medice shared seed

`medice-seed.json` is the canonical fictional dataset for local development, E2E and staging demonstrations.

- The API runner reads it and upserts stable IDs into the configured local/test database.
- `IndexedDBApiRepository` reads the same fixture and adapts it to its browser store.
- Adapters may add derived fields at runtime, but must not maintain a second divergent fixture.
- The data is synthetic. Do not add real patient data, credentials, tokens or production identifiers.
- Turso validation is outside the repository test gate.

