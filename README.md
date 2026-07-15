# akra-waxball-pages

Generated Flutter Web deployment for [waxball.akra.kr](https://waxball.akra.kr/).

The Flutter source stays in the private `akra-waxball-flutter` repository. Its
workflow analyzes, tests, and builds WebAssembly before uploading a short-lived
`build/web` artifact. This public repository checks for a new successful build
every five minutes, verifies the artifact, and publishes only those generated
files to `gh-pages` with its own repository-scoped Actions token.

- `main`: deployment workflow and documentation
- `gh-pages`: generated public website only
