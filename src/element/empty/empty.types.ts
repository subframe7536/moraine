import type { JSX } from 'solid-js'

import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { EmptyStyleSlot, EmptyStyleVariant } from './empty.style-types'

export namespace EmptyT {
  export type Kind = 'composite'
  export type Slot<T = unknown> = EmptyStyleSlot<T>
  export type Variant = EmptyStyleVariant
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Base<T extends ValidComponent = 'div'> {
    /** Element or component to render as. @default 'div' */
    as?: T
    /** Empty-state parts and direct content. */
    children?: JSX.Element
  }

  /** Props for Empty. */
  export type Props<T extends ValidComponent = 'div'> = BaseProps<
    T,
    Base<T>,
    Variant,
    Classes,
    Styles,
    'div'
  >

  export interface MediaBase<T extends ValidComponent = 'div'> {
    /** Element or component to render as. @default 'div' */
    as?: T
    children?: JSX.Element
  }
  export type MediaProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    MediaBase<T>,
    never,
    never,
    never,
    'div'
  >

  export interface TitleBase<T extends ValidComponent = 'div'> {
    /** Element or component to render as. @default 'div' */
    as?: T
    children?: JSX.Element
  }
  export type TitleProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    TitleBase<T>,
    never,
    never,
    never,
    'div'
  >

  export interface DescriptionBase<T extends ValidComponent = 'p'> {
    /** Element or component to render as. @default 'p' */
    as?: T
    children?: JSX.Element
  }
  export type DescriptionProps<T extends ValidComponent = 'p'> = BaseProps<
    T,
    DescriptionBase<T>,
    never,
    never,
    never,
    'p'
  >

  export interface ActionsBase<T extends ValidComponent = 'div'> {
    /** Element or component to render as. @default 'div' */
    as?: T
    children?: JSX.Element
  }
  export type ActionsProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    ActionsBase<T>,
    never,
    never,
    never,
    'div'
  >
}

/** Props for Empty. */
export type EmptyProps = EmptyT.Props
