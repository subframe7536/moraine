import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, createSignal, Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import { hasContent } from '../../shared/jsx-content'
import { renderWithProps } from '../../shared/render-with-props'
import type { ValidComponent } from '../../shared/types'
import { createId } from '../../shared/utils'

import type { FieldBinding, FieldContextOptions, FieldPath } from './field-context'
import { FieldProvider } from './field-context'
import { fieldDataAttributes, fieldRecipe } from './field.recipe'
import type { FieldProps } from './field.types'
/** Generic field layout and accessibility primitive. */
export function Field<T extends ValidComponent = 'div'>(
  props: FieldProps<T> & { binding?: FieldBinding },
): JSX.Element {
  const [local, rest] = splitProps(props, [
    'binding',
    'as',
    'id',
    'name',
    'label',
    'hiddenLabel',
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
  const isRequired = () => Boolean(local.required)
  const labelHidden = () => !hasContent(local.label) && Boolean(local.hiddenLabel)
  const label = createMemo(() => (hasContent(local.label) ? local.label : local.hiddenLabel))
  const description = createMemo(() => local.description)
  const hint = createMemo(() => local.hint)
  const help = createMemo(() => local.help)
  const error = createMemo(() => local.error)

  const showLabel = () => hasContent(label())
  const showHint = () => showLabel() && hasContent(hint())
  const showDescription = () => hasContent(description())
  const hasLabelText = () => (showLabel() && !labelHidden()) || showHint()
  const hasText = () => hasLabelText() || showDescription()
  const {
    slots: {
      root: rootSlot,
      wrapper: wrapperSlot,
      labelWrapper: labelWrapperSlot,
      label: labelSlot,
      hint: hintSlot,
      description: descriptionSlot,
      container: containerSlot,
      help: helpSlot,
      error: errorSlot,
    },
    variants,
  } = useRecipe(fieldRecipe, local, {
    data: {
      label: fieldDataAttributes.label({ required: isRequired }),
      container: fieldDataAttributes.container({ hasText }),
    },
    context: () => ({
      variants: {
        labelHidden: labelHidden(),
        hasLabelText: hasLabelText(),
        hasText: hasText(),
      },
    }),
  })

  const ariaId = createId(() => local.id, 'field')
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
    return local.binding?.error
  })

  const shouldShowError = () => hasContent(resolvedError())
  const showError = () => error() !== false && shouldShowError()
  const showHelp = () => !showError() && hasContent(help())
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
    if (hasContent(resolvedError())) {
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
      return local.binding
    },
    get size() {
      return variants.size
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
    ariaAttrs: fieldAriaAttrs,
    registerControl,
  }

  function RenderFieldInternal(): JSX.Element {
    const fieldChild = resolveChildren(() => local.children)
    const fieldChildren = createMemo(() =>
      renderWithProps(fieldChild(), {
        get error() {
          return resolvedError()
        },
      }),
    )

    return (
      <Dynamic component={local.as ?? 'div'} data-slot="field" {...rootSlot} {...rest}>
        <div data-slot="field-wrapper" {...wrapperSlot}>
          <Show when={showLabel()}>
            <div data-slot="field-label-wrapper" {...labelWrapperSlot}>
              <label
                id={`${ariaId()}-label`}
                for={selectedControlId()}
                data-slot="field-label"
                {...labelSlot}
              >
                {label()}
              </label>
              <Show when={showHint()}>
                <span id={`${ariaId()}-hint`} data-slot="field-hint" {...hintSlot}>
                  {hint()}
                </span>
              </Show>
            </div>
          </Show>
          <Show when={showDescription()}>
            <p id={`${ariaId()}-description`} data-slot="field-description" {...descriptionSlot}>
              {description()}
            </p>
          </Show>
        </div>
        <div data-slot="field-container" {...containerSlot}>
          {fieldChildren()}
          <Show
            when={showError()}
            fallback={
              <Show when={showHelp()}>
                <div id={`${ariaId()}-help`} data-slot="field-help" {...helpSlot}>
                  {help()}
                </div>
              </Show>
            }
          >
            <div id={`${ariaId()}-error`} data-slot="field-error" {...errorSlot}>
              {resolvedError()}
            </div>
          </Show>
        </div>
      </Dynamic>
    )
  }

  return (
    <FieldProvider value={fieldContextValue}>
      <RenderFieldInternal />
    </FieldProvider>
  )
}
