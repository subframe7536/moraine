import type { JSX } from 'solid-js'
import { Match, Switch } from 'solid-js'

import { Input, InputNumber, Select, Switch as SwitchComp } from '../../../../../src'
import type { InputT } from '../../../../../src'

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

export interface DocsPlaygroundControlsProps {
  controls: readonly DocsPlaygroundControl[]
}

export interface DocsPlaygroundProps extends DocsPlaygroundControlsProps {
  children: (props: Record<string, unknown>) => JSX.Element
}

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

export function DocsPlaygroundControlField(props: {
  control: DocsPlaygroundControl
  controlId: string
  value: DocsPlaygroundControlValue
  onChange: (value: DocsPlaygroundControlValue) => void
}): JSX.Element {
  return (
    <Switch>
      <Match
        when={
          props.control.kind === 'input' &&
          (!props.control.inputType || props.control.inputType === 'text')
        }
      >
        <div class="flex flex-col gap-1.5">
          <label for={props.controlId} class="text-xs text-muted-foreground font-medium">
            {props.control.label}
          </label>
          <Input
            id={props.controlId}
            size="sm"
            value={props.value as InputT.Value}
            onValueChange={props.onChange}
          />
        </div>
      </Match>
      <Match when={props.control.kind === 'input' && props.control.inputType === 'number'}>
        <div class="flex flex-col gap-1.5">
          <label for={props.controlId} class="text-xs text-muted-foreground font-medium">
            {props.control.label}
          </label>
          <InputNumber
            id={props.controlId}
            size="sm"
            value={props.value as InputT.Value}
            onRawValueChange={props.onChange}
          />
        </div>
      </Match>
      <Match when={props.control.kind === 'switch'}>
        <SwitchComp
          id={props.controlId}
          label={props.control.label}
          size="sm"
          checked={Boolean(props.value)}
          onChange={props.onChange}
        />
      </Match>
      <Match when={props.control.kind === 'select'}>
        {(() => {
          const selectControl = props.control as DocsPlaygroundSelectControl
          return (
            <div class="flex flex-col gap-1.5">
              <label for={props.controlId} class="text-xs text-muted-foreground font-medium">
                {selectControl.label}
              </label>
              <Select
                id={props.controlId}
                size="sm"
                items={[...selectControl.options]}
                value={props.value as string | number}
                onChange={(val) => {
                  if (val !== null) {
                    props.onChange(val)
                  }
                }}
              />
            </div>
          )
        })()}
      </Match>
    </Switch>
  )
}
