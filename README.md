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

## Signed operations and news

`control-plane/` contains only immutable signed Akra public releases and the
Waxball production pointer. The Ed25519 private key and authoring source stay
outside this public repository. `tools/verify_news.py` checks the pinned public
key, signature, artifact hashes, complete allowlist and current release expiry.

`deploy-news.yml` overlays reviewed news and `policy-updates/` on the existing
`gh-pages` website. `deploy-waxball.yml` includes the same files when publishing
a new website, using the same delivery concurrency group. No app source or
private key is copied to Pages. Existing immutable releases are never edited;
rollback publishes a new revision with a higher sequence.

Public channel: https://waxball.akra.kr/control-plane/apps/waxball/channels/production/release.json

Push delivery uses Firebase Cloud Messaging from the app's separately reviewed
Android integration. Pages does not store registration tokens or send pushes.

Initial authoring snapshot: `akra-devs/akra-waxball-flutter@2291146ac98600d3cc57055c4a96fcbcd802230f` (private, pushed before this public handoff).
