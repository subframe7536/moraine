import type { MDXComponents } from 'solid-file-router/mdx'
import type { Component, JSX } from 'solid-js'
import { lazy, Show, createSignal, onMount, untrack } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Kbd } from '../../../../src/index'

import { CodeBlock } from './docs-code-block'
import { CodeTabs } from './docs-code-tabs'
import { DocsPlayground as Playground } from './docs-playground'
import { IntroComponents } from './intro-components'
import { Markdown } from './markdown'
import { ToastHosts } from './toast-hosts'

const DOCS_DEMO_BLOCK_CLASS =
  'mb-6 mt-4 overflow-hidden border border-border/70 rounded-xl bg-card shadow-xs'
const DOCS_DEMO_BLOCK_PREVIEW_CLASS =
  'relative flex items-center justify-center min-h-[160px] p-6 sm:p-8 bg-background/45'

interface MdxProps {
  [key: string]: unknown
}

export interface DocsMdxPreview {
  component?: Component
  source?: string
}

function toStringProp(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export const DOCS_MDX_COMPONENTS: MDXComponents = {
  Markdown,

  button: (props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} />,
  label: (props: JSX.LabelHTMLAttributes<HTMLLabelElement>) => <label {...props} />,
  kbd: (props: JSX.IntrinsicElements['kbd']) => (
    <Kbd variant="outline" value={props.children as any} />
  ),

  Playground,

  Preview(props: MdxProps) {
    const loader = untrack(() => props.load as () => Promise<{ default: DocsMdxPreview }>)
    const PreviewRender = lazy(async () => {
      const descriptor = (await loader()).default

      return {
        default() {
          const [mounted, setMounted] = createSignal(false)
          onMount(() => queueMicrotask(() => setMounted(true)))
          return (
            <section class={DOCS_DEMO_BLOCK_CLASS}>
              <div
                class={DOCS_DEMO_BLOCK_PREVIEW_CLASS}
                data-preview-ready={mounted() ? '' : undefined}
              >
                <Show when={mounted() && descriptor.component}>
                  {(value) => <Dynamic component={value()} />}
                </Show>
              </div>
              <Show when={descriptor.source}>
                {(value) => <CodeBlock variant="source" lang="tsx" html={value()} />}
              </Show>
            </section>
          )
        },
      }
    })

    return <PreviewRender />
  },

  CodeTabs,

  IntroComponents,

  ToastHosts,

  CodeBlock(props: MdxProps) {
    return (
      <CodeBlock
        html={toStringProp(props.html)}
        code={toStringProp(props.code)}
        lang={toStringProp(props.lang)}
        title={toStringProp(props.title)}
        highlightedLines={props.highlightedLines as any}
      />
    )
  },

  DocsCodeBlock(props: MdxProps) {
    return (
      <CodeBlock
        html={toStringProp(props.html)}
        code={toStringProp(props.code)}
        lang={toStringProp(props.lang)}
        title={toStringProp(props.title)}
        highlightedLines={props.highlightedLines as any}
      />
    )
  },
}
