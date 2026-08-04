import { createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { useSelectableCollectionNavigation } from './use-selectable-collection-navigation.ts'

interface TestItem {
  value: string
  disabled?: boolean
}

describe('useSelectableCollectionNavigation', () => {
  function createMockKeyboardEvent(key: string, target?: Element): KeyboardEvent {
    return {
      key,
      target: target ?? document.createElement('div'),
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent
  }

  describe('orientation-aware navigation', () => {
    test('uses ArrowDown/ArrowUp for vertical orientation', () => {
      const [items] = createSignal<TestItem[]>([{ value: 'a' }, { value: 'b' }, { value: 'c' }])
      const onSelect = vi.fn()
      const { onNavigationKeyDown } = useSelectableCollectionNavigation({
        items,
        getValue: (item) => item.value,
        onSelect,
      })

      const downEvent = createMockKeyboardEvent('ArrowDown')
      onNavigationKeyDown(downEvent, 'a', 'vertical')

      expect(downEvent.preventDefault).toHaveBeenCalled()
      expect(onSelect).toHaveBeenCalledWith('b')

      const upEvent = createMockKeyboardEvent('ArrowUp')
      onNavigationKeyDown(upEvent, 'b', 'vertical')

      expect(upEvent.preventDefault).toHaveBeenCalled()
      expect(onSelect).toHaveBeenCalledWith('a')
    })

    test('ignores horizontal arrow keys in vertical orientation', () => {
      const [items] = createSignal<TestItem[]>([{ value: 'a' }, { value: 'b' }])
      const onSelect = vi.fn()
      const { onNavigationKeyDown } = useSelectableCollectionNavigation({
        items,
        getValue: (item) => item.value,
        onSelect,
      })

      const rightEvent = createMockKeyboardEvent('ArrowRight')
      onNavigationKeyDown(rightEvent, 'a', 'vertical')

      expect(rightEvent.preventDefault).not.toHaveBeenCalled()
      expect(onSelect).not.toHaveBeenCalled()
    })

    test('uses ArrowRight/ArrowLeft for horizontal LTR orientation', () => {
      const [items] = createSignal<TestItem[]>([{ value: 'a' }, { value: 'b' }, { value: 'c' }])
      const onSelect = vi.fn()
      const { onNavigationKeyDown } = useSelectableCollectionNavigation({
        items,
        getValue: (item) => item.value,
        onSelect,
        getDirection: () => 'ltr',
      })

      const rightEvent = createMockKeyboardEvent('ArrowRight')
      onNavigationKeyDown(rightEvent, 'a', 'horizontal')

      expect(rightEvent.preventDefault).toHaveBeenCalled()
      expect(onSelect).toHaveBeenCalledWith('b')

      const leftEvent = createMockKeyboardEvent('ArrowLeft')
      onNavigationKeyDown(leftEvent, 'b', 'horizontal')

      expect(leftEvent.preventDefault).toHaveBeenCalled()
      expect(onSelect).toHaveBeenCalledWith('a')
    })
  })

  describe('RTL-aware horizontal navigation', () => {
    test('flips arrow keys for RTL horizontal orientation', () => {
      const [items] = createSignal<TestItem[]>([{ value: 'a' }, { value: 'b' }, { value: 'c' }])
      const onSelect = vi.fn()
      const { onNavigationKeyDown } = useSelectableCollectionNavigation({
        items,
        getValue: (item) => item.value,
        onSelect,
        getDirection: () => 'rtl',
      })

      // In RTL, ArrowLeft moves forward (next)
      const leftEvent = createMockKeyboardEvent('ArrowLeft')
      onNavigationKeyDown(leftEvent, 'a', 'horizontal')

      expect(leftEvent.preventDefault).toHaveBeenCalled()
      expect(onSelect).toHaveBeenCalledWith('b')

      // In RTL, ArrowRight moves backward (previous)
      const rightEvent = createMockKeyboardEvent('ArrowRight')
      onNavigationKeyDown(rightEvent, 'b', 'horizontal')

      expect(rightEvent.preventDefault).toHaveBeenCalled()
      expect(onSelect).toHaveBeenCalledWith('a')
    })

    test('detects direction from element computed style when getDirection not provided', () => {
      const [items] = createSignal<TestItem[]>([{ value: 'a' }, { value: 'b' }])
      const onSelect = vi.fn()
      const { onNavigationKeyDown } = useSelectableCollectionNavigation({
        items,
        getValue: (item) => item.value,
        onSelect,
      })

      const rtlElement = document.createElement('div')
      rtlElement.dir = 'rtl'
      document.body.appendChild(rtlElement)

      const leftEvent = createMockKeyboardEvent('ArrowLeft', rtlElement)
      onNavigationKeyDown(leftEvent, 'a', 'horizontal')

      expect(onSelect).toHaveBeenCalledWith('b')

      document.body.removeChild(rtlElement)
    })

    test('RTL does not affect vertical orientation', () => {
      const [items] = createSignal<TestItem[]>([{ value: 'a' }, { value: 'b' }])
      const onSelect = vi.fn()
      const { onNavigationKeyDown } = useSelectableCollectionNavigation({
        items,
        getValue: (item) => item.value,
        onSelect,
        getDirection: () => 'rtl',
      })

      const downEvent = createMockKeyboardEvent('ArrowDown')
      onNavigationKeyDown(downEvent, 'a', 'vertical')

      expect(onSelect).toHaveBeenCalledWith('b')
    })
  })

  describe('Home and End keys', () => {
    test('Home jumps to first enabled item', () => {
      const [items] = createSignal<TestItem[]>([{ value: 'a' }, { value: 'b' }, { value: 'c' }])
      const onSelect = vi.fn()
      const { onNavigationKeyDown } = useSelectableCollectionNavigation({
        items,
        getValue: (item) => item.value,
        onSelect,
      })

      const homeEvent = createMockKeyboardEvent('Home')
      onNavigationKeyDown(homeEvent, 'c', 'horizontal')

      expect(homeEvent.preventDefault).toHaveBeenCalled()
      expect(onSelect).toHaveBeenCalledWith('a')
    })

    test('End jumps to last enabled item', () => {
      const [items] = createSignal<TestItem[]>([{ value: 'a' }, { value: 'b' }, { value: 'c' }])
      const onSelect = vi.fn()
      const { onNavigationKeyDown } = useSelectableCollectionNavigation({
        items,
        getValue: (item) => item.value,
        onSelect,
      })

      const endEvent = createMockKeyboardEvent('End')
      onNavigationKeyDown(endEvent, 'a', 'horizontal')

      expect(endEvent.preventDefault).toHaveBeenCalled()
      expect(onSelect).toHaveBeenCalledWith('c')
    })

    test('Home/End skip disabled items', () => {
      const [items] = createSignal<TestItem[]>([
        { value: 'a', disabled: true },
        { value: 'b' },
        { value: 'c', disabled: true },
        { value: 'd' },
      ])
      const onSelect = vi.fn()
      const { onNavigationKeyDown } = useSelectableCollectionNavigation({
        items,
        getValue: (item) => item.value,
        isDisabled: (item) => item.disabled ?? false,
        onSelect,
      })

      const homeEvent = createMockKeyboardEvent('Home')
      onNavigationKeyDown(homeEvent, 'd', 'horizontal')
      expect(onSelect).toHaveBeenCalledWith('b')

      onSelect.mockClear()

      const endEvent = createMockKeyboardEvent('End')
      onNavigationKeyDown(endEvent, 'b', 'horizontal')
      expect(onSelect).toHaveBeenCalledWith('d')
    })
  })

  describe('activation modes', () => {
    test('automatic mode calls onSelect immediately', () => {
      const [items] = createSignal<TestItem[]>([{ value: 'a' }, { value: 'b' }])
      const onSelect = vi.fn()
      const focusValue = vi.fn()
      const [activationMode] = createSignal<'automatic' | 'manual'>('automatic')

      const { onNavigationKeyDown } = useSelectableCollectionNavigation({
        items,
        getValue: (item) => item.value,
        onSelect,
        focusValue,
        activationMode,
      })

      const rightEvent = createMockKeyboardEvent('ArrowRight')
      onNavigationKeyDown(rightEvent, 'a', 'horizontal')

      expect(onSelect).toHaveBeenCalledWith('b')
      expect(focusValue).toHaveBeenCalledWith('b')
    })

    test('manual mode only focuses without selecting', () => {
      const [items] = createSignal<TestItem[]>([{ value: 'a' }, { value: 'b' }])
      const onSelect = vi.fn()
      const focusValue = vi.fn()
      const [activationMode] = createSignal<'automatic' | 'manual'>('manual')

      const { onNavigationKeyDown } = useSelectableCollectionNavigation({
        items,
        getValue: (item) => item.value,
        onSelect,
        focusValue,
        activationMode,
      })

      const rightEvent = createMockKeyboardEvent('ArrowRight')
      onNavigationKeyDown(rightEvent, 'a', 'horizontal')

      expect(onSelect).not.toHaveBeenCalled()
      expect(focusValue).toHaveBeenCalledWith('b')
    })

    test('manual mode activates on Enter', () => {
      const [items] = createSignal<TestItem[]>([{ value: 'a' }, { value: 'b' }])
      const onSelect = vi.fn()
      const [activationMode] = createSignal<'automatic' | 'manual'>('manual')

      const { onNavigationKeyDown } = useSelectableCollectionNavigation({
        items,
        getValue: (item) => item.value,
        onSelect,
        activationMode,
      })

      const enterEvent = createMockKeyboardEvent('Enter')
      onNavigationKeyDown(enterEvent, 'b', 'horizontal')

      expect(enterEvent.preventDefault).toHaveBeenCalled()
      expect(onSelect).toHaveBeenCalledWith('b')
    })

    test('manual mode activates on Space', () => {
      const [items] = createSignal<TestItem[]>([{ value: 'a' }, { value: 'b' }])
      const onSelect = vi.fn()
      const [activationMode] = createSignal<'automatic' | 'manual'>('manual')

      const { onNavigationKeyDown } = useSelectableCollectionNavigation({
        items,
        getValue: (item) => item.value,
        onSelect,
        activationMode,
      })

      const spaceEvent = createMockKeyboardEvent(' ')
      onNavigationKeyDown(spaceEvent, 'b', 'horizontal')

      expect(spaceEvent.preventDefault).toHaveBeenCalled()
      expect(onSelect).toHaveBeenCalledWith('b')
    })

    test('manual mode can focus from an undefined current value', () => {
      const [items] = createSignal<TestItem[]>([{ value: 'a' }, { value: 'b' }])
      const onSelect = vi.fn()
      const focusValue = vi.fn()
      const [activationMode] = createSignal<'automatic' | 'manual'>('manual')

      const { onNavigationKeyDown } = useSelectableCollectionNavigation({
        items,
        getValue: (item) => item.value,
        onSelect,
        focusValue,
        activationMode,
      })

      const downEvent = createMockKeyboardEvent('ArrowDown')
      onNavigationKeyDown(downEvent, undefined, 'vertical')

      expect(downEvent.preventDefault).toHaveBeenCalled()
      expect(onSelect).not.toHaveBeenCalled()
      expect(focusValue).toHaveBeenCalledWith('a')
    })
  })

  test('ignores printable keys', () => {
    const [items] = createSignal<TestItem[]>([{ value: 'apple' }, { value: 'banana' }])
    const onSelect = vi.fn()
    const { onNavigationKeyDown } = useSelectableCollectionNavigation({
      items,
      getValue: (item) => item.value,
      onSelect,
    })

    const event = createMockKeyboardEvent('b')
    onNavigationKeyDown(event, 'apple', 'horizontal')

    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(onSelect).not.toHaveBeenCalled()
  })

  describe('looping behavior', () => {
    test('wraps from last to first when loop is true', () => {
      const [items] = createSignal<TestItem[]>([{ value: 'a' }, { value: 'b' }, { value: 'c' }])
      const onSelect = vi.fn()
      const [loop] = createSignal(true)

      const { onNavigationKeyDown } = useSelectableCollectionNavigation({
        items,
        getValue: (item) => item.value,
        onSelect,
        loop,
      })

      const rightEvent = createMockKeyboardEvent('ArrowRight')
      onNavigationKeyDown(rightEvent, 'c', 'horizontal')

      expect(onSelect).toHaveBeenCalledWith('a')
    })

    test('wraps from first to last when loop is true', () => {
      const [items] = createSignal<TestItem[]>([{ value: 'a' }, { value: 'b' }, { value: 'c' }])
      const onSelect = vi.fn()
      const [loop] = createSignal(true)

      const { onNavigationKeyDown } = useSelectableCollectionNavigation({
        items,
        getValue: (item) => item.value,
        onSelect,
        loop,
      })

      const leftEvent = createMockKeyboardEvent('ArrowLeft')
      onNavigationKeyDown(leftEvent, 'a', 'horizontal')

      expect(onSelect).toHaveBeenCalledWith('c')
    })

    test('stops at boundaries when loop is false', () => {
      const [items] = createSignal<TestItem[]>([{ value: 'a' }, { value: 'b' }, { value: 'c' }])
      const onSelect = vi.fn()
      const [loop] = createSignal(false)

      const { onNavigationKeyDown } = useSelectableCollectionNavigation({
        items,
        getValue: (item) => item.value,
        onSelect,
        loop,
      })

      const rightEvent = createMockKeyboardEvent('ArrowRight')
      onNavigationKeyDown(rightEvent, 'c', 'horizontal')

      expect(onSelect).not.toHaveBeenCalled()
    })
  })

  describe('disabled items', () => {
    test('skips disabled items during navigation', () => {
      const [items] = createSignal<TestItem[]>([
        { value: 'a' },
        { value: 'b', disabled: true },
        { value: 'c' },
      ])
      const onSelect = vi.fn()

      const { onNavigationKeyDown } = useSelectableCollectionNavigation({
        items,
        getValue: (item) => item.value,
        isDisabled: (item) => item.disabled ?? false,
        onSelect,
      })

      const rightEvent = createMockKeyboardEvent('ArrowRight')
      onNavigationKeyDown(rightEvent, 'a', 'horizontal')

      expect(onSelect).toHaveBeenCalledWith('c')
    })
  })

  describe('edge cases', () => {
    test('handles Spacebar legacy key name', () => {
      const [items] = createSignal<TestItem[]>([{ value: 'a' }, { value: 'b' }])
      const onSelect = vi.fn()

      const { onNavigationKeyDown } = useSelectableCollectionNavigation({
        items,
        getValue: (item) => item.value,
        onSelect,
      })

      const spacebarEvent = createMockKeyboardEvent('Spacebar')
      onNavigationKeyDown(spacebarEvent, 'a', 'horizontal')

      expect(spacebarEvent.preventDefault).toHaveBeenCalled()
      expect(onSelect).toHaveBeenCalledWith('a')
    })

    test('handles empty items array gracefully', () => {
      const [items] = createSignal<TestItem[]>([])
      const onSelect = vi.fn()

      const { onNavigationKeyDown } = useSelectableCollectionNavigation({
        items,
        getValue: (item) => item.value,
        onSelect,
      })

      const rightEvent = createMockKeyboardEvent('ArrowRight')
      onNavigationKeyDown(rightEvent, 'a', 'horizontal')

      expect(onSelect).not.toHaveBeenCalled()
    })

    test('handles all items disabled', () => {
      const [items] = createSignal<TestItem[]>([
        { value: 'a', disabled: true },
        { value: 'b', disabled: true },
      ])
      const onSelect = vi.fn()

      const { onNavigationKeyDown } = useSelectableCollectionNavigation({
        items,
        getValue: (item) => item.value,
        isDisabled: (item) => item.disabled ?? false,
        onSelect,
      })

      const homeEvent = createMockKeyboardEvent('Home')
      onNavigationKeyDown(homeEvent, 'a', 'horizontal')

      expect(onSelect).not.toHaveBeenCalled()
    })
  })
})
