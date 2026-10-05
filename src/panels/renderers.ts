import { Uri, Webview } from 'vscode'

export type RendererId = 'scalar' | 'rapidoc'
export type PanelTheme = 'light' | 'dark'

export interface RendererContext {
  webview: Webview
  extensionUri: Uri
  nonce: string
  theme: PanelTheme
}

export interface RendererMarkup {
  head: string
  body: string
  // Defines window.renderOpenApi(spec), called for every spec update
  boot: string
}

function assetUri(context: RendererContext, ...path: string[]) {
  return context.webview.asWebviewUri(
    Uri.joinPath(context.extensionUri, 'assets', ...path)
  )
}

// Scalar supports OpenAPI 3.2 (tag summary/parent, QUERY and additional
// operations, querystring parameters, itemSchema, device authorization flow).
// Every hosted service is disabled so the preview works offline.
function scalar(context: RendererContext): RendererMarkup {
  const configuration = {
    theme: 'none',
    layout: 'modern',
    darkMode: context.theme === 'dark',
    forceDarkModeState: context.theme,
    hideDarkModeToggle: true,
    withDefaultFonts: false,
    telemetry: false,
    hideClientButton: true,
    showDeveloperTools: 'never',
    documentDownloadType: 'none',
    proxyUrl: '',
    agent: { disabled: true },
    mcp: { disabled: true },
  }

  return {
    head: `<script nonce="${context.nonce}" src="${assetUri(context, 'scalar', 'standalone.js')}"></script>
        <style>
          body { margin: 0; }
          .light-mode, .dark-mode {
            --scalar-font: var(--vscode-font-family);
            --scalar-font-code: var(--vscode-editor-font-family);
            --scalar-background-1: var(--vscode-editor-background);
            --scalar-background-2: var(--vscode-sideBar-background, var(--vscode-editor-background));
            --scalar-background-3: var(--vscode-input-background);
            --scalar-background-accent: var(--vscode-list-activeSelectionBackground);
            --scalar-sidebar-background-1: var(--vscode-sideBar-background, var(--vscode-editor-background));
            --scalar-color-1: var(--vscode-editor-foreground);
            --scalar-color-2: var(--vscode-descriptionForeground);
            --scalar-color-3: var(--vscode-disabledForeground);
            --scalar-color-accent: var(--vscode-textLink-foreground);
            --scalar-border-color: var(--vscode-panel-border, var(--vscode-widget-border, rgba(128, 128, 128, 0.35)));
          }
        </style>`,
    body: `<div id="OpenApiPanel"></div>`,
    boot: `const configuration = ${JSON.stringify(configuration)};
          let instance;
          window.renderOpenApi = (spec) => {
            if (instance) {
              instance.updateConfiguration({ ...configuration, content: spec });
            } else {
              instance = Scalar.createApiReference('#OpenApiPanel', { ...configuration, content: spec });
            }
          };`,
  }
}

function rapidoc(context: RendererContext): RendererMarkup {
  const bgColor = { light: '#F3F3F3', dark: '#252526' }[context.theme]

  return {
    head: `<script nonce="${context.nonce}" src="${assetUri(context, 'rapidoc-min.js')}"></script>`,
    body: `<rapi-doc
          id="OpenApiPanel"
          theme = '${context.theme}'
          show-header = 'false'
          show-info = 'true'
          allow-authentication ='true'
          allow-server-selection = 'true'
          allow-api-list-style-selection ='true'
          show-method-in-nav-bar ='as-colored-block'
          use-path-in-nav-bar = 'true'
          render-style = 'read'
          nav-bg-color = '${bgColor}'
        />`,
    boot: `window.renderOpenApi = (spec) => {
            document.getElementById('OpenApiPanel').loadSpec(spec);
          };`,
  }
}

export const renderers: Record<RendererId, (c: RendererContext) => RendererMarkup> =
  { scalar, rapidoc }
