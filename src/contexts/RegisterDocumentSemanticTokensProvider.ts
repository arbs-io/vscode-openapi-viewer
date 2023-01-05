import { languages, ExtensionContext } from 'vscode'
import { OpenApiDocumentSemanticTokensProvider } from '../providers/DocumentSemanticTokensProvider'

export function RegisterDocumentSemanticTokensProvider(
  context: ExtensionContext
) {
  const provider = new OpenApiDocumentSemanticTokensProvider(context)
  context.subscriptions.push(
    languages.registerDocumentSemanticTokensProvider(
      { language: 'json' },
      provider,
      provider.legend
    )
  )
}
