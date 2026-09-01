import type { JSX } from 'solid-js'
import { For, Match, Show, Switch, createMemo, untrack } from 'solid-js'
import { createStore } from 'solid-js/store'

import {
  Button,
  Icon,
  Input,
  InputNumber,
  Select,
  Switch as SwitchComp,
  useId,
} from '../../../../src/index.ts'
import type { InputT } from '../../../../src/index.ts'

export type DocsPlaygroundControlValue = string | number | boolean

export interface DocsPlaygroundInputControl {
  kind: 'input'
  prop: string
  label: string
  defaultValue: string | number
  inputType?: 'text' | 'number'
}

export interface DocsPlaygroundSwitchControl {
  kind: 'switch'
  prop: string
  label: string
  defaultValue: boolean
}

export interface DocsPlaygroundSelectControl {
  kind: 'select'
  prop: string
  label: string
  defaultValue: string | number
  options: readonly {
    label: string
    value: string | number
  }[]
}

export type DocsPlaygroundControl =
  | DocsPlaygroundInputControl
  | DocsPlaygroundSwitchControl
  | DocsPlaygroundSelectControl

export type DocsPlaygroundControlValues = Record<string, DocsPlaygroundControlValue>

const DOCS_PLAYGROUND_CLASS =
  'mb-6 mt-4 border border-border/60 rounded-xl bg-card/40 overflow-hidden shadow-xs'
const DOCS_PLAYGROUND_PREVIEW_CLASS =
  'p-6 sm:p-8 flex flex-1 min-w-0 min-h-[160px] items-center justify-center bg-background/60 relative'

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

/** Validates the static, serializable control configuration authored in MDX. */
export function normalizeDocsPlaygroundControls(value: unknown): readonly DocsPlaygroundControl[] {
  if (!Array.isArray(value)) {
    return []
  }
  const controls: DocsPlaygroundControl[] = []
  const props = new Set<string>()

  for (const candidate of value) {
    if (!isRecord(candidate) || !isText(candidate.prop) || !isText(candidate.label)) {
      continue
    }

    const prop = candidate.prop.trim()
    if (props.has(prop)) {
      continue
    }

    if (
      !Object.prototype.hasOwnProperty.call(candidate, 'defaultValue') ||
      candidate.defaultValue === undefined
    ) {
      throw new TypeError(`[docs-playground] control "${prop}" is missing defaultValue`)
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
    const options: DocsPlaygroundSelectControl['options'][number][] = []
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

export function getDocsPlaygroundControlDefaults(
  controls: readonly DocsPlaygroundControl[],
): DocsPlaygroundControlValues {
  const defaults: DocsPlaygroundControlValues = {}

  for (const control of controls) {
    defaults[control.prop] = control.defaultValue
  }

  return defaults
}

export interface DocsPlaygroundControlsProps {
  controls: readonly DocsPlaygroundControl[]
}

export interface DocsPlaygroundProps extends DocsPlaygroundControlsProps {
  children: (props: Record<string, unknown>) => JSX.Element
}

/** Compact, controlled primitive inputs for an interactive docs example. */
export function DocsPlayground(props: DocsPlaygroundProps) {
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

  function renderInputControl(control: DocsPlaygroundInputControl, controlId: string): JSX.Element {
    return (
      <div class="flex flex-col gap-1.5">
        <label for={controlId} class="text-xs text-muted-foreground font-medium">
          {control.label}
        </label>
        <Input
          id={controlId}
          size="sm"
          value={values[control.prop] as InputT.Value}
          onValueChange={(value) => setValues(control.prop, value)}
        />
      </div>
    )
  }

  function renderNumberControl(
    control: DocsPlaygroundInputControl,
    controlId: string,
  ): JSX.Element {
    return (
      <div class="flex flex-col gap-1.5">
        <label for={controlId} class="text-xs text-muted-foreground font-medium">
          {control.label}
        </label>
        <InputNumber
          id={controlId}
          size="sm"
          value={values[control.prop] as InputT.Value}
          onRawValueChange={(value) => setValues(control.prop, value)}
        />
      </div>
    )
  }

  function renderSelectControl(
    control: DocsPlaygroundSelectControl,
    controlId: string,
  ): JSX.Element {
    return (
      <div class="flex flex-col gap-1.5">
        <label for={controlId} class="text-xs text-muted-foreground font-medium">
          {control.label}
        </label>
        <Select
          id={controlId}
          size="sm"
          options={[...control.options]}
          search={false}
          value={values[control.prop] as string | number}
          onChange={(value) => {
            if (value !== null) {
              setValues(control.prop, value)
            }
          }}
        />
      </div>
    )
  }

  function renderSwitchControl(
    control: DocsPlaygroundSwitchControl,
    controlId: string,
  ): JSX.Element {
    return (
      <SwitchComp
        id={controlId}
        label={control.label}
        size="sm"
        checked={values[control.prop]}
        onChange={(value) => setValues(control.prop, value)}
      />
    )
  }

  return (
    <section class={DOCS_PLAYGROUND_CLASS}>
      <div class="flex flex-col md:flex-row md:items-stretch">
        <div class={DOCS_PLAYGROUND_PREVIEW_CLASS}>
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
            <span class="text-xs text-foreground/90 tracking-tight font-semibold flex gap-1.5 items-center">
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
                <Switch>
                  <Match
                    when={
                      control.kind === 'input' &&
                      (!control.inputType || control.inputType === 'text')
                    }
                  >
                    {renderInputControl(
                      control as DocsPlaygroundInputControl,
                      getControlId(index()),
                    )}
                  </Match>
                  <Match when={control.kind === 'input' && control.inputType === 'number'}>
                    {renderNumberControl(
                      control as DocsPlaygroundInputControl,
                      getControlId(index()),
                    )}
                  </Match>
                  <Match when={control.kind === 'switch'}>
                    {renderSwitchControl(
                      control as DocsPlaygroundSwitchControl,
                      getControlId(index()),
                    )}
                  </Match>
                  <Match when={control.kind === 'select'}>
                    {renderSelectControl(
                      control as DocsPlaygroundSelectControl,
                      getControlId(index()),
                    )}
                  </Match>
                </Switch>
              )}
            </For>
          </div>
        </div>
      </div>
    </section>
  )
}
