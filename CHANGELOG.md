# Changelog

## 2.0.0

### Breaking changes

- **New default renderer.** The preview now uses [Scalar](https://github.com/scalar/scalar) to support OpenAPI 3.2. To keep the previous look, set `openapi.preview.renderer` to `rapidoc`.
- **Requires VS Code 1.140 or later.**

### Features

- **OpenAPI 3.2 support** ([#40](https://github.com/arbs-io/vscode-openapi-viewer/issues/40)):
  - tag `summary` display names and nested tags (`parent`)
  - the `QUERY` method and `additionalOperations`
  - `in: querystring` parameters
  - streaming `itemSchema`
  - example `dataValue`
  - the OAuth 2.0 device authorization flow
- **Live preview.** The preview updates as you edit the spec.
- **Theme-aware preview.** Scalar uses the active VS Code theme colours and fonts.
- **New setting `openapi.preview.renderer`:** `scalar` (default) or `rapidoc`.
- **New setting `openapi.preview.markdownLineBreaks`:** renders single newlines in `description` fields as line breaks (GitHub style). It is off by default, which follows CommonMark as the OpenAPI Specification requires ([#39](https://github.com/arbs-io/vscode-openapi-viewer/issues/39)).
- **`jsonc` documents** are recognised as OpenAPI specifications.

### Fixes

- The preview no longer fails on specifications without an `info` object.
- `.yml` files are no longer claimed by a separate `yml` language, which competed with the built-in YAML support.
- Fixed a theme-change listener that leaked after the preview was closed.

### Security and privacy

- **Offline and private.** The preview makes no requests of its own: telemetry, hosted fonts, the request proxy and AI features are disabled. "Test Request" calls go directly to your API.
- **Hardened webview.** It now has a Content Security Policy, and its scripts carry a nonce.
- **Bundle hygiene.** Bidirectional control characters in the vendored renderer bundle are escaped.

### Maintenance

- **Toolchain:** TypeScript 7, ESLint 10 flat config, esbuild 0.28, `@vscode/vsce` 4.
- **Dependencies:** removed `crypto-js`.
- **Smaller package:** it now contains only the bundled extension and its assets.
- **CI:** runs lint, type check and packaging on pull requests.

## 1.1.5

- Dependency updates and housekeeping.
