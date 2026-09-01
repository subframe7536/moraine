import type { JSX, ValidComponent } from 'solid-js'
import { Show, children as resolveChildren, createMemo, splitProps, useContext } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { EFFECT_LOADING_CLASS, LABEL_TRUNCATE_CLASS } from '../../shared/cva-common.class.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { useButtonInteraction } from '../../shared/use-button-interaction.ts'
import { useLoadingAutoClick } from '../../shared/use-loading-auto.ts'
import { cn } from '../../shared/utils.ts'
import { Icon } from '../icon/index.ts'
import type { IconT } from '../icon/index.ts'

import { ButtonGroupContext } from './button-group-context.ts'
import type { ButtonVariantProps } from './button.class.ts'
import { buttonVariants } from './button.class.ts'

type IsUnion<T, U = T> = T extends unknown ? ([U] extends [T] ? false : true) : never

type ElementFor<T extends ValidComponent> =
  IsUnion<T> extends true
    ? HTMLElement
    : T extends keyof HTMLElementTagNameMap
      ? HTMLElementTagNameMap[T]
      : HTMLElement

export namespace ButtonT {
  export interface Slot<T = unknown> {
    /**
     * Interactive button element, or the polymorphic element provided through `as`.
     */
    root?: T

    /** Loading icon shown while the button is busy. */
    loading?: T

    /** Icon region before the button label. */
    leading?: T

    /** Button content region after render-prop resolution. */
    label?: T

    /** Icon region after the button label. */
    trailing?: T
  }
  export type Variant = ButtonVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}
  /**
   * Base props for the Button component.
   */
  export type Base<T extends ValidComponent = 'button'> = {
    /**
     * Element or component to render as.
     * @default 'button'
     */
    as?: T

    /** Native type attribute for supported native roots. */
    type?: T extends 'a'
      ? JSX.AnchorHTMLAttributes<HTMLAnchorElement>['type']
      : T extends 'button'
        ? JSX.ButtonHTMLAttributes<HTMLButtonElement>['type']
        : T extends 'input'
          ? JSX.InputHTMLAttributes<HTMLInputElement>['type']
          : never

    /**
     * Disabled state, including for non-button polymorphic roots.
     */
    disabled?: boolean

    onClick?: JSX.EventHandlerUnion<ElementFor<T>, MouseEvent>
    onKeyDown?: JSX.EventHandlerUnion<ElementFor<T>, KeyboardEvent>
    onKeyUp?: JSX.EventHandlerUnion<ElementFor<T>, KeyboardEvent>
    onBlur?: JSX.EventHandlerUnion<ElementFor<T>, FocusEvent>
    onPointerDown?: JSX.EventHandlerUnion<ElementFor<T>, PointerEvent>
    onPointerUp?: JSX.EventHandlerUnion<ElementFor<T>, PointerEvent>
    onPointerCancel?: JSX.EventHandlerUnion<ElementFor<T>, PointerEvent>
    onPointerLeave?: JSX.EventHandlerUnion<ElementFor<T>, PointerEvent>
    onContextMenu?: JSX.EventHandlerUnion<ElementFor<T>, MouseEvent>

    /**
     * Root `data-slot` name
     */
    slotName?: string
    /**
     * Controlled loading state.
     * @default false
     */
    loading?: boolean

    /**
     * Auto toggles loading while async click handlers are pending.
     * @default false
     */
    loadingAuto?: boolean

    /**
     * Optional icon shown when `loading` is active.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name

    /**
     * Leading visual content, usually an icon.
     */
    leading?: IconT.Name

    /**
     * Trailing visual content, usually an icon.
     */
    trailing?: IconT.Name

    /**
     * Children of the button. Supports render function form.
     */
    children?: ComponentOrElement<{
      /**
       * Whether the button is currently in loading state.
       */
      loading: boolean
    }>
  } & (T extends 'a'
    ? Pick<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel'>
    : {})

  /**
   * Props for the Button component.
   */
  export type Props<T extends ValidComponent = 'button'> = BaseProps<
    T,
    Base<T>,
    Variant,
    Classes,
    Styles
  >
}

/**
 * Props for the Button component.
 */
export type ButtonProps<T extends ValidComponent = 'button'> = ButtonT.Props<T>

/**
 * Button component with polymorphic `as` support and loading state.
 */
export function Button<T extends ValidComponent = 'button'>(props: ButtonProps<T>): JSX.Element {
  const group = useContext(ButtonGroupContext)
  const [local, rest] = splitProps(props, [
    'as',
    'type',
    'variant',
    'size',
    'classes',
    'styles',
    'class',
    'style',
    'slotName',
    'disabled',
    'loading',
    'loadingAuto',
    'loadingIcon',
    'leading',
    'trailing',
    'children',
  ])

  const { isLoading, onClick } = useLoadingAutoClick<ElementFor<T>>({
    loading: () => local.loading,
    loadingAuto: () => local.loadingAuto,
    get onClick() {
      return rest.onClick as JSX.EventHandlerUnion<ElementFor<T>, MouseEvent> | undefined
    },
  })

  const tag = createMemo(() => (local.as as ValidComponent) ?? 'button')
  const isDisabledOrLoading = () => isLoading() || Boolean(local.disabled)
  const size = () => (local.size ?? group?.size ?? 'md') as NonNullable<ButtonVariantProps['size']>
  const variant = () =>
    (local.variant ?? group?.variant ?? 'default') as NonNullable<ButtonVariantProps['variant']>
  const leading = createMemo(() => local.leading)
  const trailing = createMemo(() => local.trailing)

  const loadingIconName = createMemo<IconT.Name>(() => local.loadingIcon ?? 'icon-loading')

  const isLeadingLoading = createMemo(() => isLoading() && (leading() || !trailing()))
  const isTrailingLoading = createMemo(() => isLoading() && (!leading() || !trailing()))

  const resolvedLeading = createMemo(() => {
    if (!isLoading()) {
      return leading()
    }

    if (leading() || !trailing()) {
      return loadingIconName()
    }

    return undefined
  })

  const resolvedTrailing = createMemo(() => {
    if (!isLoading()) {
      return trailing()
    }

    if (!leading() && trailing()) {
      return loadingIconName()
    }

    return trailing()
  })

  const interactionProps = useButtonInteraction<ElementFor<T>>(
    {
      disabled: isDisabledOrLoading,
      onClick: () => onClick,
      tag,
      type: () => local.type,
    },
    rest,
  )

  const child = resolveChildren(() => local.children)
  const resolvedChildren = createMemo(() =>
    renderComponentOrElement(child() as ButtonT.Base['children'], {
      get loading() {
        return isLoading()
      },
    }),
  )
  const hasResolvedChildren = createMemo(() => {
    const value = resolvedChildren()
    return value === 0 || Boolean(value)
  })

  return (
    <Dynamic
      data-slot={local.slotName || 'root'}
      data-size={size()}
      data-variant={variant()}
      aria-busy={isLoading() ? true : undefined}
      data-loading={isLoading() ? '' : undefined}
      data-disabled={local.disabled ? '' : undefined}
      {...interactionProps}
      component={tag()}
      style={{ ...local.styles?.root, ...local.style }}
      class={buttonVariants(
        {
          variant: variant(),
          size: size(),
        },
        local.classes?.root,
        local.class,
      )}
    >
      <Show when={resolvedLeading()}>
        {(leading) => (
          <Icon
            name={leading()}
            slotName="leading"
            style={local.styles?.leading}
            class={cn(
              local.classes?.leading,
              isLeadingLoading() && [EFFECT_LOADING_CLASS, local.classes?.loading],
            )}
            aria-hidden={isLeadingLoading() ? true : undefined}
          />
        )}
      </Show>

      <Show when={hasResolvedChildren()}>
        <span
          data-slot="label"
          style={local.styles?.label}
          class={cn(LABEL_TRUNCATE_CLASS, local.classes?.label)}
        >
          {resolvedChildren()}
        </span>
      </Show>

      <Show when={resolvedTrailing()}>
        {(trailing) => (
          <Icon
            name={trailing()}
            slotName="trailing"
            style={local.styles?.trailing}
            class={cn(
              local.classes?.trailing,
              isTrailingLoading() && [EFFECT_LOADING_CLASS, local.classes?.loading],
            )}
          />
        )}
      </Show>
    </Dynamic>
  )
}
