import type { JSX } from 'solid-js'
import { For, Show } from 'solid-js'

import { Collapsible, cn } from '../../../../../src'
import type { PresentationPropItem } from '../../../../build/api-doc/presentation'
import { DOCS_INLINE_CODE_CLASS } from '../markdown.class.ts'

export type PropDoc = PresentationPropItem

export const REFERENCE_ROOT_CLASS =
  'mt-3 mb-6 border border-border/60 bg-card/20 overflow-hidden [content-visibility:auto] rounded-lg'

export const PROP_GRID_CLASS =
  'grid grid-cols-[minmax(0,1fr)_2.5rem] sm:grid-cols-[minmax(8rem,5fr)_minmax(0,7fr)_2.5rem] lg:grid-cols-[minmax(8rem,5fr)_minmax(0,7fr)_minmax(6rem,4.5fr)_2.5rem]'

export function ReferenceChevron(): JSX.Element {
  return (
    <span class="flex h-full items-center justify-center" aria-hidden="true">
      <svg
        class="group-data-expanded:rotate-180 transition-transform"
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
      >
        <path d="M1 3.5L5 7.5L9 3.5" stroke="currentColor" />
      </svg>
    </span>
  )
}

export function PropDetails(props: { prop: PropDoc }): JSX.Element {
  return (
    <div
      role="region"
      aria-labelledby={`${props.prop.anchorId}-trigger`}
      class="px-3 py-3 border-t border-border/40 sm:px-4"
    >
      <dl class="text-sm m-0 gap-x-4 gap-y-3 grid sm:grid-cols-[8rem_minmax(0,1fr)]">
        <dt class="text-xs text-muted-foreground font-medium">Name</dt>
        <dd class="m-0 min-w-0">
          <a
            href={`#${props.prop.anchorId}`}
            class="text-primary font-mono underline underline-offset-4 hover:underline-0"
          >
            {props.prop.name}
          </a>
        </dd>

        <Show when={props.prop.description}>
          {(description) => (
            <>
              <dt class="text-xs text-muted-foreground font-medium sm:pt-3 sm:border-t sm:border-border/30">
                Description
              </dt>
              <dd
                class="text-muted-foreground leading-relaxed m-0 min-w-0 sm:pt-3 sm:border-t sm:border-border/30"
                // oxlint-disable-next-line subf/solid-no-innerhtml
                innerHTML={description()}
              />
            </>
          )}
        </Show>

        <dt class="text-xs text-muted-foreground font-medium sm:pt-3 sm:border-t sm:border-border/30">
          Type
        </dt>
        <dd class="m-0 min-w-0 sm:pt-3 sm:border-t sm:border-border/30">
          <Show
            when={props.prop.typeHtml}
            fallback={
              <code class="text-xs text-foreground font-mono whitespace-pre-wrap break-words">
                {props.prop.type}
              </code>
            }
          >
            {(html) => (
              <div
                class="text-xs font-mono [&_code]:text-inherit [&_code]:font-inherit [&_pre]:m-0 [&_pre]:whitespace-pre-wrap [&_pre]:break-words"
                // oxlint-disable-next-line subf/solid-no-innerhtml
                innerHTML={html()}
              />
            )}
          </Show>
        </dd>

        <Show when={props.prop.defaultValue !== undefined}>
          <dt class="text-xs text-muted-foreground font-medium sm:pt-3 sm:border-t sm:border-border/30">
            Default
          </dt>
          <dd class="m-0 min-w-0 sm:pt-3 sm:border-t sm:border-border/30">
            <code class={DOCS_INLINE_CODE_CLASS}>{props.prop.defaultValue}</code>
          </dd>
        </Show>
      </dl>
    </div>
  )
}

export function PropRowItem(props: { prop: PropDoc }): JSX.Element {
  const requiredText = () => (props.prop.optional ? '' : ', required')
  const defaultText = () =>
    props.prop.defaultValue === undefined ? '' : `, default: ${props.prop.defaultValue}`

  return (
    <Collapsible id={props.prop.anchorId} transition class="group border-t border-border/40">
      <Collapsible.Trigger
        aria-label={`${props.prop.name}${requiredText()}, type: ${props.prop.summaryType}${defaultText()}`}
        class={cn(
          PROP_GRID_CLASS,
          'text-sm p-0 text-left min-h-10 w-full cursor-pointer transition-colors items-stretch hover:bg-muted/30',
        )}
      >
        <span class="text-foreground font-medium font-mono px-3 py-2.5 min-w-0 truncate">
          {props.prop.name}
          <Show when={!props.prop.optional}>
            <span aria-hidden="true">*</span>
            <span class="sr-only"> (required)</span>
          </Show>
        </span>
        <code
          class="text-xs text-muted-foreground font-mono px-3 py-2.5 min-w-0 hidden truncate sm:block"
          title={props.prop.type}
        >
          {props.prop.summaryType}
        </code>
        <span class="text-xs text-muted-foreground font-mono px-3 py-2.5 min-w-0 hidden truncate lg:block">
          {props.prop.defaultValue ?? '—'}
        </span>
        <ReferenceChevron />
      </Collapsible.Trigger>
      <Collapsible.Content class="bg-muted/50">
        <PropDetails prop={props.prop} />
      </Collapsible.Content>
    </Collapsible>
  )
}

export function PropRows(props: { props: PropDoc[] }): JSX.Element {
  return (
    <div class={REFERENCE_ROOT_CLASS}>
      <div
        class={cn(
          PROP_GRID_CLASS,
          'text-[0.7rem] text-muted-foreground tracking-wider bg-muted/40 uppercase',
        )}
      >
        <span role="columnheader" class="font-semibold px-3 py-2">
          Prop
        </span>
        <span role="columnheader" class="font-semibold px-3 py-2 hidden sm:block">
          Type
        </span>
        <span role="columnheader" class="font-semibold px-3 py-2 hidden lg:block">
          Default
        </span>
        <span aria-hidden="true" />
      </div>
      <For each={props.props}>{(prop) => <PropRowItem prop={prop} />}</For>
    </div>
  )
}
