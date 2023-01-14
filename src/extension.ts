import { ExtensionContext } from 'vscode'
import { RegisterCommand } from './contexts/showPreviewOpenApiCommand'

export function activate(context: ExtensionContext) {
  RegisterCommand(context)
}
