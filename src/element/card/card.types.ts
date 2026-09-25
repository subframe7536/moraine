import type { JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue, ValidComponent } from '../../shared/types'

import type { CardStyleSlot, CardStyleVariant } from './card.style-types'

export namespace CardT {
  export type Kind = 'composite'
  export type Slot<T = unknown> = CardStyleSlot<T>
  export type Variant = CardStyleVariant
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Base<T extends ValidComponent = 'div'> {
    /** Element or component to render as. @default 'div' */
    as?: T
    /** Card parts and direct content. */
    children?: JSX.Element
  }

  /** Props for Card. */
  export type Props<T extends ValidComponent = 'div'> = BaseProps<
    T,
    Base<T>,
    Variant,
    Classes,
    Styles,
    'div'
  >

  export interface HeaderBase<T extends ValidComponent = 'div'> {
    as?: T
    children?: JSX.Element
  }
  export type HeaderProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    HeaderBase<T>,
    never,
    never,
    never,
    'div'
  >

  export interface TitleBase<T extends ValidComponent = 'div'> {
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

  export interface ActionBase<T extends ValidComponent = 'div'> {
    as?: T
    children?: JSX.Element
  }
  export type ActionProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    ActionBase<T>,
    never,
    never,
    never,
    'div'
  >

  export interface BodyBase<T extends ValidComponent = 'div'> {
    as?: T
    children?: JSX.Element
  }
  export type BodyProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    BodyBase<T>,
    never,
    never,
    never,
    'div'
  >

  export interface FooterBase<T extends ValidComponent = 'div'> {
    as?: T
    children?: JSX.Element
  }
  export type FooterProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    FooterBase<T>,
    never,
    never,
    never,
    'div'
  >
}

/** Props for Card. */
export type CardProps = CardT.Props
