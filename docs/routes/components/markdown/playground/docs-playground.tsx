import { For, Show, createMemo, untrack, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'
import { Portal } from 'solid-js/web'

import { Badge, Button, Icon, Switch, createId } from '../../../../../src'
import { DOCS_FOCUS_RING_CLASS } from '../../../../shared/docs-focus.class'
import { ComponentDocContext } from '../component-doc.context'

import { createDocsPlaygroundSlots } from './create-docs-playground-slots'
import {
  DocsPlaygroundControlField,
  getDocsPlaygroundControlDefaults,
  normalizeDocsPlaygroundControls,
} from './docs-playground-controls'
import type {
  DocsPlaygroundControl,
  DocsPlaygroundControlValues,
  DocsPlaygroundProps,
} from './docs-playground-controls'

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

/** Compact, controlled primitive inputs for an interactive docs example. */
export function DocsPlayground(props: DocsPlaygroundProps) {
  const api = useContext(ComponentDocContext)?.api
  let previewElement: HTMLDivElement | undefined
  const controls = untrack(() => normalizeDocsPlaygroundControls(props.controls))
  const valueControls = controls.filter((control) => control.kind !== 'switch')
  const switchControls = controls.filter((control) => control.kind === 'switch')
  const defaultValues = getDocsPlaygroundControlDefaults(controls)
  const idPrefix = createId(undefined, 'docs-example-control')
  const [values, setValues] = createStore<DocsPlaygroundControlValues>(defaultValues)
  const hasChanges = createMemo(() =>
    controls.some((control) => !Object.is(values[control.prop], control.defaultValue)),
  )

  function getControlId(control: DocsPlaygroundControl): string {
    return `${idPrefix()}-${controls.indexOf(control)}`
  }

  return (
    <section class="mb-4 mt-2 p-2 b-1 b-input rounded-5 bg-muted" aria-label="Playground">
      <div class="b-1 b-input rounded-3 bg-background overflow-hidden">
        <div class="flex flex-col md:flex-row md:items-stretch">
          <div
            class="p-4 bg-background flex flex-1 min-h-48 min-w-0 items-center justify-center relative sm:p-6 sm:min-h-56"
            ref={(element) => {
              previewElement = element
            }}
          >
            <div class="flex min-w-0 w-full items-center justify-center">
              {props.children(values)}
            </div>
          </div>
          <div
            class="b-t b-border bg-background flex shrink-0 flex-col w-full md:(b-l border-t-0 w-56)"
            role="group"
            aria-label="Example controls"
          >
            <div class="p-4 flex flex-col gap-4">
              <div class="flex shrink-0 min-h-6 items-center justify-between">
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
              <Show when={valueControls.length > 0}>
                <div class="gap-4 grid grid-cols-2 md:grid-cols-1">
                  <For each={valueControls}>
                    {(control) => (
                      <DocsPlaygroundControlField
                        control={control}
                        controlId={getControlId(control)}
                        value={values[control.prop]!}
                        onChange={(val) => setValues(control.prop, val)}
                      />
                    )}
                  </For>
                </div>
              </Show>
              <Show when={switchControls.length > 0}>
                <div class="flex flex-wrap gap-x-4 gap-y-1 md:flex-col md:gap-y-2">
                  <For each={switchControls}>
                    {(control) => (
                      <DocsPlaygroundControlField
                        control={control}
                        controlId={getControlId(control)}
                        value={values[control.prop]!}
                        onChange={(val) => setValues(control.prop, val)}
                      />
                    )}
                  </For>
                </div>
              </Show>
            </div>
            <Show when={api}>
              {(componentApi) => {
                const slots = createDocsPlaygroundSlots({
                  api: componentApi(),
                  preview: () => previewElement,
                })
                return (
                  <section
                    class="p-4 b-t b-border flex flex-col gap-4"
                    aria-label="Component slots"
                  >
                    <div class="flex gap-2 items-center justify-between">
                      <span class="text-foreground/90 font-semibold flex gap-1.5 items-center text-xs">
                        <Icon name="i-lucide:layers" class="text-muted-foreground size-3.5" />
                        <span>Slots</span>
                      </span>
                      <Switch
                        size="sm"
                        label="Auto"
                        checked={slots.autoHover()}
                        onCheckedChange={slots.setAutoHover}
                      />
                    </div>
                    <div class="flex flex-wrap gap-1.5">
                      <For each={slots.slots}>
                        {(slot) => (
                          <Badge
                            as="button"
                            type="button"
                            size="md"
                            variant="outline"
                            class={[
                              `font-mono cursor-pointer transition-colors ${DOCS_FOCUS_RING_CLASS} disabled:(opacity-40 cursor-not-allowed pointer-events-none)`,
                              slots.locked() === slot.name
                                ? 'text-primary border-primary bg-primary/12'
                                : 'enabled:hover:(border-primary/60 bg-primary/8)',
                            ]}
                            disabled={!slots.nodes().has(slot.name)}
                            aria-pressed={slots.locked() === slot.name}
                            onPointerEnter={() => slots.setListHovered(slot.name)}
                            onPointerLeave={() => slots.setListHovered(undefined)}
                            onFocus={() => slots.setListHovered(slot.name)}
                            onBlur={() => slots.setListHovered(undefined)}
                            onClick={() => slots.toggleSlot(slot.name)}
                          >
                            {slot.name}
                          </Badge>
                        )}
                      </For>
                    </div>
                    <Show when={slots.boxes().length > 0}>
                      {(_boxes) => (
                        <Portal mount={previewElement!.ownerDocument.body}>
                          <For each={slots.boxes()}>
                            {(box, index) => (
                              <div
                                aria-hidden="true"
                                data-docs-slot-highlight={slots.activeSlot()}
                                class="border-2 border-primary bg-primary/10 pointer-events-none shadow-[0_0_0_2px_var(--background)] fixed z-[2147483647] rounded-sm"
                                style={{
                                  top: `${box.top}px`,
                                  left: `${box.left}px`,
                                  width: `${box.width}px`,
                                  height: `${box.height}px`,
                                }}
                              >
                                <Show when={index() === 0}>
                                  <span class="text-[10px] text-primary-foreground font-mono px-1.5 py-0.5 bg-primary whitespace-nowrap left-0 absolute rounded-sm -top-6">
                                    {slots.activeSlot()}
                                  </span>
                                </Show>
                              </div>
                            )}
                          </For>
                        </Portal>
                      )}
                    </Show>
                  </section>
                )
              }}
            </Show>
          </div>
        </div>
      </div>
    </section>
  )
}
