import * as vscode from 'vscode'

export const json = 'json'
export const openApiLanguageModes = [json]

export function isSupportedLanguageMode(doc: vscode.TextDocument) {
  return vscode.languages.match([json], doc) > 0
}
