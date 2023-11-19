import { TextDocument } from 'vscode'
import YAML from 'yaml'
import { jsonLangId, ymlLangId, yamlLangId } from './languageIds'

export function getOpenApiObject(document: TextDocument): any {
  try {
    const documentText = document.getText()
    switch (document.languageId) {
      case jsonLangId:
        return JSON.parse(documentText)

      case ymlLangId:
      case yamlLangId:
        return YAML.parse(documentText)

      default:
        return undefined
    }
  } catch (error) {
    return undefined
  }
}

export function isValidOpenApi(document: TextDocument): boolean {
  const documentOpenApi = getOpenApiObject(document)

  if (!documentOpenApi) return false

  if (documentOpenApi['openapi'] || documentOpenApi['swagger']) {
    return true
  } else {
    return false
  }
}
