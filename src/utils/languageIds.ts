import { TextDocument, languages } from 'vscode'

const json = 'json'
const yml = 'yml'
const yaml = 'yaml'

export function isSupportedLanguageMode(doc: TextDocument) {
  return languages.match([json, yml, yaml], doc) > 0
}
