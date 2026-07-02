import type { ComponentProps, JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'

import { Icon } from './icon'
import type { IconT } from './icon'
import { iconButtonVariants, iconVariants } from './icon-button.class'
import type { IconButtonVariantProps } from './icon-button.class'

export namespace IconButtonInnerT {
  export interface Slot<T = unknown> {
    /** Internal icon-only button shell used by composed components. */
    root?: T

    /** Icon glyph rendered inside the internal button shell. */
    icon?: T
  }
  export type Variant = IconButtonVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
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

  export interface Props extends BaseProps<Base, Variant, Extend, Classes, Styles> {}
}

export interface IconButtonInnerProps extends IconButtonInnerT.Props {}

/** Internal icon-only button without loading behavior. */
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
  ])

  return (
    <button
      data-slot={local.slotName ?? 'root'}
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
        data-loading={(rest as any)['data-loading']}
      />
    </button>
  )
}
