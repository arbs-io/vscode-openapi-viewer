import { TextEditor, EventEmitter, window } from 'vscode'
import { Disposable } from './dispose'
import { isSupportedLanguageMode } from './languageIds'

export class ActiveEditorTracker extends Disposable {
  private _activeEditor: TextEditor | undefined

  private readonly _onDidChangeActiveEditor = this._register(
    new EventEmitter<TextEditor | undefined>()
  )
  public readonly onDidChangeActiveEditor = this._onDidChangeActiveEditor.event

  public constructor() {
    super()
    window.onDidChangeActiveTextEditor(
      this._onDidChangeActiveTextEditor,
      this,
      this._disposables
    )
    window.onDidChangeVisibleTextEditors(
      () => {
        // Make sure the active editor is still in the visible set.
        // This can happen if the output view is focused and the last active TS file is closed
        if (this._activeEditor) {
          if (
            !window.visibleTextEditors.some(
              (visibleEditor) => visibleEditor === this._activeEditor
            )
          ) {
            this._onDidChangeActiveTextEditor(undefined)
          }
        }
      },
      this,
      this._disposables
    )

    this._onDidChangeActiveTextEditor(window.activeTextEditor)
  }

  public get activeEditor(): TextEditor | undefined {
    return this._activeEditor
  }

  private _onDidChangeActiveTextEditor(editor: TextEditor | undefined): any {
    if (editor === this._activeEditor) {
      return
    }

    if (editor && !editor.viewColumn) {
      // viewColumn is undefined for the debug/output panel, but we still want
      // to show the version info for the previous editor
      return
    }

    if (editor && this._isManagedFile(editor)) {
      this._activeEditor = editor
    } else {
      this._activeEditor = undefined
    }
    this._onDidChangeActiveEditor.fire(this._activeEditor)
  }

  private _isManagedFile(editor: TextEditor): boolean {
    return isSupportedLanguageMode(editor.document)
  }
}
