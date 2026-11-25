/**
 * Custom Oxlint JS Plugin for Moraine component library.
 * Enforces architectural style rules and AGENTS.md conventions.
 */

function normalizePath(filePath: string): string {
  return filePath.replaceAll('\\', '/')
}

function isComponentFile(filePath: string): boolean {
  const normalized = normalizePath(filePath)
  if (
    normalized.includes('.test.') ||
    normalized.includes('.spec.') ||
    normalized.includes('.ssr.') ||
    normalized.includes('.fixture.') ||
    normalized.endsWith('.recipe.ts') ||
    normalized.endsWith('.recipe.js') ||
    normalized.endsWith('.style-types.ts') ||
    normalized.endsWith('.types.ts')
  ) {
    return false
  }
  return /\/src\/components\//.test(normalized)
}

function isSourceFile(filePath: string): boolean {
  const normalized = normalizePath(filePath)
  if (
    normalized.includes('.test.') ||
    normalized.includes('.spec.') ||
    normalized.includes('.ssr.') ||
    normalized.includes('.fixture.')
  ) {
    return false
  }
  return /\/src\//.test(normalized)
}

function isTestOrFixtureFile(filePath: string): boolean {
  const normalized = normalizePath(filePath)
  return (
    normalized.includes('.test.') ||
    normalized.includes('.spec.') ||
    normalized.includes('.ssr.') ||
    normalized.includes('.fixture.') ||
    normalized.includes('/test/') ||
    normalized.includes('/test-util/')
  )
}

function isEntryOrBarrelFile(filePath: string): boolean {
  const normalized = normalizePath(filePath)
  if (
    normalized.endsWith('/index.ts') ||
    normalized.endsWith('/index.tsx') ||
    normalized.endsWith('/index.js')
  ) {
    return true
  }
  return (
    /\/src\/(index|utils|theme)\.ts$/.test(normalized) ||
    /\/src\/theme\/(unocss|tailwind|cn|style-types)\.ts$/.test(normalized)
  )
}

interface AstNode {
  type?: string
  parent?: AstNode
  [key: string]: unknown
}

interface IdentifierNode extends AstNode {
  type: 'Identifier' | 'JSXIdentifier'
  name: string
}

interface LiteralNode extends AstNode {
  type: 'Literal'
  value: unknown
}

interface MemberExpressionNode extends AstNode {
  type: 'MemberExpression'
  object?: AstNode
  property?: AstNode
  computed?: boolean
}

interface ConditionalExpressionNode extends AstNode {
  type: 'ConditionalExpression'
  consequent?: AstNode
  alternate?: AstNode
}

interface BinaryOrLogicalNode extends AstNode {
  type: 'LogicalExpression' | 'BinaryExpression'
  left?: AstNode
  right?: AstNode
}

interface PropertyNode extends AstNode {
  type: 'Property' | 'MethodDefinition'
  key?: AstNode
  value?: AstNode
  computed?: boolean
}

interface ObjectExpressionNode extends AstNode {
  type: 'ObjectExpression'
  properties: Array<AstNode>
}

interface ArrayExpressionNode extends AstNode {
  type: 'ArrayExpression'
  elements: Array<AstNode | null>
}

interface CallExpressionNode extends AstNode {
  type: 'CallExpression'
  callee: AstNode
  arguments: Array<AstNode>
}

interface JSXExpressionContainerNode extends AstNode {
  type: 'JSXExpressionContainer'
  expression: AstNode
}

interface JSXAttributeNode extends AstNode {
  type?: 'JSXAttribute'
  name?: AstNode
  value?: AstNode
}

interface JSXSpreadAttributeNode extends AstNode {
  type?: 'JSXSpreadAttribute'
  argument?: AstNode
}

interface JSXOpeningElementNode extends AstNode {
  type?: 'JSXOpeningElement'
  name?: AstNode
  attributes?: Array<AstNode>
}

interface JSXElementNode extends AstNode {
  type?: 'JSXElement'
  openingElement?: JSXOpeningElementNode
  children?: Array<AstNode>
}

interface FunctionNode extends AstNode {
  type?: 'FunctionDeclaration' | 'FunctionExpression' | 'ArrowFunctionExpression'
  id?: AstNode
  params?: Array<AstNode>
  body?: AstNode
}

interface VariableDeclaratorNode extends AstNode {
  type?: 'VariableDeclarator'
  id?: AstNode
  init?: AstNode | null
}

interface ExportSpecifierNode extends AstNode {
  exported?: AstNode
  local?: AstNode
}

interface ModuleDeclarationNode extends AstNode {
  source?: LiteralNode | null
}

interface ExportNamedDeclarationNode extends ModuleDeclarationNode {
  declaration?: AstNode | null
  specifiers?: Array<ExportSpecifierNode>
}

interface RuleContext {
  filename: string
  report: (descriptor: { node: AstNode; messageId: string; data?: Record<string, string> }) => void
}

type RuleVisitor = (node: AstNode) => void

interface RuleListeners {
  JSXAttribute: RuleVisitor
  JSXSpreadAttribute: RuleVisitor
  JSXOpeningElement: RuleVisitor
  JSXElement: RuleVisitor
  CallExpression: RuleVisitor
  ImportDeclaration: RuleVisitor
  ExportNamedDeclaration: RuleVisitor
  ExportAllDeclaration: RuleVisitor
  FunctionDeclaration: RuleVisitor
  VariableDeclarator: RuleVisitor
}

function isIdentifier(node: AstNode | null | undefined): node is IdentifierNode {
  return node?.type === 'Identifier' || node?.type === 'JSXIdentifier'
}

function isLiteral(node: AstNode | null | undefined): node is LiteralNode {
  return node?.type === 'Literal'
}

function isMemberExpression(node: AstNode | null | undefined): node is MemberExpressionNode {
  return node?.type === 'MemberExpression'
}

function isProperty(node: AstNode | null | undefined): node is PropertyNode {
  return node?.type === 'Property' || node?.type === 'MethodDefinition'
}

function isSlotsAccess(obj: AstNode | null | undefined): boolean {
  if (!obj) {
    return false
  }
  if (obj.type === 'Identifier' && (obj as IdentifierNode).name === 'slots') {
    return true
  }
  if (
    isMemberExpression(obj) &&
    obj.property?.type === 'Identifier' &&
    (obj.property as IdentifierNode).name === 'slots'
  ) {
    return true
  }
  return false
}

function findSlotsClassOrStyleAccess(node: AstNode | null | undefined): AstNode | null {
  if (!node) {
    return null
  }
  if (isMemberExpression(node)) {
    const propName = isIdentifier(node.property) ? node.property.name : undefined
    if (propName === 'class' || propName === 'style') {
      if (isMemberExpression(node.object) && isSlotsAccess(node.object.object)) {
        return node
      }
      if (
        node.object?.type === 'Identifier' &&
        (node.object as IdentifierNode).name.endsWith('Slot')
      ) {
        return node
      }
    }
    return findSlotsClassOrStyleAccess(node.object)
  }
  if (node.type === 'ConditionalExpression') {
    const cond = node as ConditionalExpressionNode
    return (
      findSlotsClassOrStyleAccess(cond.consequent) || findSlotsClassOrStyleAccess(cond.alternate)
    )
  }
  if (node.type === 'LogicalExpression' || node.type === 'BinaryExpression') {
    const expr = node as BinaryOrLogicalNode
    return findSlotsClassOrStyleAccess(expr.left) || findSlotsClassOrStyleAccess(expr.right)
  }
  if (node.type === 'ObjectExpression') {
    for (const prop of (node as ObjectExpressionNode).properties) {
      if (prop.type === 'Property') {
        const found = findSlotsClassOrStyleAccess((prop as PropertyNode).value)
        if (found) {
          return found
        }
      }
    }
  }
  if (node.type === 'ArrayExpression') {
    for (const el of (node as ArrayExpressionNode).elements) {
      const found = findSlotsClassOrStyleAccess(el)
      if (found) {
        return found
      }
    }
  }
  if (node.type === 'CallExpression') {
    for (const arg of (node as CallExpressionNode).arguments) {
      const found = findSlotsClassOrStyleAccess(arg)
      if (found) {
        return found
      }
    }
  }
  return null
}

/** Component and feature-entry implementation files that render slot hosts. */
function isSlotHostFile(filePath: string): boolean {
  const normalized = normalizePath(filePath)
  if (!normalized.endsWith('.tsx') && !normalized.endsWith('.jsx')) {
    return false
  }
  if (isComponentFile(filePath)) {
    return true
  }
  return isSourceFile(filePath) && /\/src\/(data-table|virtualizer)\//.test(normalized)
}

const REST_NAMES = new Set(['rest', 'others'])

/** Returns the printed callee of a `*DataAttributes.<slot>(...)` or `*DataAttributes(...)` call. */
function dataAttributesCallee(callee: AstNode | undefined): string | undefined {
  if (callee?.type === 'Identifier' && (callee as IdentifierNode).name.endsWith('DataAttributes')) {
    return (callee as IdentifierNode).name
  }
  if (
    isMemberExpression(callee) &&
    callee.object?.type === 'Identifier' &&
    (callee.object as IdentifierNode).name.endsWith('DataAttributes')
  ) {
    const property = callee.computed
      ? '[...]'
      : `.${isIdentifier(callee.property) ? callee.property.name : undefined}`
    return `${(callee.object as IdentifierNode).name}${property}`
  }
  return undefined
}

function propertyKeyName(property: AstNode | undefined): string | undefined {
  if (property?.type !== 'Property' || (property as PropertyNode).computed) {
    return undefined
  }
  const key = (property as PropertyNode).key
  return key?.type === 'Identifier'
    ? (key as IdentifierNode).name
    : isLiteral(key) && typeof key.value === 'string'
      ? key.value
      : undefined
}

/** `data: { slot: <call> }` (useRecipe) or `data: <call>` (slotWith). */
function isSlotDataEntry(call: CallExpressionNode): boolean {
  const property = call.parent
  if (property?.type !== 'Property' || (property as PropertyNode).value !== call) {
    return false
  }
  if (propertyKeyName(property) === 'data') {
    return true
  }
  const slots = property.parent
  const dataProperty = slots?.type === 'ObjectExpression' ? slots.parent : undefined
  return (
    isProperty(dataProperty) &&
    dataProperty.value === slots &&
    propertyKeyName(dataProperty) === 'data'
  )
}

/** Slot name for `{...slots.<slot>}` with a static key. */
function staticSlotsMember(argument: AstNode | undefined): string | undefined {
  if (
    isMemberExpression(argument) &&
    !argument.computed &&
    argument.object?.type === 'Identifier' &&
    (argument.object as IdentifierNode).name === 'slots' &&
    argument.property?.type === 'Identifier'
  ) {
    return (argument.property as IdentifierNode).name
  }
  return undefined
}

/** Printed name of a slot binding spread: `xSlot`, `slots.x`, `slots[k]`, or `slotWith(...)`. */
function slotBindingName(argument: AstNode | undefined): string | undefined {
  if (argument?.type === 'Identifier' && (argument as IdentifierNode).name.endsWith('Slot')) {
    return (argument as IdentifierNode).name
  }
  if (isMemberExpression(argument) && isSlotsAccess(argument.object)) {
    return argument.computed
      ? 'slots[...]'
      : `slots.${isIdentifier(argument.property) ? argument.property.name : undefined}`
  }
  if (argument?.type === 'CallExpression') {
    const callee = (argument as CallExpressionNode).callee
    const name =
      callee?.type === 'Identifier'
        ? (callee as IdentifierNode).name
        : isMemberExpression(callee) && isIdentifier(callee.property)
          ? callee.property.name
          : undefined
    if (name === 'slotWith') {
      return 'slotWith(...)'
    }
  }
  return undefined
}

const GLOBAL_BUILTINS = new Set([
  'Boolean',
  'String',
  'Number',
  'BigInt',
  'Symbol',
  'Object',
  'Function',
  'Array',
  'Date',
  'RegExp',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'Promise',
  'Proxy',
  'Reflect',
  'Error',
  'TypeError',
  'RangeError',
  'SyntaxError',
  'ReferenceError',
  'URIError',
  'EvalError',
  'Intl',
  'JSON',
  'Math',
  'URL',
  'URLSearchParams',
  'Node',
  'Element',
  'HTMLElement',
  'SVGElement',
  'Event',
  'CustomEvent',
  'UIEvent',
  'MouseEvent',
  'KeyboardEvent',
  'PointerEvent',
  'FocusEvent',
  'TouchEvent',
  'WheelEvent',
  'AnimationEvent',
  'TransitionEvent',
  'ResizeObserver',
  'IntersectionObserver',
  'MutationObserver',
  'AbortController',
  'FormData',
  'File',
  'Blob',
  'Headers',
  'Request',
  'Response',
  'TextEncoder',
  'TextDecoder',
  'Infinity',
  'NaN',
])

function isPascalCase(name: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(name)
}

function toPascalCase(name: string): string {
  if (!name) {
    return name
  }
  const clean = name.replace(/^_+/, '')
  if (!clean) {
    return name
  }
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

function isJsxNode(node: AstNode | null | undefined): boolean {
  if (!node) {
    return false
  }
  if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
    return true
  }
  if (node.type === 'ConditionalExpression') {
    const cond = node as ConditionalExpressionNode
    return isJsxNode(cond.consequent) || isJsxNode(cond.alternate)
  }
  if (node.type === 'LogicalExpression') {
    return isJsxNode((node as BinaryOrLogicalNode).right)
  }
  return false
}

function functionReturnsJsx(fnNode: FunctionNode | null | undefined): boolean {
  if (!fnNode) {
    return false
  }
  if (fnNode.type === 'ArrowFunctionExpression' && fnNode.body?.type !== 'BlockStatement') {
    return isJsxNode(fnNode.body)
  }

  const body = fnNode.body
  if (!body || body.type !== 'BlockStatement') {
    return false
  }

  let found = false
  function search(current: AstNode | null | undefined) {
    if (!current || found) {
      return
    }
    if (
      current !== fnNode &&
      (current.type === 'FunctionDeclaration' ||
        current.type === 'FunctionExpression' ||
        current.type === 'ArrowFunctionExpression')
    ) {
      return
    }
    if (current.type === 'ReturnStatement') {
      if (isJsxNode(current.argument as AstNode | undefined)) {
        found = true
        return
      }
    }
    for (const key of Object.keys(current)) {
      if (key === 'parent') {
        continue
      }
      const child = current[key]
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item === 'object') {
            search(item as AstNode)
          }
        }
      } else if (child && typeof child === 'object') {
        search(child as AstNode)
      }
    }
  }

  search(body)
  return found
}

const REF_LIFECYCLE_CALL =
  /^(?:onCleanup|onSettled|createEffect|createRenderEffect|createComputed|createEventListener(?:Map)?|attachEventListener(?:Map)?|register[A-Z]\w*)$/

function calleeName(callee: AstNode | undefined): string | undefined {
  if (callee?.type === 'Identifier') {
    return (callee as IdentifierNode).name
  }
  if (isMemberExpression(callee) && !callee.computed && isIdentifier(callee.property)) {
    return callee.property.name
  }
  return undefined
}

function isRefKey(key: AstNode | undefined): boolean {
  return (
    (key?.type === 'Identifier' && (key as IdentifierNode).name === 'ref') ||
    (isLiteral(key) && key.value === 'ref')
  )
}

/** Whether a function node is a ref callback: `ref={(el) => ...}`, `ref: (el) => ...`, or `ref(el) {}`. */
function isRefCallback(fn: FunctionNode): boolean {
  const parent = fn.parent
  if (!parent) {
    return false
  }
  if (parent.type === 'JSXExpressionContainer') {
    const attribute = parent.parent
    if (attribute?.type !== 'JSXAttribute') {
      return false
    }
    const attrName = (attribute as JSXAttributeNode).name
    return isIdentifier(attrName) && attrName.name === 'ref'
  }
  if (isProperty(parent)) {
    return parent.value === fn && isRefKey(parent.key)
  }
  return false
}

function nearestFunction(node: AstNode): FunctionNode | undefined {
  let current = node.parent
  while (current) {
    if (
      current.type === 'ArrowFunctionExpression' ||
      current.type === 'FunctionExpression' ||
      current.type === 'FunctionDeclaration'
    ) {
      return current as FunctionNode
    }
    current = current.parent
  }
  return undefined
}

export default {
  meta: {
    name: 'moraine',
  },
  rules: {
    'no-slots-class-style-in-jsx': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Disallow passing a slot binding class or style (slots.<slot>.class, <slot>Slot.style) directly to JSX attributes.',
        },
        messages: {
          forbidden:
            'Do not pass a slot binding "class" or "style" to JSX attributes. Spread the binding ("{...<slot>Slot}") or use "slotWith" / "overrides".',
        },
      },
      create(context: RuleContext): Pick<RuleListeners, 'JSXAttribute' | 'JSXSpreadAttribute'> {
        return {
          JSXAttribute(rawNode: AstNode) {
            const node = rawNode as JSXAttributeNode
            if (node.value?.type === 'JSXExpressionContainer') {
              const invalid = findSlotsClassOrStyleAccess(
                (node.value as JSXExpressionContainerNode).expression,
              )
              if (invalid) {
                context.report({
                  node: invalid,
                  messageId: 'forbidden',
                })
              }
            }
          },
          JSXSpreadAttribute(rawNode: AstNode) {
            const node = rawNode as JSXSpreadAttributeNode
            const invalid = findSlotsClassOrStyleAccess(node.argument)
            if (invalid) {
              context.report({
                node: invalid,
                messageId: 'forbidden',
              })
            }
          },
        }
      },
    },

    'data-attributes-in-slot-binding': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Require *DataAttributes.*(...) calls to be slot `data` entries of useRecipe or slotWith options.',
        },
        messages: {
          mustBind:
            'Pass "{{callee}}(...)" as a slot entry of the `data` option of useRecipe or slotWith, so the slot binding carries it.',
        },
      },
      create(context: RuleContext): Pick<RuleListeners, 'CallExpression'> {
        if (!isSlotHostFile(context.filename)) {
          return {} as Pick<RuleListeners, 'CallExpression'>
        }
        return {
          CallExpression(rawNode: AstNode) {
            const node = rawNode as CallExpressionNode
            const callee = dataAttributesCallee(node.callee)
            if (callee && !isSlotDataEntry(node)) {
              context.report({ node, messageId: 'mustBind', data: { callee } })
            }
          },
        }
      },
    },

    'slot-binding-order': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Spread destructured slot bindings, and spread them before {...rest} so callers can overload generated attributes.',
        },
        messages: {
          beforeRest:
            'Spread the slot binding "{{binding}}" before "{...{{rest}}}"; owned wiring goes after rest.',
          destructure:
            'Destructure the slot binding (`slots: { {{slot}}: {{slot}}Slot }`) and spread "{...{{slot}}Slot}" instead of "{...slots.{{slot}}}".',
        },
      },
      create(context: RuleContext): Pick<RuleListeners, 'JSXOpeningElement'> {
        if (!isSlotHostFile(context.filename)) {
          return {} as Pick<RuleListeners, 'JSXOpeningElement'>
        }
        return {
          JSXOpeningElement(rawNode: AstNode) {
            const node = rawNode as JSXOpeningElementNode
            let rest: string | undefined
            for (const attribute of node.attributes ?? []) {
              if (attribute.type !== 'JSXSpreadAttribute') {
                continue
              }
              const argument = (attribute as JSXSpreadAttributeNode).argument
              if (!argument) {
                continue
              }
              const member = staticSlotsMember(argument)
              if (member) {
                context.report({ node: argument, messageId: 'destructure', data: { slot: member } })
              }
              if (
                argument.type === 'Identifier' &&
                REST_NAMES.has((argument as IdentifierNode).name)
              ) {
                rest ??= (argument as IdentifierNode).name
                continue
              }
              const binding = slotBindingName(argument)
              if (binding && rest) {
                context.report({ node: argument, messageId: 'beforeRest', data: { binding, rest } })
              }
            }
          },
        }
      },
    },

    'ref-callback-assign-only': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Ref callbacks only store the element and forward it; lifecycle work belongs in an owned scope.',
        },
        messages: {
          lifecycleInRef:
            'Do not call "{{name}}" inside a ref callback. Store the element in a signal and move this work into "bindElement" in the owner that renders it.',
        },
      },
      create(context: RuleContext): Pick<RuleListeners, 'CallExpression'> {
        if (!/\/src\//.test(normalizePath(context.filename))) {
          return {} as Pick<RuleListeners, 'CallExpression'>
        }
        return {
          CallExpression(rawNode: AstNode) {
            const node = rawNode as CallExpressionNode
            const name = calleeName(node.callee)
            if (!name || !REF_LIFECYCLE_CALL.test(name)) {
              return
            }
            const fn = nearestFunction(node)
            if (fn && isRefCallback(fn)) {
              context.report({ node, messageId: 'lifecycleInRef', data: { name } })
            }
          },
        }
      },
    },

    'require-create-effect-on': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce the Solid 2 createEffect(compute, apply) two-argument signature.',
        },
        messages: {
          requireOn:
            'Use the Solid 2 "createEffect(compute, apply)" signature: reactive reads go in the first argument, imperative work in the second.',
        },
      },
      create(context: RuleContext): Pick<RuleListeners, 'CallExpression'> {
        if (!isSourceFile(context.filename)) {
          return {} as Pick<RuleListeners, 'CallExpression'>
        }
        return {
          CallExpression(rawNode: AstNode) {
            const node = rawNode as CallExpressionNode
            if (
              node.callee.type === 'Identifier' &&
              (node.callee as IdentifierNode).name === 'createEffect'
            ) {
              const firstArg = node.arguments[0]
              if (!firstArg || node.arguments.length < 2) {
                context.report({
                  node: firstArg ?? node,
                  messageId: 'requireOn',
                })
              }
            }
          },
        }
      },
    },

    'no-emitted-extensions-in-imports': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow using emitted .js or .jsx extensions in source import paths.',
        },
        messages: {
          noEmittedExtension:
            'Never use emitted ".js" or ".jsx" extensions in source import "{{source}}". Omit the extension or use source extension (.ts / .tsx).',
        },
      },
      create(
        context: RuleContext,
      ): Pick<
        RuleListeners,
        'ImportDeclaration' | 'ExportNamedDeclaration' | 'ExportAllDeclaration'
      > {
        function checkSource(rawNode: AstNode) {
          const node = rawNode as ModuleDeclarationNode
          const source = node.source?.value
          if (
            typeof source === 'string' &&
            node.source &&
            (source.startsWith('.') || source.startsWith('@src/') || source.startsWith('moraine/'))
          ) {
            if (source.endsWith('.js') || source.endsWith('.jsx')) {
              context.report({
                node: node.source,
                messageId: 'noEmittedExtension',
                data: { source },
              })
            }
          }
        }
        return {
          ImportDeclaration: checkSource,
          ExportNamedDeclaration: checkSource,
          ExportAllDeclaration: checkSource,
        }
      },
    },

    'no-string-style-prop': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prohibit string literals or template literals for style attribute in JSX.',
        },
        messages: {
          noStringStyle:
            'String style prop is forbidden. Use a style object (style?: JSX.CSSProperties).',
        },
      },
      create(context: RuleContext): Pick<RuleListeners, 'JSXAttribute'> {
        const normalized = normalizePath(context.filename)
        if (
          normalized.includes('/test/') ||
          normalized.includes('.test.') ||
          normalized.includes('.spec.')
        ) {
          return {} as Pick<RuleListeners, 'JSXAttribute'>
        }
        return {
          JSXAttribute(rawNode: AstNode) {
            const node = rawNode as JSXAttributeNode
            if (
              node.name?.type === 'JSXIdentifier' &&
              (node.name as IdentifierNode).name === 'style'
            ) {
              if (isLiteral(node.value) && typeof node.value.value === 'string') {
                context.report({
                  node: node.value,
                  messageId: 'noStringStyle',
                })
              } else if (node.value?.type === 'JSXExpressionContainer') {
                const expr = (node.value as JSXExpressionContainerNode).expression
                if (
                  (isLiteral(expr) && typeof expr.value === 'string') ||
                  expr.type === 'TemplateLiteral'
                ) {
                  context.report({
                    node: expr,
                    messageId: 'noStringStyle',
                  })
                }
              }
            }
          },
        }
      },
    },

    'no-direct-component-call': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Prohibit calling components directly as functions and require JSX-returning functions to be PascalCase SolidJS components.',
        },
        messages: {
          noDirectCall:
            'Do not call component "{{name}}" directly as a function. Use JSX syntax "<{{pascalName}} ... />" instead.',
          mustBePascalCaseComponent:
            'Function "{{name}}" returns JSX and must be a SolidJS component with a PascalCase name. Use JSX syntax "<{{pascalName}} ... />" instead.',
        },
      },
      create(
        context: RuleContext,
      ): Pick<RuleListeners, 'FunctionDeclaration' | 'VariableDeclarator' | 'CallExpression'> {
        const normalized = normalizePath(context.filename)
        if (
          !isComponentFile(context.filename) ||
          (!normalized.endsWith('.tsx') && !normalized.endsWith('.jsx'))
        ) {
          return {} as Pick<
            RuleListeners,
            'FunctionDeclaration' | 'VariableDeclarator' | 'CallExpression'
          >
        }
        const jsxFunctions = new Set<string>()

        function checkFunction(name: string, fnNode: FunctionNode, reportNode: AstNode) {
          if (
            !name ||
            isPascalCase(name) ||
            /^[A-Z0-9_]+$/.test(name) ||
            GLOBAL_BUILTINS.has(name)
          ) {
            return
          }
          if (functionReturnsJsx(fnNode)) {
            jsxFunctions.add(name)
            context.report({
              node: reportNode,
              messageId: 'mustBePascalCaseComponent',
              data: {
                name,
                pascalName: toPascalCase(name),
              },
            })
          }
        }

        return {
          FunctionDeclaration(rawNode: AstNode) {
            const node = rawNode as FunctionNode
            if (node.id?.type === 'Identifier') {
              checkFunction((node.id as IdentifierNode).name, node, node.id)
            }
          },
          VariableDeclarator(rawNode: AstNode) {
            const node = rawNode as VariableDeclaratorNode
            if (
              node.id?.type === 'Identifier' &&
              node.init &&
              (node.init.type === 'ArrowFunctionExpression' ||
                node.init.type === 'FunctionExpression')
            ) {
              checkFunction((node.id as IdentifierNode).name, node.init as FunctionNode, node.id)
            }
          },
          CallExpression(rawNode: AstNode) {
            const node = rawNode as CallExpressionNode
            if (node.callee.type === 'Identifier') {
              const name = (node.callee as IdentifierNode).name
              if (isPascalCase(name) && !/^[A-Z0-9_]+$/.test(name) && !GLOBAL_BUILTINS.has(name)) {
                context.report({
                  node,
                  messageId: 'noDirectCall',
                  data: {
                    name,
                    pascalName: name,
                  },
                })
              } else if (jsxFunctions.has(name)) {
                context.report({
                  node,
                  messageId: 'noDirectCall',
                  data: {
                    name,
                    pascalName: toPascalCase(name),
                  },
                })
              }
            }
          },
        }
      },
    },

    'no-re-export': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Disallow standalone "export { ... }" and module re-exports in component files. All exports must be declared inline.',
        },
        messages: {
          mustInline:
            'Standalone "export { {{names}} }" is disallowed. Export declarations inline (e.g. "export const", "export function", "export type").',
          noReExport:
            'Re-exporting from "{{source}}" is disallowed in component files. Export declarations directly where defined and import directly from source.',
        },
      },
      create(
        context: RuleContext,
      ): Pick<RuleListeners, 'ExportNamedDeclaration' | 'ExportAllDeclaration'> {
        if (isTestOrFixtureFile(context.filename)) {
          return {} as Pick<RuleListeners, 'ExportNamedDeclaration' | 'ExportAllDeclaration'>
        }
        const isEntryOrBarrel = isEntryOrBarrelFile(context.filename)

        return {
          ExportNamedDeclaration(rawNode: AstNode) {
            const node = rawNode as ExportNamedDeclarationNode
            if (!node.declaration) {
              if (!node.source) {
                const names =
                  node.specifiers
                    ?.map((s) => {
                      const exported = s.exported as { name?: string } | undefined
                      const local = s.local as { name?: string } | undefined
                      return exported?.name || local?.name
                    })
                    .filter(Boolean)
                    .join(', ') || 'bindings'
                context.report({
                  node,
                  messageId: 'mustInline',
                  data: { names },
                })
              } else if (!isEntryOrBarrel) {
                context.report({
                  node,
                  messageId: 'noReExport',
                  data: { source: typeof node.source.value === 'string' ? node.source.value : '' },
                })
              }
            }
          },
          ExportAllDeclaration(rawNode: AstNode) {
            const node = rawNode as ModuleDeclarationNode
            if (!isEntryOrBarrel) {
              context.report({
                node,
                messageId: 'noReExport',
                data: {
                  source: typeof node.source?.value === 'string' ? node.source.value : '',
                },
              })
            }
          },
        }
      },
    },

    'no-default-param-render-children': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Warn when JSX children is a function whose parameters all have defaults or a rest element; it runs as an accessor and never receives render props.',
        },
        messages: {
          accessorCall:
            'A children function whose parameters all have defaults is invoked as an accessor with no arguments, so the defaults apply and render props are never passed. Declare a required parameter to mount it as a render-prop component.',
        },
      },
      create(context: RuleContext): Pick<RuleListeners, 'JSXElement' | 'JSXAttribute'> {
        function check(expression: AstNode | undefined): void {
          if (
            expression?.type !== 'ArrowFunctionExpression' &&
            expression?.type !== 'FunctionExpression'
          ) {
            return
          }
          const params = (expression as FunctionNode).params ?? []
          const first = params[0]
          if (first && (first.type === 'AssignmentPattern' || first.type === 'RestElement')) {
            context.report({ node: expression, messageId: 'accessorCall' })
          }
        }

        return {
          JSXElement(rawNode: AstNode) {
            const node = rawNode as JSXElementNode
            const tagName = node.openingElement?.name
            if (
              tagName?.type === 'JSXIdentifier' &&
              ((tagName as IdentifierNode).name === 'For' ||
                (tagName as IdentifierNode).name === 'Index')
            ) {
              return
            }
            for (const child of node.children ?? []) {
              if (child.type === 'JSXExpressionContainer') {
                check((child as JSXExpressionContainerNode).expression)
              }
            }
          },
          JSXAttribute(rawNode: AstNode) {
            const node = rawNode as JSXAttributeNode
            if (
              node.name?.type === 'JSXIdentifier' &&
              (node.name as IdentifierNode).name === 'children' &&
              node.value?.type === 'JSXExpressionContainer'
            ) {
              check((node.value as JSXExpressionContainerNode).expression)
            }
          },
        }
      },
    },
  },
}
