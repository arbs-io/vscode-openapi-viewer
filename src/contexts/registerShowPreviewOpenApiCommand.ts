import {
  commands,
  ExtensionContext,
  TextDocument,
  TextDocumentChangeEvent,
  TextEditor,
  Uri,
  window,
  workspace,
} from 'vscode'
import { OpenApiPanel } from '../panels/openApiPanel'
import { ActiveEditorTracker } from '../utils/activeEditorTracker'
import { isValidOpenApi } from '../utils/documentOpenApi'

export function registerShowPreviewOpenApiCommand(context: ExtensionContext) {
  _registerCommand(context)
}

function _registerCommand(context: ExtensionContext) {
  const command = 'openapi.showPreviewOpenApi'
  const commandHandler = (uri: Uri) => {
    OpenApiPanel.createOrShow(context.extensionUri)
    OpenApiPanel.currentPanel?.updateOpenApiSpecification()
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
    _setContext(activeEditor.document)
  }
}

function _handleDidChangeActiveEditor(e: TextEditor | undefined): any {
  if (e !== undefined) {
    _setContext(e.document)
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
    _setContext(event.document)
  }, 500)
}

function _setContext(document: TextDocument): void {
  try {
    if (document.fileName == 'exthost') return //Ignore logs and output

    const isValid = isValidOpenApi(document)
    commands.executeCommand('setContext', 'openapi.isValid', isValid)
  } catch (error) {
    commands.executeCommand('setContext', 'openapi.isValid', false)
  }
}
