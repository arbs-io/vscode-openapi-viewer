import { commands, ExtensionContext, Uri, WebviewPanel, window } from 'vscode'
import { RapiDocPanel, getWebviewOptions } from '../webviews/RapiDocPanel'
export function RegisterCommand(context: ExtensionContext) {
  showPreviewOpenApi(context)
}

function showPreviewOpenApi(context: ExtensionContext) {
  const command = 'openapi.showPreviewOpenApi'
  const commandHandler = (uri: Uri) => {
    RapiDocPanel.createOrShow(context.extensionUri)
    RapiDocPanel.currentPanel?.updateOpenApi()
  }
  context.subscriptions.push(commands.registerCommand(command, commandHandler))

  if (window.registerWebviewPanelSerializer) {
    // Make sure we register a serializer in activation event
    window.registerWebviewPanelSerializer(RapiDocPanel.viewType, {
      async deserializeWebviewPanel(webviewPanel: WebviewPanel, state: any) {
        console.log(`Got state: ${state}`)
        // Reset the webview options so we use latest uri for `localResourceRoots`.
        webviewPanel.webview.options = getWebviewOptions(context.extensionUri)
        RapiDocPanel.revive(webviewPanel, context.extensionUri)
      },
    })
  }
}
