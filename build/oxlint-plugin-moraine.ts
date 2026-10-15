/**
 * Custom Oxlint JS Plugin for Moraine component library.
 * Enforces architectural style rules and AGENTS.md conventions.
 */

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/')
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
  return /\/src\/(element|form|navigation|overlay)\//.test(normalized)
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

function isSlotsAccess(obj: any): boolean {
  if (!obj) {
    return false
  }
  if (obj.type === 'Identifier' && obj.name === 'slots') {
    return true
  }
  if (
    obj.type === 'MemberExpression' &&
    obj.property?.type === 'Identifier' &&
    obj.property.name === 'slots'
  ) {
    return true
  }
  return false
}

function findSlotsClassOrStyleAccess(node: any): any {
  if (!node) {
    return null
  }
  if (node.type === 'MemberExpression') {
    const propName = node.property?.name
    if (propName === 'class' || propName === 'style') {
      if (node.object?.type === 'MemberExpression' && isSlotsAccess(node.object.object)) {
        return node
      }
    }
    return findSlotsClassOrStyleAccess(node.object)
  }
  if (node.type === 'ConditionalExpression') {
    return (
      findSlotsClassOrStyleAccess(node.consequent) || findSlotsClassOrStyleAccess(node.alternate)
    )
  }
  if (node.type === 'LogicalExpression' || node.type === 'BinaryExpression') {
    return findSlotsClassOrStyleAccess(node.left) || findSlotsClassOrStyleAccess(node.right)
  }
  if (node.type === 'ObjectExpression') {
    for (const prop of node.properties) {
      if (prop.type === 'Property') {
        const found = findSlotsClassOrStyleAccess(prop.value)
        if (found) {
          return found
        }
      }
    }
  }
  if (node.type === 'ArrayExpression') {
    for (const el of node.elements) {
      const found = findSlotsClassOrStyleAccess(el)
      if (found) {
        return found
      }
    }
  }
  if (node.type === 'CallExpression') {
    for (const arg of node.arguments) {
      const found = findSlotsClassOrStyleAccess(arg)
      if (found) {
        return found
      }
    }
  }
  return null
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
            'Disallow passing slots.<slot>.class or slots.<slot>.style directly to JSX attributes.',
        },
        messages: {
          forbidden:
            'Do not pass "slots.<slot>.class" or "slots.<slot>.style" to JSX attributes. Spread "{...slots.<slot>}" directly or use "slotWith" / "overrides".',
        },
      },
      create(context: any) {
        return {
          JSXAttribute(node: any) {
            if (node.value?.type === 'JSXExpressionContainer') {
              const invalid = findSlotsClassOrStyleAccess(node.value.expression)
              if (invalid) {
                context.report({
                  node: invalid,
                  messageId: 'forbidden',
                })
              }
            }
          },
          JSXSpreadAttribute(node: any) {
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

    'inline-data-attributes-in-jsx': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Enforce calling *DataAttributes.*(...) directly inside JSX spreads rather than assigning to an intermediate variable.',
        },
        messages: {
          mustInline:
            'Call "...DataAttributes.*(...)" directly inside JSX spreads instead of assigning to variable "{{name}}".',
        },
      },
      create(context: any) {
        const normalized = normalizePath(context.filename)
        if (
          !isComponentFile(context.filename) ||
          (!normalized.endsWith('.tsx') && !normalized.endsWith('.jsx'))
        ) {
          return {}
        }
        return {
          VariableDeclarator(node: any) {
            if (node.init?.type === 'CallExpression') {
              const callee = node.init.callee
              const isDirectCall =
                callee.type === 'Identifier' && callee.name.endsWith('DataAttributes')
              const isMemberCall =
                callee.type === 'MemberExpression' &&
                callee.object?.type === 'Identifier' &&
                callee.object.name.endsWith('DataAttributes')

              if (isDirectCall || isMemberCall) {
                context.report({
                  node,
                  messageId: 'mustInline',
                  data: { name: node.id.type === 'Identifier' ? node.id.name : 'variable' },
                })
              }
            }
          },
        }
      },
    },

    'require-create-effect-on': {
      meta: {
        type: 'problem',
        docs: {
          description: "Enforce wrapping createEffect callbacks with Solid's on().",
        },
        messages: {
          requireOn:
            'Always wrap "createEffect" callbacks with Solid\'s "on()". Use "on([], () => ...)" for effects with no reactive dependencies.',
        },
      },
      create(context: any) {
        if (!isSourceFile(context.filename)) {
          return {}
        }
        return {
          CallExpression(node: any) {
            if (node.callee.type === 'Identifier' && node.callee.name === 'createEffect') {
              const firstArg = node.arguments[0]
              if (!firstArg) {
                return
              }

              if (
                firstArg.type === 'ArrowFunctionExpression' ||
                firstArg.type === 'FunctionExpression'
              ) {
                context.report({
                  node: firstArg,
                  messageId: 'requireOn',
                })
              } else if (
                firstArg.type === 'CallExpression' &&
                firstArg.callee.type === 'Identifier' &&
                firstArg.callee.name !== 'on'
              ) {
                context.report({
                  node: firstArg,
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
      create(context: any) {
        function checkSource(node: any) {
          const source = node.source?.value
          if (
            typeof source === 'string' &&
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
      create(context: any) {
        const normalized = normalizePath(context.filename)
        if (
          normalized.includes('/test/') ||
          normalized.includes('.test.') ||
          normalized.includes('.spec.')
        ) {
          return {}
        }
        return {
          JSXAttribute(node: any) {
            if (node.name?.type === 'JSXIdentifier' && node.name.name === 'style') {
              if (node.value?.type === 'Literal' && typeof node.value.value === 'string') {
                context.report({
                  node: node.value,
                  messageId: 'noStringStyle',
                })
              } else if (node.value?.type === 'JSXExpressionContainer') {
                const expr = node.value.expression
                if (
                  (expr.type === 'Literal' && typeof expr.value === 'string') ||
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
            'Prohibit calling components directly as functions. Use JSX <Component /> syntax instead.',
        },
        messages: {
          noDirectCall:
            'Do not call component "{{name}}" directly as a function. Use JSX syntax "<{{name}} ... />" instead.',
        },
      },
      create(context: any) {
        const normalized = normalizePath(context.filename)
        if (
          !isComponentFile(context.filename) ||
          (!normalized.endsWith('.tsx') && !normalized.endsWith('.jsx'))
        ) {
          return {}
        }
        return {
          CallExpression(node: any) {
            if (node.callee.type === 'Identifier') {
              const name = node.callee.name
              if (
                /^[A-Z][a-zA-Z0-9]*$/.test(name) &&
                !/^[A-Z0-9_]+$/.test(name) &&
                !GLOBAL_BUILTINS.has(name)
              ) {
                context.report({
                  node,
                  messageId: 'noDirectCall',
                  data: { name },
                })
              }
            }
          },
        }
      },
    },
  },
}
