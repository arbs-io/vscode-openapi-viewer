import * as vscode from 'vscode'
import * as crypto from 'crypto'

export class OpenApiPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: OpenApiPanel | undefined

  public static readonly viewType = 'OpenApiPanel'

  private readonly _panel: vscode.WebviewPanel
  private readonly _extensionUri: vscode.Uri
  private _disposables: vscode.Disposable[] = []
  private openapiJsonCache: string | undefined

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined

    // If we already have a panel, show it.
    if (OpenApiPanel.currentPanel) {
      OpenApiPanel.currentPanel._panel.reveal(column)
      return
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      OpenApiPanel.viewType,
      '[Preview] ', // + openapiUri.scheme,
      column || vscode.ViewColumn.Two,
      getWebviewOptions(extensionUri)
    )

    OpenApiPanel.currentPanel = new OpenApiPanel(panel, extensionUri)
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    OpenApiPanel.currentPanel = new OpenApiPanel(panel, extensionUri)
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel
    this._extensionUri = extensionUri

    this._update() // Set the webview's initial html content
    this._setPanelIcon() // Icon

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      (e) => {
        if (this._panel.visible) {
          this._update()
        }
      },
      null,
      this._disposables
    )

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case 'alert':
            vscode.window.showErrorMessage(message.text)
            return
          case 'info':
            vscode.window.showInformationMessage(message.text)
            return
          default:
            console.log(message.text)
            return
        }
      },
      null,
      this._disposables
    )

    vscode.window.onDidChangeActiveColorTheme((theme) => {
      this._update()
    })
  }

  public updateOpenApi() {
    const _openapiText = vscode.window.activeTextEditor?.document.getText()
    this.openapiJsonCache = _openapiText ? _openapiText : this.openapiJsonCache
    this._panel.webview.postMessage(this.openapiJsonCache)
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
    const iconPathOnDisk = vscode.Uri.joinPath(
      this._extensionUri,
      'assets',
      'openapi-icon-light.png'
    )
    this._panel.iconPath = iconPathOnDisk
  }

  private _update() {
    this._panel.title = 'OpenAPI Specification'
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview)
    this.updateOpenApi()
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Local path to main script run in the webview
    const scriptPathOnDisk = vscode.Uri.joinPath(
      this._extensionUri,
      'assets',
      'rapidoc-min.js'
    )

    // And the uri we use to load this script in the webview
    const scriptWebviewUri = webview.asWebviewUri(scriptPathOnDisk)
    const nonce = getNonce()

    const panelTheme = {
      [vscode.ColorThemeKind.Light]: 'light',
      [vscode.ColorThemeKind.Dark]: 'dark',
      [vscode.ColorThemeKind.HighContrast]: 'dark',
      [vscode.ColorThemeKind.HighContrastLight]: 'light',
    }[vscode.window.activeColorTheme.kind]

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

function getNonce() {
  const nonce = crypto.randomBytes(32).toString('base64')
  return nonce
}

export function getWebviewOptions(
  extensionUri: vscode.Uri
): vscode.WebviewOptions {
  return {
    // Enable javascript in the webview
    enableScripts: true,
    // And restrict the webview to only loading content from extension `assets` directory
    localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'assets')],
  }
}
