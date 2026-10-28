import type { Accessor, JSX } from 'solid-js'
import {
  batch,
  createEffect,
  createMemo,
  createSelector,
  createSignal,
  on,
  onCleanup,
  untrack,
} from 'solid-js'

import { createControllableValue } from '../../shared/controllable-value'

import { createTreeNavigation } from './tree-navigation'
import type { TreeNavigation } from './tree-navigation'
import {
  buildRegistry,
  collectCheckedKeys,
  flattenKeys,
  getAncestorKeys,
  getDescendantKeys,
  resolveCheckedStates,
  sameKeys,
} from './tree-registry'
import type { TreeNode, TreeRegistry } from './tree-registry'
import type { TreeT } from './tree.types'

const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, label, [role="checkbox"]'
const POINTER_FOCUS_SELECTOR = 'button, input, [role="checkbox"]'

function belongsToItem(event: Event): boolean {
  const host = event.currentTarget
  const target = event.target instanceof Element ? event.target : null
  if (!(host instanceof Element) || !target || target.closest('[role="treeitem"]') !== host) {
    return false
  }
  const group = target.closest('[role="group"]')
  return !group || !host.contains(group)
}

function isFromDescendant(event: Event, selector: string): boolean {
  const host = event.currentTarget
  const target = event.target instanceof Element ? event.target.closest(selector) : null
  return host instanceof Element && !!target && target !== host && host.contains(target)
}

/**
 * Stable per-key item handle. Kept as a class instance so Solid stores never wrap it in a proxy,
 * with arrow methods that can be destructured safely.
 */
class TreeItemHandle<T> implements TreeT.ItemInstance<T> {
  readonly key: string
  private readonly state: TreeState<T>
  private lastNode: TreeNode<T>

  constructor(state: TreeState<T>, node: TreeNode<T>) {
    this.state = state
    this.key = node.key
    this.lastNode = node
  }

  private get node(): TreeNode<T> {
    const node = this.state.registry().nodes.get(this.key)
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
    return this.node.posInSet
  }
  get setSize(): number {
    return this.node.setSize
  }
  get hasChildren(): boolean {
    return this.node.hasChildren
  }
  get isLastChild(): boolean {
    const node = this.node
    return node.posInSet === node.setSize
  }
  get parentKey(): string | undefined {
    return this.node.parentKey
  }
  get children(): readonly TreeT.ItemInstance<T>[] {
    return this.node.childrenKeys.flatMap((key) => this.state.getItem(key) ?? [])
  }
  get textValue(): string {
    return this.node.textValue
  }
  get isDisabled(): boolean {
    return this.node.disabled
  }
  get isExpanded(): boolean {
    return this.state.isExpanded(this.key)
  }
  get isSelected(): boolean {
    return this.state.isSelected(this.key)
  }
  get isLoading(): boolean {
    return this.state.isLoading(this.key)
  }
  get isFocused(): boolean {
    return this.state.navigation.focusedKey() === this.key
  }
  get checkedState(): TreeT.CheckedState {
    return this.state.getCheckedState(this.key)
  }

  expand = (): void => this.state.expand(this.key)
  collapse = (): void => this.state.collapse(this.key)
  toggle = (): void => this.state.toggle(this.key)
  select = (): void => this.state.select(this.key)
  toggleSelect = (): void => this.state.toggleSelect(this.key)
  toggleCheck = (): void => this.state.toggleCheck(this.key)
  focus = (): void => this.state.navigation.focus(this.key)

  getItemProps = (): JSX.HTMLAttributes<HTMLElement> => {
    const { state, key } = this
    const node = (): TreeNode<T> => this.node
    return {
      role: 'treeitem',
      get tabIndex() {
        return node().disabled ? undefined : state.navigation.tabStopKey() === key ? 0 : -1
      },
      get 'aria-level'() {
        return node().level
      },
      get 'aria-posinset'() {
        return node().posInSet
      },
      get 'aria-setsize'() {
        return node().setSize
      },
      get 'aria-expanded'() {
        return node().hasChildren ? state.isExpanded(key) : undefined
      },
      get 'aria-selected'() {
        return state.selectionMode() === 'none' ? undefined : state.isSelected(key)
      },
      get 'aria-checked'() {
        if (!state.options.checkable) {
          return undefined
        }
        const checked = state.getCheckedState(key)
        return checked === 'indeterminate' ? 'mixed' : checked === 'checked'
      },
      get 'aria-disabled'() {
        return node().disabled ? true : undefined
      },
      get 'aria-busy'() {
        return state.isLoading(key) ? true : undefined
      },
      get 'aria-label'() {
        return node().textValue
      },
      onClick: (event: MouseEvent) => {
        if (
          !event.defaultPrevented &&
          belongsToItem(event) &&
          !isFromDescendant(event, INTERACTIVE_SELECTOR) &&
          !node().disabled
        ) {
          state.handleClick(event, key)
        }
      },
      onKeyDown: (event: KeyboardEvent) => state.navigation.onKeyDown(event, key),
      onFocusIn: (event: FocusEvent) => {
        if (belongsToItem(event) && !node().disabled) {
          state.setFocusedKey(key)
        }
      },
      onMouseDown: (event: MouseEvent) => {
        if (
          belongsToItem(event) &&
          !node().disabled &&
          isFromDescendant(event, POINTER_FOCUS_SELECTOR)
        ) {
          event.preventDefault()
          if (event.currentTarget instanceof HTMLElement) {
            event.currentTarget.focus()
          }
        }
      },
      ref: (element: HTMLElement) => {
        onCleanup(state.navigation.registerElement(key, element))
      },
    }
  }

  getTriggerProps = (): JSX.HTMLAttributes<HTMLElement> => {
    const { state, key } = this
    return {
      'aria-hidden': true,
      onClick: (event: MouseEvent) => {
        event.preventDefault()
        state.toggle(key)
      },
    }
  }

  getCheckboxProps = (): TreeT.CheckboxBinding => {
    const { state, key } = this
    const node = (): TreeNode<T> => this.node
    return {
      get checked() {
        return state.getCheckedState(key) === 'checked'
      },
      get indeterminate() {
        return state.getCheckedState(key) === 'indeterminate'
      },
      get disabled() {
        return node().disabled
      },
      onCheckedChange: (checked: boolean) => state.setChecked(key, checked),
      fieldBind: false,
      tabIndex: -1,
      'aria-hidden': true,
    }
  }
}

export interface TreeState<T> extends TreeT.Methods<T> {
  options: TreeT.Options<T>
  registry: Accessor<TreeRegistry<T>>
  expandedKeys: Accessor<readonly string[]>
  selectedKeys: Accessor<readonly string[]>
  checkedKeys: Accessor<readonly string[]>
  loadingKeys: Accessor<readonly string[]>
  flattenedKeys: Accessor<readonly string[]>
  flattenedItems: Accessor<readonly TreeT.ItemInstance<T>[]>
  rootItems: () => readonly TreeT.ItemInstance<T>[]
  selectionMode: () => TreeT.SelectionMode
  navigation: TreeNavigation
  isExpanded: (key: string) => boolean
  isSelected: (key: string) => boolean
  getCheckedState: (key: string) => TreeT.CheckedState
  setChecked: (key: string, checked: boolean) => void
  setFocusedKey: (key: string | undefined) => void
  handleClick: (event: MouseEvent, key: string) => void
}

export function createTreeState<T>(options: TreeT.Options<T>): TreeState<T> {
  const [focusedKey, setFocusedKey] = createSignal<string | undefined>()
  const [loadingKeys, setLoadingKeys] = createSignal<readonly string[]>([])
  const [loaded, setLoaded] = createSignal<Readonly<Record<string, readonly T[]>>>({})
  const inFlight = new Map<string, Promise<boolean>>()
  const handles = new Map<string, TreeItemHandle<T>>()
  let state!: TreeState<T>

  const registry = createMemo(() => {
    const next = buildRegistry(options.items(), options, loaded())
    for (const key of handles.keys()) {
      if (!next.nodes.has(key)) {
        handles.delete(key)
      }
    }
    return next
  })

  const isDisabled = (key: string): boolean => Boolean(state.registry().nodes.get(key)?.disabled)
  const loadingSet = createMemo(() => new Set(loadingKeys()))

  async function runLoad(
    key: string,
    item: T,
    loadChildren: (item: T) => Promise<readonly T[]>,
  ): Promise<boolean> {
    let children: readonly T[]
    try {
      children = await loadChildren(item)
    } catch (error) {
      setLoadingKeys((keys) => keys.filter((loadingKey) => loadingKey !== key))
      options.onLoadChildrenError?.({ item, error })
      return false
    } finally {
      inFlight.delete(key)
    }
    batch(() => {
      setLoaded((previous) => ({ ...previous, [key]: children }))
      setLoadingKeys((keys) => keys.filter((loadingKey) => loadingKey !== key))
    })
    options.onLoadChildrenComplete?.({ item, children })
    return true
  }

  function load(node: TreeNode<T> | undefined): Promise<boolean> {
    const loadChildren = options.loadChildren
    if (!node || !loadChildren) {
      return Promise.resolve(false)
    }
    if (!node.needsLoad) {
      return Promise.resolve(true)
    }
    const existing = inFlight.get(node.key)
    if (existing) {
      return existing
    }
    setLoadingKeys((keys) => [...keys, node.key])
    const promise = runLoad(node.key, node.raw, loadChildren)
    inFlight.set(node.key, promise)
    return promise
  }

  // Expansion
  const [expandedKeys, setExpandedKeys] = createControllableValue<readonly string[]>({
    value: () => options.expandedKeys,
    defaultValue: () => options.defaultExpandedKeys ?? [],
    onChange: (keys) => options.onExpandedChange?.([...keys]),
  })
  const expandedSet = createMemo(() => new Set(expandedKeys()))
  const isExpanded = createSelector<ReadonlySet<string>, string>(expandedSet, (key, set) =>
    set.has(key),
  )

  function addExpanded(keys: readonly string[]): void {
    setExpandedKeys((previous) => {
      const existing = new Set(previous)
      const added = keys.filter((key) => !existing.has(key))
      return added.length > 0 ? [...previous, ...added] : previous
    })
  }

  function expand(key: string): void {
    const node = registry().nodes.get(key)
    if (!node?.hasChildren || node.disabled || isExpanded(key)) {
      return
    }
    if (node.needsLoad) {
      void load(node).then((ok) => {
        if (ok && state.registry().nodes.has(key)) {
          addExpanded([key])
        }
      })
      return
    }
    addExpanded([key])
  }

  function collapse(key: string): void {
    if (!isExpanded(key) || isDisabled(key)) {
      return
    }
    setExpandedKeys((previous) => previous.filter((expandedKey) => expandedKey !== key))
  }

  function toggle(key: string): void {
    if (isExpanded(key)) {
      collapse(key)
    } else {
      expand(key)
    }
  }

  function expandAll(): void {
    const branches: string[] = []
    for (const node of registry().nodes.values()) {
      if (node.hasChildren && !node.disabled) {
        branches.push(node.key)
      }
    }
    addExpanded(branches)
  }

  function collapseAll(): void {
    if (expandedKeys().some((key) => !isDisabled(key))) {
      setExpandedKeys((previous) => previous.filter((key) => isDisabled(key)))
    }
  }

  function expandTo(key: string): void {
    addExpanded(getAncestorKeys(registry(), key).filter((ancestorKey) => !isDisabled(ancestorKey)))
  }

  const flattenedKeys = createMemo(
    () => {
      const expanded = expandedSet()
      return flattenKeys(registry(), (key) => expanded.has(key))
    },
    undefined,
    { equals: sameKeys },
  )

  // Selection
  const selectionMode = (): TreeT.SelectionMode => options.selectionMode ?? 'single'
  const [selectedKeys, setSelectedKeys] = createControllableValue<readonly string[]>({
    value: () => options.selectedKeys,
    defaultValue: () => options.defaultSelectedKeys ?? [],
    onChange: (keys) => options.onSelectionChange?.([...keys]),
  })
  const selectedSet = createMemo(() => new Set(selectedKeys()))
  const isSelected = createSelector<ReadonlySet<string>, string>(selectedSet, (key, set) =>
    set.has(key),
  )
  let anchorKey: string | undefined
  let rangeSnapshot = new Set<string>()

  const canSelect = (key: string): boolean => {
    const node = registry().nodes.get(key)
    return selectionMode() !== 'none' && !!node && !node.disabled
  }

  function select(key: string): void {
    if (!canSelect(key)) {
      return
    }
    anchorKey = key
    rangeSnapshot = new Set([...selectedKeys(), key])
    if (selectionMode() === 'multiple') {
      setSelectedKeys((previous) => (previous.includes(key) ? previous : [...previous, key]))
    } else {
      setSelectedKeys([key])
    }
  }

  function selectOnly(key: string): void {
    if (!canSelect(key)) {
      return
    }
    anchorKey = key
    rangeSnapshot = new Set()
    setSelectedKeys([key])
  }

  function deselect(key: string): void {
    if (isDisabled(key)) {
      return
    }
    anchorKey = key
    rangeSnapshot.delete(key)
    setSelectedKeys((previous) =>
      previous.includes(key) ? previous.filter((selectedKey) => selectedKey !== key) : previous,
    )
  }

  function toggleSelect(key: string): void {
    if (selectedSet().has(key)) {
      deselect(key)
    } else {
      select(key)
    }
  }

  function selectAll(): void {
    if (selectionMode() !== 'multiple') {
      return
    }
    const keys: string[] = []
    for (const node of registry().nodes.values()) {
      if (!node.disabled) {
        keys.push(node.key)
      }
    }
    setSelectedKeys(keys)
    rangeSnapshot = new Set(keys)
  }

  function clearSelection(): void {
    anchorKey = undefined
    rangeSnapshot = new Set()
    setSelectedKeys([])
  }

  function selectRange(key: string, fallbackAnchor?: string): void {
    if (selectionMode() !== 'multiple') {
      return
    }
    const visible = flattenedKeys()
    let anchor = anchorKey ?? fallbackAnchor
    if (anchor === undefined || !visible.includes(anchor) || isDisabled(anchor)) {
      anchor = visible.includes(key) && !isDisabled(key) ? key : undefined
      if (anchor === undefined) {
        return
      }
      anchorKey = anchor
      rangeSnapshot = new Set(selectedKeys())
    } else if (anchorKey === undefined) {
      anchorKey = anchor
      rangeSnapshot = new Set(selectedKeys())
    }
    const from = visible.indexOf(anchor)
    const to = visible.indexOf(key)
    if (from === -1 || to === -1) {
      return
    }
    const min = Math.min(from, to)
    const max = Math.max(from, to)
    const next = new Set(rangeSnapshot)
    for (let i = min; i <= max; i++) {
      const candidate = visible[i]!
      if (!isDisabled(candidate)) {
        next.add(candidate)
      }
    }
    setSelectedKeys([...next])
  }

  // Checked
  const [storedCheckedKeys, setStoredCheckedKeys] = createControllableValue<readonly string[]>({
    value: () => options.checkedKeys,
    defaultValue: () => options.defaultCheckedKeys ?? [],
    onChange: (keys) => options.onCheckedChange?.([...keys]),
  })
  const checkedStates = createMemo(() =>
    resolveCheckedStates(registry(), new Set(storedCheckedKeys()), options.checkCascade !== false),
  )
  const checkedKeys = createMemo(() => collectCheckedKeys(checkedStates()), undefined, {
    equals: sameKeys,
  })
  const getCheckedState = (key: string): TreeT.CheckedState =>
    checkedStates().get(key) ?? 'unchecked'

  function setChecked(key: string, checked: boolean): void {
    const current = registry()
    const node = current.nodes.get(key)
    if (!node || node.disabled) {
      return
    }
    if (options.checkCascade === false) {
      setStoredCheckedKeys((previous) =>
        checked
          ? previous.includes(key)
            ? previous
            : [...previous, key]
          : previous.filter((storedKey) => storedKey !== key),
      )
      return
    }
    // Preserve keys outside the current registry, such as unloaded lazy children.
    const unknownKeys = storedCheckedKeys().filter((storedKey) => !current.nodes.has(storedKey))
    const working = new Set(checkedKeys())
    const subtree = [
      key,
      ...getDescendantKeys(current, key).filter(
        (childKey) => !current.nodes.get(childKey)!.disabled,
      ),
    ]
    if (checked) {
      for (const subtreeKey of subtree) {
        working.add(subtreeKey)
      }
    } else {
      for (const subtreeKey of [...subtree, ...getAncestorKeys(current, key)]) {
        working.delete(subtreeKey)
      }
    }
    const next = resolveCheckedStates(current, working, true)
    setStoredCheckedKeys([...collectCheckedKeys(next), ...unknownKeys])
  }

  function getItem(key: string): TreeItemHandle<T> | undefined {
    const node = registry().nodes.get(key)
    if (!node) {
      return undefined
    }
    let handle = handles.get(key)
    if (!handle) {
      handle = new TreeItemHandle(state, node)
      handles.set(key, handle)
    }
    return handle
  }

  const navigation = createTreeNavigation<T>({
    options,
    registry,
    flattenedKeys,
    selectedKeys,
    getFocusedKey: focusedKey,
    setFocusedKey,
    isExpanded,
    expand,
    collapse,
    toggle,
    select,
    selectOnly,
    toggleSelect,
    selectAll,
    selectRange,
    toggleCheck: (key) => setChecked(key, getCheckedState(key) !== 'checked'),
    getItem,
  })

  createEffect(
    on(
      flattenedKeys,
      (visible) => {
        const current = untrack(focusedKey)
        if (current === undefined || visible.includes(current)) {
          return
        }
        const fallback = untrack(navigation.tabStopKey)
        if (fallback !== undefined && fallback !== current) {
          navigation.focus(fallback, { dom: untrack(navigation.isFocusWithin) })
        }
      },
      { defer: true },
    ),
  )

  createEffect(
    on([registry, expandedKeys], ([current, keys]) => {
      for (const key of keys) {
        const node = current.nodes.get(key)
        if (node?.needsLoad) {
          void load(node)
        }
      }
    }),
  )

  function handleClick(event: MouseEvent, key: string): void {
    const modifier = event.ctrlKey || event.metaKey
    const mode = selectionMode()
    if (mode !== 'none') {
      if (modifier) {
        toggleSelect(key)
      } else if (event.shiftKey && mode === 'multiple') {
        selectRange(key, navigation.tabStopKey() ?? key)
      } else {
        selectOnly(key)
      }
    }
    if (
      !modifier &&
      !event.shiftKey &&
      (options.expandOnClick !== false || options.trigger === false) &&
      registry().nodes.get(key)?.hasChildren
    ) {
      toggle(key)
    }
  }

  const rootItems = () => registry().rootKeys.flatMap((key) => getItem(key) ?? [])
  const flattenedItems = () => flattenedKeys().flatMap((key) => getItem(key) ?? [])

  state = {
    options,
    registry,
    expandedKeys,
    selectedKeys,
    checkedKeys,
    loadingKeys,
    flattenedKeys,
    flattenedItems,
    rootItems,
    selectionMode,
    navigation,
    isExpanded,
    isSelected,
    getCheckedState,
    setChecked,
    setFocusedKey,
    handleClick,
    expand,
    collapse,
    toggle,
    expandAll,
    collapseAll,
    expandTo,
    select,
    deselect,
    toggleSelect,
    selectAll,
    clearSelection,
    check: (key) => setChecked(key, true),
    uncheck: (key) => setChecked(key, false),
    toggleCheck: (key) => setChecked(key, getCheckedState(key) !== 'checked'),
    focus: (key) => navigation.focus(key),
    getItem,
    isLoading: (key) => loadingSet().has(key),
  }

  return state
}
