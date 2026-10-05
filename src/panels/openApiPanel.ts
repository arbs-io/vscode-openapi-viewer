import {
  ColorThemeKind,
  TextDocument,
  Uri,
  ViewColumn,
  Webview,
  WebviewOptions,
  WebviewPanel,
  WebviewPanelOptions,
  window,
} from 'vscode'
import { Disposable } from '../utils/dispose'
import { getOpenApiObject } from '../utils/documentOpenApi'

export class OpenApiPanel extends Disposable {
  public static currentPanel: OpenApiPanel | undefined
  public static readonly _viewType = 'OpenApiPanel'
  private readonly _panel: WebviewPanel
  private readonly _extensionUri: Uri
  private _document: TextDocument | undefined

  public static createOrShow(extensionUri: Uri) {
    const columnBeside = ViewColumn.Beside

    if (OpenApiPanel.currentPanel) {
      OpenApiPanel.currentPanel._panel.reveal(columnBeside, true)
      return
    }

    // Otherwise, create a new panel.
    const panel = window.createWebviewPanel(
      OpenApiPanel._viewType,
      '[Preview] ',
      { viewColumn: columnBeside, preserveFocus: true },
      OpenApiPanel._getWebviewOptions(extensionUri)
    )

    OpenApiPanel.currentPanel = new OpenApiPanel(panel, extensionUri)
  }

  public static revive(panel: WebviewPanel, extensionUri: Uri) {
    OpenApiPanel.currentPanel = new OpenApiPanel(panel, extensionUri)
  }

  private constructor(panel: WebviewPanel, extensionUri: Uri) {
    super()
    this._panel = panel
    this._extensionUri = extensionUri

    this._update()
    this._setPanelIcon()

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

    this._panel.webview.onDidReceiveMessage(
      (message: { command: any; text: any }) => {
        switch (message.command) {
          case 'alert':
            window.showErrorMessage(message.text)
            return
          case 'info':
            window.showInformationMessage(message.text)
            return
          default:
            console.log(message.text)
            return
        }
      },
      null,
      this._disposables
    )

    this._register(
      window.onDidChangeActiveColorTheme(() => {
        this._update()
      })
    )
  }

  // The document currently rendered in the preview
  public get document(): TextDocument | undefined {
    return this._document
  }

  public updateOpenApiSpecification(document?: TextDocument) {
    const source = document ?? window.activeTextEditor?.document
    if (!source) return

    const documentOpenApi = getOpenApiObject(source)
    if (documentOpenApi === undefined) return

    this._document = source
    this._panel.title =
      (documentOpenApi?.info?.title as string) || 'OpenAPI Specification'
    this._panel.webview.postMessage(JSON.stringify(documentOpenApi))
  }

  public dispose() {
    OpenApiPanel.currentPanel = undefined

    // Clean up our resources
    this._panel.dispose()
    super.dispose()
  }

  private _setPanelIcon() {
    const iconPathOnDisk = Uri.joinPath(
      this._extensionUri,
      'assets',
      'openapi-icon-color.png'
    )
    this._panel.iconPath = iconPathOnDisk
  }

  private _update() {
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview)
    this.updateOpenApiSpecification(this._document)
  }

  private _getNonce() {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(32))
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  }

  public static _getWebviewOptions(
    extensionUri: Uri
  ): WebviewOptions | WebviewPanelOptions {
    return {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [Uri.joinPath(extensionUri, 'assets')],
    }
  }

  private _getHtmlForWebview(webview: Webview) {
    // Local path to main script run in the webview
    const scriptPathOnDisk = Uri.joinPath(
      this._extensionUri,
      'assets',
      'rapidoc-min.js'
    )

    // And the uri we use to load this script in the webview
    const scriptWebviewUri = webview.asWebviewUri(scriptPathOnDisk)
    const nonce = this._getNonce()

    // Scripts are limited to the bundled renderer and the nonce'd inline
    // loader. connect-src stays open so "Try" requests can reach any API.
    const csp = [
      `default-src 'none'`,
      `script-src 'nonce-${nonce}'`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `img-src ${webview.cspSource} https: http: data:`,
      `font-src ${webview.cspSource} https: data:`,
      `connect-src https: http:`,
    ].join('; ')

    const panelTheme = {
      [ColorThemeKind.Light]: 'light',
      [ColorThemeKind.Dark]: 'dark',
      [ColorThemeKind.HighContrast]: 'dark',
      [ColorThemeKind.HighContrastLight]: 'light',
    }[window.activeColorTheme.kind]

    const bgColor = {
      light: '#F3F3F3',
      dark: '#252526',
    }[panelTheme]

    return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta http-equiv="Content-Security-Policy" content="${csp}">
        <script nonce="${nonce}" src="${scriptWebviewUri}"></script>
      </head>
      <body>
        <rapi-doc
          id="OpenApiPanel"
          theme = '${panelTheme}'
          show-header = 'false'
          show-info = 'true'
          allow-authentication ='true'
          allow-server-selection = 'true'
          allow-api-list-style-selection ='true'
          show-method-in-nav-bar ='as-colored-block'
          use-path-in-nav-bar = 'true'
          render-style = 'read'
          nav-bg-color = '${bgColor}'
        />
        <script nonce="${nonce}">
          window.addEventListener('message', event => {
            let objSpec = JSON.parse(event.data);
            let docEl = document.getElementById("OpenApiPanel");
            docEl.loadSpec(objSpec);
          });
        </script>
      </body>
    </html>`
  }
}
