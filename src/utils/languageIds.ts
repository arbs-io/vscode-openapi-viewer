import { TextDocument, languages } from 'vscode'

export const jsonLangId = 'json'
export const ymlLangId = 'yml'
export const yamlLangId = 'yaml'

export function isSupportedLanguageMode(doc: TextDocument) {
  return languages.match([jsonLangId, ymlLangId, yamlLangId], doc) > 0
}
