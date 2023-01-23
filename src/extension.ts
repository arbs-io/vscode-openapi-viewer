import { ExtensionContext } from 'vscode'
import { registerShowPreviewOpenApiCommand } from './contexts/registerShowPreviewOpenApiCommand'

export function activate(context: ExtensionContext) {
  registerShowPreviewOpenApiCommand(context)
}
