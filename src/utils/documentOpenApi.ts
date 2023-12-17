// Import necessary modules
import { TextDocument } from 'vscode'
import YAML from 'yaml'
import { jsonLangId, ymlLangId, yamlLangId } from './languageIds'

// Define an interface for the strategy pattern
interface IParserStrategy {
  parse(input: string): any
}

// Define concrete strategies
class JsonParser implements IParserStrategy {
  parse(input: string): any {
    return JSON.parse(input)
  }
}

class YamlParser implements IParserStrategy {
  parse(input: string): any {
    return YAML.parse(input)
  }
}

// Define a context for the strategy pattern
class ParserContext {
  private strategy: IParserStrategy

  constructor(strategy: IParserStrategy) {
    this.strategy = strategy
  }

  setStrategy(strategy: IParserStrategy) {
    this.strategy = strategy
  }

  parse(input: string): any {
    return this.strategy.parse(input)
  }
}

// Define a factory for creating parsers
class ParserFactory {
  static createParser(languageId: string): IParserStrategy | undefined {
    switch (languageId) {
      case jsonLangId:
        return new JsonParser()
      case ymlLangId:
      case yamlLangId:
        return new YamlParser()
      default:
        return undefined
    }
  }
}

// Use the factory and strategy in the function
export function getOpenApiObject(document: TextDocument): any {
  try {
    const documentText = document.getText()
    const parser = ParserFactory.createParser(document.languageId)
    if (parser) {
      const context = new ParserContext(parser)
      return context.parse(documentText)
    }
    return undefined
  } catch (error) {
    return undefined
  }
}

// Use the refactored function in the validation function
export function isValidOpenApi(document: TextDocument): boolean {
  const documentOpenApi = getOpenApiObject(document)

  if (!documentOpenApi) return false

  if (documentOpenApi['openapi'] || documentOpenApi['swagger']) {
    return true
  } else {
    return false
  }
}
