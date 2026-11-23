import type { JSX } from '@solidjs/web'
import { omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { callHandler, pick } from '../../shared/utils'
import type { Orientation } from '../../theme/style-types'
import { useFieldContext } from '../field/field-context'
import { isInteractiveTarget } from '../shared/form/is-interactive-target'
import { containsComposed, isNode } from '../shared/overlay/dom'

import { InputGroupProvider } from './input-group-context'
import { InputGroupLeading, InputGroupTrailing } from './input-group-part'
import { inputGroupDataAttributes, inputGroupRecipe } from './input-group.recipe'
import type { InputGroupProps } from './input-group.types'
/**
 * Shared frame that gives one `Input` or `Textarea` and its `InputGroup.Leading` and
 * `InputGroup.Trailing` addons a single visual boundary. Place the leading parts first, then the
 * control, then the trailing parts. The inner control still owns the value, form props, and
 * accessible name; the group registers no form field, so wrap it in `Field` for a label. Clicking
 * non-interactive group space focuses the control.
 *
 * @example
 * ```tsx
 * import { Field, Input, InputGroup } from 'moraine'
 *
 * <Field label="Website">
 *   <InputGroup>
 *     <InputGroup.Leading>https://</InputGroup.Leading>
 *     <Input placeholder="example.com" />
 *     <InputGroup.Trailing>.com</InputGroup.Trailing>
 *   </InputGroup>
 * </Field>
 * ```
 */
export function InputGroup(props: InputGroupProps): JSX.Element {
  const local = pick(
    props,
    'children',
    'size',
    'variant',
    'orientation',
    'classes',
    'styles',
    'class',
    'style',
    'onPointerDown',
  )
  const rest = omit(
    props,
    'children',
    'size',
    'variant',
    'orientation',
    'classes',
    'styles',
    'class',
    'style',
    'onPointerDown',
  )
  const field = useFieldContext()
  const {
    slots: { root: rootSlot, frame: frameSlot },
    variants,
  } = useRecipe(inputGroupRecipe, local, {
    data: {
      root: inputGroupDataAttributes.root(() => ({
        inputGroup: true,
        orientation: (): Orientation | undefined => variants.orientation,
      })),
    },
    context: () => ({ variants: { size: field?.size } }),
  })

  const onPointerDown: JSX.EventHandler<HTMLDivElement, PointerEvent> = (event) => {
    callHandler(event, local.onPointerDown)
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      !isNode(event.target) ||
      !containsComposed(event.currentTarget, event.target) ||
      isInteractiveTarget(event.target)
    ) {
      return
    }
    const control = event.currentTarget.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      ':scope > input, :scope > textarea',
    )
    if (control && !control.disabled) {
      event.preventDefault()
      control.focus()
    }
  }

  return (
    <InputGroupProvider
      value={{
        grouped: true,
        get variant() {
          return variants.variant
        },
        get size() {
          return variants.size
        },
        get orientation() {
          return variants.orientation
        },
        get slotOverrides() {
          return { classes: local.classes, styles: local.styles }
        },
      }}
    >
      <div
        role="group"
        data-slot="input-group"
        {...rootSlot}
        {...rest}
        onPointerDown={onPointerDown}
      >
        {local.children}
        <span aria-hidden="true" data-slot="input-group-frame" {...frameSlot} />
      </div>
    </InputGroupProvider>
  )
}

InputGroup.Leading = InputGroupLeading
InputGroup.Trailing = InputGroupTrailing
