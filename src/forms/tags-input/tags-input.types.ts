import type { JSX, Ref } from 'solid-js'

import type { IconT } from '../../elements/icon/index.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../shared/form-options.ts'

export namespace TagsInputT {
  export type Kind = 'single'
  export interface TagRenderProps {
    /** Committed tag value. */
    value: string
    /** Removes the tag. */
    onClose: () => void
  }
  export interface Slot<T = unknown> {
    /** Outer visual field. */
    control?: T
    /** Icon shown before the tags. */
    leading?: T
    /** Container for tags and the draft input. */
    tagsContainer?: T
    /** One committed tag. */
    tag?: T
    /** Text label inside a tag. */
    tagLabel?: T
    /** Button that removes one tag. */
    tagRemove?: T
    /** Editable draft input. */
    input?: T
    /** Button that clears all tags and draft text. */
    clear?: T
  }
  export interface Variant {
    /** Visual treatment of the component. @default 'outline' */
    variant?: 'outline' | 'subtle' | 'ghost' | 'none'
    /** Visual size of the component. @default 'md' */
    size?: 'sm' | 'md' | 'lg'
  }
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item {}
  export interface Base
    extends
      FormIdentityOptions,
      FormDisableOption,
      FormReadOnlyOption,
      FormRequiredOption,
      FormValueOptions<string[]> {
    /** Called when committed tags change. */
    onChange?: (value: string[]) => void
    /** Controlled draft input. */
    inputValue?: string
    /** Initial uncontrolled draft input. @default '' */
    defaultInputValue?: string
    /** Called when draft input changes. */
    onInputValueChange?: (value: string) => void
    /** Strings that commit completed tokens while typing or pasting. @default [','] */
    tokenSeparators?: string[]
    /** Maximum committed tag count. */
    maxCount?: number
    /** Custom tag renderer. */
    tagRender?: ComponentOrElement<TagRenderProps>
    /** Show a clear action when tags or draft text exist. */
    allowClear?: boolean
    /** Called once when clear is triggered. */
    onClear?: () => void
    /** Placeholder shown when no tags are committed. */
    placeholder?: string
    /** Icon shown before the tags. */
    leadingIcon?: IconT.Name
    /** Icon used by clear and remove actions. @default 'icon-close' */
    closeIcon?: IconT.Name
    /** Native input event after draft synchronization. */
    onInput?: JSX.InputEventHandlerUnion<HTMLInputElement, InputEvent>
    /** Native input key event after tag behavior. */
    onKeyDown?: JSX.EventHandlerUnion<HTMLInputElement, KeyboardEvent>
    /** Optional inner input element ref. */
    inputRef?: Ref<HTMLInputElement>
  }
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

export type TagsInputProps = TagsInputT.Props
