import { describe, expect, it } from 'vitest'

import morainePlugin from './oxlint-plugin-moraine.ts'

function createMockContext(filename: string) {
  const reports: Array<{ node: any; messageId?: string; message?: string; data?: any }> = []
  return {
    filename,
    report(diagnostic: any) {
      reports.push(diagnostic)
    },
    get reports() {
      return reports
    },
  }
}

describe('oxlint-plugin-moraine', () => {
  describe('no-slots-class-style-in-jsx', () => {
    const rule = morainePlugin.rules['no-slots-class-style-in-jsx']

    it('reports slots.<slot>.class and slots.<slot>.style in JSX attributes', () => {
      const ctx = createMockContext('/project/src/components/button/button.tsx')
      const visitor = rule.create(ctx)

      // <div class={slots.root.class} />
      visitor.JSXAttribute({
        name: { type: 'JSXIdentifier', name: 'class' },
        value: {
          type: 'JSXExpressionContainer',
          expression: {
            type: 'MemberExpression',
            object: {
              type: 'MemberExpression',
              object: { type: 'Identifier', name: 'slots' },
              property: { type: 'Identifier', name: 'root' },
            },
            property: { type: 'Identifier', name: 'class' },
          },
        },
      })
      expect(ctx.reports).toHaveLength(1)
      expect(ctx.reports[0]?.messageId).toBe('forbidden')

      // <div style={slots.root.style} />
      visitor.JSXAttribute({
        name: { type: 'JSXIdentifier', name: 'style' },
        value: {
          type: 'JSXExpressionContainer',
          expression: {
            type: 'MemberExpression',
            object: {
              type: 'MemberExpression',
              object: { type: 'Identifier', name: 'slots' },
              property: { type: 'Identifier', name: 'root' },
            },
            property: { type: 'Identifier', name: 'style' },
          },
        },
      })
      expect(ctx.reports).toHaveLength(2)
      expect(ctx.reports[1]?.messageId).toBe('forbidden')
    })

    it('reports slots.<slot>.class inside conditional expressions', () => {
      const ctx = createMockContext('/project/src/components/button/button.tsx')
      const visitor = rule.create(ctx)

      // <div class={open() ? slots.root.class : undefined} />
      visitor.JSXAttribute({
        name: { type: 'JSXIdentifier', name: 'class' },
        value: {
          type: 'JSXExpressionContainer',
          expression: {
            type: 'ConditionalExpression',
            test: { type: 'CallExpression', callee: { type: 'Identifier', name: 'open' } },
            consequent: {
              type: 'MemberExpression',
              object: {
                type: 'MemberExpression',
                object: { type: 'Identifier', name: 'slots' },
                property: { type: 'Identifier', name: 'root' },
              },
              property: { type: 'Identifier', name: 'class' },
            },
            alternate: { type: 'Identifier', name: 'undefined' },
          },
        },
      })
      expect(ctx.reports).toHaveLength(1)
    })

    it('allows valid spreads like {...slots.root}', () => {
      const ctx = createMockContext('/project/src/components/button/button.tsx')
      const visitor = rule.create(ctx)

      visitor.JSXSpreadAttribute({
        argument: {
          type: 'MemberExpression',
          object: { type: 'Identifier', name: 'slots' },
          property: { type: 'Identifier', name: 'root' },
        },
      })
      expect(ctx.reports).toHaveLength(0)
    })
  })

  describe('data-attributes-in-slot-binding', () => {
    const rule = morainePlugin.rules['data-attributes-in-slot-binding']

    function dataCall(name = 'dialogDataAttributes') {
      return {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { type: 'Identifier', name },
          property: { type: 'Identifier', name: 'body' },
        },
        arguments: [],
      } as any
    }

    function property(name: string, value: any, parent?: any) {
      const node = {
        type: 'Property',
        key: { type: 'Identifier', name },
        value,
        parent,
      } as any
      value.parent = node
      return node
    }

    it('reports calls outside a slot data option', () => {
      const ctx = createMockContext('/project/src/components/dialog/dialog-body.tsx')
      const visitor = rule.create(ctx)

      // <div {...dialogDataAttributes.body()} />
      const spread = dataCall()
      spread.parent = { type: 'JSXSpreadAttribute', argument: spread }
      visitor.CallExpression(spread)

      // const bodyAttrs = popoverDataAttributes.body()
      const assigned = dataCall('popoverDataAttributes')
      assigned.parent = { type: 'VariableDeclarator', init: assigned }
      visitor.CallExpression(assigned)

      expect(ctx.reports.map((report) => report.data?.callee)).toEqual([
        'dialogDataAttributes.body',
        'popoverDataAttributes.body',
      ])
      expect(ctx.reports[0]?.messageId).toBe('mustBind')
    })

    it('allows useRecipe and slotWith data entries', () => {
      const ctx = createMockContext('/project/src/data-table/data-table-row.tsx')
      const visitor = rule.create(ctx)

      // useRecipe(recipe, props, { data: { body: dialogDataAttributes.body() } })
      const slotEntry = dataCall()
      const slots = { type: 'ObjectExpression', properties: [] } as any
      slots.properties.push(property('body', slotEntry, slots))
      property('data', slots)
      visitor.CallExpression(slotEntry)

      // slotWith('row', { data: dialogDataAttributes.body() })
      const itemEntry = dataCall()
      property('data', itemEntry)
      visitor.CallExpression(itemEntry)

      // { own: dialogDataAttributes.body() } is not a data entry.
      const misplaced = dataCall()
      property('own', misplaced)
      visitor.CallExpression(misplaced)

      expect(ctx.reports).toHaveLength(1)
    })

    it('ignores non-JSX files like context hooks and tests', () => {
      const contextCtx = createMockContext(
        '/project/src/components/context-menu/context-menu-context.ts',
      )
      expect(rule.create(contextCtx)).toEqual({})

      const testCtx = createMockContext('/project/src/components/dialog/dialog.test.tsx')
      expect(rule.create(testCtx)).toEqual({})
    })
  })

  describe('slot-binding-order', () => {
    const rule = morainePlugin.rules['slot-binding-order']
    const spread = (argument: any) => ({ type: 'JSXSpreadAttribute', argument })
    const id = (name: string) => ({ type: 'Identifier', name })
    const slotsMember = (slot: string) => ({
      type: 'MemberExpression',
      computed: false,
      object: id('slots'),
      property: id(slot),
    })

    it('reports bindings spread after rest', () => {
      const ctx = createMockContext('/project/src/components/badge/badge.tsx')
      const visitor = rule.create(ctx)

      visitor.JSXOpeningElement({
        attributes: [
          spread(id('rest')),
          spread(id('rootSlot')),
          spread({ type: 'CallExpression', callee: id('slotWith'), arguments: [] }),
        ],
      })
      expect(ctx.reports.map((report) => report.data?.binding)).toEqual([
        'rootSlot',
        'slotWith(...)',
      ])
      expect(ctx.reports[0]?.messageId).toBe('beforeRest')
    })

    it('allows bindings before rest and other spreads after rest', () => {
      const ctx = createMockContext('/project/src/data-table/data-table.tsx')
      const visitor = rule.create(ctx)

      visitor.JSXOpeningElement({
        attributes: [
          { type: 'JSXAttribute', name: { name: 'data-slot' } },
          spread(id('rootSlot')),
          spread(id('rest')),
          spread(id('handlers')),
        ],
      })
      expect(ctx.reports).toHaveLength(0)
    })

    it('requires destructuring static slots members', () => {
      const ctx = createMockContext('/project/src/components/badge/badge.tsx')
      const visitor = rule.create(ctx)

      visitor.JSXOpeningElement({
        attributes: [
          spread(slotsMember('label')),
          spread({ ...slotsMember('label'), computed: true, property: id('key') }),
        ],
      })
      expect(ctx.reports).toHaveLength(1)
      expect(ctx.reports[0]?.messageId).toBe('destructure')
      expect(ctx.reports[0]?.data?.slot).toBe('label')
    })
  })

  describe('require-create-effect-on', () => {
    const rule = morainePlugin.rules['require-create-effect-on']

    it('reports unwrapped callbacks in createEffect', () => {
      const ctx = createMockContext('/project/src/components/accordion/accordion.tsx')
      const visitor = rule.create(ctx)

      visitor.CallExpression({
        callee: { type: 'Identifier', name: 'createEffect' },
        arguments: [{ type: 'ArrowFunctionExpression', body: {} }],
      })
      expect(ctx.reports).toHaveLength(1)
      expect(ctx.reports[0]?.messageId).toBe('requireOn')

      visitor.CallExpression({
        callee: { type: 'Identifier', name: 'createEffect' },
        arguments: [
          {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'notOn' },
            arguments: [],
          },
        ],
      })
      expect(ctx.reports).toHaveLength(2)
    })

    it('allows createEffect wrapped with on(...)', () => {
      const ctx = createMockContext('/project/src/components/accordion/accordion.tsx')
      const visitor = rule.create(ctx)

      visitor.CallExpression({
        callee: { type: 'Identifier', name: 'createEffect' },
        arguments: [
          {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'on' },
            arguments: [],
          },
        ],
      })
      expect(ctx.reports).toHaveLength(0)
    })

    it('ignores test files', () => {
      const testCtx = createMockContext('/project/src/shared/event-listener.test.ts')
      expect(rule.create(testCtx)).toEqual({})
    })
  })

  describe('no-emitted-extensions-in-imports', () => {
    const rule = morainePlugin.rules['no-emitted-extensions-in-imports']

    it('reports .js and .jsx extensions in source imports', () => {
      const ctx = createMockContext('/project/src/components/button/button.tsx')
      const visitor = rule.create(ctx)

      visitor.ImportDeclaration({
        source: { value: './button-group.js' },
      })
      visitor.ImportDeclaration({
        source: { value: '../icon/icon.jsx' },
      })
      visitor.ExportNamedDeclaration({
        source: { value: './button.js' },
      })
      expect(ctx.reports).toHaveLength(3)
      expect(ctx.reports[0]?.messageId).toBe('noEmittedExtension')
      expect(ctx.reports[0]?.data?.source).toBe('./button-group.js')
    })

    it('allows imports without extension or with source extensions', () => {
      const ctx = createMockContext('/project/src/components/button/button.tsx')
      const visitor = rule.create(ctx)

      visitor.ImportDeclaration({ source: { value: './button-group' } })
      visitor.ImportDeclaration({ source: { value: './button-group.ts' } })
      visitor.ImportDeclaration({ source: { value: 'solid-js' } })
      expect(ctx.reports).toHaveLength(0)
    })
  })

  describe('no-string-style-prop', () => {
    const rule = morainePlugin.rules['no-string-style-prop']

    it('reports literal and template string style props', () => {
      const ctx = createMockContext('/project/src/components/button/button.tsx')
      const visitor = rule.create(ctx)

      visitor.JSXAttribute({
        name: { type: 'JSXIdentifier', name: 'style' },
        value: { type: 'Literal', value: 'color: red;' },
      })
      visitor.JSXAttribute({
        name: { type: 'JSXIdentifier', name: 'style' },
        value: {
          type: 'JSXExpressionContainer',
          expression: { type: 'Literal', value: 'color: red;' },
        },
      })
      visitor.JSXAttribute({
        name: { type: 'JSXIdentifier', name: 'style' },
        value: {
          type: 'JSXExpressionContainer',
          expression: { type: 'TemplateLiteral', quasis: [] },
        },
      })
      expect(ctx.reports).toHaveLength(3)
      expect(ctx.reports[0]?.messageId).toBe('noStringStyle')
    })

    it('allows object style props and expressions', () => {
      const ctx = createMockContext('/project/src/components/button/button.tsx')
      const visitor = rule.create(ctx)

      visitor.JSXAttribute({
        name: { type: 'JSXIdentifier', name: 'style' },
        value: {
          type: 'JSXExpressionContainer',
          expression: { type: 'ObjectExpression', properties: [] },
        },
      })
      expect(ctx.reports).toHaveLength(0)
    })

    it('ignores test fixtures asserting string style rejection', () => {
      const testCtx = createMockContext('/project/test/types-default/index.tsx')
      expect(rule.create(testCtx)).toEqual({})
    })
  })

  describe('no-direct-component-call', () => {
    const rule = morainePlugin.rules['no-direct-component-call']

    it('reports direct function calls to PascalCase components', () => {
      const ctx = createMockContext('/project/src/components/card/card.tsx')
      const visitor = rule.create(ctx)

      visitor.CallExpression({
        callee: { type: 'Identifier', name: 'Button' },
        arguments: [],
      })
      visitor.CallExpression({
        callee: { type: 'Identifier', name: 'CardHeader' },
        arguments: [],
      })
      visitor.CallExpression({
        callee: { type: 'Identifier', name: 'Show' },
        arguments: [],
      })
      expect(ctx.reports).toHaveLength(3)
      expect(ctx.reports[0]?.messageId).toBe('noDirectCall')
      expect(ctx.reports[0]?.data?.name).toBe('Button')
    })

    it('allows global constructors and built-in objects', () => {
      const ctx = createMockContext('/project/src/components/card/card.tsx')
      const visitor = rule.create(ctx)

      visitor.CallExpression({
        callee: { type: 'Identifier', name: 'Boolean' },
        arguments: [],
      })
      visitor.CallExpression({
        callee: { type: 'Identifier', name: 'String' },
        arguments: [],
      })
      visitor.CallExpression({
        callee: { type: 'Identifier', name: 'Array' },
        arguments: [],
      })
      visitor.CallExpression({
        callee: { type: 'Identifier', name: 'DEFAULT_CARD_CLASS' },
        arguments: [],
      })
      expect(ctx.reports).toHaveLength(0)
    })

    it('reports non-PascalCase function declarations returning JSX', () => {
      const ctx = createMockContext('/project/src/components/sheet/sheet-content.tsx')
      const visitor = rule.create(ctx)

      visitor.FunctionDeclaration({
        id: { type: 'Identifier', name: 'renderSheetContent' },
        body: {
          type: 'BlockStatement',
          body: [
            {
              type: 'ReturnStatement',
              argument: { type: 'JSXElement' },
            },
          ],
        },
      })
      expect(ctx.reports).toHaveLength(1)
      expect(ctx.reports[0]?.messageId).toBe('mustBePascalCaseComponent')
      expect(ctx.reports[0]?.data?.name).toBe('renderSheetContent')
      expect(ctx.reports[0]?.data?.pascalName).toBe('RenderSheetContent')
    })

    it('reports non-PascalCase arrow functions returning JSX and their direct calls', () => {
      const ctx = createMockContext('/project/src/components/dialog/dialog-content.tsx')
      const visitor = rule.create(ctx)

      visitor.VariableDeclarator({
        id: { type: 'Identifier', name: 'renderDialogContent' },
        init: {
          type: 'ArrowFunctionExpression',
          body: { type: 'JSXElement' },
        },
      })
      expect(ctx.reports).toHaveLength(1)
      expect(ctx.reports[0]?.messageId).toBe('mustBePascalCaseComponent')
      expect(ctx.reports[0]?.data?.name).toBe('renderDialogContent')
      expect(ctx.reports[0]?.data?.pascalName).toBe('RenderDialogContent')

      visitor.CallExpression({
        callee: { type: 'Identifier', name: 'renderDialogContent' },
        arguments: [],
      })
      expect(ctx.reports).toHaveLength(2)
      expect(ctx.reports[1]?.messageId).toBe('noDirectCall')
      expect(ctx.reports[1]?.data?.name).toBe('renderDialogContent')
      expect(ctx.reports[1]?.data?.pascalName).toBe('RenderDialogContent')
    })

    it('allows non-PascalCase functions returning non-JSX values', () => {
      const ctx = createMockContext('/project/src/components/card/card.tsx')
      const visitor = rule.create(ctx)

      visitor.FunctionDeclaration({
        id: { type: 'Identifier', name: 'computeStyle' },
        body: {
          type: 'BlockStatement',
          body: [
            {
              type: 'ReturnStatement',
              argument: { type: 'ObjectExpression', properties: [] },
            },
          ],
        },
      })
      visitor.VariableDeclarator({
        id: { type: 'Identifier', name: 'calculateOffset' },
        init: {
          type: 'ArrowFunctionExpression',
          body: { type: 'Literal', value: 42 },
        },
      })
      expect(ctx.reports).toHaveLength(0)
    })

    it('allows PascalCase function declarations and components', () => {
      const ctx = createMockContext('/project/src/components/sheet/sheet-content.tsx')
      const visitor = rule.create(ctx)

      visitor.FunctionDeclaration({
        id: { type: 'Identifier', name: 'SheetContentSurface' },
        body: {
          type: 'BlockStatement',
          body: [
            {
              type: 'ReturnStatement',
              argument: { type: 'JSXElement' },
            },
          ],
        },
      })
      expect(ctx.reports).toHaveLength(0)
    })

    it('ignores test and non-component files', () => {
      const testCtx = createMockContext('/project/src/components/card/card.test.tsx')
      expect(rule.create(testCtx)).toEqual({})
    })
  })

  describe('no-re-export', () => {
    const rule = morainePlugin.rules['no-re-export']

    it('reports standalone export { x } without inline declaration', () => {
      const ctx = createMockContext('/project/src/components/button/button.tsx')
      const visitor = rule.create(ctx)

      visitor.ExportNamedDeclaration({
        declaration: null,
        source: null,
        specifiers: [{ local: { name: 'Button' }, exported: { name: 'Button' } }],
      })
      expect(ctx.reports).toHaveLength(1)
      expect(ctx.reports[0]?.messageId).toBe('mustInline')
      expect(ctx.reports[0]?.data?.names).toBe('Button')
    })

    it('reports standalone export type { T } without inline declaration', () => {
      const ctx = createMockContext('/project/src/components/button/button.types.ts')
      const visitor = rule.create(ctx)

      visitor.ExportNamedDeclaration({
        declaration: null,
        source: null,
        exportKind: 'type',
        specifiers: [{ local: { name: 'ButtonT' }, exported: { name: 'ButtonT' } }],
      })
      expect(ctx.reports).toHaveLength(1)
      expect(ctx.reports[0]?.messageId).toBe('mustInline')
    })

    it('reports re-export from another file in component/implementation files', () => {
      const ctx = createMockContext('/project/src/components/button/button.tsx')
      const visitor = rule.create(ctx)

      visitor.ExportNamedDeclaration({
        declaration: null,
        source: { value: './button-part' },
        specifiers: [{ local: { name: 'ButtonPart' }, exported: { name: 'ButtonPart' } }],
      })
      expect(ctx.reports).toHaveLength(1)
      expect(ctx.reports[0]?.messageId).toBe('noReExport')
      expect(ctx.reports[0]?.data?.source).toBe('./button-part')

      visitor.ExportAllDeclaration({
        source: { value: './button-part' },
      })
      expect(ctx.reports).toHaveLength(2)
      expect(ctx.reports[1]?.messageId).toBe('noReExport')
    })

    it('allows inline export declarations', () => {
      const ctx = createMockContext('/project/src/components/button/button.tsx')
      const visitor = rule.create(ctx)

      visitor.ExportNamedDeclaration({
        declaration: { type: 'FunctionDeclaration', id: { name: 'Button' } },
        source: null,
      })
      visitor.ExportNamedDeclaration({
        declaration: { type: 'VariableDeclaration' },
        source: null,
      })
      expect(ctx.reports).toHaveLength(0)
    })

    it('allows re-exports in index.ts and package entry files', () => {
      const barrelCtx = createMockContext('/project/src/components/button/index.ts')
      const barrelVisitor = rule.create(barrelCtx)

      barrelVisitor.ExportNamedDeclaration({
        declaration: null,
        source: { value: './button' },
        specifiers: [{ local: { name: 'Button' }, exported: { name: 'Button' } }],
      })
      barrelVisitor.ExportAllDeclaration({
        source: { value: './button.types' },
      })
      expect(barrelCtx.reports).toHaveLength(0)

      const entryCtx = createMockContext('/project/src/utils.ts')
      const entryVisitor = rule.create(entryCtx)

      entryVisitor.ExportNamedDeclaration({
        declaration: null,
        source: { value: './shared/utils' },
        specifiers: [{ local: { name: 'createId' }, exported: { name: 'createId' } }],
      })
      expect(entryCtx.reports).toHaveLength(0)
    })

    it('ignores test files and fixtures', () => {
      const testCtx = createMockContext('/project/src/components/button/button.test.tsx')
      expect(rule.create(testCtx)).toEqual({})

      const fixtureCtx = createMockContext('/project/src/components/button/button.ssr.fixture.tsx')
      expect(rule.create(fixtureCtx)).toEqual({})
    })
  })
})
