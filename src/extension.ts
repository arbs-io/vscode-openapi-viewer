import { ExtensionContext } from 'vscode'
import { RegisterCommand } from './contexts/RegisterCommand'

export function activate(context: ExtensionContext) {
  RegisterCommand(context)
}
