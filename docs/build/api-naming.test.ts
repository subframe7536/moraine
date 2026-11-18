// @vitest-environment node

import { readFileSync } from 'node:fs'

import path from 'pathe'
import { describe, expect, test } from 'vitest'

import { collectFiles } from './core/paths.ts'

const projectRoot = path.resolve(__dirname, '../..')
const pagesRoot = path.join(projectRoot, 'docs/pages')

const BANNED_PROPS = new Set([
  'leadingIcon',
  'trailingIcon',
  'mountMode',
  'minValue',
  'maxValue',
  'searchTerm',
  'onSearch',
  'modelModifiers',
  'inverted',
  'dismissible',
  'itemsPerPage',
  'edgeThreshold',
  'onReachStart',
  'onReachEnd',
  'onScrollTop',
  'onScrollBottom',
  'onScrollLeft',
  'onScrollRight',
  // Replaced names kept out by the naming conventions below.
  'showValue',
  'showControls',
  'showBorder',
  'hoverEffect',
  'loadingAuto',
  'portalMount',
  'onClosePrevent',
  'onCloseBlocked',
  'controllerRef',
  'inputsRef',
  'itemToLabelString',
  'filterItem',
  'filterItems',
  'allowClear',
  'textLabel',
  'getItemSearchText',
  'filterGroups',
])

// Item predicate callbacks may keep the `is` prefix; component booleans may not.
const IS_PREFIX_ALLOWLIST = new Set(['isItemDisabled'])

const ICON_PROP_NAMES = new Set(['icon', 'leading', 'trailing', 'separator', 'badge'])

// Callbacks without a matching value prop.
const CHANGE_CALLBACK_ALLOWLIST = new Set(['onStatusChange', 'onOverflowChange'])

interface ApiProp {
  name: string
  type: string
}

interface ApiDoc {
  key: string
  parts: Array<{ name: string; props: ApiProp[] }>
}

function loadApiDocs(): Array<{ file: string; doc: ApiDoc }> {
  return collectFiles(pagesRoot, (file) => path.basename(file) === 'api.json').map((file) => ({
    file,
    doc: JSON.parse(readFileSync(file, 'utf8')) as ApiDoc,
  }))
}

describe('api naming rules', () => {
  const apiDocs = loadApiDocs()

  test('no banned prop names', () => {
    const offenders: string[] = []
    for (const { file, doc } of apiDocs) {
      for (const part of doc.parts) {
        for (const prop of part.props) {
          if (BANNED_PROPS.has(prop.name)) {
            offenders.push(`${doc.key} ${part.name}.${prop.name} (${file})`)
          }
        }
      }
    }
    expect(offenders).toEqual([])
  })

  test('component boolean props do not use the is prefix', () => {
    const offenders: string[] = []
    for (const { doc } of apiDocs) {
      for (const part of doc.parts) {
        for (const prop of part.props) {
          if (/^is[A-Z]/.test(prop.name) && !IS_PREFIX_ALLOWLIST.has(prop.name)) {
            offenders.push(`${doc.key} ${part.name}.${prop.name}`)
          }
        }
      }
    }
    expect(offenders).toEqual([])
  })

  test('icon props use positional or Icon-suffixed names', () => {
    const offenders: string[] = []
    for (const { doc } of apiDocs) {
      for (const part of doc.parts) {
        for (const prop of part.props) {
          if (
            prop.type.includes('IconT.Name') &&
            !ICON_PROP_NAMES.has(prop.name) &&
            !prop.name.endsWith('Icon')
          ) {
            offenders.push(`${doc.key} ${part.name}.${prop.name}: ${prop.type}`)
          }
        }
      }
    }
    expect(offenders).toEqual([])
  })

  test('every on<X>Change callback has a matching x prop on the same part', () => {
    const offenders: string[] = []
    for (const { doc } of apiDocs) {
      for (const part of doc.parts) {
        const names = new Set(part.props.map((prop) => prop.name))
        for (const prop of part.props) {
          const match = /^on([A-Z].*)Change$/.exec(prop.name)
          const stem = match?.[1]
          if (!stem || CHANGE_CALLBACK_ALLOWLIST.has(prop.name)) {
            continue
          }
          const valueName = stem.charAt(0).toLowerCase() + stem.slice(1)
          if (!names.has(valueName)) {
            offenders.push(`${doc.key} ${part.name}.${prop.name} expects ${valueName}`)
          }
        }
      }
    }
    expect(offenders).toEqual([])
  })

  test('part-visibility props do not use the show prefix', () => {
    const offenders: string[] = []
    for (const { doc } of apiDocs) {
      for (const part of doc.parts) {
        for (const prop of part.props) {
          if (/^show[A-Z]/.test(prop.name)) {
            offenders.push(`${doc.key} ${part.name}.${prop.name}`)
          }
        }
      }
    }
    expect(offenders).toEqual([])
  })

  test('*Ref props are DOM element refs', () => {
    const offenders: string[] = []
    for (const { doc } of apiDocs) {
      for (const part of doc.parts) {
        for (const prop of part.props) {
          if (/Refs?$/.test(prop.name) && !prop.type.startsWith('Ref<')) {
            offenders.push(`${doc.key} ${part.name}.${prop.name}: ${prop.type}`)
          }
        }
      }
    }
    expect(offenders).toEqual([])
  })

  test('alert public props do not leak the internal hasDescription variant', () => {
    const alert = apiDocs.find(({ doc }) => doc.key === 'alert')
    expect(alert).toBeDefined()
    for (const part of alert!.doc.parts) {
      expect(part.props.map((prop) => prop.name)).not.toContain('hasDescription')
    }
  })
})
