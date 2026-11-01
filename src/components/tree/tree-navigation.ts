import type { Accessor } from 'solid-js'
import { createMemo, createSignal, onCleanup } from 'solid-js'

import { useLocale } from '../../provider'
import { attachEventListenerMap } from '../../shared/event-listener'
import { createKeyDownHandler } from '../../shared/keyboard'
import { createTypeahead } from '../../shared/typeahead'

import { getSiblingKeys } from './tree-registry'
import type { TreeRegistry } from './tree-registry'
import type { TreeT } from './tree.types'

const PENDING_FOCUS_TIMEOUT = 1000

export interface TreeNavigationDeps<T> {
  options: TreeT.Options<T>
  registry: Accessor<TreeRegistry<T>>
  flattenedKeys: Accessor<readonly string[]>
  selectedKeys: Accessor<readonly string[]>
  getFocusedKey: () => string | undefined
  setFocusedKey: (key: string | undefined) => void
  isExpanded: (key: string) => boolean
  expand: (key: string) => void
  collapse: (key: string) => void
  toggle: (key: string) => void
  select: (key: string) => void
  selectOnly: (key: string) => void
  toggleSelect: (key: string) => void
  selectAll: () => void
  selectRange: (key: string, from: string) => void
  toggleCheck: (key: string) => void
  getItem: (key: string) => TreeT.ItemInstance<T> | undefined
}

export interface TreeNavigation {
  /** Key of the item that is reachable with `Tab`. */
  tabStopKey: Accessor<string | undefined>
  /** Key of the item that currently holds DOM focus. */
  focusedKey: Accessor<string | undefined>
  focus: (key: string, options?: { dom?: boolean }) => void
  onKeyDown: (event: KeyboardEvent, key: string) => void
  registerElement: (key: string, element: HTMLElement) => () => void
  /** Tracks focus within the tree root; returns a release function. */
  registerRoot: (element: HTMLElement) => () => void
  registerScroller: (scroll: ((key: string) => void) | undefined) => void
  isFocusWithin: () => boolean
}

export function createTreeNavigation<T>(deps: TreeNavigationDeps<T>): TreeNavigation {
  const dir = useLocale().dir
  const elements = new Map<string, HTMLElement>()
  let root: HTMLElement | undefined
  let removeRootListeners: (() => void) | undefined
  let scrollToKey: ((key: string) => void) | undefined
  let pendingFocus: { key: string; expires: number } | undefined

  const isDisabled = (key: string): boolean => Boolean(deps.registry().nodes.get(key)?.disabled)
  const visibleKeys = createMemo(() => new Set(deps.flattenedKeys()))
  const navigableKeys = createMemo(() => deps.flattenedKeys().filter((key) => !isDisabled(key)))

  const tabStopKey = createMemo<string | undefined>(() => {
    let candidate = deps.getFocusedKey()
    while (candidate !== undefined && (!visibleKeys().has(candidate) || isDisabled(candidate))) {
      candidate = deps.registry().nodes.get(candidate)?.parentKey
    }
    if (candidate !== undefined) {
      return candidate
    }
    const keys = navigableKeys()
    const selected = new Set(deps.selectedKeys())
    return keys.find((key) => selected.has(key)) ?? keys[0]
  })

  const [hasFocusWithin, setHasFocusWithin] = createSignal(false)
  const focusedKey = createMemo<string | undefined>(() => {
    const key = deps.getFocusedKey()
    if (key === undefined) {
      return undefined
    }
    const tabStop = tabStopKey()
    if (tabStop === undefined) {
      return undefined
    }
    return hasFocusWithin() || !root ? tabStop : undefined
  })

  function isFocusWithin(): boolean {
    return !!root && root.contains(root.ownerDocument.activeElement)
  }

  function focus(key: string, focusOptions?: { dom?: boolean }): void {
    const node = deps.registry().nodes.get(key)
    if (!node || node.disabled) {
      return
    }
    deps.setFocusedKey(key)
    if (focusOptions?.dom === false) {
      return
    }
    const element = elements.get(key)
    if (element?.isConnected) {
      pendingFocus = undefined
      element.focus()
      setHasFocusWithin(isFocusWithin())
      return
    }
    pendingFocus = { key, expires: Date.now() + PENDING_FOCUS_TIMEOUT }
    setHasFocusWithin(true)
    scrollToKey?.(key)
  }

  function registerElement(key: string, element: HTMLElement): () => void {
    elements.set(key, element)
    queueMicrotask(() => {
      if (
        pendingFocus?.key === key &&
        pendingFocus.expires > Date.now() &&
        elements.get(key) === element &&
        element.isConnected
      ) {
        pendingFocus = undefined
        element.focus()
        setHasFocusWithin(isFocusWithin())
      }
    })
    return () => {
      if (elements.get(key) === element) {
        elements.delete(key)
      }
    }
  }

  function moveTo(key: string, extend: boolean, from: string): void {
    if (extend) {
      deps.selectRange(key, from)
    }
    focus(key)
  }

  function moveRelative(from: string, offset: 1 | -1, extend: boolean): void {
    const keys = deps.flattenedKeys()
    let index = keys.indexOf(from) + offset
    while (index >= 0 && index < keys.length && isDisabled(keys[index]!)) {
      index += offset
    }
    const target = keys[index]
    if (target !== undefined) {
      moveTo(target, extend, from)
    }
  }

  function moveToBoundary(from: string, extend: boolean, last: boolean): void {
    const keys = navigableKeys()
    const target = keys[last ? keys.length - 1 : 0]
    if (target !== undefined) {
      moveTo(target, extend, from)
    }
  }

  function expandSiblings(key: string): void {
    if (isDisabled(key)) {
      return
    }
    for (const siblingKey of getSiblingKeys(deps.registry(), key)) {
      if (!isDisabled(siblingKey)) {
        deps.expand(siblingKey)
      }
    }
  }

  function activate(key: string): void {
    const node = deps.registry().nodes.get(key)
    if (!node || node.disabled) {
      return
    }
    const item = deps.getItem(key)
    if (item && deps.options.onAction) {
      deps.options.onAction(item)
    } else if ((deps.options.selectionMode ?? 'single') !== 'none') {
      deps.selectOnly(key)
    } else if (node.hasChildren) {
      deps.toggle(key)
    }
  }

  function toggleCurrent(key: string): void {
    if (isDisabled(key)) {
      return
    }
    if (deps.options.checkable) {
      deps.toggleCheck(key)
    } else if (deps.options.selectionMode === 'multiple') {
      deps.toggleSelect(key)
    } else {
      deps.select(key)
    }
  }

  const typeahead = createTypeahead<string>({
    getItems: navigableKeys,
    getStartIndex: () => navigableKeys().indexOf(tabStopKey() ?? ''),
    getText: (key) => deps.registry().nodes.get(key)?.textValue ?? key,
    onMatch: (key) => focus(key),
  })

  const selectAllBinding = {
    when: (event: KeyboardEvent) =>
      (event.ctrlKey || event.metaKey) && deps.options.selectionMode === 'multiple',
    handle: () => deps.selectAll(),
  }

  const onKeyDown = createKeyDownHandler<HTMLElement, [string]>({
    currentTargetOnly: true,
    ignoreModifiers: ['alt'],
    disabled: (_event, key) => !deps.registry().nodes.has(key),
    orientation: 'vertical',
    direction: () => dir(),
    keys: {
      ArrowDown: (event, key) => moveRelative(key, 1, event.shiftKey),
      ArrowUp: (event, key) => moveRelative(key, -1, event.shiftKey),
      Home: (event, key) => moveToBoundary(key, event.shiftKey, false),
      End: (event, key) => moveToBoundary(key, event.shiftKey, true),
      Enter: (_event, key) => activate(key),
      ' ': (_event, key) => toggleCurrent(key),
      '*': (_event, key) => expandSiblings(key),
      a: selectAllBinding,
      A: selectAllBinding,
      // Expand, or move into the first enabled child.
      forward: {
        preventDefault: false,
        handle: (event, key) => {
          const node = deps.registry().nodes.get(key)
          if (!node?.hasChildren) {
            return
          }
          event.preventDefault()
          if (!deps.isExpanded(key)) {
            deps.expand(key)
            return
          }
          const child = node.childrenKeys.find((childKey) => !isDisabled(childKey))
          if (child !== undefined) {
            focus(child)
          }
        },
      },
      // Collapse the expanded node, or move focus to the nearest enabled ancestor.
      backward: {
        preventDefault: false,
        handle: (event, key) => {
          const node = deps.registry().nodes.get(key)
          if (!node) {
            return
          }
          if (node.hasChildren && deps.isExpanded(key) && !node.disabled) {
            event.preventDefault()
            deps.collapse(key)
            return
          }
          let ancestorKey = node.parentKey
          while (ancestorKey !== undefined && isDisabled(ancestorKey)) {
            ancestorKey = deps.registry().nodes.get(ancestorKey)?.parentKey
          }
          if (ancestorKey !== undefined) {
            event.preventDefault()
            focus(ancestorKey)
          }
        },
      },
    },
    onUnhandled: (event) => {
      if (deps.options.typeahead !== false) {
        typeahead.handleKeyDown(event)
      }
    },
  })

  onCleanup(() => {
    removeRootListeners?.()
    removeRootListeners = undefined
    elements.clear()
    pendingFocus = undefined
  })

  return {
    tabStopKey,
    focusedKey,
    focus,
    onKeyDown,
    registerElement,
    registerRoot: (element) => {
      removeRootListeners?.()
      root = element
      setHasFocusWithin(element.contains(element.ownerDocument.activeElement))
      const removeListeners = attachEventListenerMap(element, {
        focusin: () => setHasFocusWithin(true),
        focusout: (event: FocusEvent) => {
          if (!element.contains(event.relatedTarget as Node | null)) {
            setHasFocusWithin(false)
          }
        },
      })
      removeRootListeners = removeListeners
      return () => {
        removeListeners()
        if (removeRootListeners === removeListeners) {
          removeRootListeners = undefined
          root = undefined
          setHasFocusWithin(false)
        }
      }
    },
    registerScroller: (scroll) => {
      scrollToKey = scroll
    },
    isFocusWithin: () => hasFocusWithin() || isFocusWithin(),
  }
}
