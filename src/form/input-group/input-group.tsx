import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { containsComposed, isNode } from '../../overlay/base/dom'
import { useRecipe } from '../../provider'
import { callHandler } from '../../shared/utils'
import { useFieldContext } from '../field/field-context'
import { isInteractiveTarget } from '../shared/is-interactive-target'

import { InputGroupProvider } from './input-group-context'
import { InputGroupLeading, InputGroupTrailing } from './input-group-part'
import { inputGroupDataAttributes, inputGroupRecipe } from './input-group.recipe'
import type { InputGroupProps } from './input-group.types'
/** Shared frame for one independently exported Input or Textarea and supporting content. */
export function InputGroup(props: InputGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'children',
    'size',
    'variant',
    'orientation',
    'classes',
    'styles',
    'class',
    'style',
    'onPointerDown',
  ])
  const field = useFieldContext()
  const { slots, variants } = useRecipe(inputGroupRecipe, local, {
    contextVariants: () => ({ size: field?.size }),
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
        {...inputGroupDataAttributes.root({
          inputGroup: true,
          orientation: () => variants.orientation,
        })}
        {...rest}
        {...slots.root}
        onPointerDown={onPointerDown}
      >
        {local.children}
        <span aria-hidden="true" data-slot="input-group-frame" {...slots.frame} />
      </div>
    </InputGroupProvider>
  )
}

InputGroup.Leading = InputGroupLeading
InputGroup.Trailing = InputGroupTrailing
