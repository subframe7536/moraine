import type { Coords } from '@floating-ui/dom'
import type { Accessor, JSX } from 'solid-js'
import {
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
  mergeProps,
} from 'solid-js'

import {
  createPointerGraceIntent,
  isPointInPointerGraceIntent,
} from '../../overlay/base/menu/menu.utils'
import { resolveFloatingPlacement } from '../../overlay/base/placement'
import type { PopperContentContext } from '../../overlay/base/popper.types'
import {
  focusWithoutScrolling,
  getFocusableElements,
  scrollIntoViewWithin,
} from '../../overlay/base/utils'
import { createControllableValue } from '../../shared/controllable-value'
import { createContextProvider } from '../../shared/create-context-provider'
import { createEventListenerMap } from '../../shared/event-listener'
import { createSelectableCollectionNavigation } from '../../shared/selectable-collection-navigation'
import { createTransitionPresence } from '../../shared/transition-presence'
import { createId } from '../../shared/utils'
import type { Orientation } from '../../theme/style-types'

import type { NavigationMenuProps, NavigationMenuT } from './navigation-menu.types'

export interface NavigationMenuItemContextValue {
  value: Accessor<string>
  disabled: Accessor<boolean>
  trigger: Accessor<HTMLButtonElement | undefined>
  setTrigger: (element: HTMLButtonElement | undefined) => void
  content: Accessor<HTMLDivElement | undefined>
  setContent: (element: HTMLDivElement | undefined) => void
  contentTrees: Accessor<JSX.Element[]>
  registerContent: (tree: JSX.Element) => VoidFunction
  setTriggerOptions: (options: NavigationMenuT.TriggerProps | undefined) => void
}

export const [NavigationMenuItemProvider, useOptionalNavigationMenuItemContext] =
  createContextProvider<NavigationMenuItemContextValue | null>('NavigationMenuItem', null)

export function useNavigationMenuItemContext(): NavigationMenuItemContextValue {
  const item = useOptionalNavigationMenuItemContext()
  if (!item) {
    throw new Error('NavigationMenu.Trigger and NavigationMenu.Content require NavigationMenu.Item')
  }
  return item
}

export function createNavigationMenuState(
  props: NavigationMenuProps,
  orientation: Accessor<Orientation>,
) {
  const options = mergeProps(
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
  const id = createId(() => options.id, 'navigation-menu')
  const [value, setValue] = createControllableValue<string | null>({
    value: () => options.value,
    defaultValue: () => options.defaultValue ?? null,
  })
  const [items, setItems] = createSignal<NavigationMenuItemContextValue[]>([])
  const [rootElement, setRootElement] = createSignal<HTMLElement>()
  const [panelElement, setPanelElement] = createSignal<HTMLDivElement>()
  const [floating, setFloating] =
    createSignal<
      Pick<PopperContentContext, 'positionerElement' | 'positioned' | 'currentPlacement'>
    >()
  const positionerElement = () => floating()?.positionerElement()
  const [mounted, setMounted] = createSignal(false)
  const positioned = () => floating()?.positioned() ?? false
  const activeItem = createMemo(() => findEnabledItem(value()))
  const open = createMemo(() => mounted() && activeItem() !== undefined)
  const activeTrigger = createMemo(() => activeItem()?.trigger())
  const activeContent = createMemo(() => activeItem()?.content())
  const [reference, setReference] = createSignal<HTMLButtonElement>()
  const [initialPosition, setInitialPosition] = createSignal<Coords>()
  const [focusRequest, setFocusRequest] = createSignal<string>()
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
    if (next === value()) {
      return
    }
    setValue(next)
    options.onValueChange?.(next)
  }

  function close(restoreFocus = false): void {
    const trigger = activeTrigger()
    changeValue(null)
    if (restoreFocus && !open()) {
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
          element.hasAttribute('data-moraine-navigation-menu-control'),
        )
      : []
  }
  const navigation = createSelectableCollectionNavigation<HTMLElement, HTMLElement>({
    items: controls,
    getValue: (element) => element,
    loop: () => false,
    activationMode: () => 'manual',
    focusValue: focusWithoutScrolling,
    onSelect: () => {},
  })

  function onListKeyDown(event: KeyboardEvent, element: HTMLElement): void {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      navigation.onNavigationKeyDown(event, element, orientation())
    }
  }

  function focusPanel(last = false): void {
    const content = activeContent()
    if (!content) {
      return
    }
    const focusable = getFocusableElements(content)
    const target = last ? focusable[focusable.length - 1] : focusable[0]
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
        !element.hasAttribute('data-moraine-navigation-menu-focus-guard'),
    )
    const index = candidates.indexOf(trigger)
    const next = index >= 0 ? candidates[index + 1] : undefined
    if (!next) {
      return false
    }
    focusWithoutScrolling(next)
    return true
  }

  onMount(() =>
    queueMicrotask(() => {
      if (alive) {
        setMounted(true)
      }
    }),
  )
  onCleanup(() => {
    alive = false
    cancelTimers()
  })

  createEffect(
    on(activeTrigger, (trigger, previous) => {
      if (!trigger) {
        return
      }
      const positioner = positionerElement()
      const previousTrigger = previous ?? reference()
      if (
        positioner?.style.visibility === 'visible' &&
        presence.present() &&
        previousTrigger &&
        previousTrigger !== trigger
      ) {
        const position = positioner.getBoundingClientRect()
        setInitialPosition({ x: position.left, y: position.top })
      } else {
        setInitialPosition(undefined)
      }
      setReference(trigger)
    }),
  )

  const itemSnapshot = () =>
    items().map((item) => ({
      value: item.value(),
      disabled: item.disabled(),
      contentCount: item.contentTrees().length,
    }))
  // Item changes can invalidate a controlled value; value updates alone do not request a change.
  createEffect(
    on([mounted, () => options.disabled, itemSnapshot], ([ready, disabled]) => {
      if (!ready) {
        return
      }
      if (value() !== null && !activeItem()) {
        changeValue(null)
      }
      if (disabled) {
        cancelTimers()
      }
    }),
  )
  createEffect(
    on([focusRequest, activeContent, positioned], ([requested, content, ready]) => {
      if (requested === undefined || !content || !ready) {
        return
      }
      let cancelled = false
      // oxlint-disable-next-line subf/solid-reactivity -- Check the latest item after content is committed.
      queueMicrotask(() => {
        if (cancelled || activeItem()?.value() !== requested) {
          return
        }
        focusPanel()
        setFocusRequest(undefined)
      })
      onCleanup(() => {
        cancelled = true
      })
    }),
  )
  createEffect(
    on([open, rootElement], ([isOpen, root]) => {
      if (!isOpen || !root) {
        return
      }
      createEventListenerMap(root.ownerDocument, {
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
      onCleanup(cancelTimers)
    }),
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
      setItems((current) => [...current, item])
      onCleanup(() =>
        queueMicrotask(() => {
          if (alive) {
            setItems((current) => current.filter((candidate) => candidate !== item))
          }
        }),
      )
    },
  }
}

export const [NavigationMenuProvider, useNavigationMenuContext] =
  createContextProvider<ReturnType<typeof createNavigationMenuState>>('NavigationMenu')

export function isMousePointer(event: PointerEvent): boolean {
  return !event.pointerType || event.pointerType === 'mouse'
}
