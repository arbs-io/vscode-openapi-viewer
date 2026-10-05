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

// Singleton pattern for command registration
class CommandRegistration {
  private static instance: CommandRegistration
  private activeEditorTracker: ActiveEditorTracker
  private changeTimeout: ReturnType<typeof setTimeout> | undefined

  private constructor(private context: ExtensionContext) {
    this.activeEditorTracker = ActiveEditorTracker.getInstance()
  }

  // Static method to get singleton instance
  public static getInstance(context: ExtensionContext): CommandRegistration {
    if (!CommandRegistration.instance) {
      CommandRegistration.instance = new CommandRegistration(context)
    }
    return CommandRegistration.instance
  }

  // Method to register command
  public registerCommand(): void {
    const command = 'openapi.showPreviewOpenApi'
    const commandHandler = async (uri?: Uri) => {
      const document = uri
        ? await workspace.openTextDocument(uri)
        : window.activeTextEditor?.document
      OpenApiPanel.createOrShow(this.context.extensionUri)
      OpenApiPanel.currentPanel?.updateOpenApiSpecification(document)
    }
    this.context.subscriptions.push(
      commands.registerCommand(command, commandHandler)
    )

    // Subscribe to active editor change event and push to context subscriptions
    this.context.subscriptions.push(
      this.activeEditorTracker.onDidChangeActiveEditor((e) =>
        this.handleDidChangeActiveEditor(e)
      )
    )

    // Subscribe to document change event and push to context subscriptions
    this.context.subscriptions.push(
      workspace.onDidChangeTextDocument((e) =>
        this.handleDidChangeTextDocument(e)
      ),
      { dispose: () => clearTimeout(this.changeTimeout) }
    )

    const activeEditor = window.activeTextEditor // Get active text editor
    if (activeEditor) {
      this.setContext(activeEditor.document)
    }
  }

  // Handler for active editor change event
  private handleDidChangeActiveEditor(e: TextEditor | undefined): any {
    if (e !== undefined) {
      this.setContext(e.document)
    }
  }

  // Debounce edits, then refresh the context key and the preview
  private handleDidChangeTextDocument(event: TextDocumentChangeEvent): void {
    if (event.contentChanges.length === 0) return
    if (this.changeTimeout !== undefined) {
      clearTimeout(this.changeTimeout)
    }
    this.changeTimeout = setTimeout(() => {
      this.changeTimeout = undefined
      this.setContext(event.document)

      const panel = OpenApiPanel.currentPanel
      if (panel?.document === event.document) {
        panel.updateOpenApiSpecification(event.document)
      }
    }, 500)
  }

  private setContext(document: TextDocument): void {
    try {
      if (document.fileName == 'exthost') return

      const isValid = isValidOpenApi(document)
      commands.executeCommand('setContext', 'openapi.isValid', isValid)
    } catch (error) {
      commands.executeCommand('setContext', 'openapi.isValid', false)
    }
  }
}

export function registerShowPreviewOpenApiCommand(context: ExtensionContext) {
  const commandRegistration = CommandRegistration.getInstance(context)
  commandRegistration.registerCommand()
}
