import type { JSX } from 'solid-js'
import { For, Show, createEffect, createMemo } from 'solid-js'
import { createStore } from 'solid-js/store'

import { Input, Select, Switch, useId } from '../../../../src/index.ts'

const DOCS_EXAMPLE_CONTROLS_CLASS =
  'flex flex-wrap items-end gap-3 border-b border-border bg-muted/35 px-4 py-3'
const DOCS_EXAMPLE_CONTROL_CLASS = 'flex min-w-32 flex-1 basis-36 flex-col gap-1.5'
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
      <>
        <label class={DOCS_EXAMPLE_CONTROL_LABEL_CLASS} for={controlId}>
          {control.label}
        </label>
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
      </>
    )
  }

  function renderSelectControl(control: DocsExampleSelectControl, controlId: string): JSX.Element {
    return (
      <>
        <label class={DOCS_EXAMPLE_CONTROL_LABEL_CLASS} for={controlId}>
          {control.label}
        </label>
        <Select
          id={controlId}
          aria-label={control.label}
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
      </>
    )
  }

  const onSwitchKeyDown: JSX.EventHandler<HTMLDivElement, KeyboardEvent> = (event) => {
    if (event.key !== ' ' && event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    event.currentTarget.querySelector<HTMLButtonElement>('[role="switch"]')?.click()
  }

  function renderControl(control: DocsExampleControl, controlId: string): JSX.Element {
    if (control.kind === 'switch') {
      return (
        <Switch
          id={controlId}
          size="sm"
          checked={Boolean(props.values[control.prop])}
          label={control.label}
          onKeyDown={onSwitchKeyDown}
          onChange={(value) => props.onChange(control.prop, value)}
        />
      )
    }

    if (control.kind === 'input') {
      return renderInputControl(control, controlId)
    }

    return renderSelectControl(control, controlId)
  }

  return (
    <div class={DOCS_EXAMPLE_CONTROLS_CLASS} role="group" aria-label="Example controls">
      <For each={props.controls}>
        {(control, index) => {
          const controlId = getControlId(index())

          return <div class={DOCS_EXAMPLE_CONTROL_CLASS}>{renderControl(control, controlId)}</div>
        }}
      </For>
      <Show when={hasChanges()}>
        <button
          type="button"
          class="h-8 text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
          onClick={props.onReset}
        >
          Reset
        </button>
      </Show>
    </div>
  )
}
