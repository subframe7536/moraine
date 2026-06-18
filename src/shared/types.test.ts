import ts from 'typescript'
import { describe, expect, test } from 'vitest'

function getQuickInfoDocumentation(sourceWithMarker: string): string {
  const fileName = 'slot-docs.ts'
  const marker = '/*cursor*/'
  const position = sourceWithMarker.indexOf(marker)
  const source = sourceWithMarker.replace(marker, '')
  const files = new Map([[fileName, { text: source, version: '0' }]])
  const host: ts.LanguageServiceHost = {
    getCompilationSettings: () => ({
      noEmit: true,
      strict: true,
      target: ts.ScriptTarget.Latest,
      types: [],
    }),
    getCurrentDirectory: () => process.cwd(),
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    getScriptFileNames: () => [fileName],
    getScriptSnapshot: (requestedFileName) => {
      const file = files.get(requestedFileName)
      return file ? ts.ScriptSnapshot.fromString(file.text) : undefined
    },
    getScriptVersion: (requestedFileName) => files.get(requestedFileName)?.version ?? '0',
    fileExists: ts.sys.fileExists,
    readDirectory: ts.sys.readDirectory,
    readFile: ts.sys.readFile,
  }
  const service = ts.createLanguageService(host)
  const quickInfo = service.getQuickInfoAtPosition(fileName, position)

  return ts.displayPartsToString(quickInfo?.documentation ?? [])
}

describe('slot override docs', () => {
  test('keeps slot jsdoc when hovering class override properties', () => {
    expect(
      getQuickInfoDocumentation(`
        type SlotClassValue = string

        interface Slot<T = unknown> {
          /** Root element. */
          root?: T
        }

        type Classes = Slot<SlotClassValue>
        const overrides: Classes = { /*cursor*/root: 'custom' }
      `),
    ).toBe('Root element.')
  })
})
