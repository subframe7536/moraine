import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'
import lucideIcons from '@iconify-json/lucide/icons.json' with { type: 'json' }
import { createInlineSvgUrl, createRenderer } from 'satteri-expressive-code'
import type {
  ExpressiveCodeBlockOptions,
  SatteriExpressiveCodeOptions,
} from 'satteri-expressive-code'
import type { Element } from 'satteri-expressive-code/hast'
import { getClassNames, selectAll, toHtml } from 'satteri-expressive-code/hast'

const NO_LINE_NUMBER_LANGUAGES =
  'bash,sh,shell,shellscript,zsh,console,terminal,ansi,text,txt,plaintext'

const LUCIDE_COPY_ICON = createInlineSvgUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${lucideIcons.icons.copy.body.replaceAll('currentColor', 'black')}</svg>`,
)

const EXPRESSIVE_CODE_OPTIONS = {
  themes: ['one-light', 'one-dark-pro'],
  shiki: {
    engine: 'javascript',
  },
  useDarkModeMediaQuery: false,
  themeCssSelector(theme) {
    return theme.type === 'dark' ? '.dark' : false
  },
  plugins: [pluginLineNumbers()],
  defaultProps: {
    showLineNumbers: false,
    overridesByLang: {
      [NO_LINE_NUMBER_LANGUAGES]: {
        showLineNumbers: false,
      },
    },
  },
  styleOverrides: {
    borderRadius: 'calc(var(--radius) + 0.125rem)',
    borderWidth: '1px',
    borderColor: 'var(--border)',
    codeFontFamily:
      'Maple Mono NF CN, Maple Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
    codeFontSize: '0.875rem',
    codeLineHeight: '1.6',
    codePaddingBlock: '0.875rem',
    codePaddingInline: '1rem',
    codeBackground: 'var(--card)',
    gutterBorderColor: 'var(--border)',
    gutterBorderWidth: '1px',
    gutterForeground: 'var(--muted-foreground)',
    gutterHighlightForeground: 'var(--foreground)',
    uiFontSize: '0.75rem',
    uiFontWeight: '500',
    uiLineHeight: '1.5',
    uiPaddingBlock: '0.25rem',
    uiPaddingInline: '0.75rem',
    focusBorder: 'var(--ring)',
    frames: {
      frameBoxShadowCssValue: '0 1px 2px rgb(0 0 0 / 0.04)',
      editorActiveTabBackground: 'var(--card)',
      editorActiveTabForeground: 'var(--foreground)',
      editorActiveTabBorderColor: 'var(--border)',
      editorActiveTabIndicatorHeight: '2px',
      editorActiveTabIndicatorTopColor: 'transparent',
      editorActiveTabIndicatorBottomColor: 'var(--ring)',
      editorTabBorderRadius: 'calc(var(--radius) - 0.125rem)',
      editorTabBarBackground: 'color-mix(in srgb, var(--muted) 72%, transparent)',
      editorTabBarBorderColor: 'var(--border)',
      editorTabBarBorderBottomColor: 'var(--border)',
      editorBackground: 'var(--card)',
      terminalTitlebarBackground: 'color-mix(in srgb, var(--muted) 72%, transparent)',
      terminalTitlebarForeground: 'var(--muted-foreground)',
      terminalTitlebarDotsForeground: 'var(--muted-foreground)',
      terminalTitlebarBorderBottomColor: 'var(--border)',
      terminalBackground: 'var(--card)',
      inlineButtonForeground: 'var(--foreground)',
      inlineButtonBackground: 'var(--background)',
      inlineButtonBorder: 'var(--border)',
      inlineButtonBorderOpacity: '1',
      tooltipSuccessBackground: 'var(--foreground)',
      tooltipSuccessForeground: 'var(--background)',
      copyIcon: LUCIDE_COPY_ICON,
    },
    lineNumbers: {
      foreground: 'var(--muted-foreground)',
      highlightForeground: 'var(--foreground)',
    },
  },
} satisfies SatteriExpressiveCodeOptions

const DOCS_EXPRESSIVE_CODE_RENDERER = createRenderer(EXPRESSIVE_CODE_OPTIONS)

export interface DocsCodeRenderOptions {
  code: string
  language: string
  meta?: string
  props?: ExpressiveCodeBlockOptions['props']
  sourceFilePath?: string
  stickyCopyButton?: boolean
}

function findDirectChildByClass(parent: Element, className: string): Element | undefined {
  return parent.children.find(
    (child): child is Element =>
      child.type === 'element' && getClassNames(child).includes(className),
  )
}

function createStickyCopyToolbars(root: Element): void {
  for (const frame of selectAll('.frame', root)) {
    const header = findDirectChildByClass(frame, 'header')
    const copy = findDirectChildByClass(frame, 'copy')
    if (!copy) {
      continue
    }

    frame.children = frame.children.filter((child) => child !== copy && child !== header)
    frame.children.unshift({
      type: 'element',
      tagName: 'div',
      properties: { className: ['docs-code-copy-toolbar'] },
      children: [copy],
    })
  }
}

export async function getDocsExpressiveCodeAssets(): Promise<{
  css: string
  js: string
}> {
  const renderer = await DOCS_EXPRESSIVE_CODE_RENDERER
  return {
    css: `${renderer.baseStyles}\n${renderer.themeStyles}`,
    js: renderer.jsModules.join('\n'),
  }
}

export async function renderDocsCodeHtml(options: DocsCodeRenderOptions): Promise<string> {
  const { ec } = await DOCS_EXPRESSIVE_CODE_RENDERER
  const { renderedGroupAst, styles } = await ec.render({
    code: options.code,
    language: options.language,
    meta: options.meta,
    props: options.props,
    parentDocument: options.sourceFilePath ? { sourceFilePath: options.sourceFilePath } : undefined,
  })

  if (options.stickyCopyButton) {
    createStickyCopyToolbars(renderedGroupAst)
  }

  if (styles.size > 0) {
    renderedGroupAst.children.unshift({
      type: 'element',
      tagName: 'style',
      properties: {},
      children: [{ type: 'text', value: [...styles].join('') }],
    })
  }

  return toHtml(renderedGroupAst)
}
