import { TextDocument } from 'vscode'
import YAML from 'yaml'

export function getOpenApiObject(document: TextDocument): any {
  const documentText = document.getText()
  if (document.languageId == 'json') {
    return JSON.parse(documentText)
  } else {
    return YAML.parse(documentText)
  }
}

export function isValidOpenApi(document: TextDocument): boolean {
  const documentOpenApi = getOpenApiObject(document)
  if (documentOpenApi['openapi'] || documentOpenApi['swagger']) {
    return true
  } else {
    return false
  }
}
