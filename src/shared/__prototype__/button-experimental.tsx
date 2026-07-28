// ═══════════════════════════════════════════════════════════════════════════════
// EXPERIMENTAL — Button component using BaseProps<Base, Variant, Slot, TElement>.
// Uses splitProps + rest forwarding instead of mergeProps.
// ═══════════════════════════════════════════════════════════════════════════════

import type { JSX, ValidComponent } from 'solid-js'
import { Show, children as resolveChildren, createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { ButtonVariantProps } from '../../elements/button/button.class'
import { buttonVariants } from '../../elements/button/button.class'
import { Icon } from '../../elements/icon'
import type { IconT } from '../../elements/icon'
import { callHandler, cn } from '../utils'

import type { BaseProps, SlotClassValue, SlotStyleValue } from './type'

export namespace ButtonExperimentalT {
  export interface Slot<T = unknown> {
    root?: T
    loading?: T
    leading?: T
    label?: T
    trailing?: T
  }
  export type Variant = ButtonVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Base {
    as?: ValidComponent
    disabled?: boolean
    slotName?: string
    loading?: boolean
    loadingAuto?: boolean
    loadingIcon?: IconT.Name
    leading?: IconT.Name
    trailing?: IconT.Name
    onClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>
    onKeyDown?: JSX.EventHandlerUnion<HTMLButtonElement, KeyboardEvent>
    onPointerDown?: JSX.EventHandlerUnion<HTMLButtonElement, PointerEvent>
    children?: JSX.Element
  }

  export type Props = BaseProps<'button', Base, Variant, Slot>
}

export type ButtonExperimentalProps = ButtonExperimentalT.Props

/**
 * Experimental Button — uses splitProps + rest forwarding.
 * HTML attributes (id, data-*, aria-*, events, ref) pass through `rest`
 * and land on the root element (via Dynamic).
 */
export function ButtonExperimental(props: ButtonExperimentalProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'as',
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
    'onClick',
    'onKeyDown',
    'onPointerDown',
    'leading',
    'trailing',
    'children',
  ])

  const tag = () => (local.as as ValidComponent) ?? 'button'
  const isNativeBtn = () => typeof tag() === 'string' && (tag() === 'button' || tag() === 'input')
  const isNativeLink = () =>
    !isNativeBtn() && typeof tag() === 'string' && tag() === 'a' && (rest as any).href !== undefined
  const needsButtonRole = () => typeof tag() === 'string' && !isNativeBtn() && !isNativeLink()

  const isLoading = createMemo(() => Boolean(local.loading || local.loadingAuto))
  const isDisabledOrLoading = createMemo(() => isLoading() || Boolean(local.disabled))

  const size = createMemo(() => local.size ?? 'md')
  const variant = createMemo(() => local.variant ?? 'default')
  const leading = createMemo(() => local.leading)
  const trailing = createMemo(() => local.trailing)
  const loadingIconName = createMemo<IconT.Name>(() => local.loadingIcon ?? 'icon-loading')

  const isLeadingLoading = createMemo(() => isLoading() && (leading() || !trailing()))
  const isTrailingLoading = createMemo(() => isLoading() && !(leading() && trailing()))

  const resolvedLeading = createMemo(() => {
    if (!isLoading()) return leading()
    if (leading() || !trailing()) return loadingIconName()
    return undefined
  })

  const resolvedTrailing = createMemo(() => {
    if (!isLoading()) return trailing()
    if (!leading() && trailing()) return loadingIconName()
    return trailing()
  })

  const child = resolveChildren(() => local.children as JSX.Element)

  // Keyboard activation for non-native buttons
  const handleKeyDown = (event: KeyboardEvent) => {
    const { defaultPrevented } = callHandler(event, local.onKeyDown)
    if (defaultPrevented) return

    if (isDisabledOrLoading()) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
      }
      return
    }

    if (needsButtonRole() && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      const target = event.target as HTMLElement
      target.click()
    }
  }

  // Block clicks for non-native buttons when disabled/loading
  const handleClick = (event: MouseEvent) => {
    if (!isNativeBtn() && isDisabledOrLoading()) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    callHandler(event, local.onClick)
  }

  const handlePointerDown = (event: PointerEvent) => {
    if (!isNativeBtn() && isDisabledOrLoading()) {
      event.preventDefault()
      event.stopPropagation()
    }
    callHandler(event, local.onPointerDown)
  }

  return (
    <Dynamic
      component={tag()}
      data-slot={local.slotName ?? 'root'}
      data-size={size()}
      data-variant={variant()}
      style={{ ...local.styles?.root, ...local.style }}
      class={buttonVariants({ variant: variant(), size: size() }, local.classes?.root, local.class)}
      type={isNativeBtn() ? 'button' : undefined}
      role={needsButtonRole() ? 'button' : undefined}
      tabIndex={needsButtonRole() && !isDisabledOrLoading() ? 0 : undefined}
      aria-busy={isLoading() ? true : undefined}
      data-loading={isLoading() ? '' : undefined}
      disabled={isNativeBtn() ? isDisabledOrLoading() : undefined}
      aria-disabled={!isNativeBtn() && isDisabledOrLoading() ? true : undefined}
      data-disabled={local.disabled ? '' : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      {...rest}
    >
      <Show when={resolvedLeading()}>
        {(leading) => (
          <Icon
            name={leading()}
            slotName="leading"
            style={local.styles?.leading}
            class={cn(
              local.classes?.leading,
              isLeadingLoading() && ['effect-loading', local.classes?.loading],
            )}
          />
        )}
      </Show>

      <Show when={child()}>
        {(body) => (
          <span
            data-slot="label"
            style={local.styles?.label}
            class={cn('min-w-0 truncate', local.classes?.label)}
          >
            {body()}
          </span>
        )}
      </Show>

      <Show when={resolvedTrailing()}>
        {(trailing) => (
          <Icon
            name={trailing()}
            slotName="trailing"
            style={local.styles?.trailing}
            class={cn(
              local.classes?.trailing,
              isTrailingLoading() && ['effect-loading', local.classes?.loading],
            )}
          />
        )}
      </Show>
    </Dynamic>
  )
}
