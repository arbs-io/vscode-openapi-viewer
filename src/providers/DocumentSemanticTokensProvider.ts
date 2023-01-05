/* eslint-disable no-prototype-builtins */
import {
  SemanticTokensLegend,
  DocumentSemanticTokensProvider,
  TextDocument,
  CancellationToken,
  SemanticTokens,
  SemanticTokensBuilder,
  ExtensionContext,
  commands,
} from 'vscode'

const tokenTypes = new Map<string, number>()
const tokenTypesLegend = ['openapi']

export class OpenApiDocumentSemanticTokensProvider
  implements DocumentSemanticTokensProvider
{
  context: ExtensionContext

  constructor(context: ExtensionContext) {
    this.context = context
  }

  legend = (function () {
    tokenTypesLegend.forEach((tokenType, index) =>
      tokenTypes.set(tokenType, index)
    )
    return new SemanticTokensLegend(tokenTypesLegend)
  })()

  async provideDocumentSemanticTokens(
    document: TextDocument,
    token: CancellationToken
  ): Promise<SemanticTokens> {
    
    const isValid = this._parseTokenText(document.getText())
    commands.executeCommand('setContext', 'openapi.isValid', isValid);

    return new SemanticTokensBuilder().build()
  }

  private _parseTokenText(text: string): boolean {    
    const openApiJson = JSON.parse(text);
    if(openApiJson.hasOwnProperty('openapi')){
      return true;
    }
    else if(openApiJson.hasOwnProperty('swagger')){
      return true;
    }

    return false;  
  }
}