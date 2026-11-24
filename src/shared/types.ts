import type { JSX } from '@solidjs/web'
import type { Component } from 'solid-js'

import type { SlotClassValue, SlotStyleValue } from '../theme/style-types'
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

type CommonRootProps = { [x: string]: any }

type StrictedAttributes<T extends Tags> = T extends unknown ? JSX.IntrinsicElements[T] : never

type Override<A, B> = Omit<A, keyof B> & B

/**
 * Variant props of a component, derived from its style variants (for example `variant`, `size`, `tone`).
 * Each accepts the documented values, `undefined` to fall back to the inherited or default variant,
 * or `null` to select no value, so no variant-specific classes or styles apply for that prop.
 * Resolution order: the prop, then variants inherited from an ancestor component (such as a group),
 * then the recipe default (including `defaultVariants` from a `MoraineProvider` theme).
 */
export type NullableVariantProps<Variants> = {
  [K in keyof Variants]: Variants[K] | null
}

type ComponentBaseProps<Base, Variants, Classes, Styles, HasElement extends boolean = true> = Base &
  ([Variants] extends [never] ? {} : NullableVariantProps<Variants>) &
  ([Classes] extends [never]
    ? {}
    : {
        /**
         * Classes for individual parts of the component, keyed by slot name. A slot is a named part
         * (for example `root`, `header`, `label`); the keys are listed by this prop's type. Each value
         * accepts a string, array, or object, and is merged with the class of that slot using the
         * Moraine class merger, so a conflicting utility (for example `p-4` over `p-2`) replaces the
         * built-in one instead of adding to it.
         *
         * Presentation layers, later wins: recipe and `MoraineProvider` theme, then the `classes` of
         * an ancestor component, then component-owned defaults, then this prop, then `class` on the
         * root slot, and finally functional classes the component enforces (positioning, virtual
         * scroll sizes) that cannot be overridden. For parts of a composite component, set `classes`
         * on the root and it reaches every part.
         * @example
         * ```tsx
         * import { Card } from 'moraine'
         *
         * <Card classes={{ root: 'shadow-lg', header: 'bg-muted' }}>
         *   <Card.Header>
         *     <Card.Title>Plan</Card.Title>
         *   </Card.Header>
         * </Card>
         * ```
         */
        classes?: Classes
      }) &
  ([Styles] extends [never]
    ? {}
    : {
        /**
         * Inline styles for individual parts of the component, keyed by slot name like `classes`.
         * Each value is a style object (`JSX.CSSProperties`; a string is not accepted). Styles merge
         * per property over the component's own styles in the same layer order as `classes`:
         * `undefined` and `null` values are skipped, they do not clear an earlier value, and
         * properties the component enforces (such as virtual scroll positioning) still win.
         * Custom properties (`--name`) are accepted for components that expose them.
         * @example
         * ```tsx
         * import { Card } from 'moraine'
         *
         * <Card styles={{ root: { 'max-width': '24rem' }, header: { 'padding-block': '0.5rem' } }}>
         *   <Card.Header>
         *     <Card.Title>Plan</Card.Title>
         *   </Card.Header>
         * </Card>
         * ```
         */
        styles?: Styles
      }) &
  (HasElement extends true
    ? {
        /**
         * Class applied to the component root, or to its main host element when the component has
         * no root. Unlike `classes`, it targets only that one element, and it is merged after the
         * `classes` entry for the same slot, so it wins over it. It accepts a string, array, or
         * object, and conflicting utilities replace built-in ones through the Moraine class merger.
         */
        class?: SlotClassValue
        /**
         * Inline style object applied to the component root, or to its main host element when the
         * component has no root. It is merged per property after the `styles` entry for the same
         * slot, so it wins over it; `undefined` and `null` values are skipped. Strings are not
         * accepted.
         */
        style?: SlotStyleValue
      }
    : {})

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
   * Element or component to render as. A tag name (`'a'`) renders that element and narrows the
   * other props to its attributes; a Solid component receives the props the trigger would put on
   * its element, so it should spread them onto its root and forward `ref`. Own styles and state
   * attributes are kept.
   * @example
   * ```tsx
   * import { Button } from 'moraine'
   *
   * <Button as="a" href="/docs" target="_blank">Docs</Button>
   * ```
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
  Variants,
  Classes,
  Styles,
  TDefault extends ValidComponent = TElement,
  AcceptsChildren extends boolean = 'children' extends keyof Base ? true : false,
> = [TDefault] extends [never]
  ? ComponentBaseProps<Base, Variants, Classes, Styles, false>
  : Override<
      RootProps<DefaultTag<TElement, TDefault>>,
      ComponentBaseProps<Base, Variants, Classes, Styles> &
        (AcceptsChildren extends true ? {} : { children?: never })
    >
