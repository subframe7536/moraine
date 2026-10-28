import type { JSX } from 'solid-js'
import { onCleanup } from 'solid-js'

import {
  belongsToItem,
  isFromInteractiveDescendant,
  isFromPointerFocusableDescendant,
} from './tree-dom'
import type { TreeNode, TreeRegistry } from './tree-registry'
import type { TreeT } from './tree.types'

/** Everything an item handle delegates to. Implemented by `createTree`. */
export interface TreeEngine<T> {
  registry: () => TreeRegistry<T>
  getItem: (key: string) => TreeT.ItemInstance<T> | undefined
  getTextValue: (key: string) => string
  isDisabled: (key: string) => boolean
  selectionMode: () => TreeT.SelectionMode
  checkable: () => boolean
  isExpanded: (key: string) => boolean
  isSelected: (key: string) => boolean
  isLoading: (key: string) => boolean
  isFocused: (key: string) => boolean
  isTabStop: (key: string) => boolean
  getCheckedState: (key: string) => TreeT.CheckedState
  setChecked: (key: string, checked: boolean) => void
  expand: (key: string) => void
  collapse: (key: string) => void
  toggle: (key: string) => void
  select: (key: string) => void
  toggleSelect: (key: string) => void
  toggleCheck: (key: string) => void
  focus: (key: string) => void
  setFocusedKey: (key: string) => void
  handleClick: (event: MouseEvent, key: string) => void
  handleKeyDown: (event: KeyboardEvent, key: string) => void
  registerElement: (key: string, element: HTMLElement) => () => void
}

/**
 * Stable handle per key. It is a class instance so Solid stores never wrap it in a proxy,
 * and its members are arrow functions so they can be destructured safely.
 */
export class TreeItemHandle<T> implements TreeT.ItemInstance<T> {
  readonly key: string
  private readonly engine: TreeEngine<T>
  private lastNode: TreeNode<T>

  constructor(engine: TreeEngine<T>, node: TreeNode<T>) {
    this.engine = engine
    this.key = node.key
    this.lastNode = node
  }

  private get node(): TreeNode<T> {
    const node = this.engine.registry().nodes.get(this.key)
    if (node) {
      this.lastNode = node
    }
    return this.lastNode
  }

  get raw(): T {
    return this.node.raw
  }
  get level(): number {
    return this.node.level
  }
  get posInSet(): number {
    return this.node.indexInParent + 1
  }
  get setSize(): number {
    return this.node.siblingCount
  }
  get hasChildren(): boolean {
    return this.node.hasChildren
  }
  get isLastChild(): boolean {
    const node = this.node
    return node.indexInParent === node.siblingCount - 1
  }
  get parentKey(): string | undefined {
    return this.node.parentKey
  }
  get children(): readonly TreeT.ItemInstance<T>[] {
    return this.node.childrenKeys.flatMap((key) => this.engine.getItem(key) ?? [])
  }
  get textValue(): string {
    return this.engine.getTextValue(this.key)
  }
  get isExpanded(): boolean {
    return this.engine.isExpanded(this.key)
  }
  get isSelected(): boolean {
    return this.engine.isSelected(this.key)
  }
  get isLoading(): boolean {
    return this.engine.isLoading(this.key)
  }
  get isFocused(): boolean {
    return this.engine.isFocused(this.key)
  }
  get isDisabled(): boolean {
    return this.engine.isDisabled(this.key)
  }
  get checkedState(): TreeT.CheckedState {
    return this.engine.getCheckedState(this.key)
  }

  expand = (): void => this.engine.expand(this.key)
  collapse = (): void => this.engine.collapse(this.key)
  toggle = (): void => this.engine.toggle(this.key)
  select = (): void => this.engine.select(this.key)
  toggleSelect = (): void => this.engine.toggleSelect(this.key)
  toggleCheck = (): void => this.engine.toggleCheck(this.key)
  focus = (): void => this.engine.focus(this.key)

  getItemProps = (): JSX.HTMLAttributes<HTMLElement> => {
    const { engine, key } = this
    const item = (): TreeItemHandle<T> => this
    return {
      role: 'treeitem',
      get tabIndex() {
        return item().isDisabled ? undefined : engine.isTabStop(key) ? 0 : -1
      },
      get 'aria-level'() {
        return item().level
      },
      get 'aria-posinset'() {
        return item().posInSet
      },
      get 'aria-setsize'() {
        return item().setSize
      },
      get 'aria-expanded'() {
        return item().hasChildren ? item().isExpanded : undefined
      },
      get 'aria-selected'() {
        return engine.selectionMode() === 'none' ? undefined : item().isSelected
      },
      get 'aria-checked'() {
        if (!engine.checkable()) {
          return undefined
        }
        const state = item().checkedState
        return state === 'indeterminate' ? 'mixed' : state === 'checked'
      },
      get 'aria-disabled'() {
        return item().isDisabled ? true : undefined
      },
      get 'aria-busy'() {
        return item().isLoading ? true : undefined
      },
      get 'aria-label'() {
        return item().textValue
      },
      onClick: (event: MouseEvent) => {
        if (
          !event.defaultPrevented &&
          belongsToItem(event) &&
          !isFromInteractiveDescendant(event) &&
          !item().isDisabled
        ) {
          engine.handleClick(event, key)
        }
      },
      onKeyDown: (event: KeyboardEvent) => engine.handleKeyDown(event, key),
      onFocusIn: (event: FocusEvent) => {
        if (belongsToItem(event) && !item().isDisabled) {
          engine.setFocusedKey(key)
        }
      },
      onMouseDown: (event: MouseEvent) => {
        if (belongsToItem(event) && !item().isDisabled && isFromPointerFocusableDescendant(event)) {
          event.preventDefault()
          if (event.currentTarget instanceof HTMLElement) {
            event.currentTarget.focus()
          }
        }
      },
      ref: (element: HTMLElement) => {
        onCleanup(engine.registerElement(key, element))
      },
    }
  }

  getTriggerProps = (): JSX.HTMLAttributes<HTMLElement> => {
    const { engine, key } = this
    return {
      'aria-hidden': true,
      onClick: (event: MouseEvent) => {
        event.preventDefault()
        if (!engine.isDisabled(key)) {
          engine.toggle(key)
        }
      },
    }
  }

  getCheckboxProps = (): TreeT.CheckboxBinding => {
    const { engine, key } = this
    return {
      get checked() {
        return engine.getCheckedState(key) === 'checked'
      },
      get indeterminate() {
        return engine.getCheckedState(key) === 'indeterminate'
      },
      get disabled() {
        return engine.isDisabled(key)
      },
      onCheckedChange: (checked: boolean) => engine.setChecked(key, checked),
      fieldBind: false,
      tabIndex: -1,
      'aria-hidden': true,
    }
  }
}
