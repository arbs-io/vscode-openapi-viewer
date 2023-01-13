import * as vscode from 'vscode';

export const json = 'json';

export const jsTsLanguageModes = [
	json
];

export function isSupportedLanguageMode(doc: vscode.TextDocument) {
	return vscode.languages.match([json], doc) > 0;
}

export function isTypeScriptDocument(doc: vscode.TextDocument) {
	return vscode.languages.match([json], doc) > 0;
}