import { getOverflowAncestors } from '@floating-ui/dom'
import type { JSX } from '@solidjs/web'
import { For, createEffect, createSignal, onCleanup, untrack } from 'solid-js'

import { useLocale } from '../../provider/locale/locale-context'
import { attachEventListener } from '../../shared/event-listener'
import { settle } from '../../shared/utils'
import { resolveDirection } from '../shared/overlay/direction'
import { PopperContent } from '../shared/overlay/popper'
import type { PopperProps } from '../shared/overlay/popper.types'

import { isMousePointer, useNavigationMenuContext } from './navigation-menu-context'
import {
  NAVIGATION_MENU_POSITIONER_CLASS,
  NAVIGATION_MENU_PANEL_CLASS,
} from './navigation-menu.recipe'
/** One persistent surface owns positioning and size transitions for every item. */
export function NavigationMenuPanel(): JSX.Element {
  const context = useNavigationMenuContext()
  const direction = useLocale().dir
  const [size, setSize] = createSignal<JSX.CSSProperties>({})

  createEffect(
    () => [context.positionerElement(), context.reference()],
    ([positioner, reference]) => {
      if (!positioner || !reference || !reference.isConnected) {
        return
      }
      const detaches: Array<VoidFunction> = [
        attachEventListener(positioner, 'pointerenter', (event) => {
          if (isMousePointer(event)) {
            context.keepOpen()
          }
        }),
        attachEventListener(positioner, 'pointerleave', (event) => {
          if (isMousePointer(event)) {
            context.scheduleClose(event)
          }
        }),
      ]
      positioner.style.removeProperty('transition-property')
      // Scroll tracking must be immediate; trigger changes restore the movement transition.
      for (const ancestor of getOverflowAncestors(reference)) {
        detaches.push(
          attachEventListener<EventTarget, 'scroll'>(
            ancestor,
            'scroll',
            () => {
              positioner.style.transitionProperty = 'none'
            },
            { passive: true },
          ),
        )
      }
      return () => {
        for (const detach of detaches) {
          detach()
        }
      }
    },
  )

  function measure(
    content = untrack(context.activeContent),
    panel = untrack(context.panelElement),
  ): void {
    if (!content || !panel) {
      return
    }
    const view = panel.ownerDocument.defaultView
    if (!view) {
      return
    }
    const computed = view.getComputedStyle(panel)
    const width =
      content.offsetWidth +
      Number.parseFloat(computed.borderLeftWidth || '0') +
      Number.parseFloat(computed.borderRightWidth || '0')
    const height =
      content.offsetHeight +
      Number.parseFloat(computed.borderTopWidth || '0') +
      Number.parseFloat(computed.borderBottomWidth || '0')
    const widthStyle = `${width}px`
    const heightStyle = `${height}px`
    const currentSize = untrack(size)
    if (
      width > 0 &&
      height > 0 &&
      (currentSize.width !== widthStyle || currentSize.height !== heightStyle)
    ) {
      setSize({ width: widthStyle, height: heightStyle })
    }
  }

  createEffect(
    () => [context.activeContent(), context.panelElement()] as const,
    ([content, panel]) => {
      if (!content || !panel) {
        return
      }
      measure(content, panel)
      const onResize = () => settle(() => measure(content, panel))
      const Observer = panel.ownerDocument.defaultView?.ResizeObserver
      let observer: ResizeObserver | undefined
      if (Observer) {
        observer = new Observer(onResize)
        observer.observe(content)
      }
      const detach = attachEventListener(panel.ownerDocument.defaultView, 'resize', onResize)
      return () => {
        detach()
        observer?.disconnect()
      }
    },
  )

  return (
    <PopperContent
      context={{
        options: context.options as PopperProps,
        slotName: (slot) => `navigation-menu-${slot}`,
        contentId: () => `${context.id()}-panel`,
        isOpen: context.open,
        setOpen: () => context.close(),
        contentElement: context.panelElement,
        setContentElement: context.setPanelElement,
        triggerElement: context.reference,
        contentPresence: context.presence,
      }}
      dir={resolveDirection(context.reference(), direction())}
      placement={context.options.placement}
      align={context.options.align}
      gutter={context.options.gutter}
      overflowPadding={context.options.overflowPadding}
      flip={context.options.flip}
      slide={context.options.slide}
      shift={context.options.shift}
      initialPosition={context.initialPosition()}
      positionerClass={NAVIGATION_MENU_POSITIONER_CLASS}
      positionerStyle={size()}
      interactionEnabled={context.open()}
      containsTarget={(target) => context.rootElement()?.contains(target) ?? false}
      finalFocus={false}
      onEscapeKeyDown={(event) => {
        if (!event.defaultPrevented) {
          event.preventDefault()
          context.close(true)
        }
      }}
    >
      {(floating) => {
        context.setFloating(floating)
        onCleanup(() => {
          context.setFloating(undefined)
          setSize({})
        })
        return (
          <div
            {...floating.contentProps}
            {...{ 'prop:inert': !context.open() ? true : undefined }}
            aria-hidden={!context.open() ? 'true' : undefined}
            class={NAVIGATION_MENU_PANEL_CLASS}
            style={size()}
          >
            <For each={context.contentTrees()}>{(tree) => tree}</For>
          </div>
        )
      }}
    </PopperContent>
  )
}
