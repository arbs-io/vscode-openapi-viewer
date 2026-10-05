import { TextDocument, languages } from 'vscode'

export const jsonLangId = 'json'
export const jsoncLangId = 'jsonc'
export const yamlLangId = 'yaml'

export function isSupportedLanguageMode(doc: TextDocument) {
  return languages.match([jsonLangId, jsoncLangId, yamlLangId], doc) > 0
}
