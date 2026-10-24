import type { Accessor } from 'solid-js'
import { createMemo, onCleanup } from 'solid-js'

import { useLocale } from '../../provider'
import { createTypeahead } from '../../shared/typeahead'

import type { TreeChecked } from './tree-checked'
import type { TreeExpansion } from './tree-expansion'
import { getSiblingKeys } from './tree-registry'
import type { TreeRegistry } from './tree-registry'
import type { TreeSelection } from './tree-selection'
import type { TreeT } from './tree.types'

const PENDING_FOCUS_TIMEOUT = 1000

export interface TreeNavigationDeps<T> {
  options: TreeT.Options<T>
  registry: Accessor<TreeRegistry<T>>
  flattenedKeys: Accessor<readonly string[]>
  isDisabled: (key: string) => boolean
  getTextValue: (key: string) => string
  getFocusedKey: () => string | undefined
  setFocusedKey: (key: string | undefined) => void
  expansion: Pick<TreeExpansion, 'isExpanded' | 'expand' | 'collapse' | 'toggle'>
  selection: TreeSelection
  checked: Pick<TreeChecked, 'toggleCheck'>
  checkable: () => boolean
  getItem: (key: string) => TreeT.ItemInstance<T> | undefined
}

export interface TreeNavigation {
  /** Key of the item that is reachable with `Tab`. */
  tabStopKey: Accessor<string | undefined>
  focus: (key: string, options?: { dom?: boolean }) => void
  onKeyDown: (event: KeyboardEvent, key: string) => void
  registerElement: (key: string, element: HTMLElement) => () => void
  registerRoot: (element: HTMLElement | undefined) => void
  registerScroller: (scroll: ((key: string) => void) | undefined) => void
  isFocusWithin: () => boolean
}

export function createTreeNavigation<T>(deps: TreeNavigationDeps<T>): TreeNavigation {
  const dir = useLocale().dir
  const elements = new Map<string, HTMLElement>()
  let root: HTMLElement | undefined
  let scrollToKey: ((key: string) => void) | undefined
  let pendingFocus: { key: string; expires: number } | undefined

  const visibleKeys = createMemo(() => new Set(deps.flattenedKeys()))
  const navigableKeys = createMemo(() =>
    deps.flattenedKeys().filter((key) => !deps.isDisabled(key)),
  )

  const tabStopKey = createMemo<string | undefined>(() => {
    let candidate = deps.getFocusedKey()
    while (candidate !== undefined && !visibleKeys().has(candidate)) {
      candidate = deps.registry().nodes.get(candidate)?.parentKey
    }
    if (candidate !== undefined && !deps.isDisabled(candidate)) {
      return candidate
    }
    const keys = navigableKeys()
    return keys.find((key) => deps.selection.isSelected(key)) ?? keys[0]
  })

  function isFocusWithin(): boolean {
    return !!root && root.contains(root.ownerDocument.activeElement)
  }

  function focus(key: string, focusOptions?: { dom?: boolean }): void {
    if (!deps.registry().nodes.has(key)) {
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
      return
    }
    pendingFocus = { key, expires: Date.now() + PENDING_FOCUS_TIMEOUT }
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
      deps.selection.selectRange(key, deps.selection.getAnchor() ?? from)
    }
    focus(key)
  }

  function moveRelative(from: string, offset: 1 | -1, extend: boolean): void {
    const keys = deps.flattenedKeys()
    let index = keys.indexOf(from) + offset
    while (index >= 0 && index < keys.length && deps.isDisabled(keys[index]!)) {
      index += offset
    }
    const target = keys[index]
    if (target !== undefined) {
      moveTo(target, extend, from)
    }
  }

  function expandSiblings(key: string): void {
    for (const siblingKey of getSiblingKeys(deps.registry(), key)) {
      deps.expansion.expand(siblingKey)
    }
  }

  function activate(key: string): void {
    const item = deps.getItem(key)
    if (item && deps.options.onAction) {
      deps.options.onAction(item)
    } else if (deps.selection.mode() !== 'none') {
      deps.selection.selectOnly(key)
    } else if (deps.registry().nodes.get(key)?.hasChildren) {
      deps.expansion.toggle(key)
    }
  }

  function toggleCurrent(key: string): void {
    if (deps.checkable()) {
      deps.checked.toggleCheck(key)
    } else if (deps.selection.mode() === 'multiple') {
      deps.selection.toggleSelect(key)
    } else {
      deps.selection.select(key)
    }
  }

  const typeahead = createTypeahead<string>({
    getItems: navigableKeys,
    getStartIndex: () => navigableKeys().indexOf(tabStopKey() ?? ''),
    getText: (key) => deps.getTextValue(key),
    onMatch: (key) => focus(key),
  })

  function onKeyDown(event: KeyboardEvent, key: string): void {
    const element = event.currentTarget
    if (event.target !== element || event.altKey || !(element instanceof Element)) {
      return
    }
    const node = deps.registry().nodes.get(key)
    if (!node) {
      return
    }
    const modifier = event.ctrlKey || event.metaKey
    const rtl = (dir() ?? getComputedStyle(element).direction) === 'rtl'
    const forwardKey = rtl ? 'ArrowLeft' : 'ArrowRight'

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        moveRelative(key, 1, event.shiftKey)
        return
      case 'ArrowUp':
        event.preventDefault()
        moveRelative(key, -1, event.shiftKey)
        return
      case 'Home':
      case 'End': {
        event.preventDefault()
        const keys = navigableKeys()
        const target = event.key === 'Home' ? keys[0] : keys[keys.length - 1]
        if (target !== undefined) {
          moveTo(target, event.shiftKey, key)
        }
        return
      }
      case 'Enter':
        event.preventDefault()
        activate(key)
        return
      case ' ':
        event.preventDefault()
        toggleCurrent(key)
        return
      case '*':
        event.preventDefault()
        expandSiblings(key)
        return
      case 'a':
      case 'A':
        if (modifier && deps.selection.mode() === 'multiple') {
          event.preventDefault()
          deps.selection.selectAll()
          return
        }
        break
      default:
        if (event.key === forwardKey) {
          if (node.hasChildren) {
            event.preventDefault()
            if (!deps.expansion.isExpanded(key)) {
              deps.expansion.expand(key)
            } else {
              const child = node.childrenKeys.find((childKey) => !deps.isDisabled(childKey))
              if (child !== undefined) {
                focus(child)
              }
            }
          }
          return
        }
        if (event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) {
          if (node.hasChildren && deps.expansion.isExpanded(key)) {
            event.preventDefault()
            deps.expansion.collapse(key)
          } else if (node.parentKey !== undefined) {
            event.preventDefault()
            focus(node.parentKey)
          }
          return
        }
    }

    if (deps.options.typeahead !== false) {
      typeahead.handleKeyDown(event)
    }
  }

  onCleanup(() => {
    elements.clear()
    pendingFocus = undefined
  })

  return {
    tabStopKey,
    focus,
    onKeyDown,
    registerElement,
    registerRoot: (element) => {
      root = element
    },
    registerScroller: (scroll) => {
      scrollToKey = scroll
    },
    isFocusWithin,
  }
}
