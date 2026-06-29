import { Dynamic } from 'solid-js/web'

import { Tabs } from '../../src'

import { IntroCards } from './intro-cards'
import { IntroComponents } from './intro-components'
import type { RenderExampleMarkdownPageInput } from './markdown'
import { ShikiCodeBlock } from './shiki-code-block'
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

    CodeTabs(props: MdxProps) {
      const packageName = () => toStringProp(props.package)
      const items = () => {
        const nextPackageName = packageName()
        return nextPackageName ? (context.codeTabs[nextPackageName] ?? []) : []
      }

      return (
        <Tabs
          defaultValue={items()[0]?.value}
          variant="link"
          size="sm"
          classes={{
            list: 'w-fit',
            content: 'pt-1 [&_pre]:rounded-lg',
            trigger: 'flex-none',
          }}
          items={items().map((item) => ({
            label: item.label,
            value: item.value,
            content: <ShikiCodeBlock html={item.html} />,
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

    ShikiCodeBlock(props: MdxProps) {
      return <ShikiCodeBlock html={toStringProp(props.html)} />
    },
  }
}
