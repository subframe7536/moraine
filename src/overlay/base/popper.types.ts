import type { Coords, Placement } from '@floating-ui/dom'
import type { Accessor, JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'
import type { OverlayAlign, OverlayPlacement } from '../../theme/style-types'

import type { OverlayTriggerComponentProps } from './trigger'

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
  'aria-modal'?: true

  'data-closed'?: string
  'data-expanded'?: string

  id: string
  onKeyDown: (event: KeyboardEvent) => void
  ref: (element: HTMLDivElement) => void
  role?: JSX.HTMLAttributes<HTMLDivElement>['role']
  tabIndex: number
}

export interface PopperProps {
  /**
   * Initial open state when uncontrolled.
   * @default false
   */
  defaultOpen?: boolean

  /**
   * Whether trigger interactions and content rendering are disabled.
   * @default false
   */
  disabled?: boolean

  /** Unique identifier used to derive the content id. */
  id?: string

  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void

  /** Controlled open state. */
  open?: boolean

  /** Composed trigger and content primitives. */
  children?: JSX.Element
}
export type PopperTriggerProps<T extends ValidComponent = 'button'> =
  OverlayTriggerComponentProps<T> & {
    /**
     * Whether the trigger describes the content.
     * @default false
     */
    describeTrigger?: boolean
    /**
     * Whether clicking the trigger toggles the open state.
     * @default true
     */
    toggleOnClick?: boolean
  }
export interface PopperContentOptions {
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
   * Whether outside interaction and Escape dismiss the content.
   * @default true
   */
  dismissible?: boolean

  /**
   * Whether content dimensions should be constrained to the available viewport.
   * @default false
   */
  fitViewport?: boolean

  /**
   * Whether to flip placement when the preferred side lacks space, or a space-delimited fallback placement list.
   * @default true
   */
  flip?: boolean | string

  /**
   * Whether content remains mounted while closed.
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
   * Whether the content traps focus, hides outside content from assistive technology, prevents
   * the native default action of outside pointer events, and locks body scroll.
   * Outside and Escape dismissal remain controlled by `dismissible`.
   * @default false
   */
  modal?: boolean

  /** Called when a dismissal attempt is blocked. */
  onClosePrevent?: () => void

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
   * Preferred content placement relative to the trigger.
   * @default 'bottom'
   */
  placement?: OverlayPlacement

  /** Alignment along the cross axis.
   * @default 'center'
   */
  align?: OverlayAlign

  /**
   * Whether body scroll should be locked while the content is present.
   * @default false
   */
  preventScroll?: boolean

  /**
   * Whether focus returns to the trigger after the content closes.
   * @default true
   */
  restoreFocusOnClose?: boolean

  /** Semantic role applied to the positioned content. */
  role?: JSX.HTMLAttributes<HTMLDivElement>['role']

  /**
   * Whether the content width should match the trigger width.
   * @default false
   */
  sameWidth?: boolean

  /**
   * Cross-axis offset in pixels from the resolved placement.
   * @default 0
   */
  shift?: number

  /**
   * Whether the content may slide along its main axis to remain visible.
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
  children: JSX.Element | ((props: PopperContentContext) => JSX.Element)

  /** Viewport coordinates to transition from when content is first positioned. */
  initialPosition?: Coords

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

  /** Attributes and event handlers to forward to the content root. */
  contentProps: PopperContentAttributes

  /** Current placement after collision handling. */
  currentPlacement: Accessor<Placement>
}
