import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

import { iconButtonVariants, iconVariants } from './icon-button.class.ts'
import type { IconButtonVariantProps } from './icon-button.class.ts'
import { Icon } from './icon.tsx'
import type { IconT } from './icon.tsx'

export namespace IconButtonInnerT {
  export interface Slot<T = unknown> {
    /** Internal icon-only button element. */
    root?: T

    /** Icon glyph rendered inside the internal button. */
    icon?: T
  }
  export type Variant = IconButtonVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  export interface Base {
    /** Icon source. Strings should be Uno icon classes such as `i-lucide-search`. */
    name: IconT.Name

    /** Root `data-slot` name. */
    slotName?: string

    /** Icon `data-slot` name. */
    iconSlotName?: string

    /** Explicit root slot name used by composed components. */
    'data-slot'?: string

    /** Present while the composed button is loading. */
    'data-loading'?: string

    /** Whether the internal button is disabled. */
    disabled?: boolean

    /** Native click handler for the internal button. */
    onClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>

    /** Pointer handler for the internal button. */
    onPointerDown?: JSX.EventHandlerUnion<HTMLButtonElement, PointerEvent>

    /** Tab order for the internal button. */
    tabIndex?: number
  }

  export type Props = BaseProps<'button', Base, Variant, Slot>
}

export interface IconButtonInnerProps extends IconButtonInnerT.Props {}

/** Internal icon-only button foundation without loading state management. */
export function IconButtonInner(props: IconButtonInnerProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'classes',
    'styles',
    'class',
    'style',
    'name',
    'size',
    'slotName',
    'iconSlotName',
    'data-slot',
    'data-loading',
  ])

  return (
    <button
      data-slot={local['data-slot'] ?? local.slotName ?? 'root'}
      data-loading={local['data-loading']}
      type="button"
      class={iconButtonVariants({ size: local.size }, local.classes?.root, local.class)}
      style={{ ...local.styles?.root, ...local.style }}
      {...rest}
    >
      <Icon
        name={local.name}
        slotName={local.iconSlotName ?? 'icon'}
        class={iconVariants({ size: local.size }, local.classes?.icon)}
        style={local.styles?.icon}
        data-loading={local['data-loading']}
      />
    </button>
  )
}
