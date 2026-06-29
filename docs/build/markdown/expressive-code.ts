import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'
import { toHtml } from 'hast-util-to-html'
import { createRenderer, ExpressiveCodeBlock } from 'satteri-expressive-code'
import type { SatteriExpressiveCodeOptions } from 'satteri-expressive-code'

export const DOCS_EXPRESSIVE_CODE_OPTIONS = {
  themes: ['github-light', 'github-dark'],
  useDarkModeMediaQuery: false,
  themeCssSelector: (theme) => (theme.name === 'github-dark' ? 'html.dark' : 'html:not(.dark)'),
  plugins: [pluginCollapsibleSections(), pluginLineNumbers()],
  defaultProps: {
    wrap: true,
    showLineNumbers: true,
    collapseStyle: 'collapsible-auto',
    overridesByLang: {
      'ansi,bat,bash,batch,cmd,console,powershell,ps,ps1,psd1,psm1,sh,shell,shellscript,shellsession,text,zsh':
        {
          showLineNumbers: false,
        },
    },
  },
  styleOverrides: {
    codeFontFamily: 'var(--font-mono)',
    codeBackground: 'transparent',
    borderColor: 'var(--un-preset-border, var(--border))',
    borderRadius: '0.5rem',
    frames: {
      frameBoxShadowCssValue: 'none',
    },
  },
} satisfies SatteriExpressiveCodeOptions

const docsExpressiveCodeRenderer = createRenderer(DOCS_EXPRESSIVE_CODE_OPTIONS)

export async function renderDocsCodeBlock(source: string, lang = 'text'): Promise<string> {
  const { ec, baseStyles, themeStyles, jsModules } = await docsExpressiveCodeRenderer
  const block = new ExpressiveCodeBlock({ code: source, language: lang })
  const { renderedGroupAst, styles } = await ec.render(block)
  const styleContent = [baseStyles, themeStyles, ...styles].filter(Boolean).join('')
  const scriptContent = jsModules.join('\n')

  return [
    styleContent ? `<style>${styleContent}</style>` : '',
    toHtml(renderedGroupAst),
    scriptContent ? `<script type="module">${scriptContent}</script>` : '',
  ].join('')
}
