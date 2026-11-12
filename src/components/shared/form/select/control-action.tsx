import type { JSX } from 'solid-js'

import { createKeyDownHandler } from '../../../../shared/keyboard'
import { callHandler } from '../../../../shared/utils'
import type { SlotBinding } from '../../../../theme/use-recipe'
import { Icon } from '../../../icon'
import type { IconT } from '../../../icon'

import { SELECT_LOADING_ICON_CLASS, selectLoadingData } from './select-field.recipe'

export interface UseControlPressOptions<TElement extends HTMLElement = HTMLDivElement> {
  focusOwner: () => HTMLElement | undefined
  focus: () => void
  openOnControlClick?: () => boolean
  setOpen: (open: boolean) => void
  disabled?: () => boolean
  onPointerDown?: JSX.EventHandlerUnion<TElement, PointerEvent>
  onClick?: JSX.EventHandlerUnion<TElement, MouseEvent>
}

export function useControlPress<TElement extends HTMLElement = HTMLDivElement>(
  options: UseControlPressOptions<TElement>,
) {
  return {
    onPointerDown: (event: PointerEvent & { currentTarget: TElement }) => {
      callHandler(event, options.onPointerDown)
      if (
        !event.defaultPrevented &&
        event.target !== options.focusOwner() &&
        event.pointerType !== 'touch' &&
        event.pointerType !== 'pen'
      ) {
        event.preventDefault()
        options.focus()
      }
    },
    onClick: (event: MouseEvent & { currentTarget: TElement }) => {
      callHandler(event, options.onClick)
      if (
        !event.defaultPrevented &&
        !options.disabled?.() &&
        (options.openOnControlClick?.() ?? false)
      ) {
        options.focus()
        options.setOpen(true)
      }
    },
  }
}

export interface ClearButtonProps {
  ariaLabel?: string
  closeIcon?: IconT.Name
  dataSlot?: string
  disabled?: boolean
  slot?: SlotBinding
  onClear: () => void
  onFocusOwner?: () => void
}

export function ClearButton(props: ClearButtonProps): JSX.Element {
  return (
    <button
      type="button"
      data-slot={props.dataSlot}
      aria-label={props.ariaLabel}
      tabIndex={0}
      {...props.slot}
      disabled={props.disabled}
      onPointerDown={(event) => {
        event.preventDefault()
        event.stopPropagation()
        props.onFocusOwner?.()
      }}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        props.onClear()
      }}
    >
      <Icon name={props.closeIcon ?? 'icon-close'} />
    </button>
  )
}

export interface ToggleTriggerProps {
  ariaControls?: string
  ariaLabel?: string
  dataSlot?: string
  disabled?: boolean
  expanded?: boolean
  loading?: boolean
  loadingIcon?: IconT.Name
  slot?: SlotBinding
  trailingIcon?: IconT.Name
  onClick?: () => void
  onFocusOwner?: () => void
}

export function ToggleTrigger(props: ToggleTriggerProps): JSX.Element {
  return (
    <button
      type="button"
      tabIndex={-1}
      data-slot={props.dataSlot}
      aria-label={props.ariaLabel}
      aria-controls={props.ariaControls}
      aria-expanded={props.expanded ? 'true' : 'false'}
      aria-busy={props.loading ? 'true' : undefined}
      {...props.slot}
      disabled={props.disabled || Boolean(props.loading)}
      onPointerDown={(event) => {
        event.preventDefault()
        event.stopPropagation()
        props.onFocusOwner?.()
      }}
      onClick={(event) => {
        event.stopPropagation()
        props.onClick?.()
      }}
    >
      <Icon
        name={
          props.loading
            ? (props.loadingIcon ?? 'icon-loading')
            : (props.trailingIcon ?? 'icon-chevron-down')
        }
        {...selectLoadingData(props.loading)}
        class={SELECT_LOADING_ICON_CLASS}
      />
    </button>
  )
}

export function createSelectClearKeyDownHandler(options: {
  allowClear: () => boolean | undefined
  canClear: () => boolean
  clear: () => void
}) {
  return createKeyDownHandler({
    keys: {
      Backspace: {
        handle: options.clear,
        when: () => Boolean(options.allowClear()) && options.canClear(),
      },
      Delete: {
        handle: options.clear,
        when: () => Boolean(options.allowClear()) && options.canClear(),
      },
    },
  })
}
