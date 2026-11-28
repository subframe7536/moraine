import type { Accessor } from 'solid-js'
import { createEffect, createMemo, createSignal, untrack, createProjection } from 'solid-js'

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
import type { LoadedChildren, TreeNode, TreeRegistry } from './tree-registry'
import type { TreeT } from './tree.types'
/**
 * Stable per-key item handle. Kept as a class instance so Solid stores never wrap it in a proxy.
 */
class TreeItemHandle<T> implements TreeT.ItemInstance<T> {
  readonly key: string
  private readonly getState: () => TreeState<T>
  private lastNode: TreeNode<T>

  constructor(getState: () => TreeState<T>, node: TreeNode<T>) {
    this.getState = getState
    this.key = node.key
    this.lastNode = node
  }

  private get state(): TreeState<T> {
    return this.getState()
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
  get leaf(): boolean {
    return !this.node.hasChildren
  }
  get lastChild(): boolean {
    const node = this.node
    return node.posInSet === node.setSize
  }
  get parentKey(): string | undefined {
    return this.node.parentKey
  }
  get children(): ReadonlyArray<TreeT.ItemInstance<T>> {
    return this.node.childrenKeys.flatMap((key) => this.state.getItem(key) ?? [])
  }
  get label(): string {
    return this.node.label
  }
  get disabled(): boolean {
    return this.node.disabled
  }
  get expanded(): boolean {
    return this.state.isExpanded(this.key)
  }
  get selected(): boolean {
    return this.state.isSelected(this.key)
  }
  get loading(): boolean {
    return this.state.isLoading(this.key)
  }
  get focused(): boolean {
    return this.state.navigation.isFocused(this.key)
  }
  get checkedState(): TreeT.CheckedState {
    return this.state.getCheckedState(this.key)
  }

  expand(): void {
    this.state.expand(this.key)
  }
  collapse(): void {
    this.state.collapse(this.key)
  }
  toggle(): void {
    this.state.toggle(this.key)
  }
  select(): void {
    this.state.select(this.key)
  }
  toggleSelect(): void {
    this.state.toggleSelect(this.key)
  }
  toggleCheck(): void {
    this.state.toggleCheck(this.key)
  }
  focus(): void {
    this.state.focus(this.key)
  }
}

export interface TreeState<T> extends TreeT.Methods<T> {
  options: TreeT.Options<T>
  registry: Accessor<TreeRegistry<T>>
  expandedKeys: Accessor<ReadonlyArray<string>>
  selectedKeys: Accessor<ReadonlyArray<string>>
  checkedKeys: Accessor<ReadonlyArray<string>>
  loadingKeys: Accessor<ReadonlyArray<string>>
  flattenedKeys: Accessor<ReadonlyArray<string>>
  flattenedItems: Accessor<ReadonlyArray<TreeT.ItemInstance<T>>>
  rootItems: () => ReadonlyArray<TreeT.ItemInstance<T>>
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
  const [loadingKeys, setLoadingKeys] = createSignal<ReadonlyArray<string>>([])
  const [loaded, setLoaded] = createSignal<Readonly<Record<string, LoadedChildren<T>>>>({})
  const inFlight = new Map<string, Promise<boolean>>()
  const handles = new Map<string, TreeItemHandle<T>>()

  // Memoized so lazy loads rebuild the registry against the same source items.
  const items = createMemo(() => options.items())
  const registry = createMemo(() => {
    const next = buildRegistry(items(), options, loaded())
    for (const key of handles.keys()) {
      if (!next.nodes.has(key)) {
        handles.delete(key)
      }
    }
    return next
  })

  const isDisabled = (key: string): boolean => Boolean(state.registry().nodes.get(key)?.disabled)
  let previousLoadingKeys = new Set<string>()
  const loadingMap = createProjection<Record<string, boolean>>((draft) => {
    const nextKeys = new Set(loadingKeys())
    for (const key of nextKeys) {
      if (!previousLoadingKeys.has(key)) {
        draft[key] = true
      }
    }
    for (const key of previousLoadingKeys) {
      if (!nextKeys.has(key)) {
        delete draft[key]
      }
    }
    previousLoadingKeys = nextKeys
  }, {})

  async function runLoad(
    key: string,
    item: T,
    loadChildren: (item: T) => Promise<ReadonlyArray<T>>,
  ): Promise<boolean> {
    let children: ReadonlyArray<T>
    try {
      children = await loadChildren(item)
    } catch (error) {
      setLoadingKeys((keys) => keys.filter((loadingKey) => loadingKey !== key))
      options.onLoadChildrenError?.({ item, error })
      return false
    } finally {
      inFlight.delete(key)
    }
    setLoaded((previous) => ({ ...previous, [key]: { raw: item, children } }))
    setLoadingKeys((keys) => keys.filter((loadingKey) => loadingKey !== key))
    options.onLoadChildrenSuccess?.({ item, children })
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
  const [expandedKeys, setExpandedKeys] = createControllableValue<ReadonlyArray<string>>({
    value: () => options.expandedKeys,
    defaultValue: () => options.defaultExpandedKeys ?? [],
    onChange: (keys) => options.onExpandedKeysChange?.([...keys]),
  })
  const expandedSet = createMemo(() => new Set(expandedKeys()))
  let previousExpanded: ReadonlySet<string> = new Set()
  const expandedMap = createProjection<Record<string, boolean>>((draft) => {
    const next = expandedSet()
    for (const key of previousExpanded) {
      if (!next.has(key)) {
        delete draft[key]
      }
    }
    for (const key of next) {
      if (!previousExpanded.has(key)) {
        draft[key] = true
      }
    }
    previousExpanded = next
  }, {})
  const isExpanded = (key: string): boolean => expandedMap[key] === true

  function addExpanded(keys: ReadonlyArray<string>): void {
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
        // An empty result turns the node into a leaf, which must not be recorded as expanded.
        if (ok && state.registry().nodes.get(key)?.hasChildren) {
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
    const branches: Array<string> = []
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
    { equals: sameKeys },
  )

  // Selection
  const selectionMode = (): TreeT.SelectionMode => options.selectionMode ?? 'single'
  const [selectedKeys, setSelectedKeys] = createControllableValue<ReadonlyArray<string>>({
    value: () => options.selectedKeys,
    defaultValue: () => options.defaultSelectedKeys ?? [],
    onChange: (keys) => options.onSelectedKeysChange?.([...keys]),
  })
  const selectedSet = createMemo(() => new Set(selectedKeys()))
  let previousSelected: ReadonlySet<string> = new Set()
  const selectedMap = createProjection<Record<string, boolean>>((draft) => {
    const next = selectedSet()
    for (const key of previousSelected) {
      if (!next.has(key)) {
        delete draft[key]
      }
    }
    for (const key of next) {
      if (!previousSelected.has(key)) {
        draft[key] = true
      }
    }
    previousSelected = next
  }, {})
  const isSelected = (key: string): boolean => selectedMap[key] === true
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
    const keys: Array<string> = []
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
      const candidate = visible[i]
      if (candidate !== undefined && !isDisabled(candidate)) {
        next.add(candidate)
      }
    }
    setSelectedKeys([...next])
  }

  // Checked
  const [storedCheckedKeys, setStoredCheckedKeys] = createControllableValue<ReadonlyArray<string>>({
    value: () => options.checkedKeys,
    defaultValue: () => options.defaultCheckedKeys ?? [],
    onChange: (keys) => options.onCheckedKeysChange?.([...keys]),
  })
  const checkedStates = createMemo(() =>
    resolveCheckedStates(registry(), new Set(storedCheckedKeys()), options.checkCascade !== false),
  )
  // Stored keys outside the current registry, such as unloaded lazy children, stay checked so
  // they apply once their items load. `checkedKeys` reports them so it matches `onCheckedKeysChange`.
  const unknownCheckedKeys = (): Array<string> => {
    const nodes = registry().nodes
    return storedCheckedKeys().filter((storedKey) => !nodes.has(storedKey))
  }
  const checkedKeys = createMemo(
    () => [...collectCheckedKeys(checkedStates()), ...unknownCheckedKeys()],
    { equals: sameKeys },
  )
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
    const unknownKeys = unknownCheckedKeys()
    const working = new Set(collectCheckedKeys(checkedStates()))
    const subtree = [
      key,
      ...getDescendantKeys(current, key).filter(
        (childKey) => !current.nodes.get(childKey)?.disabled,
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

  const getState = (): TreeState<T> => state

  function getItem(key: string): TreeItemHandle<T> | undefined {
    const node = registry().nodes.get(key)
    if (!node) {
      return undefined
    }
    let handle = handles.get(key)
    if (!handle) {
      handle = new TreeItemHandle(getState, node)
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

  // Moves focus off the current item once it is hidden or becomes disabled.
  createEffect(
    () => [flattenedKeys(), registry()],
    ([visible, { nodes }]) => {
      const current = untrack(focusedKey)
      if (current === undefined || (visible.includes(current) && !nodes.get(current)?.disabled)) {
        return
      }
      const fallback = untrack(navigation.tabStopKey)
      if (fallback !== undefined && fallback !== current) {
        navigation.focus(fallback, { dom: untrack(navigation.isFocusWithin) })
      }
    },
    { defer: true },
  )

  createEffect(
    () => [registry(), expandedKeys()],
    ([current, keys]) => {
      for (const key of keys) {
        const node = current.nodes.get(key)
        if (node?.needsLoad) {
          void load(node).then((ok) => {
            const loaded = state.registry().nodes.get(key)
            if (!ok || (loaded && !loaded.hasChildren)) {
              setExpandedKeys((previous) => previous.filter((expandedKey) => expandedKey !== key))
            }
          })
        }
      }
    },
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
      options.expandOnClick !== false &&
      registry().nodes.get(key)?.hasChildren
    ) {
      toggle(key)
    }
  }

  const rootItems = createMemo(() => registry().rootKeys.flatMap((key) => getItem(key) ?? []), {
    equals: (prev, next) =>
      prev.length === next.length && prev.every((item, index) => item === next[index]),
  })
  const flattenedItems = createMemo(() => flattenedKeys().flatMap((key) => getItem(key) ?? []))

  const state: TreeState<T> = {
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
    focus: (key) => {
      const item = getItem(key)
      if (!item || item.disabled) {
        return
      }
      // `flattenedKeys()` cannot see the `expandTo` write it precedes, so
      // reachability is checked structurally: the item becomes visible when
      // every ancestor on its path can be (and just was) expanded.
      const ancestors = getAncestorKeys(registry(), key)
      const needsExpand = ancestors.some((ancestorKey) => !expandedSet().has(ancestorKey))
      expandTo(key)
      if (ancestors.every((ancestorKey) => !isDisabled(ancestorKey))) {
        if (needsExpand) {
          queueMicrotask(() => navigation.focus(key))
        } else {
          navigation.focus(key)
        }
      }
    },
    getItem,
    isLoading: (key) => loadingMap[key] === true,
  }

  return state
}
