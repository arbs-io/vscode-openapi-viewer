import * as vscode from 'vscode';
import { Disposable } from './dispose';
import { isSupportedLanguageMode } from './languageIds';

export class ActiveEditorTracker extends Disposable {

	private _activeEditor: vscode.TextEditor | undefined;

	private readonly _onDidChangeActiveEditor = this._register(new vscode.EventEmitter<vscode.TextEditor | undefined>());
	public readonly onDidChangeActiveEditor = this._onDidChangeActiveEditor.event;

	public constructor() {
		super();
		vscode.window.onDidChangeActiveTextEditor(this.onDidChangeActiveTextEditor, this, this._disposables);
		vscode.window.onDidChangeVisibleTextEditors(() => {
			// Make sure the active editor is still in the visible set.
			// This can happen if the output view is focused and the last active TS file is closed
			if (this._activeEditor) {
				if (!vscode.window.visibleTextEditors.some(visibleEditor => visibleEditor === this._activeEditor)) {
					this.onDidChangeActiveTextEditor(undefined);
				}
			}
		}, this, this._disposables);

		this.onDidChangeActiveTextEditor(vscode.window.activeTextEditor);
	}

	public get activeEditor(): vscode.TextEditor | undefined {
		return this._activeEditor;
	}

	private onDidChangeActiveTextEditor(editor: vscode.TextEditor | undefined): any {
		if (editor === this._activeEditor) {
			return;
		}

		if (editor && !editor.viewColumn) {
			// viewColumn is undefined for the debug/output panel, but we still want
			// to show the version info for the previous editor
			return;
		}

		if (editor && this.isManagedFile(editor)) {
			this._activeEditor = editor;
		} else {
			this._activeEditor = undefined;
		}
		this._onDidChangeActiveEditor.fire(this._activeEditor);
	}

	private isManagedFile(editor: vscode.TextEditor): boolean {
		return isSupportedLanguageMode(editor.document);
	}
}