import type { JSX, ValidComponent } from 'solid-js'
import {
  Show,
  children as resolveChildren,
  createComponent,
  createEffect,
  createMemo,
  mergeProps,
  on,
  onCleanup,
  splitProps,
} from 'solid-js'

import { hasJsxContent } from '../../shared/jsx-content.ts'
import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'
import { Popper, resolveOverlayMenuSide } from '../base/index.ts'
import { mergePopperContentProps } from '../base/popper.tsx'
import type { PopperContentContext } from '../base/popper.tsx'

import type { PopoverProps, PopoverT } from './popover.types.ts'

export type { PopoverProps, PopoverT } from './popover.types.ts'

/** Click-triggered floating content panel anchored to a trigger element. */
export function Popover(props: PopoverProps): JSX.Element {
  const merged = mergeProps(
    {
      mode: 'click' as const,
      placement: 'bottom' as const,
      openDelay: 100,
      closeDelay: 100,
      dismissible: true,
    },
    props,
  )

  let openTimer: ReturnType<typeof setTimeout> | undefined
  let closeTimer: ReturnType<typeof setTimeout> | undefined
  let hasPreventedPointerAttempt = false
  let resetTimeout: ReturnType<typeof setTimeout> | undefined
  let hoverTimerVersion = 0
  let ownerAlive = true

  function clearOpenTimer(): void {
    clearTimeout(openTimer)
    openTimer = undefined
  }

  function clearCloseTimer(): void {
    clearTimeout(closeTimer)
    closeTimer = undefined
  }

  function invalidateHoverTimers(): void {
    hoverTimerVersion += 1
    clearOpenTimer()
    clearCloseTimer()
  }

  function scheduleOpen(open: () => void): void {
    if (merged.mode !== 'hover' || merged.disabled) {
      return
    }

    clearCloseTimer()
    clearOpenTimer()
    const version = ++hoverTimerVersion
    openTimer = setTimeout(() => {
      if (
        !ownerAlive ||
        version !== hoverTimerVersion ||
        merged.mode !== 'hover' ||
        merged.disabled
      ) {
        return
      }

      openTimer = undefined
      open()
    }, merged.openDelay)
  }

  function scheduleClose(close: () => void): void {
    if (merged.mode !== 'hover' || merged.disabled) {
      return
    }

    clearOpenTimer()
    clearCloseTimer()
    const version = ++hoverTimerVersion
    closeTimer = setTimeout(() => {
      if (
        !ownerAlive ||
        version !== hoverTimerVersion ||
        merged.mode !== 'hover' ||
        merged.disabled
      ) {
        return
      }

      closeTimer = undefined
      close()
    }, merged.closeDelay)
  }

  createEffect(
    on(
      () => [merged.mode, merged.disabled] as const,
      () => {
        invalidateHoverTimers()
      },
    ),
  )

  onCleanup(() => {
    ownerAlive = false
    clearTimeout(resetTimeout)
    invalidateHoverTimers()
  })

  return (
    <Popper
      id={merged.id}
      placement={merged.placement}
      open={merged.open}
      defaultOpen={merged.defaultOpen}
      onOpenChange={merged.onOpenChange}
      disabled={merged.disabled}
      forceMount={merged.forceMount}
      overflowPadding={4}
      modal={merged.modal}
      preventScroll={merged.preventScroll}
      dismissible={merged.dismissible}
      onClosePrevent={merged.onClosePrevent}
      role="dialog"
      toggleOnClick
      onTriggerFocus={
        merged.mode === 'hover'
          ? ({ open }) => {
              scheduleOpen(open)
            }
          : undefined
      }
      onTriggerBlur={
        merged.mode === 'hover'
          ? ({ close }) => {
              scheduleClose(close)
            }
          : undefined
      }
      onTriggerPointerEnter={
        merged.mode === 'hover'
          ? ({ open }, event) => {
              if (event.pointerType === 'mouse') {
                scheduleOpen(open)
              }
            }
          : undefined
      }
      onTriggerPointerLeave={
        merged.mode === 'hover'
          ? ({ close }, event) => {
              if (event.pointerType === 'mouse') {
                scheduleClose(close)
              }
            }
          : undefined
      }
      onContentFocus={
        merged.mode === 'hover'
          ? () => {
              clearCloseTimer()
            }
          : undefined
      }
      onContentBlur={
        merged.mode === 'hover'
          ? ({ close }) => {
              scheduleClose(close)
            }
          : undefined
      }
      onContentPointerEnter={
        merged.mode === 'hover'
          ? (_, event) => {
              if (event.pointerType === 'mouse') {
                clearCloseTimer()
              }
            }
          : undefined
      }
      onContentPointerLeave={
        merged.mode === 'hover'
          ? ({ close }, event) => {
              if (event.pointerType === 'mouse') {
                scheduleClose(close)
              }
            }
          : undefined
      }
      closeOnOutsideFocus={merged.mode === 'click'}
      onPointerDownOutside={(event) => {
        if (merged.dismissible) {
          return
        }

        event.preventDefault()
        hasPreventedPointerAttempt = true
        clearTimeout(resetTimeout)
        resetTimeout = setTimeout(() => {
          hasPreventedPointerAttempt = false
          resetTimeout = undefined
        }, 0)
        merged.onClosePrevent?.()
      }}
      onInteractOutside={(event) => {
        if (merged.dismissible || event.defaultPrevented) {
          return
        }

        event.preventDefault()

        if (!hasPreventedPointerAttempt) {
          merged.onClosePrevent?.()
        }
      }}
      onEscapeKeyDown={(event) => {
        if (merged.dismissible) {
          return
        }

        event.preventDefault()
        merged.onClosePrevent?.()
      }}
    >
      {merged.children}
    </Popper>
  )
}

function PopoverTrigger<T extends ValidComponent = 'button'>(
  props: PopoverT.TriggerProps<T>,
): JSX.Element {
  const design = useMoraineDesign()
  const resolved = resolveComponentStyle({
    rootSlot: 'trigger',
    design: {
      get classes() {
        return design().popover.recipe()
      },
    },
    get instance() {
      return props
    },
  })
  const triggerProps = mergeProps(props, resolved.rootClassAndStyle()) as PopoverT.TriggerProps<T>
  return createComponent(Popper.Anchor<T>, triggerProps)
}

function PopoverContent(props: PopoverT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'ariaLabel',
    'content',
    'children',
    'side',
    'class',
    'style',
    'classes',
    'styles',
    'ref',
  ])
  const design = useMoraineDesign()
  function Content(context: PopperContentContext): JSX.Element {
    const explicitContent = createMemo(() => local.content)
    const content = createMemo(() => {
      const value = explicitContent()
      return value === undefined ? resolveChildren(() => local.children)() : value
    })
    const resolved = resolveComponentStyle({
      rootSlot: 'content',
      design: {
        get classes() {
          return design().popover.recipe({
            side: resolveOverlayMenuSide(context.currentPlacement() || local.side || 'bottom'),
          })
        },
      },
      get instance() {
        return local
      },
    })
    const surfaceProps = mergeProps(rest, {
      get ref() {
        return local.ref
      },
    }) as JSX.HTMLAttributes<HTMLDivElement>
    const contentProps = mergePopperContentProps(context.contentProps, surfaceProps)
    return (
      <div
        {...contentProps}
        data-slot="content"
        aria-label={local.ariaLabel ?? (rest['aria-label'] as string | undefined)}
        {...resolved.rootClassAndStyle()}
      >
        <Show when={hasJsxContent(content())}>
          <div data-slot="body" {...resolved.slotClassAndStyle('body')}>
            {content()}
          </div>
        </Show>
      </div>
    )
  }
  return <Popper.Content contentRender={Content} />
}

Popover.Trigger = PopoverTrigger
Popover.Content = PopoverContent
