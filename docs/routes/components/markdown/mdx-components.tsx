import type { JSX } from '@solidjs/web'
import type { MDXComponents } from 'solid-file-router/mdx'
import type { Component, ComponentProps } from 'solid-js'
import { Show, createComponent } from 'solid-js'

import { Kbd, cn } from '../../../../src'

import { Anatomy } from './anatomy'
import { CodeBlock, CodeTabs } from './code'
import { ColorTokenTable } from './color-token-table'
import { ComponentsIndex } from './components-index'
import { HooksIndex } from './hooks-index'
import { IconGallery } from './icon-gallery'
import { Markdown } from './markdown'
import { DOCS_INLINE_CODE_CLASS } from './markdown.recipe'

interface MdxProps {
  [key: string]: unknown
}

function toStringProp(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export const DOCS_MDX_COMPONENTS: MDXComponents = {
  Markdown,

  button: (props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} />,
  label: (props: JSX.LabelHTMLAttributes<HTMLLabelElement>) => <label {...props} />,
  kbd: (props: JSX.IntrinsicElements['kbd']) => (
    <Kbd variant="outline" value={props.children as ComponentProps<typeof Kbd>['value']} />
  ),
  code: (props: JSX.HTMLAttributes<HTMLElement>) => (
    <code {...props} class={cn(DOCS_INLINE_CODE_CLASS, props.class)} />
  ),

  Anatomy,
  IconGallery,
  ColorTokenTable,
  ComponentsIndex,
  HooksIndex,

  Preview(props: MdxProps) {
    return (
      <Show when={props.preview as Component | undefined}>
        {(PreviewComponent) => createComponent(PreviewComponent(), {})}
      </Show>
    )
  },

  CodeTabs,

  CodeBlock(props: MdxProps) {
    return (
      <CodeBlock
        html={toStringProp(props.html)}
        code={toStringProp(props.code)}
        lang={toStringProp(props.lang)}
        title={toStringProp(props.title)}
        highlightedLines={
          props.highlightedLines as ComponentProps<typeof CodeBlock>['highlightedLines']
        }
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
        highlightedLines={
          props.highlightedLines as ComponentProps<typeof CodeBlock>['highlightedLines']
        }
      />
    )
  },
}
