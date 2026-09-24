import type { MDXComponents } from 'solid-file-router/mdx'
import type { Component, JSX } from 'solid-js'
import { createSignal, lazy, onMount, Show, untrack } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Kbd, cn } from '../../../../src'

import { CodeBlock, CodeTabs } from './code'
import { IconGallery } from './icon-gallery'
import { Markdown } from './markdown'
import {
  DOCS_BLOCK_CONTAINER_CLASS,
  DOCS_INLINE_CODE_CLASS,
  DOCS_PREVIEW_CANVAS_CLASS,
} from './markdown.class.ts'
import { DocsPlayground as Playground } from './playground'

export const DOCS_DEMO_BLOCK_CLASS = DOCS_BLOCK_CONTAINER_CLASS
export const DOCS_DEMO_BLOCK_PREVIEW_CLASS = DOCS_PREVIEW_CANVAS_CLASS

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
  code: (props: JSX.HTMLAttributes<HTMLElement>) => (
    <code {...props} class={cn(DOCS_INLINE_CODE_CLASS, props.class)} />
  ),

  Playground,
  IconGallery,

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
