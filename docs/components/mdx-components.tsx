import { Dynamic } from 'solid-js/web'

import { Tabs } from '../../src'

import { DocsCodeBlock as DocsCodeBlockView } from './docs-code-block'
import { DocsDemoBlock } from './docs-demo-block'
import { IntroCards } from './intro-cards'
import { IntroComponents } from './intro-components'
import type { RenderExampleMarkdownPageInput } from './markdown'
import {
  DOCS_INSTALL_TABS_CONTENT_CLASS,
  DOCS_INSTALL_TABS_INDICATOR_CLASS,
  DOCS_INSTALL_TABS_LIST_CLASS,
  DOCS_INSTALL_TABS_ROOT_CLASS,
  DOCS_INSTALL_TABS_TRIGGER_CLASS,
} from './mdx-components.class'
import { ToastHosts } from './toast-hosts'

interface MdxProps {
  [key: string]: unknown
}

const MDX_INTRINSIC_TAGS = [
  'a',
  'blockquote',
  'br',
  'code',
  'del',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  'span',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'ul',
] as const

function createMdxIntrinsicComponents(): Record<(typeof MDX_INTRINSIC_TAGS)[number], unknown> {
  return Object.fromEntries(
    MDX_INTRINSIC_TAGS.map((tag) => [
      tag,
      (props: MdxProps) => <Dynamic component={tag} {...props} />,
    ]),
  ) as Record<(typeof MDX_INTRINSIC_TAGS)[number], unknown>
}

function toStringProp(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function createDocsMdxComponents(context: RenderExampleMarkdownPageInput) {
  return {
    ...createMdxIntrinsicComponents(),

    Example(props: MdxProps) {
      const example = () => {
        const examplePath = toStringProp(props.path)
        const descriptor = examplePath ? context.examples[examplePath] : undefined
        if (!descriptor) {
          throw new Error(
            `[docs-mdx] compiled example not found for path: ${examplePath ?? '<missing>'}`,
          )
        }
        return descriptor
      }
      return <DocsDemoBlock component={example().component} source={example().source} />
    },

    CodeTabs(props: MdxProps) {
      const packageName = () => toStringProp(props.package)
      const items = () => {
        const nextPackageName = packageName()
        return nextPackageName ? (context.codeTabs[nextPackageName] ?? []) : []
      }

      return (
        <Tabs
          defaultValue={items()[0]?.value}
          size="sm"
          class={DOCS_INSTALL_TABS_ROOT_CLASS}
          classes={{
            list: DOCS_INSTALL_TABS_LIST_CLASS,
            indicator: DOCS_INSTALL_TABS_INDICATOR_CLASS,
            content: DOCS_INSTALL_TABS_CONTENT_CLASS,
            trigger: DOCS_INSTALL_TABS_TRIGGER_CLASS,
          }}
          items={items().map((item) => ({
            label: item.label,
            value: item.value,
            content: <DocsCodeBlockView variant="install" html={item.html} />,
          }))}
        />
      )
    },

    IntroCards(props: MdxProps) {
      return <IntroCards {...props} />
    },

    IntroComponents(props: MdxProps) {
      return <IntroComponents {...props} />
    },

    ToastHosts(props: MdxProps) {
      return <ToastHosts {...props} />
    },

    DocsCodeBlock(props: MdxProps) {
      const html = () => {
        const value = toStringProp(props.html)
        if (!value) {
          throw new Error('[docs-mdx] compiled code block is missing rendered HTML')
        }
        return value
      }
      return <DocsCodeBlockView html={html()} />
    },
  }
}
