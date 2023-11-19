import { TextDocument, languages } from 'vscode'

export const jsonLangId = 'json'
export const ymlLangId = 'yml'
export const yamlLangId = 'yaml'

export function isSupportedLanguageMode(doc: TextDocument) {
  return languages.match([jsonLangId, ymlLangId, yamlLangId], doc) > 0
}

// import { TextDocument, languages } from 'vscode'

// const json = 'json'
// const yml = 'yml'
// const yaml = 'yaml'

// export const jsonLanguageModes = [json]

// export const yamlLanguageModes = [yml, yaml]

// export function isSupportedLanguageMode(doc: TextDocument) {
//   return (
//     jsonLanguageModes.includes(doc.languageId) ||
//     yamlLanguageModes.includes(doc.languageId)
//   )
// }
// export function isJsonLanguageMode(doc: TextDocument) {
//   return jsonLanguageModes.includes(doc.languageId)
// }
// export function isYamlLanguageMode(doc: TextDocument) {
//   return yamlLanguageModes.includes(doc.languageId)
// }
