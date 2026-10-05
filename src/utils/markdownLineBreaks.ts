// CommonMark treats a single newline as a soft break (rendered as a space).
// When enabled, description text is rewritten so each single newline becomes a
// hard break ("  \n"), matching how GitHub renders comments.

// Keys holding literal payloads; their contents are user data, not docs
const literalKeys = new Set([
  'example',
  'value',
  'dataValue',
  'serializedValue',
  'default',
  'enum',
  'const',
])

// Schema maps whose keys are property names rather than keywords
const nameMapKeys = new Set([
  'properties',
  'patternProperties',
  'dependentSchemas',
  '$defs',
  'definitions',
])

const fencePattern = /^ {0,3}(`{3,}|~{3,})/

export function applyHardLineBreaks(markdown: string): string {
  const lines = markdown.split('\n')
  let fence: string | undefined

  return lines
    .map((line, i) => {
      const match = fencePattern.exec(line)
      if (match) {
        const marker = match[1]
        if (fence === undefined) fence = marker
        else if (marker[0] === fence[0] && marker.length >= fence.length)
          fence = undefined
        return line
      }

      const next = lines[i + 1]
      if (
        fence !== undefined ||
        next === undefined ||
        line.trim() === '' ||
        next.trim() === '' ||
        / {2}$|\\$/.test(line)
      ) {
        return line
      }
      return `${line}  `
    })
    .join('\n')
}

export function withHardLineBreaks<T>(node: T, isNameMap = false): T {
  if (Array.isArray(node)) {
    return node.map((item) => withHardLineBreaks(item)) as T
  }
  if (node === null || typeof node !== 'object') {
    return node
  }

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(node)) {
    if (isNameMap) {
      result[key] = withHardLineBreaks(value)
    } else if (key === 'description' && typeof value === 'string') {
      result[key] = applyHardLineBreaks(value)
    } else if (
      literalKeys.has(key) ||
      key.startsWith('x-') ||
      (key === 'examples' && Array.isArray(value))
    ) {
      result[key] = value
    } else {
      result[key] = withHardLineBreaks(value, nameMapKeys.has(key))
    }
  }
  return result as T
}
