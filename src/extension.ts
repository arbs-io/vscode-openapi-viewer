import { ExtensionContext } from 'vscode'
import { RegisterCommand } from './contexts/registerCommand'

export function activate(context: ExtensionContext) {
  RegisterCommand(context)
}
