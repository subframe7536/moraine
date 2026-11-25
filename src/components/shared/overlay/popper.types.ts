import type { Coords, Placement } from '@floating-ui/dom'
import type { JSX } from '@solidjs/web'
import type { Accessor, Component } from 'solid-js'

import type { ValidComponent } from '../../../shared/types'
import type { OverlayAlign, OverlayPlacement } from '../../../theme/style-types'

import type { OverlayTriggerComponentProps } from './trigger'
import type {
  OverlayDisclosureProps,
  OverlayDismissProps,
  OverlayPortalProps,
  OverlayPositionProps,
} from './types'

export interface PopperInteractOutsideEvent {
  defaultPrevented: boolean
  originalEvent: FocusEvent
  preventDefault: () => void
}

export interface PopperPointerDownOutsideEvent {
  defaultPrevented: boolean
  originalEvent: MouseEvent | PointerEvent
  preventDefault: () => void
}

export interface PopperContentAttributes {
  'aria-describedby'?: string
  'aria-labelledby'?: string

  'data-closed'?: string
  'data-expanded'?: string

  id: string
  /** Stores the content host; see `PopperContentContext.contentProps` for its lifetime contract. */
  ref: (element: HTMLDivElement) => void
  role?: JSX.HTMLAttributes<HTMLDivElement>['role']
  tabIndex: number
}

export interface PopperProps extends OverlayDisclosureProps, OverlayPortalProps {
  /**
   * Initial open state when uncontrolled. Ignored while `open` is set.
   * @default false
   */
  defaultOpen?: boolean

  /**
   * Whether trigger interactions and content rendering are disabled.
   * @default false
   */
  disabled?: boolean

  /**
   * Unique identifier used to derive the content id, which becomes `<id>-content`. Generated when
   * omitted.
   */
  id?: string

  /**
   * Called with the next open state when an interaction (trigger press, hover or focus delay,
   * Escape, outside press) requests a change. It is not called when `open` is changed from outside,
   * and it does not apply the change itself when `open` is controlled: update `open` in the handler.
   * @example
   * ```tsx
   * import { Button, Popover } from 'moraine'
   * import { createSignal } from 'solid-js'
   *
   * const [open, setOpen] = createSignal(false)
   *
   * <Popover open={open()} onOpenChange={setOpen}>
   *   <Popover.Trigger as={Button}>Details</Popover.Trigger>
   *   <Popover.Content>More information</Popover.Content>
   * </Popover>
   * ```
   */
  onOpenChange?: (open: boolean) => void

  /**
   * Controlled open state. Pair it with `onOpenChange`; leave it `undefined` to let the component
   * manage its own state (see `defaultOpen`). `disabled` forces the content closed regardless.
   */
  open?: boolean

  /** Composed trigger and content primitives. */
  children?: JSX.Element
}
export type PopperTriggerProps<T extends ValidComponent = 'button'> =
  OverlayTriggerComponentProps<T> & {
    /**
     * ARIA relation between the trigger and the content: `'popup'` exposes
     * `aria-haspopup`, `aria-expanded`, and `aria-controls`; `'description'`
     * exposes `aria-describedby`; `'none'` adds no relation attributes.
     * @default 'popup'
     */
    ariaRelation?: 'popup' | 'description' | 'none'
    /**
     * Whether clicking the trigger toggles the open state.
     * @default true
     */
    toggleOnClick?: boolean
  }
export interface PopperContentOptions
  extends OverlayDismissProps, OverlayPortalProps, OverlayPositionProps {
  /** Id of the element that describes the positioned content. */
  ariaDescribedBy?: string

  /** Id of the element that labels the positioned content. */
  ariaLabelledBy?: string

  /**
   * Whether focus moving outside should close the content.
   * @default true
   */
  closeOnOutsideFocus?: boolean

  /**
   * Padding from the clipping boundary used to detect a detached trigger.
   * @default 0
   */
  detachedPadding?: number

  /**
   * Whether pressing Escape closes the content. When `false` the key press is blocked, the content
   * stays open and `onClosePrevented` is called.
   * @default true
   */
  closeOnEscape?: boolean

  /**
   * Whether a pointer press outside the content and its trigger, or focus moving outside, closes
   * the content (focus does not dismiss hover-opened popovers). When `false` the attempt is blocked,
   * the content stays open and `onClosePrevented` is called.
   * @default true
   */
  closeOnOutsideClick?: boolean

  /**
   * Whether content dimensions should be constrained to the available viewport.
   * @default false
   */
  fitViewport?: boolean

  /**
   * Whether the content moves to another side when the preferred `placement` does not fit in the
   * viewport. `false` keeps the side fixed. An array is an ordered list of fallback `Placement`
   * values tried in order (each `top`, `right`, `bottom` or `left`, optionally suffixed with
   * `-start` or `-end`).
   * @default true
   * @example
   * ```tsx
   * import { Button, Popover } from 'moraine'
   *
   * <Popover placement="bottom" flip={['top', 'bottom-end']}>
   *   <Popover.Trigger as={Button}>Details</Popover.Trigger>
   *   <Popover.Content>More information</Popover.Content>
   * </Popover>
   * ```
   */
  flip?: boolean | Array<Placement>

  /**
   * Whether the content stays in the DOM while closed, hidden and marked with `data-closed`, for
   * example to measure it or keep its state. Has no effect while `disabled`.
   * @default false
   */
  forceMount?: boolean

  /**
   * Gap in pixels between the trigger and positioned content.
   * @default 0
   */
  gutter?: number

  /**
   * Whether content should be hidden when its trigger is detached from the clipping boundary.
   * @default false
   */
  hideWhenDetached?: boolean

  /**
   * Called with no arguments when Escape (`closeOnEscape` is `false`) or an outside press or focus
   * move (`closeOnOutsideClick` is `false`) tried to close the content and was blocked.
   */
  onClosePrevented?: () => void

  /** Called when Escape is pressed while the content is active. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void

  /** Called when focus moves outside the content and trigger. */
  onInteractOutside?: (event: PopperInteractOutsideEvent) => void

  /**
   * Called when an outside pointer press or press-less click activates outside the content and trigger.
   * Calling preventDefault blocks Popper's default dismissal without cancelling the native event.
   */
  onPointerDownOutside?: (event: PopperPointerDownOutsideEvent) => void

  /**
   * Whether the content may overlap its trigger while remaining inside the viewport.
   * @default false
   */
  overlap?: boolean

  /**
   * Padding in pixels between positioned content and the viewport boundary.
   * @default 4
   */
  overflowPadding?: number

  /**
   * Side of the trigger the content opens on. The rendered side can differ when `flip` moves it to
   * fit the viewport; read it from `data-side` on the content.
   * @default 'bottom'
   */
  placement?: OverlayPlacement

  /**
   * Alignment of the content along the trigger edge: `'start'` and `'end'` line up the content
   * edge with the matching trigger edge, `'center'` centers it. Combines with `placement`.
   * @default 'center'
   */
  align?: OverlayAlign

  /**
   * Whether body scroll is locked while the content is present.
   * @default false
   */
  preventScroll?: boolean

  /**
   * Element (or accessor resolving to one) that receives focus after the content closes, or
   * `false` to skip the close-time focus restore. Defaults to the trigger. An accessor that
   * returns `undefined` restores no focus. Focus is not restored when the content is dismissed by
   * an outside press or focus move, since focus already went elsewhere. Hover-opened popovers
   * (`openOnHover`) default to not restoring focus.
   * @example
   * ```tsx
   * import { Button, Popover } from 'moraine'
   *
   * <Popover finalFocus={() => document.getElementById('search') ?? undefined}>
   *   <Popover.Trigger as={Button}>Filters</Popover.Trigger>
   *   <Popover.Content>Filter options</Popover.Content>
   * </Popover>
   * ```
   */
  finalFocus?: HTMLElement | (() => HTMLElement | undefined) | false

  /** Semantic role applied to the positioned content. */
  role?: JSX.HTMLAttributes<HTMLDivElement>['role']

  /**
   * Whether the content width should match the trigger width.
   * @default false
   */
  sameWidth?: boolean

  /**
   * Offset in pixels along the trigger edge (horizontal for `top` and `bottom` placements,
   * vertical for `left` and `right`), added to the position given by `align`.
   * @default 0
   */
  shift?: number

  /**
   * Whether the content slides along the trigger edge (horizontally for `top` and `bottom`
   * placements, vertically for `left` and `right`) to stay inside the viewport, keeping
   * `overflowPadding` from the edge, instead of overflowing.
   * @default true
   */
  slide?: boolean
}
export interface PopperContentProps extends PopperContentOptions {
  /** Text direction inherited by portaled content. */
  dir?: JSX.HTMLAttributes<HTMLDivElement>['dir']

  /** Additional roots that belong to this overlay's interaction region. */
  containsTarget?: (target: Node) => boolean

  /** Overrides interaction tracking independently of transition presence. */
  interactionEnabled?: boolean

  /**
   * Content or render function inside the positioned content.
   * A render function must declare its parameter, even when unused. A zero-argument
   * function is called as an accessor and is not mounted as a component.
   */
  children: JSX.Element | Component<PopperContentContext>

  /** Viewport coordinates to transition from when content is first positioned. */
  initialPosition?: Coords

  /**
   * Pointer coordinates used by Floating UI's `inline` middleware so content can
   * anchor to the hovered line of a wrapped trigger.
   */
  inline?: Coords

  /** Class applied to the positioning wrapper. */
  positionerClass?: string

  /** Style applied to the positioning wrapper. */
  positionerStyle?: JSX.CSSProperties
}
export interface PopperContentContext {
  /** Whether the initial floating position has been committed. */
  positioned: Accessor<boolean>

  /** The shared floating wrapper. */
  positionerElement: Accessor<HTMLDivElement | undefined>

  /** Closes the positioned content. */
  close: () => void

  /**
   * Attributes and event handlers to forward to the content root.
   *
   * Spread them on a host that lives as long as this render function: do not place the host in a
   * conditional branch. Refs cannot observe their element unmounting, so the popper releases the
   * host only when this render function unmounts or another host replaces it.
   */
  contentProps: PopperContentAttributes

  /** Current placement after collision handling. */
  currentPlacement: Accessor<Placement>
}
