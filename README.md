# akra-waxball-pages

Generated Flutter Web deployment for [waxball.akra.kr](https://waxball.akra.kr/).

The Flutter source stays in the private `akra-waxball-flutter` repository. Its
workflow analyzes, tests, and builds WebAssembly before uploading the generated
`build/web` files to a temporary draft release in this repository. A successful
private release dispatches this repository once with the exact run ID, attempt,
source SHA, asset name, and SHA-256 digest. The public workflow verifies the
completed private run and release asset, publishes only those generated files
to `gh-pages`, and deletes the temporary release. It neither polls on a schedule
nor consumes the shared Actions artifact storage quota.

- `main`: deployment workflow and documentation
- `gh-pages`: generated public website only
