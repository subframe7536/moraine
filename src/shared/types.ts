import type { Component, ComponentProps, JSX, ValidComponent } from 'solid-js'

import type { ClassValue } from './style/recipe.ts'

export type { ClassValue } from './style/recipe.ts'

export type SlotClassValue = ClassValue

export type SlotStyleValue = JSX.CSSProperties

export type ElementProps<T extends HTMLElement> = JSX.HTMLAttributes<T> & {
  [key: `data-${string}`]: string | number | boolean | undefined
}

/** Type-only configuration for the public root-props surface. */
export interface MoraineTypeConfig {}

type Tags = keyof JSX.HTMLElementTags

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
  ? Omit<JSX.HTMLElementTags[T], StrictedAttributeKeys>
  : never

type IntrinsicRefProps<T extends Tags> = T extends unknown
  ? {
      ref?: JSX.HTMLElementTags[T] extends { ref?: infer Ref } ? Ref : never
    }
  : never

type Override<A, B> = Omit<A, keyof B> & B

type ComponentBaseProps<Base, Variant, Classes, Styles> = Base &
  ([Variant] extends [never] ? {} : Variant) & {
    /** Class applied to the component root or trigger element. */
    class?: SlotClassValue
    /** Style applied to the component root or trigger element. */
    style?: SlotStyleValue
  } & ([Classes] extends [never]
    ? {}
    : {
        /** Classes applied to the component slots. */
        classes?: Classes
        /** Styles applied to the component slots. */
        styles?: Styles
      })

type RootProps<T extends ValidComponent> = T extends Tags
  ? MoraineTypeConfig extends { enableRootAutocomplete: true }
    ? StrictedAttributes<T>
    : CommonRootProps & IntrinsicRefProps<T>
  : T extends Component<any>
    ? ComponentProps<T>
    : { [x: string]: unknown }

export type BaseProps<
  TElement extends ValidComponent,
  Base,
  Variant,
  Classes,
  Styles,
> = TElement extends Tags
  ? MoraineTypeConfig extends { enableRootAutocomplete: true }
    ? Override<StrictedAttributes<TElement>, ComponentBaseProps<Base, Variant, Classes, Styles>>
    : RootProps<TElement> & ComponentBaseProps<Base, Variant, Classes, Styles>
  : Override<RootProps<TElement>, ComponentBaseProps<Base, Variant, Classes, Styles>>
