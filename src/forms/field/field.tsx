import type { Accessor, JSX } from 'solid-js'
import { children as resolveChildren, createMemo, createSignal, Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import { hasNonEmptyJsxContent } from '../../shared/jsx-content'
import { renderComponentOrElement } from '../../shared/render-prop'
import type { ValidComponent } from '../../shared/types.ts'
import { useId } from '../../shared/utils'

import type { FieldBinding, FieldContextOptions, FieldPath } from './field-context'
import { FieldProvider } from './field-context'
import { fieldDataAttributes, fieldRecipe } from './field.recipe'
import type { FieldProps } from './field.types'
/** Generic field layout and accessibility primitive. */
export function Field<T extends ValidComponent = 'div'>(props: FieldProps<T>): JSX.Element {
  return renderField(props)
}

/**
 * Form adapter entry for supplying a generic field binding.
 * @internal
 */
export function renderField<T extends ValidComponent = 'div'>(
  props: FieldProps<T>,
  binding?: Accessor<FieldBinding | undefined>,
): JSX.Element {
  const [local, rest] = splitProps(props, [
    'as',
    'id',
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
  const resolved = createStyles(fieldRecipe, local)

  const isRequired = () => Boolean(local.required)
  const label = createMemo(() => local.label)
  const description = createMemo(() => local.description)
  const hint = createMemo(() => local.hint)
  const help = createMemo(() => local.help)
  const error = createMemo(() => local.error)
  const activeBinding = () => binding?.()

  const ariaId = useId(() => local.id, 'field')
  const [registeredControls, setRegisteredControls] = createSignal<
    { id: () => string; bind: () => boolean; key: symbol }[]
  >([])

  const standalonePath = createMemo<FieldPath | undefined>(() => {
    const name = local.name
    if (Array.isArray(name)) {
      return name.length > 0 ? name : undefined
    }
    return typeof name === 'string' && name ? [name] : undefined
  })

  const registerControl: NonNullable<FieldContextOptions['registerControl']> = (entry) => {
    const key = Symbol('field-control')
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

  const resolvedError = createMemo(() => {
    const value = error()
    if (value === false) {
      return false
    }
    if (value !== undefined && value !== null) {
      return value
    }
    return activeBinding()?.error
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
      return value !== ''
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

  const fieldContextValue: FieldContextOptions = {
    get error() {
      return resolvedError()
    },
    get name() {
      return local.name
    },
    get path() {
      return standalonePath()
    },
    get binding() {
      return activeBinding()
    },
    get size() {
      return resolved.variants.size
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
      return local.disabled
    },
    get readOnly() {
      return local.readOnly
    },
    get required() {
      return isRequired()
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

  function RenderFieldRoot(): JSX.Element {
    const fieldChildren = resolveChildren(() =>
      renderComponentOrElement(local.children, {
        get error() {
          return resolvedError()
        },
      }),
    )

    return (
      <Dynamic data-slot="root" {...rest} component={local.as ?? 'div'} {...resolved.styles.root}>
        <div data-slot="wrapper" {...resolved.styles.wrapper}>
          <Show when={showLabel()}>
            <div data-slot="labelWrapper" {...resolved.styles.labelWrapper}>
              <label
                id={`${ariaId()}-label`}
                for={selectedControlId()}
                data-slot="label"
                {...fieldDataAttributes.label({ required: isRequired })}
                {...resolved.styles.label}
              >
                {label()}
              </label>
              <Show when={showHint()}>
                <span id={`${ariaId()}-hint`} data-slot="hint" {...resolved.styles.hint}>
                  {hint()}
                </span>
              </Show>
            </div>
          </Show>
          <Show when={showDescription()}>
            <p
              id={`${ariaId()}-description`}
              data-slot="description"
              {...resolved.styles.description}
            >
              {description()}
            </p>
          </Show>
        </div>
        <div
          data-slot="container"
          {...fieldDataAttributes.container({
            hasText: () => showLabel() || showDescription(),
          })}
          {...resolved.styles.container}
        >
          {fieldChildren()}
          <Show
            when={showError()}
            fallback={
              <Show when={showHelp()}>
                <div id={`${ariaId()}-help`} data-slot="help" {...resolved.styles.help}>
                  {help()}
                </div>
              </Show>
            }
          >
            <div id={`${ariaId()}-error`} data-slot="error" {...resolved.styles.error}>
              {resolvedError()}
            </div>
          </Show>
        </div>
      </Dynamic>
    )
  }

  return (
    <FieldProvider value={fieldContextValue}>
      <RenderFieldRoot />
    </FieldProvider>
  )
}
