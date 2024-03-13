import { ExtensionMap, UiconsIndex } from './types'

export function buildExtensions(
  json: UiconsIndex,
): ExtensionMap {
  const extensions: ExtensionMap = {}
  Object.entries(json).forEach(([category, values]) => {
    if (Array.isArray(values) && values.length > 0) {
      extensions[category] = values[0].split('.').pop()
    } else if (typeof values === 'object') {
      extensions[category] = buildExtensions(values)
    }
  })
  return extensions
}
