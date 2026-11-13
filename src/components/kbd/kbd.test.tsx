import { render, screen } from '@solidjs/testing-library'
import { createSignal, onCleanup } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { MoraineProvider } from '../../provider'
import { defineTheme } from '../../theme'
import { KbdGroup } from '../kbd-group/kbd-group'
import type { KbdGroupT } from '../kbd-group/kbd-group.types'

import { Kbd } from './kbd'

describe('Kbd', () => {
  test('renders a keycap in the root slot', () => {
    const view = render(() => <Kbd value="K" />)
    const root = view.container.querySelector('[data-slot="kbd"]')

    expect(root?.tagName).toBe('KBD')
    expect(root?.textContent).toBe('K')
  })

  test.each([
    ['meta', '⌘', 'Meta'],
    ['COMMAND', '⌘', 'Command'],
    ['ctrl', 'Ctrl', 'Control'],
    ['control', '⌃', 'Control'],
    ['alt', 'Alt', 'Alt'],
    ['option', '⌥', 'Option'],
    ['shift', '⇧', 'Shift'],
    ['enter', '↵', 'Enter'],
    ['delete', '⌦', 'Delete'],
    ['backspace', '⌫', 'Backspace'],
    ['escape', 'Esc', 'Escape'],
    ['tab', '⇥', 'Tab'],
    ['capslock', '⇪', 'Caps Lock'],
    ['arrowup', '↑', 'Arrow Up'],
    ['arrowright', '→', 'Arrow Right'],
    ['arrowdown', '↓', 'Arrow Down'],
    ['arrowleft', '←', 'Arrow Left'],
    ['pageup', '⇞', 'Page Up'],
    ['pagedown', '⇟', 'Page Down'],
    ['home', '↖', 'Home'],
    ['end', '↘', 'End'],
    ['win', '⊞', 'Windows'],
  ])('resolves the %s alias', (value, text, label) => {
    render(() => <Kbd value={value} />)

    expect(screen.getByLabelText(label).textContent).toBe(text)
  })

  test('preserves unknown values without an invented accessible label', () => {
    const view = render(() => <Kbd value="F13" />)
    const root = view.container.querySelector('[data-slot="kbd"]')

    expect(root?.textContent).toBe('F13')
    expect(root?.hasAttribute('aria-label')).toBe(false)
  })

  test('lets a native aria-label win over the alias label', () => {
    render(() => <Kbd value="meta" aria-label="Super key" />)

    expect(screen.getByLabelText('Super key').textContent).toBe('⌘')
  })

  test('renders the raw key when symbol aliases are disabled', () => {
    const view = render(() => <Kbd value="meta" symbol={false} />)
    const root = view.container.querySelector('[data-slot="kbd"]')

    expect(root?.textContent).toBe('meta')
    expect(root?.getAttribute('aria-label')).toBeNull()
  })

  test('does not render an empty value', () => {
    const view = render(() => <Kbd value="" />)

    expect(view.container.querySelector('[data-slot="kbd"]')).toBeNull()
  })

  test('falls back to the default data-slot when slotName is empty', () => {
    const view = render(() => <Kbd value="K" slotName="" />)

    expect(view.container.querySelector('kbd')?.getAttribute('data-slot')).toBe('kbd')
  })

  test('supports a custom slot, class, and style overrides', () => {
    const view = render(() => (
      <Kbd value="K" slotName="shortcut" class="shortcut-class" style={{ width: '200px' }} />
    ))
    const root = view.container.querySelector('[data-slot="shortcut"]') as HTMLElement | null

    expect(root?.className).toContain('shortcut-class')
    expect(root?.style.width).toBe('200px')
  })

  test('applies root slot overrides without leaking style props to the DOM', () => {
    const view = render(() => (
      <Kbd
        value="K"
        classes={{ root: 'slot-class' }}
        styles={{ root: { height: '18px', color: 'blue' } }}
        class="native-class"
        style={{ width: '20px', color: 'red' }}
      />
    ))
    const root = view.container.querySelector<HTMLElement>('[data-slot="kbd"]')!

    expect(root.className).toContain('slot-class')
    expect(root.className).toContain('native-class')
    expect(root.style.height).toBe('18px')
    expect(root.style.width).toBe('20px')
    expect(root.style.color).toBe('red')
    expect(root.hasAttribute('classes')).toBe(false)
    expect(root.hasAttribute('styles')).toBe(false)
  })

  test('replaces Design root styling without remounting the keycap', () => {
    const [design, setDesign] = createSignal(
      defineTheme({ kbd: { base: { root: 'theme-kbd-a' } } }),
    )
    const view = render(() => (
      <MoraineProvider theme={design()}>
        <Kbd value="K" />
      </MoraineProvider>
    ))
    const root = view.container.querySelector<HTMLElement>('[data-slot="kbd"]')!

    expect(root.className).toContain('theme-kbd-a')

    setDesign(defineTheme({ kbd: { base: { root: 'theme-kbd-b' } } }))

    expect(view.container.querySelector('[data-slot="kbd"]')).toBe(root)
    expect(root.className).toContain('theme-kbd-b')
    expect(root.className).not.toContain('theme-kbd-a')
  })
})

describe('KbdGroup', () => {
  test('renders default inline separators without separator semantics', () => {
    const view = render(() => <KbdGroup items={['Ctrl', 'Shift', 'P']} />)
    const items = view.container.querySelectorAll('[data-slot="kbd-group-item"]')
    const root = view.container.querySelector('[data-slot="kbd-group"]')

    expect(root?.tagName).toBe('KBD')
    expect([...items].map((item) => item.textContent)).toEqual(['Ctrl', '⇧', 'P'])
    expect(root?.textContent).toBe('Ctrl+⇧+P')
    expect(view.container.querySelector('[role="separator"]')).toBeNull()
    expect(view.container.querySelector('[aria-orientation]')).toBeNull()
    expect(view.container.querySelector('[data-slot="separator"]')).toBeNull()
  })

  test('renders item objects with translated alias labels', () => {
    render(() => <KbdGroup items={[{ value: 'meta', translations: { meta: 'Command' } }, 'K']} />)

    expect(screen.getByLabelText('Command').textContent).toBe('⌘')
  })

  test('names non-alias item keys through their aria-label', () => {
    render(() => <KbdGroup items={[{ value: 'fn', 'aria-label': 'Function key' }, 'K']} />)

    expect(screen.getByLabelText('Function key').textContent).toBe('fn')
  })

  test('renders nothing for empty items and no separator for a single item', () => {
    const empty = render(() => <KbdGroup items={[]} />)
    const single = render(() => <KbdGroup items={['K']} separatorRender="/" />)

    expect(empty.container.querySelector('[data-slot="kbd-group"]')).toBeNull()
    expect(single.container.querySelectorAll('[data-slot="kbd-group-item"]')).toHaveLength(1)
    expect(single.container.querySelector('[data-slot="kbd-group"]')?.textContent).toBe('K')
  })

  test('supports string shorthand and independent custom separators', () => {
    const stringSeparator = render(() => <KbdGroup items={['Ctrl', 'K']} separatorRender="/" />)
    const jsxSeparator = render(() => (
      <KbdGroup
        items={['Ctrl', 'Shift', 'P']}
        separatorRender={(props) => (
          <span data-testid="custom-separator" data-index={props.index}>
            ·
          </span>
        )}
      />
    ))

    expect(stringSeparator.container.querySelector('[data-slot="kbd-group"]')?.textContent).toBe(
      'Ctrl/K',
    )
    expect(jsxSeparator.getAllByTestId('custom-separator')).toHaveLength(2)
    expect(
      jsxSeparator.getAllByTestId('custom-separator').map((element) => element.dataset.index),
    ).toEqual(['0', '1'])
    expect(jsxSeparator.container.querySelector('[data-slot="kbd-group"]')?.textContent).toBe(
      'Ctrl·⇧·P',
    )
  })

  test('keeps separator nodes across reorders and cleans up removed separators', () => {
    const [items, setItems] = createSignal(['Ctrl', 'Shift', 'P'])
    const [text, setText] = createSignal('+')
    let cleanups = 0
    const SeparatorRender = (props: KbdGroupT.SeparatorRenderProps) => {
      onCleanup(() => {
        cleanups += 1
      })
      return <span data-index={props.index}>{text()}</span>
    }
    const [separator, setSeparator] =
      createSignal<KbdGroupT.Base['separatorRender']>(SeparatorRender)
    const view = render(() => <KbdGroup items={items()} separatorRender={separator()} />)
    const separators = [...view.container.querySelectorAll('span')]
    expect(separators).toHaveLength(2)
    expect(separators[0]).not.toBe(separators[1])
    setText('/')
    expect([...view.container.querySelectorAll('span')]).toEqual(separators)
    expect(separators.map((node) => node.textContent)).toEqual(['/', '/'])
    setItems(['Shift', 'Ctrl', 'P'])
    expect([...view.container.querySelectorAll('span')]).toEqual([separators[1], separators[0]])
    expect(separators.map((node) => node.dataset.index)).toEqual(['1', '0'])
    expect(cleanups).toBe(0)
    setItems(['Shift', 'Ctrl'])
    expect(view.container.querySelectorAll('span')).toHaveLength(1)
    expect(cleanups).toBe(1)
    setSeparator('/')
    expect(view.container.querySelector('[data-slot="kbd-group"]')?.textContent).toBe('⇧/Ctrl')
    expect(view.container.querySelectorAll('span')).toHaveLength(0)
    expect(cleanups).toBe(2)
    setSeparator(() => SeparatorRender)
    expect(view.container.querySelectorAll('span')).toHaveLength(1)
    setSeparator(0)
    expect(view.container.querySelector('[data-slot="kbd-group"]')?.textContent).toBe('⇧0Ctrl')
    expect(cleanups).toBe(3)
    setSeparator(undefined)
    expect(view.container.querySelector('[data-slot="kbd-group"]')?.textContent).toBe('⇧+Ctrl')
    view.unmount()
    expect(cleanups).toBe(3)
  })

  test('applies root and item slot customizations', () => {
    const view = render(() => (
      <KbdGroup
        items={['Ctrl', 'K']}
        class="root-class"
        style={{ width: '200px' }}
        classes={{ item: 'item-class' }}
        styles={{ item: { height: '20px' } }}
      />
    ))
    const root = view.container.querySelector('[data-slot="kbd-group"]') as HTMLElement | null
    const item = view.container.querySelector('[data-slot="kbd-group-item"]') as HTMLElement | null

    expect(root?.className).toContain('root-class')
    expect(root?.style.width).toBe('200px')
    expect(item?.className).toContain('item-class')
    expect(item?.style.height).toBe('20px')
  })

  test('reacts to item changes', () => {
    const [items, setItems] = createSignal(['Ctrl', 'K'])
    const view = render(() => <KbdGroup items={items()} />)

    expect(view.container.querySelector('[data-slot="kbd-group"]')?.textContent).toBe('Ctrl+K')
    setItems(['Shift', 'P'])
    expect(view.container.querySelector('[data-slot="kbd-group"]')?.textContent).toBe('⇧+P')
  })

  test('renders duplicate key items without key collision', () => {
    const view = render(() => <KbdGroup items={['Shift', 'Shift']} />)
    const items = view.container.querySelectorAll('[data-slot="kbd-group-item"]')

    expect(items.length).toBe(2)
    expect(view.container.querySelector('[data-slot="kbd-group"]')?.textContent).toBe('⇧+⇧')
  })
})
