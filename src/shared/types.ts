import type { Component, JSX } from 'solid-js'

import type { ClassValue } from '../theme/style/recipe'

export type { ClassValue } from '../theme/style/recipe'

export type SlotClassValue = ClassValue

export type SlotStyleValue = JSX.CSSProperties

export type ElementProps<T extends HTMLElement> = Omit<JSX.HTMLAttributes<T>, 'style'> & {
  style?: JSX.CSSProperties
  [key: `data-${string}`]: string | number | boolean | undefined
}

/**
 * Type-only configuration for the public root-props surface.
 *
 * Can be augmented via module declaration:
 * @example
 * ```ts
 * declare module 'moraine' {
 *   interface MoraineTypeConfig {
 *     simpleRootAttributes?: boolean
 *     simpleHtmlTags?: boolean
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

type RootProps<T extends ValidComponent> = string & {} extends T
  ? {}
  : T extends Tags
    ? MoraineTypeConfig extends { simpleRootAttributes: true }
      ? CommonRootProps
      : StrictedAttributes<T>
    : T extends (props: infer P) => any
      ? P
      : CommonRootProps

export type BaseProps<TElement extends ValidComponent, Base, Variant, Classes, Styles> = Override<
  RootProps<TElement>,
  ComponentBaseProps<Base, Variant, Classes, Styles>
>
