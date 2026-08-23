import type { JSX } from 'solid-js'
import { For, Show, createEffect, createMemo } from 'solid-js'
import { createStore } from 'solid-js/store'

import { Button, FormField, Input, Select, Switch, useId } from '../../../../src/index.ts'

const DOCS_EXAMPLE_CONTROLS_CLASS =
  'w-full md:w-64 lg:w-72 border-t md:border-t-0 md:border-l border-border/60 bg-muted/20 p-4 flex flex-col gap-3.5 shrink-0'
const DOCS_EXAMPLE_CONTROL_LABEL_CLASS = 'text-xs text-muted-foreground font-medium'

export type DocsExampleControlValue = string | number | boolean

export interface DocsExampleInputControl {
  kind: 'input'
  prop: string
  label: string
  defaultValue: string | number
  inputType?: 'text' | 'number'
}

export interface DocsExampleSwitchControl {
  kind: 'switch'
  prop: string
  label: string
  defaultValue: boolean
}

export interface DocsExampleSelectControl {
  kind: 'select'
  prop: string
  label: string
  defaultValue: string | number
  options: readonly {
    label: string
    value: string | number
  }[]
}

export type DocsExampleControl =
  | DocsExampleInputControl
  | DocsExampleSwitchControl
  | DocsExampleSelectControl

export type DocsExampleControlValues = Record<string, DocsExampleControlValue>

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isPrimitiveValue(value: unknown): value is string | number {
  return typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))
}

function getValueKey(value: string | number): string {
  return `${typeof value}:${value}`
}

function warnForTooManyControls(): void {
  if (import.meta.env.DEV) {
    console.warn('[docs-example-controls] A playground accepts at most five controls.')
  }
}

/** Validates the static, serializable control configuration authored in MDX. */
export function normalizeDocsExampleControls(value: unknown): readonly DocsExampleControl[] {
  if (!Array.isArray(value)) {
    return []
  }

  if (value.length > 5) {
    warnForTooManyControls()
    return []
  }

  const controls: DocsExampleControl[] = []
  const props = new Set<string>()

  for (const candidate of value) {
    if (!isRecord(candidate) || !isText(candidate.prop) || !isText(candidate.label)) {
      continue
    }

    const prop = candidate.prop.trim()
    if (props.has(prop)) {
      continue
    }

    if (candidate.kind === 'input') {
      if (
        !isPrimitiveValue(candidate.defaultValue) ||
        (candidate.inputType !== undefined &&
          candidate.inputType !== 'text' &&
          candidate.inputType !== 'number')
      ) {
        continue
      }

      controls.push({
        kind: 'input',
        prop,
        label: candidate.label.trim(),
        defaultValue: candidate.defaultValue,
        inputType: candidate.inputType,
      })
      props.add(prop)
      continue
    }

    if (candidate.kind === 'switch') {
      if (typeof candidate.defaultValue !== 'boolean') {
        continue
      }

      controls.push({
        kind: 'switch',
        prop,
        label: candidate.label.trim(),
        defaultValue: candidate.defaultValue,
      })
      props.add(prop)
      continue
    }

    if (candidate.kind !== 'select' || !isPrimitiveValue(candidate.defaultValue)) {
      continue
    }

    if (!Array.isArray(candidate.options) || candidate.options.length === 0) {
      continue
    }

    const values = new Set<string>()
    const options: DocsExampleSelectControl['options'][number][] = []
    let validOptions = true
    for (const option of candidate.options) {
      if (!isRecord(option) || !isText(option.label) || !isPrimitiveValue(option.value)) {
        validOptions = false
        break
      }

      const optionValue = option.value
      if (
        (typeof optionValue === 'string' && optionValue.trim().length === 0) ||
        values.has(getValueKey(optionValue))
      ) {
        validOptions = false
        break
      }

      values.add(getValueKey(optionValue))
      options.push({ label: option.label.trim(), value: optionValue })
    }

    if (!validOptions || !values.has(getValueKey(candidate.defaultValue))) {
      continue
    }

    controls.push({
      kind: 'select',
      prop,
      label: candidate.label.trim(),
      defaultValue: candidate.defaultValue,
      options,
    })
    props.add(prop)
  }

  return controls
}

export function getDocsExampleControlDefaults(
  controls: readonly DocsExampleControl[],
): DocsExampleControlValues {
  const defaults: DocsExampleControlValues = {}

  for (const control of controls) {
    defaults[control.prop] = control.defaultValue
  }

  return defaults
}

export interface DocsExampleControlsProps {
  controls: readonly DocsExampleControl[]
  values: DocsExampleControlValues
  onChange: (prop: string, value: DocsExampleControlValue) => void
  onReset: () => void
}

/** Compact, controlled primitive inputs for an interactive docs example. */
export function DocsExampleControls(props: DocsExampleControlsProps) {
  const idPrefix = useId(undefined, 'docs-example-control')
  const [numberDrafts, setNumberDrafts] = createStore<Record<string, string>>({})
  const hasChanges = createMemo(() =>
    props.controls.some((control) => !Object.is(props.values[control.prop], control.defaultValue)),
  )

  createEffect(() => {
    for (const control of props.controls) {
      if (control.kind === 'input' && control.inputType === 'number') {
        setNumberDrafts(control.prop, String(props.values[control.prop]))
      }
    }
  })

  function getControlId(index: number): string {
    return `${idPrefix()}-${index}`
  }

  function updateInput(control: DocsExampleInputControl, value: string): void {
    if (control.inputType !== 'number') {
      props.onChange(control.prop, value)
      return
    }

    setNumberDrafts(control.prop, value)
    if (value.length === 0) {
      return
    }

    const numberValue = Number(value)
    if (Number.isFinite(numberValue)) {
      props.onChange(control.prop, numberValue)
    }
  }

  function renderInputControl(control: DocsExampleInputControl, controlId: string): JSX.Element {
    return (
      <FormField
        id={controlId}
        label={control.label}
        size="sm"
        classes={{
          root: 'w-full',
          label: DOCS_EXAMPLE_CONTROL_LABEL_CLASS,
          container: 'mt-1',
        }}
      >
        <Input
          id={controlId}
          size="sm"
          type={control.inputType ?? 'text'}
          value={
            control.inputType === 'number'
              ? (numberDrafts[control.prop] ?? String(props.values[control.prop]))
              : String(props.values[control.prop])
          }
          onValueChange={(value) => updateInput(control, String(value))}
        />
      </FormField>
    )
  }

  function renderSelectControl(control: DocsExampleSelectControl, controlId: string): JSX.Element {
    return (
      <FormField
        id={controlId}
        label={control.label}
        size="sm"
        classes={{
          root: 'w-full',
          label: DOCS_EXAMPLE_CONTROL_LABEL_CLASS,
          container: 'mt-1',
        }}
      >
        <Select
          id={controlId}
          options={[...control.options]}
          search={false}
          size="sm"
          value={props.values[control.prop] as string | number}
          onChange={(value) => {
            if (value !== null) {
              props.onChange(control.prop, value)
            }
          }}
        />
      </FormField>
    )
  }

  const onSwitchKeyDown: JSX.EventHandler<HTMLDivElement, KeyboardEvent> = (event) => {
    if (event.key !== ' ' && event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    event.currentTarget.querySelector<HTMLButtonElement>('[role="switch"]')?.click()
  }

  function renderSwitchControl(control: DocsExampleSwitchControl, controlId: string): JSX.Element {
    return (
      <div class="py-0.5 flex items-center justify-between">
        <label
          class="text-xs text-muted-foreground font-medium cursor-pointer select-none"
          for={controlId}
        >
          {control.label}
        </label>
        <div onKeyDown={onSwitchKeyDown}>
          <Switch
            id={controlId}
            trackProps={{ 'aria-label': control.label }}
            size="sm"
            checked={Boolean(props.values[control.prop])}
            onChange={(value) => props.onChange(control.prop, value)}
          />
        </div>
      </div>
    )
  }

  function renderControl(control: DocsExampleControl, controlId: string): JSX.Element {
    if (control.kind === 'switch') {
      return renderSwitchControl(control, controlId)
    }

    if (control.kind === 'input') {
      return renderInputControl(control, controlId)
    }

    return renderSelectControl(control, controlId)
  }

  return (
    <div class={DOCS_EXAMPLE_CONTROLS_CLASS} role="group" aria-label="Example controls">
      <div class="h-8 shrink-0 pb-2 border-b border-border/50 flex items-center justify-between">
        <span class="text-xs text-foreground/90 tracking-tight font-semibold">Props</span>
        <Show when={hasChanges()}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leading="i-lucide:rotate-ccw"
            class="text-[0.7rem] text-muted-foreground px-1.5 h-6 hover:text-foreground"
            onClick={props.onReset}
          >
            Reset
          </Button>
        </Show>
      </div>
      <div class="flex flex-col gap-3">
        <For each={props.controls}>
          {(control, index) => {
            const controlId = getControlId(index())

            return renderControl(control, controlId)
          }}
        </For>
      </div>
    </div>
  )
}
