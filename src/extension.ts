import { ExtensionContext } from 'vscode'
import { registerShowPreviewOpenApi } from './contexts/registerShowPreviewOpenApi'

export function activate(context: ExtensionContext) {
  registerShowPreviewOpenApi(context)
}
