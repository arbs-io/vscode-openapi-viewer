import { TextDocument, languages } from 'vscode'

export const json = 'json'
export const openApiLanguageModes = [json]

export function isSupportedLanguageMode(doc: TextDocument) {
  return languages.match([json], doc) > 0
}
