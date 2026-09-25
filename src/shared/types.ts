import type { Component, JSX } from 'solid-js'

import type { ClassValue } from '../theme/style/recipe'

export type { ClassValue } from '../theme/style/recipe'

export type SlotClassValue = ClassValue

export type SlotStyleValue = JSX.CSSProperties

export type ElementProps<
  T extends HTMLElement = HTMLElement,
  A extends JSX.HTMLAttributes<T> = JSX.HTMLAttributes<T>,
> = Omit<A, 'style' | 'class'> & {
  style?: JSX.CSSProperties
  class?: string
  [key: `data-${string}`]: string | number | boolean | undefined
}

export type InputElementProps = ElementProps<
  HTMLInputElement,
  JSX.InputHTMLAttributes<HTMLInputElement>
>

/**
 * Type-only configuration for the public root-props surface.
 *
 * Can be augmented via module declaration:
 * @example
 * ```ts
 * declare module 'moraine' {
 *   interface MoraineTypeConfig {
 *     simpleRootAttributes: true
 *     simpleHtmlTags: true
 *   }
 * }
 * ```
 */
export interface MoraineTypeConfig {}

export type Tags = MoraineTypeConfig extends { simpleHtmlTags: true }
  ? keyof JSX.HTMLElementTags
  : keyof JSX.IntrinsicElements

export type ValidComponent = Tags | Component<any> | (string & {})

type CommonRootProps = { [x: string]: unknown }

type LowerCaseEvents = Lowercase<
  Extract<keyof JSX.CustomEventHandlersCamelCase<HTMLElement>, string>
>

type StrictedAttributeKeys =
  | LowerCaseEvents
  | `on:${string}`
  | `oncapture:${string}`
  | `use:${string}`
  | `prop:${string}`
  | `attr:${string}`
  | `bool:${string}`

type StrictedAttributes<T extends Tags> = T extends unknown
  ? Omit<JSX.IntrinsicElements[T], StrictedAttributeKeys>
  : never

type Override<A, B> = Omit<A, keyof B> & B

type NullableVariantProps<Variant> = {
  [K in keyof Variant]: Variant[K] | null
}

type ComponentBaseProps<Base, Variant, Classes, Styles> = Base &
  ([Variant] extends [never] ? {} : NullableVariantProps<Variant>) &
  ([Classes] extends [never] ? {} : { classes?: Classes }) &
  ([Styles] extends [never] ? {} : { styles?: Styles }) & {
    /** Class applied to the component root or trigger element. */
    class?: SlotClassValue
    /** Style applied to the component root or trigger element. */
    style?: SlotStyleValue
  }

type RootProps<T extends ValidComponent> = T extends Tags
  ? MoraineTypeConfig extends { simpleRootAttributes: true }
    ? CommonRootProps
    : StrictedAttributes<T>
  : T extends (props: infer P) => any
    ? P
    : CommonRootProps

export type DefaultTag<T extends ValidComponent, TDefault extends ValidComponent> = [
  ValidComponent,
] extends [T]
  ? TDefault
  : T

export type TriggerBase<T extends ValidComponent = 'button'> = {
  /**
   * Element or component to render as.
   */
  as?: T
  /** Whether this trigger is disabled. */
  disabled?: boolean
  /** Trigger label and visual content. */
  children?: JSX.Element
}

export type BaseProps<
  TElement extends ValidComponent,
  Base,
  Variant,
  Classes,
  Styles,
  TDefault extends ValidComponent = TElement,
  AcceptsChildren extends boolean = 'children' extends keyof Base ? true : false,
> = Override<
  RootProps<DefaultTag<TElement, TDefault>>,
  ComponentBaseProps<Base, Variant, Classes, Styles> &
    (AcceptsChildren extends true ? {} : { children?: never })
>
