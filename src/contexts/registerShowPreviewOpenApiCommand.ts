import {
  commands,
  ExtensionContext,
  TextDocumentChangeEvent,
  TextEditor,
  Uri,
  window,
  workspace,
} from 'vscode'
import { OpenApiPanel } from '../panels/openApiPanel'
import { ActiveEditorTracker } from '../utils/activeEditorTracker'

export function registerShowPreviewOpenApiCommand(context: ExtensionContext) {
  _registerCommand(context)
}

function _registerCommand(context: ExtensionContext) {
  const command = 'openapi.showPreviewOpenApi'
  const commandHandler = (uri: Uri) => {
    OpenApiPanel.createOrShow(context.extensionUri)
    OpenApiPanel.currentPanel?.updateOpenApi()
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
  try {
    const openApiJson = JSON.parse(text)
    if (openApiJson['openapi'] || openApiJson['swagger']) {
      commands.executeCommand('setContext', 'openapi.isValid', true)
    } else {
      commands.executeCommand('setContext', 'openapi.isValid', false)
    }
  } catch (error) {
    commands.executeCommand('setContext', 'openapi.isValid', false)
  }
}
