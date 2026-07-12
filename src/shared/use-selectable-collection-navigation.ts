import type { Accessor } from 'solid-js'

type ActivationMode = 'automatic' | 'manual'
type Orientation = 'horizontal' | 'vertical'

/**
 * Options for the selectable collection navigation hook.
 *
 * @template TItem - The type of items in the collection
 * @template TValue - The type of the value identifier (must extend string)
 */
export interface UseSelectableCollectionNavigationOptions<TItem, TValue extends string> {
  /** Accessor returning the array of items in the collection */
  items: Accessor<TItem[]>
  /** Function to extract the unique value identifier from an item */
  getValue: (item: TItem) => TValue
  /** Optional function to determine if an item is disabled */
  isDisabled?: (item: TItem) => boolean
  /** Whether arrow-key navigation wraps from the ends (default: false) */
  loop?: Accessor<boolean>
  /**
   * Activation mode for keyboard navigation:
   * - 'automatic': Arrow keys immediately select the item
   * - 'manual': Arrow keys only focus, Enter/Space activates
   * @default 'automatic'
   */
  activationMode?: Accessor<ActivationMode>
  /** Optional callback to focus an item by its value */
  focusValue?: (value: TValue) => void
  /** Callback when an item is selected */
  onSelect: (value: TValue) => void
  /**
   * Optional function to detect RTL direction.
   * If not provided, direction is detected from the event target's computed style.
   *
   * @example
   * ```ts
   * // Explicit direction control
   * getDirection: () => document.dir === 'rtl' ? 'rtl' : 'ltr'
   * ```
   */
  getDirection?: () => 'ltr' | 'rtl'
}

/**
 * Hook for keyboard navigation in selectable collections.
 *
 * Provides orientation-aware, RTL-compatible keyboard navigation for components
 * like Tabs, Select, Accordion, and RadioGroup. Handles arrow keys, Home/End,
 * Enter/Space, and supports both automatic and manual activation modes.
 *
 * @template TItem - The type of items in the collection
 * @template TValue - The type of the value identifier (must extend string)
 *
 * @param options - Configuration options for the navigation behavior
 * @returns Object with navigation methods
 *
 * @example
 * ```tsx
 * const { onNavigationKeyDown } = useSelectableCollectionNavigation({
 *   items: () => tabs,
 *   getValue: (tab) => tab.id,
 *   isDisabled: (tab) => tab.disabled,
 *   loop: () => true,
 *   activationMode: () => 'automatic',
 *   focusValue: (id) => tabRefs.get(id)?.focus(),
 *   onSelect: (id) => setSelectedTab(id),
 * })
 *
 * <button
 *   onKeyDown={(e) => onNavigationKeyDown(e, tab.id, 'horizontal')}
 * >
 *   {tab.label}
 * </button>
 * ```
 *
 * Keyboard behavior:
 * - Vertical orientation: ArrowUp/ArrowDown navigate
 * - Horizontal orientation: ArrowLeft/ArrowRight navigate (flipped in RTL)
 * - Home: Jump to first enabled item
 * - End: Jump to last enabled item
 * - Enter/Space: Activate current item (always, regardless of activation mode)
 *
 * RTL support:
 * In horizontal orientation with RTL direction:
 * - ArrowLeft moves forward (next item)
 * - ArrowRight moves backward (previous item)
 *
 * Activation modes:
 * - Automatic: Arrow keys immediately select and focus
 * - Manual: Arrow keys only focus, Enter/Space required to select
 */
export function useSelectableCollectionNavigation<TItem, TValue extends string>(
  options: UseSelectableCollectionNavigationOptions<TItem, TValue>,
) {
  function getEnabledItems(): TItem[] {
    return options.items().filter((item) => !options.isDisabled?.(item))
  }

  function applySelection(nextValue: TValue): void {
    if (options.activationMode?.() === 'manual') {
      options.focusValue?.(nextValue)
      return
    }

    options.onSelect(nextValue)
    options.focusValue?.(nextValue)
  }

  function moveSelection(currentValue: TValue, offset: number): void {
    const enabledItems = getEnabledItems()
    const currentIndex = enabledItems.findIndex((item) => options.getValue(item) === currentValue)

    if (currentIndex < 0 || enabledItems.length === 0) {
      return
    }

    const nextIndex = currentIndex + offset
    const boundedIndex = options.loop?.()
      ? (nextIndex + enabledItems.length) % enabledItems.length
      : Math.min(enabledItems.length - 1, Math.max(0, nextIndex))
    const nextItem = enabledItems[boundedIndex]

    if (!nextItem) {
      return
    }

    const nextValue = options.getValue(nextItem)

    if (nextValue === currentValue) {
      return
    }

    applySelection(nextValue)
  }

  function moveToBoundary(kind: 'first' | 'last'): void {
    const enabledItems = getEnabledItems()
    const nextItem = kind === 'first' ? enabledItems[0] : enabledItems[enabledItems.length - 1]

    if (!nextItem) {
      return
    }

    applySelection(options.getValue(nextItem))
  }

  function moveFromBoundaryForOffset(offset: number): void {
    moveToBoundary(offset >= 0 ? 'first' : 'last')
  }

  function focusByOffset(currentValue: TValue | undefined, offset: number): void {
    if (currentValue === undefined) {
      moveFromBoundaryForOffset(offset)
      return
    }

    moveSelection(currentValue, offset)
  }

  function focusBoundary(kind: 'first' | 'last'): void {
    moveToBoundary(kind)
  }

  function onNavigationKeyDown(
    event: KeyboardEvent,
    currentValue: TValue | undefined,
    orientation: Orientation,
  ): void {
    const normalizedKey = event.key === 'Spacebar' ? ' ' : event.key

    // Detect text direction for RTL-aware horizontal navigation
    const direction = options.getDirection?.() ?? getComputedDirection(event.target as Element)
    const isRtl = direction === 'rtl'

    // Determine next/previous keys based on orientation and direction
    let nextKey: string
    let previousKey: string

    if (orientation === 'vertical') {
      nextKey = 'ArrowDown'
      previousKey = 'ArrowUp'
    } else {
      // Horizontal: flip arrow keys for RTL
      nextKey = isRtl ? 'ArrowLeft' : 'ArrowRight'
      previousKey = isRtl ? 'ArrowRight' : 'ArrowLeft'
    }

    if (normalizedKey === nextKey) {
      event.preventDefault()
      focusByOffset(currentValue, 1)
      return
    }

    if (normalizedKey === previousKey) {
      event.preventDefault()
      focusByOffset(currentValue, -1)
      return
    }

    if (normalizedKey === 'Home') {
      event.preventDefault()
      focusBoundary('first')
      return
    }

    if (normalizedKey === 'End') {
      event.preventDefault()
      focusBoundary('last')
      return
    }

    if ((normalizedKey === 'Enter' || normalizedKey === ' ') && currentValue !== undefined) {
      event.preventDefault()
      options.onSelect(currentValue)
    }
  }

  return {
    focusBoundary,
    focusByOffset,
    moveSelection,
    onNavigationKeyDown,
  }
}

/**
 * Detects the computed text direction of an element.
 * Falls back to 'ltr' if detection fails.
 */
function getComputedDirection(element: Element | null): 'ltr' | 'rtl' {
  if (!element) {
    return 'ltr'
  }

  const computed = window.getComputedStyle(element)
  const direction = computed.direction

  return direction === 'rtl' ? 'rtl' : 'ltr'
}
