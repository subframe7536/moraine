import type { JSX, ValidComponent } from 'solid-js'

import type { ClassValue } from './style/recipe'

export type { ClassValue } from './style/recipe'

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

type Tags = MoraineTypeConfig extends { simpleHtmlTags: true }
  ? keyof JSX.HTMLElementTags
  : keyof JSX.IntrinsicElements

type CommonRootProps = { [x: string]: unknown }

type CuratedAttributeFallback = {
  [key: `aria-${string}`]: string | number | boolean | undefined
  [key: `data-${string}`]: string | number | boolean | undefined
}

type CommonNativeKeys =
  | 'children'
  | 'ref'
  | 'class'
  | 'style'
  | 'id'
  | 'role'
  | 'tabIndex'
  | 'title'
  | 'hidden'
  | 'dir'
  | 'lang'
  | 'slot'
  | 'autofocus'
  | 'accessKey'
  | 'contentEditable'
  | 'draggable'
  | 'spellcheck'
  | 'translate'
  | 'inputMode'
  | 'enterkeyhint'
  | 'onClick'
  | 'onDblClick'
  | 'onFocus'
  | 'onBlur'
  | 'onInput'
  | 'onChange'
  | 'onSubmit'
  | 'onInvalid'
  | 'onKeyDown'
  | 'onKeyUp'
  | 'onContextMenu'
  | 'onCopy'
  | 'onCut'
  | 'onPaste'
  | 'onCompositionStart'
  | 'onCompositionUpdate'
  | 'onCompositionEnd'
  | 'onMouseDown'
  | 'onMouseUp'
  | 'onMouseMove'
  | 'onMouseEnter'
  | 'onMouseLeave'
  | 'onPointerDown'
  | 'onPointerUp'
  | 'onPointerMove'
  | 'onPointerEnter'
  | 'onPointerLeave'
  | 'onPointerCancel'
  | 'onScroll'
  | 'onWheel'
  | 'onTransitionCancel'
  | 'onTransitionEnd'
  | 'onTransitionRun'
  | 'onTransitionStart'

type CommonNativeProps = Pick<JSX.HTMLAttributes<HTMLElement>, CommonNativeKeys> &
  CuratedAttributeFallback

type DivNativeProps = Pick<JSX.HTMLAttributes<HTMLDivElement>, CommonNativeKeys> &
  CuratedAttributeFallback
type SpanNativeProps = Pick<JSX.HTMLAttributes<HTMLSpanElement>, CommonNativeKeys> &
  CuratedAttributeFallback
type NavNativeProps = Pick<JSX.HTMLAttributes<HTMLElement>, CommonNativeKeys> &
  CuratedAttributeFallback
type KbdNativeProps = Pick<JSX.HTMLAttributes<HTMLElement>, CommonNativeKeys> &
  CuratedAttributeFallback

type AnchorNativeProps = Pick<
  JSX.AnchorHTMLAttributes<HTMLAnchorElement>,
  CommonNativeKeys | 'download' | 'href' | 'hreflang' | 'rel' | 'target' | 'type'
> &
  CuratedAttributeFallback

type ButtonNativeProps = Pick<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  | CommonNativeKeys
  | 'disabled'
  | 'form'
  | 'formAction'
  | 'formEnctype'
  | 'formMethod'
  | 'formNoValidate'
  | 'formTarget'
  | 'name'
  | 'type'
  | 'value'
> &
  CuratedAttributeFallback

type InputNativeProps = Pick<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  | CommonNativeKeys
  | 'accept'
  | 'alt'
  | 'autocomplete'
  | 'capture'
  | 'checked'
  | 'disabled'
  | 'form'
  | 'formAction'
  | 'formEnctype'
  | 'formMethod'
  | 'formNoValidate'
  | 'formTarget'
  | 'list'
  | 'max'
  | 'maxlength'
  | 'maxLength'
  | 'min'
  | 'minlength'
  | 'minLength'
  | 'multiple'
  | 'name'
  | 'pattern'
  | 'placeholder'
  | 'readonly'
  | 'readOnly'
  | 'required'
  | 'step'
  | 'type'
  | 'value'
> &
  CuratedAttributeFallback

type TextareaNativeProps = Pick<
  JSX.TextareaHTMLAttributes<HTMLTextAreaElement>,
  | CommonNativeKeys
  | 'autocomplete'
  | 'cols'
  | 'disabled'
  | 'form'
  | 'maxlength'
  | 'maxLength'
  | 'minlength'
  | 'minLength'
  | 'name'
  | 'placeholder'
  | 'readonly'
  | 'readOnly'
  | 'required'
  | 'rows'
  | 'value'
  | 'wrap'
> &
  CuratedAttributeFallback

type FormNativeProps = Pick<
  JSX.FormHTMLAttributes<HTMLFormElement>,
  | CommonNativeKeys
  | 'action'
  | 'autocomplete'
  | 'enctype'
  | 'method'
  | 'name'
  | 'noValidate'
  | 'rel'
  | 'target'
> &
  CuratedAttributeFallback

type LabelNativeProps = Pick<JSX.LabelHTMLAttributes<HTMLLabelElement>, CommonNativeKeys | 'for'> &
  CuratedAttributeFallback

interface MoraineIntrinsicElements {
  a: AnchorNativeProps
  button: ButtonNativeProps
  div: DivNativeProps
  form: FormNativeProps
  input: InputNativeProps
  kbd: KbdNativeProps
  label: LabelNativeProps
  nav: NavNativeProps
  span: SpanNativeProps
  textarea: TextareaNativeProps
}

type CuratedRootProps<T extends Tags> = T extends keyof MoraineIntrinsicElements
  ? MoraineIntrinsicElements[T]
  : T extends keyof JSX.HTMLElementTags
    ? CommonNativeProps
    : CommonRootProps

type Override<A, B> = Omit<A, keyof B> & B

type NullableVariantProps<Variant> = {
  [K in keyof Variant]: Variant[K] | null
}

type ComponentBaseProps<Base, Variant, Classes, Styles> = Base &
  ([Variant] extends [never] ? {} : NullableVariantProps<Variant>) & {
    /** Class applied to the component root or trigger element. */
    class?: SlotClassValue
    /** Style applied to the component root or trigger element. */
    style?: SlotStyleValue
  } & ([Classes] extends [never]
    ? {}
    : [Styles] extends [never]
      ? {}
      : {
          /** Classes applied to the component slots. */
          classes?: Classes
          /** Styles applied to the component slots. */
          styles?: Styles
        })

type RootProps<T extends ValidComponent> = string & {} extends T
  ? {}
  : T extends Tags
    ? MoraineTypeConfig extends { simpleRootAttributes: true }
      ? CommonRootProps
      : CuratedRootProps<T>
    : T extends (props: infer P) => any
      ? P
      : CommonRootProps

export type BaseProps<TElement extends ValidComponent, Base, Variant, Classes, Styles> = Override<
  RootProps<TElement>,
  ComponentBaseProps<Base, Variant, Classes, Styles>
>
