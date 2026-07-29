# akra-waxball-pages

Generated Flutter Web deployment for [waxball.akra.kr](https://waxball.akra.kr/).

The Flutter source stays in the private `akra-waxball-flutter` repository. Its
workflow analyzes, tests, and builds WebAssembly before uploading a short-lived
`build/web` artifact. A successful private release dispatches this repository
once with the exact run ID, attempt, and source SHA. The public workflow verifies
that completed private run and publishes only those generated files to
`gh-pages` with its own repository-scoped Actions token. It does not poll on a
schedule.

- `main`: deployment workflow and documentation
- `gh-pages`: generated public website only
