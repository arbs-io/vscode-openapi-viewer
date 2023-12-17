import { TextEditor, EventEmitter, window } from 'vscode'
import { Disposable } from './dispose'
import { isSupportedLanguageMode } from './languageIds'

// Singleton pattern
export class ActiveEditorTracker extends Disposable {
  private static instance: ActiveEditorTracker
  private _activeEditor: TextEditor | undefined

  private readonly _onDidChangeActiveEditor = this._register(
    new EventEmitter<TextEditor | undefined>()
  )
  public readonly onDidChangeActiveEditor = this._onDidChangeActiveEditor.event

  private constructor() {
    super()
    window.onDidChangeActiveTextEditor(
      this._onDidChangeActiveTextEditor,
      this,
      this._disposables
    )
    window.onDidChangeVisibleTextEditors(
      () => this.validateActiveEditor(),
      this,
      this._disposables
    )

    this._onDidChangeActiveTextEditor(window.activeTextEditor)
  }

  // Singleton instance getter
  public static getInstance(): ActiveEditorTracker {
    if (!ActiveEditorTracker.instance) {
      ActiveEditorTracker.instance = new ActiveEditorTracker()
    }
    return ActiveEditorTracker.instance
  }

  public get activeEditor(): TextEditor | undefined {
    return this._activeEditor
  }

  private async _onDidChangeActiveTextEditor(
    editor: TextEditor | undefined
  ): Promise<void> {
    if (editor === this._activeEditor) {
      return
    }

    if (editor && !editor.viewColumn) {
      return
    }

    if (editor && (await this._isManagedFile(editor))) {
      this._activeEditor = editor
    } else {
      this._activeEditor = undefined
    }
    this._onDidChangeActiveEditor.fire(this._activeEditor)
  }

  private async _isManagedFile(editor: TextEditor): Promise<boolean> {
    return isSupportedLanguageMode(editor.document)
  }

  // Facade pattern
  private validateActiveEditor(): void {
    if (
      this._activeEditor &&
      !window.visibleTextEditors.includes(this._activeEditor)
    ) {
      this._onDidChangeActiveTextEditor(undefined)
    }
  }
}
