import {
  commands,
  ExtensionContext,
  TextDocumentChangeEvent,
  TextEditor,
  Uri,
  WebviewPanel,
  window,
  workspace,
} from 'vscode'
import { RapiDocPanel, getWebviewOptions } from '../webviews/rapiDocPanel'
import { ActiveEditorTracker } from '../utils/activeEditorTracker'

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

  const activeEditorTracker = new ActiveEditorTracker()
  context.subscriptions.push(
    activeEditorTracker.onDidChangeActiveEditor((e) =>
      _handleDidChangeActiveEditor(e)
    )
  )

  context.subscriptions.push(
    workspace.onDidChangeTextDocument((e) => _handleDidChangeTextDocument(e))
  )

  const activeEditor = window.activeTextEditor
  if (activeEditor) {
    _setContext(activeEditor.document.getText())
  }

  if (window.registerWebviewPanelSerializer) {
    // Make sure we register a serializer in activation event
    window.registerWebviewPanelSerializer(RapiDocPanel.viewType, {
      async deserializeWebviewPanel(webviewPanel: WebviewPanel, state: any) {
        // Reset the webview options so we use latest uri for `localResourceRoots`.
        webviewPanel.webview.options = getWebviewOptions(context.extensionUri)
        RapiDocPanel.revive(webviewPanel, context.extensionUri)
      },
    })
  }
}

function _handleDidChangeActiveEditor(e: TextEditor | undefined): any {
  if (e !== undefined) {
    _setContext(e.document.getText())
  }
}

let changeTimeout: string | number | NodeJS.Timeout | undefined
function _handleDidChangeTextDocument(event: TextDocumentChangeEvent): void {
  if (changeTimeout !== undefined) {
    clearTimeout(changeTimeout)
  }
  changeTimeout = setInterval(function () {
    clearTimeout(changeTimeout)
    changeTimeout = undefined
    _setContext(event.document.getText())
  }, 500)
}

function _setContext(text: string): void {
  const openApiJson = JSON.parse(text)
  if (openApiJson['openapi'] || openApiJson['swagger']) {
    commands.executeCommand('setContext', 'openapi.isValid', true)
  } else {
    commands.executeCommand('setContext', 'openapi.isValid', false)
  }
}
