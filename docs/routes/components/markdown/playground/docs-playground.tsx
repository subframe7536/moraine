import { For, Show, createMemo, untrack, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'

import { Button, Icon, cn, useId } from '../../../../../src'
import { DOCS_PLAYGROUND_CLASS, DOCS_PLAYGROUND_PREVIEW_CLASS } from '../markdown.class.ts'

import {
  DocsPlaygroundControlField,
  getDocsPlaygroundControlDefaults,
  normalizeDocsPlaygroundControls,
} from './docs-playground-controls'
import type { DocsPlaygroundControlValues, DocsPlaygroundProps } from './docs-playground-controls'
import { DocsPlaygroundSlots } from './docs-playground-slots'
import { DocsPlaygroundApiContext } from './docs-playground.context'

export {
  DocsPlaygroundControlField,
  getDocsPlaygroundControlDefaults,
  normalizeDocsPlaygroundControls,
  type DocsPlaygroundControl,
  type DocsPlaygroundControlValue,
  type DocsPlaygroundControlValues,
  type DocsPlaygroundControlsProps,
  type DocsPlaygroundInputControl,
  type DocsPlaygroundProps,
  type DocsPlaygroundSelectControl,
  type DocsPlaygroundSwitchControl,
} from './docs-playground-controls'
export { DocsPlaygroundApiContext } from './docs-playground.context'
export { DocsPlaygroundSlots } from './docs-playground-slots'
export { DOCS_PLAYGROUND_CLASS, DOCS_PLAYGROUND_PREVIEW_CLASS }

/** Compact, controlled primitive inputs for an interactive docs example. */
export function DocsPlayground(props: DocsPlaygroundProps) {
  const api = useContext(DocsPlaygroundApiContext)
  let previewElement: HTMLDivElement | undefined
  const controls = untrack(() => normalizeDocsPlaygroundControls(props.controls))
  const defaultValues = getDocsPlaygroundControlDefaults(controls)
  const idPrefix = useId(undefined, 'docs-example-control')
  const [values, setValues] = createStore<DocsPlaygroundControlValues>(defaultValues)
  const hasChanges = createMemo(() =>
    controls.some((control) => !Object.is(values[control.prop], control.defaultValue)),
  )

  function getControlId(index: number): string {
    return `${idPrefix()}-${index}`
  }

  return (
    <section class={DOCS_PLAYGROUND_CLASS}>
      <div class="flex flex-col md:flex-row md:items-stretch">
        <div
          class={cn(DOCS_PLAYGROUND_PREVIEW_CLASS, 'flex-1 min-w-0')}
          ref={(element) => {
            previewElement = element
          }}
        >
          <div class="flex min-w-0 w-full items-center justify-center">
            {props.children(values)}
          </div>
        </div>
        <div
          class="p-4 border-t border-border/60 bg-muted/20 flex shrink-0 flex-col gap-3.5 w-full md:border-l md:border-t-0 lg:w-56 md:w-48"
          role="group"
          aria-label="Example controls"
        >
          <div class="pb-2.5 border-b border-border/60 flex shrink-0 h-8 items-center justify-between">
            <span class="text-foreground/90 tracking-tight font-semibold flex gap-1.5 items-center text-xs">
              <Icon name="i-lucide:sliders-horizontal" class="text-muted-foreground size-3.5" />
              <span>Props</span>
            </span>
            <Show when={hasChanges()}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leading="i-lucide:rotate-ccw"
                class="text-[0.7rem] text-muted-foreground px-1.5 h-6 hover:text-foreground"
                onClick={() => setValues(getDocsPlaygroundControlDefaults(controls))}
              >
                Reset
              </Button>
            </Show>
          </div>
          <div class="flex flex-col gap-3">
            <For each={controls}>
              {(control, index) => (
                <DocsPlaygroundControlField
                  control={control}
                  controlId={getControlId(index())}
                  value={values[control.prop]!}
                  onChange={(val) => setValues(control.prop, val)}
                />
              )}
            </For>
          </div>
          <Show when={api}>
            {(componentApi) => (
              <DocsPlaygroundSlots api={componentApi()} preview={() => previewElement} />
            )}
          </Show>
        </div>
      </div>
    </section>
  )
}
