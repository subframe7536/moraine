import type { ComponentProps, JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'

import { Icon } from './icon'
import type { IconT } from './icon'
import { iconButtonVariants, iconVariants } from './icon-button.class'
import type { IconButtonVariantProps } from './icon-button.class'

export namespace IconButtonInnerT {
  export type Slot = 'root' | 'icon'
  export type Variant = IconButtonVariantProps
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = ComponentProps<'button'>

  export interface Item {}

  export interface Base {
    /**
     * Icon source. Strings should be Uno icon classes such as `i-lucide-search`.
     */
    name: IconT.Name

    /**
     * Root `data-slot` name.
     * @default 'root'
     */
    slotName?: string

    /**
     * Icon `data-slot` name.
     * @default 'icon'
     */
    iconSlotName?: string
  }

  export interface Props extends BaseProps<Base, Variant, Extend, Slot> {}
}

export interface IconButtonInnerProps extends IconButtonInnerT.Props {}

/** Internal icon-only button without loading behavior. */
export function IconButtonInner(props: IconButtonInnerProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'classes',
    'styles',
    'name',
    'size',
    'slotName',
    'iconSlotName',
  ])

  return (
    <button
      data-slot={local.slotName ?? 'root'}
      type="button"
      class={iconButtonVariants({ size: local.size }, local.classes?.root)}
      style={local.styles?.root}
      {...rest}
    >
      <Icon
        name={local.name}
        slotName={local.iconSlotName ?? 'icon'}
        class={iconVariants({ size: local.size }, local.classes?.icon)}
        style={local.styles?.icon}
        data-loading={(rest as any)['data-loading']}
      />
    </button>
  )
}
