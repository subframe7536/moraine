import { getOverflowAncestors } from '@floating-ui/dom'
import type { JSX } from 'solid-js'
import { For, createEffect, createSignal, on, onCleanup } from 'solid-js'

import { parseFloatingPlacement } from '../../overlay/base/placement'
import { PopperContent } from '../../overlay/base/popper'
import { resolveDirection } from '../../overlay/base/utils'
import { useLocale } from '../../provider/locale/locale-context'
import { createEventListener } from '../../shared/event-listener'

import { isMousePointer, useNavigationMenuContext } from './navigation-menu-context'
import {
  NAVIGATION_MENU_POSITIONER_CLASS,
  NAVIGATION_MENU_PANEL_CLASS,
  navigationMenuPanelDataAttributes,
} from './navigation-menu.recipe'

/** One persistent surface owns positioning and size transitions for every item. */
export function NavigationMenuPanel(): JSX.Element {
  const context = useNavigationMenuContext()
  const direction = useLocale().dir
  const [size, setSize] = createSignal<JSX.CSSProperties>({})

  createEffect(
    on([context.positionerElement, context.reference], ([positioner, reference]) => {
      if (!positioner || !reference) {
        return
      }
      createEventListener(positioner, 'pointerenter', (event) => {
        if (isMousePointer(event)) {
          context.keepOpen()
        }
      })
      createEventListener(positioner, 'pointerleave', (event) => {
        if (isMousePointer(event)) {
          context.scheduleClose(event)
        }
      })
      positioner.style.removeProperty('transition-property')
      // Scroll tracking must be immediate; trigger changes restore the movement transition.
      for (const ancestor of getOverflowAncestors(reference)) {
        createEventListener<EventTarget, 'scroll'>(
          ancestor,
          'scroll',
          () => {
            positioner.style.transitionProperty = 'none'
          },
          { passive: true },
        )
      }
    }),
  )

  function measure(): void {
    const content = context.activeContent()
    const panel = context.panelElement()
    if (!content || !panel) {
      return
    }
    const computed = panel.ownerDocument.defaultView!.getComputedStyle(panel)
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
    if (width > 0 && height > 0 && (size().width !== widthStyle || size().height !== heightStyle)) {
      setSize({ width: widthStyle, height: heightStyle })
    }
  }

  createEffect(
    on([context.activeContent, context.panelElement], ([content, panel]) => {
      if (!content || !panel) {
        return
      }
      measure()
      const Observer = panel.ownerDocument.defaultView?.ResizeObserver
      if (Observer) {
        const observer = new Observer(measure)
        observer.observe(content)
        onCleanup(() => observer.disconnect())
      }
      createEventListener(panel.ownerDocument.defaultView, 'resize', measure)
    }),
  )

  return (
    <PopperContent
      context={{
        options: context.options,
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
      containsTarget={(target) => Boolean(context.rootElement()?.contains(target))}
      restoreFocusOnClose={false}
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
            {...navigationMenuPanelDataAttributes({
              side: () => parseFloatingPlacement(floating.currentPlacement()).side,
              align: () => parseFloatingPlacement(floating.currentPlacement()).align,
            })}
            inert={!context.open() ? true : undefined}
            aria-hidden={!context.open() ? true : undefined}
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
