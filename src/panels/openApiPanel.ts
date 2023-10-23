import {
  ColorThemeKind,
  Uri,
  ViewColumn,
  Webview,
  WebviewOptions,
  WebviewPanel,
  WebviewPanelOptions,
  window,
} from 'vscode'
import CryptoJS from 'crypto-js'
import { Disposable } from '../utils/dispose'

export class OpenApiPanel extends Disposable {
  public static currentPanel: OpenApiPanel | undefined
  public static readonly _viewType = 'OpenApiPanel'
  private readonly _panel: WebviewPanel
  private readonly _extensionUri: Uri

  public static createOrShow(extensionUri: Uri) {
    const columnBeside = ViewColumn.Beside

    if (OpenApiPanel.currentPanel) {
      OpenApiPanel.currentPanel._panel.reveal(columnBeside)
      return
    }

    // Otherwise, create a new panel.
    const panel = window.createWebviewPanel(
      OpenApiPanel._viewType,
      '[Preview] ',
      columnBeside,
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

    window.onDidChangeActiveColorTheme((theme) => {
      this._update()
    })
  }

  public updateOpenApi() {
    const openapiText = window.activeTextEditor?.document.getText()
    if (openapiText !== undefined) {
      const openapiTitle = JSON.parse(openapiText).info.title as string
      this._panel.title = openapiTitle || 'OpenAPI Specification'
      this._panel.webview.postMessage(openapiText)
    }
  }

  public dispose() {
    OpenApiPanel.currentPanel = undefined

    // Clean up our resources
    this._panel.dispose()

    while (this._disposables.length) {
      const x = this._disposables.pop()
      if (x) {
        x.dispose()
      }
    }
  }

  private _setPanelIcon() {
    const iconPathOnDisk = Uri.joinPath(
      this._extensionUri,
      'assets',
      'openapi-icon-light.png'
    )
    this._panel.iconPath = iconPathOnDisk
  }

  private _update() {
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview)
    this.updateOpenApi()
  }

  private _getNonce() {
    const nonce = CryptoJS.lib.WordArray.random(32).toString()
    return nonce
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
        <script>
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
