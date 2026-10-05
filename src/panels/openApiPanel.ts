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
  workspace,
} from 'vscode'
import { Disposable } from '../utils/dispose'
import { getOpenApiObject } from '../utils/documentOpenApi'
import { withHardLineBreaks } from '../utils/markdownLineBreaks'
import { PanelTheme, RendererId, renderers } from './renderers'

export class OpenApiPanel extends Disposable {
  private static _currentPanel: OpenApiPanel | undefined
  public static readonly _viewType = 'OpenApiPanel'
  private readonly _panel: WebviewPanel
  private readonly _extensionUri: Uri
  private _document: TextDocument | undefined

  public static get currentPanel(): OpenApiPanel | undefined {
    return OpenApiPanel._currentPanel
  }

  public static createOrShow(extensionUri: Uri) {
    const columnBeside = ViewColumn.Beside

    if (OpenApiPanel._currentPanel) {
      OpenApiPanel._currentPanel._panel.reveal(columnBeside, true)
      return
    }

    // Otherwise, create a new panel.
    const panel = window.createWebviewPanel(
      OpenApiPanel._viewType,
      '[Preview] ',
      { viewColumn: columnBeside, preserveFocus: true },
      OpenApiPanel._getWebviewOptions(extensionUri)
    )

    OpenApiPanel._currentPanel = new OpenApiPanel(panel, extensionUri)
  }

  public static revive(panel: WebviewPanel, extensionUri: Uri) {
    OpenApiPanel._currentPanel = new OpenApiPanel(panel, extensionUri)
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

    this._register(
      workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('openapi.preview.renderer')) {
          this._update()
        } else if (e.affectsConfiguration('openapi.preview')) {
          this.updateOpenApiSpecification(this._document)
        }
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

    let documentOpenApi = getOpenApiObject(source)
    if (documentOpenApi === undefined) return

    const config = workspace.getConfiguration('openapi.preview', source)
    if (config.get<boolean>('markdownLineBreaks', false)) {
      documentOpenApi = withHardLineBreaks(documentOpenApi)
    }

    this._document = source
    this._panel.title =
      (documentOpenApi?.info?.title as string) || 'OpenAPI Specification'
    this._panel.webview.postMessage(JSON.stringify(documentOpenApi))
  }

  public dispose() {
    OpenApiPanel._currentPanel = undefined

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

    const theme: PanelTheme = {
      [ColorThemeKind.Light]: 'light' as const,
      [ColorThemeKind.Dark]: 'dark' as const,
      [ColorThemeKind.HighContrast]: 'dark' as const,
      [ColorThemeKind.HighContrastLight]: 'light' as const,
    }[window.activeColorTheme.kind]

    const rendererId = workspace
      .getConfiguration('openapi.preview')
      .get<RendererId>('renderer', 'scalar')
    const renderer = renderers[rendererId] ?? renderers.scalar
    const markup = renderer({
      webview,
      extensionUri: this._extensionUri,
      nonce,
      theme,
    })

    return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta http-equiv="Content-Security-Policy" content="${csp}">
        ${markup.head}
      </head>
      <body>
        ${markup.body}
        <script nonce="${nonce}">
          ${markup.boot}
          window.addEventListener('message', event => {
            window.renderOpenApi(JSON.parse(event.data));
          });
        </script>
      </body>
    </html>`
  }
}
