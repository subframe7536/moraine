import type { Coords } from '@floating-ui/dom'
import type { JSX } from '@solidjs/web'
import type { Accessor } from 'solid-js'
import { createEffect, createMemo, createSignal, onFlush, onSettled, untrack } from 'solid-js'

import { useLocale } from '../../provider/locale/locale-context'
import { createControllableValue } from '../../shared/controllable-value'
import { createContextProvider } from '../../shared/create-context-provider'
import { attachEventListenerMap } from '../../shared/event-listener'
import type { KeyBindingOptions } from '../../shared/keyboard'
import { createKeyDownHandler } from '../../shared/keyboard'
import { createSelectableCollectionNavigation } from '../../shared/selectable-collection-navigation'
import { createTransitionPresence } from '../../shared/transition-presence'
import { createId, mergeDefinedProps } from '../../shared/utils'
import type { Orientation } from '../../theme/style-types'
import { resolveDirection } from '../shared/overlay/direction'
import { focusWithoutScrolling, getFocusableElements } from '../shared/overlay/focus'
import {
  createPointerGraceIntent,
  isPointInPointerGraceIntent,
} from '../shared/overlay/menu/menu.utils'
import { resolveFloatingPlacement } from '../shared/overlay/placement'
import type { PopperContentContext } from '../shared/overlay/popper.types'
import { scrollIntoViewWithin } from '../shared/overlay/scroll-into-view'

import {
  NAVIGATION_MENU_CONTROL_ATTR,
  NAVIGATION_MENU_FOCUS_GUARD_ATTR,
} from './navigation-menu.recipe'
import type { NavigationMenuProps } from './navigation-menu.types'
export interface NavigationMenuItemContextValue {
  value: Accessor<string>
  disabled: Accessor<boolean>
  trigger: Accessor<HTMLButtonElement | undefined>
  setTrigger: (element: HTMLButtonElement | undefined) => void
  content: Accessor<HTMLDivElement | undefined>
  setContent: (element: HTMLDivElement | undefined) => void
  contentTrees: Accessor<Array<JSX.Element>>
  registerContent: (tree: JSX.Element) => VoidFunction
  setTriggerOptions: (options: { disabled?: boolean } | undefined) => void
}

export const [NavigationMenuItemProvider, useNavigationMenuItemContext] =
  /* @__PURE__ */ createContextProvider<NavigationMenuItemContextValue | null>(
    'NavigationMenuItem',
    null,
  )

export function createNavigationMenuState(
  props: NavigationMenuProps,
  orientation: Accessor<Orientation>,
) {
  const direction = useLocale().dir
  const options = mergeDefinedProps(
    {
      openDelay: 50,
      closeDelay: 50,
      placement: 'bottom' as const,
      align: 'center' as const,
      gutter: 8,
      shift: 0,
      overflowPadding: 4,
      flip: true,
      slide: true,
    },
    props,
  )
  const id = createId(() => options.id as string | undefined, 'navigation-menu')
  const [value, setValue] = createControllableValue<string | null>({
    value: () => options.value,
    defaultValue: () => options.defaultValue ?? null,
    onChange: (next) => options.onValueChange?.(next),
  })
  const [items, setItems] = createSignal<Array<NavigationMenuItemContextValue>>([])
  const [rootElement, setRootElement] = createSignal<HTMLElement | undefined>(undefined)
  const [panelElement, setPanelElement] = createSignal<HTMLDivElement | undefined>(undefined)
  const [floating, setFloating] = createSignal<
    Pick<PopperContentContext, 'positionerElement' | 'positioned' | 'currentPlacement'> | undefined
  >(undefined)
  const positionerElement = () => floating()?.positionerElement()
  const [mounted, setMounted] = createSignal(false)
  const positioned = () => floating()?.positioned() ?? false
  const activeItem = createMemo(() => findEnabledItem(value()))
  const open = createMemo(() => mounted() && activeItem() !== undefined)
  const activeTrigger = createMemo(() => activeItem()?.trigger())
  const activeContent = createMemo(() => activeItem()?.content())
  const reference = createMemo<HTMLButtonElement | undefined>(
    (previous) => activeTrigger() ?? previous,
  )
  const [initialPosition, setInitialPosition] = createSignal<Coords | undefined>(undefined)
  const [focusRequest, setFocusRequest] = createSignal<string | undefined>(undefined)
  const presence = createTransitionPresence({ open })
  const displayedItem = createMemo<NavigationMenuItemContextValue | undefined>(
    (previous) => activeItem() ?? (presence.present() ? previous : undefined),
  )
  const contentTrees = createMemo(() => items().flatMap((item) => item.contentTrees()))
  let openTimer: ReturnType<typeof setTimeout> | undefined
  let closeTimer: ReturnType<typeof setTimeout> | undefined
  let grace: ReturnType<typeof createPointerGraceIntent> | undefined
  const placement = () =>
    floating()?.currentPlacement() ?? resolveFloatingPlacement(options.placement, options.align)
  let backwardsTab = false
  let alive = true

  function findEnabledItem(value: string | null): NavigationMenuItemContextValue | undefined {
    return items().find(
      (item) => item.value() === value && !item.disabled() && item.contentTrees().length > 0,
    )
  }

  function keepOpen(): void {
    clearTimeout(closeTimer)
    closeTimer = undefined
    grace = undefined
  }

  function cancelTimers(): void {
    clearTimeout(openTimer)
    openTimer = undefined
    keepOpen()
  }

  function changeValue(next: string | null): void {
    cancelTimers()
    setFocusRequest(undefined)
    setValue(next)
  }

  function close(restoreFocus = false): void {
    // Read the trigger before staging the close: staged writes are invisible to
    // `open()`, and a missing trigger already makes the focus call a no-op.
    const trigger = activeTrigger()
    changeValue(null)
    if (restoreFocus) {
      focusWithoutScrolling(trigger)
    }
  }

  function openItem(next: string, focus = false): void {
    if (!findEnabledItem(next)) {
      return
    }
    changeValue(next)
    if (focus) {
      setFocusRequest(next)
    }
  }

  function scheduleOpen(next: string): void {
    cancelTimers()
    if (open()) {
      openItem(next)
      return
    }
    openTimer = setTimeout(() => {
      openTimer = undefined
      openItem(next)
    }, options.openDelay)
  }

  function scheduleClose(event?: PointerEvent): void {
    clearTimeout(openTimer)
    openTimer = undefined
    keepOpen()
    const trigger = activeTrigger()
    const panel = panelElement()
    if (
      event &&
      trigger &&
      panel &&
      open() &&
      rootElement()?.contains(event.currentTarget as Node)
    ) {
      grace = createPointerGraceIntent(placement(), [event.clientX, event.clientY], trigger, panel)
      closeTimer = setTimeout(scheduleClose, 300)
      return
    }
    closeTimer = setTimeout(() => {
      closeTimer = undefined
      if (!activeContent()?.contains(rootElement()?.ownerDocument.activeElement ?? null)) {
        close()
      }
    }, options.closeDelay)
  }

  const controls = () => {
    const root = rootElement()
    return root
      ? getFocusableElements(root).filter((element) =>
          element.hasAttribute(NAVIGATION_MENU_CONTROL_ATTR),
        )
      : []
  }
  const navigation = createSelectableCollectionNavigation<HTMLElement, HTMLElement>({
    items: controls,
    getValue: (element) => element,
    loop: () => false,
    activationMode: () => 'manual',
    getDirection: () => resolveDirection(rootElement(), direction()),
    focusValue: focusWithoutScrolling,
    onSelect: () => {},
  })

  // The collection dispatcher prevents default only when the key navigates.
  const navigate: KeyBindingOptions<HTMLElement, [HTMLElement]> = {
    preventDefault: false,
    handle: (event, element) => navigation.onNavigationKeyDown(event, element, orientation()),
  }

  const onListKeyDown = createKeyDownHandler<HTMLElement, [HTMLElement]>({
    keys: {
      ArrowLeft: navigate,
      ArrowRight: navigate,
      ArrowUp: navigate,
      ArrowDown: navigate,
      Home: navigate,
      End: navigate,
    },
  })

  function focusPanel(last = false): void {
    const content = activeContent()
    if (!content) {
      return
    }
    const focusable = getFocusableElements(content)
    const target = last ? focusable.at(-1) : focusable[0]
    focusWithoutScrolling(target ?? content)
    if (target) {
      scrollIntoViewWithin(target, content)
    }
  }

  function focusAfterTrigger(): boolean {
    const trigger = activeTrigger()
    if (!trigger) {
      return false
    }
    const candidates = getFocusableElements(trigger.ownerDocument.body).filter(
      (element) =>
        !panelElement()?.contains(element) &&
        !element.hasAttribute(NAVIGATION_MENU_FOCUS_GUARD_ATTR),
    )
    const index = candidates.indexOf(trigger)
    const next = index >= 0 ? candidates[index + 1] : undefined
    if (!next) {
      return false
    }
    focusWithoutScrolling(next)
    return true
  }

  onSettled(() => {
    queueMicrotask(() => {
      if (alive) {
        setMounted(true)
      }
    })
    return () => {
      alive = false
      cancelTimers()
    }
  })

  // The last trigger the panel was anchored to, so switching triggers can start from its position.
  let anchoredTrigger: HTMLButtonElement | undefined
  createEffect(
    () => [activeTrigger(), positionerElement(), presence.present()] as const,
    ([trigger, positioner, present], previous) => {
      if (!trigger || trigger === previous?.[0]) {
        return
      }
      const previousTrigger = anchoredTrigger
      anchoredTrigger = trigger
      if (
        positioner?.style.visibility === 'visible' &&
        present &&
        previousTrigger &&
        previousTrigger !== trigger
      ) {
        const position = positioner.getBoundingClientRect()
        setInitialPosition({ x: position.left, y: position.top })
      } else {
        setInitialPosition(undefined)
      }
    },
  )

  const itemSnapshot = () =>
    items().map((item) => ({
      value: item.value(),
      disabled: item.disabled(),
      contentCount: item.contentTrees().length,
    }))
  // Item changes can invalidate a controlled value; value updates alone do not request a change,
  // so the value is sampled untracked when the items change instead of being a dependency.
  createEffect(
    () => [mounted(), options.disabled, itemSnapshot()],
    ([ready, disabled]) => {
      if (!ready) {
        return
      }
      if (untrack(() => value() !== null && !activeItem())) {
        changeValue(null)
      }
      if (disabled) {
        cancelTimers()
      }
    },
  )
  createEffect(
    () => [focusRequest(), activeContent(), positioned()],
    ([requested, content, ready]) => {
      if (requested === undefined || !content || !ready) {
        return
      }
      let cancelled = false
      onFlush(() => {
        if (cancelled || activeItem()?.value() !== requested) {
          return
        }
        focusPanel()
        setFocusRequest(undefined)
      })
      return () => {
        cancelled = true
      }
    },
  )
  createEffect(
    () => [open(), rootElement()],
    ([isOpen, root]) => {
      if (!isOpen || !root) {
        return
      }
      const detach = attachEventListenerMap(root.ownerDocument, {
        keydown: (event) => {
          if (event.key === 'Tab') {
            backwardsTab = event.shiftKey
          }
        },
        pointermove: (event) => {
          if (!grace || (event.pointerType && event.pointerType !== 'mouse')) {
            return
          }
          if (isPointInPointerGraceIntent([event.clientX, event.clientY], grace)) {
            return
          }
          scheduleClose()
        },
      })
      return () => {
        detach()
        cancelTimers()
      }
    },
  )

  return {
    options,
    id,
    open,
    orientation,
    activeItem,
    displayedItem,
    contentTrees,
    activeContent,
    presence,
    reference,
    initialPosition,
    rootElement,
    setRootElement,
    panelElement,
    setPanelElement,
    positionerElement,
    keepOpen,
    cancelTimers,
    close,
    openItem,
    scheduleOpen,
    scheduleClose,
    onListKeyDown,
    focusAfterTrigger,
    onFocusGuard: () => {
      if (positioned()) {
        focusPanel(backwardsTab)
      } else {
        setFocusRequest(activeItem()?.value())
      }
    },
    setFloating,
    registerItem: (item: NavigationMenuItemContextValue) => {
      onSettled(() => {
        setItems((current) => [...current, item])
        return () => {
          if (alive) {
            setItems((current) => current.filter((candidate) => candidate !== item))
          }
        }
      })
    },
  }
}

export const [NavigationMenuProvider, useNavigationMenuContext] =
  /* @__PURE__ */ createContextProvider<ReturnType<typeof createNavigationMenuState>>(
    'NavigationMenu',
  )

export function isMousePointer(event: PointerEvent): boolean {
  return !event.pointerType || event.pointerType === 'mouse'
}
