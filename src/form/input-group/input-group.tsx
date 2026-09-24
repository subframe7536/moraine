import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { containsComposed, isNode } from '../../overlay/base/dom.ts'
import { createStyles } from '../../provider/index.ts'
import { callHandler } from '../../shared/utils.ts'
import { useFieldContext } from '../field/field-context.ts'
import { isInteractiveTarget } from '../shared/is-interactive-target.ts'

import { InputGroupProvider } from './input-group-context.ts'
import { InputGroupLeading, InputGroupTrailing } from './input-group-parts.tsx'
import { inputGroupDataAttributes, inputGroupRecipe } from './input-group.recipe'
import type { InputGroupProps } from './input-group.types.ts'
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
  const resolved = createStyles(inputGroupRecipe, local, {
    inheritedVariants: () => ({ size: field?.size }),
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
        get size() {
          return resolved.variants.size
        },
        get orientation() {
          return resolved.variants.orientation
        },
        get presentation() {
          return { classes: local.classes, styles: local.styles }
        },
      }}
    >
      <div
        role="group"
        {...rest}
        data-slot="input-group"
        {...inputGroupDataAttributes.root({
          inputGroup: true,
          orientation: () => resolved.variants.orientation,
        })}
        {...resolved.styles.root}
        onPointerDown={onPointerDown}
      >
        {local.children}
        <span aria-hidden="true" data-slot="input-group-frame" {...resolved.styles.frame} />
      </div>
    </InputGroupProvider>
  )
}

InputGroup.Leading = InputGroupLeading
InputGroup.Trailing = InputGroupTrailing
