import type { JSX } from '@solidjs/web'
import { For, Show } from 'solid-js'

import { Collapsible, Icon, cn } from '../../../../../src'
import type { PresentationPropItem } from '../../../../build/api-doc/presentation'
import { DOCS_INLINE_CODE_CLASS } from '../markdown.recipe'
export type PropDoc = PresentationPropItem

export const REFERENCE_ROOT_CLASS =
  'mb-6 mt-3 border border-border/60 rounded-lg bg-card/20 [content-visibility:auto] overflow-hidden'

export const PROP_GRID_CLASS =
  'grid grid-cols-[minmax(0,1fr)_2.5rem] lg:grid-cols-[minmax(8rem,5fr)_minmax(0,7fr)_minmax(6rem,4.5fr)_2.5rem] sm:grid-cols-[minmax(8rem,5fr)_minmax(0,7fr)_2.5rem]'

const DESCRIPTION_CLASS =
  '[&_a]:text-primary [&_p]:m-0 [&_ul]:my-2 [&_p+p]:mt-2 [&_ul]:pl-5 [&_ul]:list-disc [&_a]:underline [&_a]:underline-offset-4'

const EXAMPLE_CLASS =
  'text-xs font-mono p-3 border border-border/40 rounded-md bg-background/60 overflow-x-auto [&_code]:text-inherit [&_code]:font-inherit [&_pre]:m-0 [&_pre]:bg-transparent!'

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
              <dd class="text-muted-foreground leading-relaxed m-0 min-w-0 sm:pt-3 sm:border-t sm:border-border/30">
                <Show when={props.prop.descriptionHtml} fallback={description()}>
                  {(html) => (
                    <div
                      class={DESCRIPTION_CLASS}
                      // oxlint-disable-next-line subf/solid-no-innerhtml
                      innerHTML={html()}
                    />
                  )}
                </Show>
              </dd>
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

        <Show when={props.prop.examplesHtml?.length}>
          <dt class="text-xs text-muted-foreground font-medium sm:pt-3 sm:border-t sm:border-border/30">
            {(props.prop.examplesHtml?.length ?? 0) > 1 ? 'Examples' : 'Example'}
          </dt>
          <dd class="m-0 gap-2 grid min-w-0 sm:pt-3 sm:border-t sm:border-border/30">
            <For each={props.prop.examplesHtml}>
              {(html) => (
                <div
                  class={EXAMPLE_CLASS}
                  // oxlint-disable-next-line subf/solid-no-innerhtml
                  innerHTML={html}
                />
              )}
            </For>
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
        <span class="text-foreground font-medium font-mono px-3 py-2.5">
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
        <div class="text-muted-foreground flex h-full items-center justify-center">
          <Icon
            name="icon-chevron-down"
            class="transition-transform group-data-[expanded]:rotate-180"
          />
        </div>
      </Collapsible.Trigger>
      <Collapsible.Content class="bg-muted/50">
        <PropDetails prop={props.prop} />
      </Collapsible.Content>
    </Collapsible>
  )
}

export function PropRows(props: { props: Array<PropDoc> }): JSX.Element {
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
