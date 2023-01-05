import { ExtensionContext } from 'vscode'
import { RegisterCommand } from './contexts/RegisterCommand'
import { RegisterDocumentSemanticTokensProvider } from './contexts/RegisterDocumentSemanticTokensProvider'

export function activate(context: ExtensionContext) {
  RegisterDocumentSemanticTokensProvider(context)
  RegisterCommand(context)
}
