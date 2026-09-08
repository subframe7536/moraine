import type { FieldStore, FormSchema, FormStore, RequiredPath } from '@formisch/solid'
import { useField } from '@formisch/solid'
import type { JSX, ValidComponent } from 'solid-js'
import {
  children as resolveChildren,
  createMemo,
  createSignal,
  mergeProps,
  Show,
  splitProps,
  untrack,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { hasNonEmptyJsxContent } from '../../shared/jsx-content.ts'
import { createComponentStyles } from '../../shared/provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { useId } from '../../shared/utils.ts'

import type { FormFieldContextOptions } from './form-context.ts'
import { FormFieldProvider } from './form-context.ts'
import type { FormFieldProps, FormFieldT } from './form-field.types.ts'

export * from './form-field.types.ts'

type LooseUseField = (form: FormStore, config: () => { path: RequiredPath }) => FieldStore

/** Form field wrapper providing label, description, and validation message layout. */
export function FormField<
  TSchema extends FormSchema | undefined = undefined,
  T extends ValidComponent = 'div',
>(props: FormFieldProps<TSchema, T>): JSX.Element {
  const [local, rest] = splitProps(props as FormFieldProps<any, any>, [
    'as',
    'id',
    'form',
    'name',
    'label',
    'description',
    'help',
    'error',
    'hint',
    'required',
    'disabled',
    'readOnly',
    'children',
    'orientation',
    'size',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const resolved = createComponentStyles('formField', local)

  type MergedProps = FormFieldT.Base<TSchema, T> &
    FormFieldT.Variant & {
      classes?: FormFieldT.Classes
      styles?: FormFieldT.Styles
      class?: string
      style?: JSX.CSSProperties
    }

  const merged = mergeProps(
    {
      as: 'div' as T,

      required: false,
    },

    local,
  ) as MergedProps

  const label = createMemo(() => merged.label)
  const description = createMemo(() => merged.description)
  const hint = createMemo(() => merged.hint)
  const help = createMemo(() => merged.help)
  const error = createMemo(() => merged.error)

  // oxlint-disable-next-line subf/solid-reactivity -- Initial form store reference is captured at setup.
  const activeForm = local.form

  const ariaId = useId(() => local.id, 'form-field')
  const [registeredControls, setRegisteredControls] = createSignal<
    { id: () => string; bind: () => boolean; key: symbol }[]
  >([])

  const fieldPath = createMemo<RequiredPath | undefined>(() => {
    if (typeof merged.name === 'string') {
      return merged.name ? [merged.name] : undefined
    }
    return merged.name?.length ? merged.name : undefined
  })
  const initialPath = untrack(fieldPath)
  const field =
    activeForm && initialPath
      ? // oxlint-disable-next-line subf/solid-reactivity -- Formisch tracks its getter config.
        (useField as unknown as LooseUseField)(activeForm, () => ({
          path: fieldPath() as RequiredPath,
        }))
      : undefined

  const registerControl: NonNullable<FormFieldContextOptions['registerControl']> = (entry) => {
    const key = Symbol('form-field-control')

    setRegisteredControls((previous) => [...previous, { ...entry, key }])

    return () => {
      setRegisteredControls((previous) => previous.filter((control) => control.key !== key))
    }
  }

  function selectedControlId(): string | undefined {
    const controls = registeredControls()

    for (let index = controls.length - 1; index >= 0; index -= 1) {
      const control = controls[index]

      if (control && control.bind()) {
        return control.id()
      }
    }

    return undefined
  }

  const resolvedLabelTargetId = selectedControlId

  const resolvedError = createMemo(() => {
    const value = error()

    if (value === false) {
      return false
    }

    if (value !== undefined && value !== null) {
      return value
    }

    return field?.errors?.[0]
  })

  const showLabel = createMemo(() => hasNonEmptyJsxContent(label()))
  const showHint = createMemo(() => showLabel() && hasNonEmptyJsxContent(hint()))
  const showDescription = createMemo(() => hasNonEmptyJsxContent(description()))

  const shouldShowError = createMemo(() => {
    const value = resolvedError()

    if (value === undefined || value === null || value === false || value === true) {
      return false
    }

    if (typeof value === 'string') {
      return value.length > 0
    }

    return true
  })
  const showError = createMemo(() => error() !== false && shouldShowError())
  const showHelp = createMemo(() => !showError() && hasNonEmptyJsxContent(help()))
  const fieldAriaAttrs = createMemo<Record<string, string | boolean | undefined>>(() => {
    const describedBy = [
      ...new Set(
        [
          showHint() ? `${ariaId()}-hint` : undefined,
          showDescription() ? `${ariaId()}-description` : undefined,
          showError() ? `${ariaId()}-error` : undefined,
          showHelp() ? `${ariaId()}-help` : undefined,
        ].filter((id): id is string => Boolean(id)),
      ),
    ]

    const attrs: Record<string, string | boolean | undefined> = {}

    if (hasNonEmptyJsxContent(resolvedError())) {
      attrs['aria-invalid'] = 'true'
    }
    if (showLabel()) {
      attrs['aria-labelledby'] = `${ariaId()}-label`
    }
    if (describedBy.length > 0) {
      attrs['aria-describedby'] = describedBy.join(' ')
    }

    return attrs
  })
  const fieldContextValue: FormFieldContextOptions = {
    get error() {
      return resolvedError()
    },
    get name() {
      return field?.props.name ?? (typeof merged.name === 'string' ? merged.name : undefined)
    },
    get path() {
      return fieldPath()
    },
    get size() {
      return resolved.variants.size
    },
    get field() {
      return field
    },
    get hint() {
      return hint()
    },
    get description() {
      return description()
    },
    get help() {
      return help()
    },
    get disabled() {
      return merged.disabled
    },
    get readOnly() {
      return merged.readOnly
    },
    get required() {
      return merged.required
    },
    get ariaId() {
      return ariaId()
    },
    get labelId() {
      return showLabel() ? `${ariaId()}-label` : undefined
    },
    get controlId() {
      return selectedControlId()
    },
    ariaAttrs: fieldAriaAttrs,
    registerControl,
  }

  function renderFieldRoot(): JSX.Element {
    const body = resolveChildren(() => merged.children as JSX.Element)
    const fieldChildren = renderComponentOrElement<FormFieldT.RenderContext>(body(), {
      get error() {
        return resolvedError()
      },
    })

    return (
      <Dynamic data-slot="root" {...rest} component={merged.as as any} {...resolved.root}>
        <div data-slot="wrapper" {...resolved.slot('wrapper')}>
          <Show when={showLabel()}>
            <div data-slot="labelWrapper" {...resolved.slot('labelWrapper')}>
              <label
                id={`${ariaId()}-label`}
                for={resolvedLabelTargetId()}
                data-slot="label"
                data-required={merged.required ? '' : undefined}
                {...resolved.slot('label')}
              >
                {label()}
              </label>

              <Show when={showHint()}>
                <span id={`${ariaId()}-hint`} data-slot="hint" {...resolved.slot('hint')}>
                  {hint()}
                </span>
              </Show>
            </div>
          </Show>

          <Show when={showDescription()}>
            <p
              id={`${ariaId()}-description`}
              data-slot="description"
              {...resolved.slot('description')}
            >
              {description()}
            </p>
          </Show>
        </div>

        <div
          data-slot="container"
          data-has-text={showLabel() || showDescription() ? '' : undefined}
          {...resolved.slot('container')}
        >
          {fieldChildren}

          <Show
            when={showError()}
            fallback={
              <Show when={showHelp()}>
                <div id={`${ariaId()}-help`} data-slot="help" {...resolved.slot('help')}>
                  {help()}
                </div>
              </Show>
            }
          >
            <div id={`${ariaId()}-error`} data-slot="error" {...resolved.slot('error')}>
              {resolvedError()}
            </div>
          </Show>
        </div>
      </Dynamic>
    )
  }

  return <FormFieldProvider value={fieldContextValue}>{renderFieldRoot()}</FormFieldProvider>
}
