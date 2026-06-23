import { Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Tabs } from '../../src'

import { DocsApiReference } from './docs-api-reference'
import { DocsHeader } from './docs-header'
import { IntroCards } from './intro-cards'
import { IntroComponents } from './intro-components'
import type { RenderExampleMarkdownPageInput } from './markdown'
import { ShikiCodeBlock } from './shiki-code-block'
import { ToastHosts } from './toast-hosts'

const MDX_UNSUPPORTED_CLASS =
  'text-sm text-muted-foreground p-4 b-1 b-border rounded-xl border-dashed'

interface MdxProps {
  [key: string]: unknown
}

function toStringProp(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function createDocsMdxComponents(context: RenderExampleMarkdownPageInput) {
  return {
    Example(props: MdxProps) {
      const name = () => toStringProp(props.name)
      const example = () => {
        const nextName = name()
        return nextName ? context.examples[nextName] : undefined
      }

      return (
        <Show
          when={example()}
          fallback={<div class={MDX_UNSUPPORTED_CLASS}>Example not found</div>}
        >
          {(entry) => (
            <section class="mb-6 mt-4 b-1 b-border rounded-2xl bg-background shadow-sm overflow-hidden">
              <div class="p-6 flex items-center justify-center">
                <Dynamic component={entry().component} />
              </div>
              <Show when={entry().code}>
                {(code) => (
                  <ShikiCodeBlock html={code()} class="border-t border-border bg-muted/70" />
                )}
              </Show>
            </section>
          )}
        </Show>
      )
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
            content: <ShikiCodeBlock variant="source" html={item.html} />,
          }))}
        />
      )
    },

    DocsHeader(props: MdxProps) {
      return <DocsHeader componentKey={context.componentKey} apiDoc={context.apiDoc} {...props} />
    },

    DocsApiReference(props: MdxProps) {
      return <DocsApiReference model={context.apiReference} {...props} />
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
      return <ShikiCodeBlock variant="source" html={toStringProp(props.html)} />
    },
  }
}
