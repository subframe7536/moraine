import { Match, Show, Switch } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Tabs } from '../../src'

import { DocsApiReference } from './docs-api-reference'
import { DocsHeader } from './docs-header'
import { IntroCards } from './intro-cards'
import { IntroComponents } from './intro-components'
import type { RenderExampleMarkdownPageInput } from './markdown'
import { ShikiCodeBlock } from './shiki-code-block'
import { ToastHosts } from './toast-hosts'
import type {
  CodeTabsRenderSegment,
  ExampleRenderSegment,
  MarkdownRenderSegment,
  RenderSegment,
  WidgetRenderSegment,
} from './types'

const SEGMENT_UNSUPPORTED_CLASS =
  'text-sm text-muted-foreground p-4 b-1 b-border rounded-xl border-dashed'

export function SegmentRenderer(props: {
  segment: RenderSegment
  pageContext: RenderExampleMarkdownPageInput
}) {
  return (
    <Switch fallback={<div class={SEGMENT_UNSUPPORTED_CLASS}>Unsupported segment type</div>}>
      <Match
        when={props.segment.type === 'markdown' ? (props.segment as MarkdownRenderSegment) : false}
      >
        {(segment) => (
          <div
            // oxlint-disable-next-line subf/solid-no-innerhtml
            innerHTML={segment().html}
          />
        )}
      </Match>

      <Match
        when={props.segment.type === 'example' ? (props.segment as ExampleRenderSegment) : false}
      >
        {(segment) => (
          <section class="mb-6 mt-4 b-1 b-border rounded-2xl bg-background shadow-sm overflow-hidden">
            <div class="p-6 flex items-center justify-center">
              <Dynamic component={segment().component} />
            </div>
            <Show when={segment().code}>
              <ShikiCodeBlock html={segment().code!} class="border-t border-border bg-muted/70" />
            </Show>
          </section>
        )}
      </Match>

      <Match
        when={props.segment.type === 'code-tabs' ? (props.segment as CodeTabsRenderSegment) : false}
      >
        {(segment) => (
          <Tabs
            defaultValue={segment().items[0]?.value}
            variant="link"
            size="sm"
            classes={{
              list: 'w-fit',
              content: 'pt-1 [&_pre]:rounded-lg',
              trigger: 'flex-none',
            }}
            items={segment().items.map((item) => ({
              label: item.label,
              value: item.value,
              content: <ShikiCodeBlock variant="source" html={item.html} />,
            }))}
          />
        )}
      </Match>

      <Match
        when={props.segment.type === 'docs-header' ? (props.segment as WidgetRenderSegment) : false}
      >
        {(segment) => (
          <DocsHeader
            componentKey={props.pageContext.componentKey}
            apiDoc={props.pageContext.apiDoc}
            upstreamHref={props.pageContext.upstreamHref}
            {...segment().props}
          />
        )}
      </Match>

      <Match
        when={
          props.segment.type === 'docs-api-reference'
            ? (props.segment as WidgetRenderSegment)
            : false
        }
      >
        {(segment) => (
          <DocsApiReference model={props.pageContext.apiReference} {...segment().props} />
        )}
      </Match>

      <Match
        when={props.segment.type === 'intro-cards' ? (props.segment as WidgetRenderSegment) : false}
      >
        {(segment) => <IntroCards {...segment().props} />}
      </Match>

      <Match
        when={
          props.segment.type === 'intro-components' ? (props.segment as WidgetRenderSegment) : false
        }
      >
        {(segment) => <IntroComponents {...segment().props} />}
      </Match>

      <Match
        when={props.segment.type === 'toast-hosts' ? (props.segment as WidgetRenderSegment) : false}
      >
        {(segment) => <ToastHosts {...segment().props} />}
      </Match>
    </Switch>
  )
}
