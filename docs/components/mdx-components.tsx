import { Tabs } from '../../src'

import { IntroCards } from './intro-cards'
import { IntroComponents } from './intro-components'
import type { RenderExampleMarkdownPageInput } from './markdown'
import { ShikiCodeBlock } from './shiki-code-block'
import { ToastHosts } from './toast-hosts'

interface MdxProps {
  [key: string]: unknown
}

function toStringProp(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function createDocsMdxComponents(context: RenderExampleMarkdownPageInput) {
  return {
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
