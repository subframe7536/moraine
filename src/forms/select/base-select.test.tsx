import { fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal, untrack } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'

import { MoraineProvider } from '../../shared/provider'
import { defaultTheme } from '../../theme/default-theme'

import { BaseSelect } from './base-select'

function renderWithProvider(ui: () => any) {
  return render(() => <MoraineProvider theme={defaultTheme}>{ui()}</MoraineProvider>)
}

describe('BaseSelect namespace component', () => {
  it('renders composite structure with unstyled trigger and styled options menu', () => {
    const options = [
      { label: 'Option 1', value: 'opt1' },
      { label: 'Option 2', value: 'opt2' },
    ]

    renderWithProvider(() => (
      <BaseSelect defaultOpen options={options}>
        <BaseSelect.Control data-testid="control">
          <BaseSelect.Input data-testid="input" placeholder="Select item" />
          <BaseSelect.Clear data-testid="clear" />
        </BaseSelect.Control>
        <BaseSelect.Content data-testid="content">
          <BaseSelect.Listbox data-testid="listbox" />
        </BaseSelect.Content>
      </BaseSelect>
    ))

    const control = screen.getByTestId('control')
    const input = screen.getByTestId('input')
    const listbox = screen.getByTestId('listbox')

    // Trigger should be unstyled (no border, background, or ring classes)
    expect(control.className).not.toContain('border')
    expect(control.className).not.toContain('ring')
    expect(input.className).not.toContain('border')

    // Content & Listbox should have options menu styling
    const content = document.querySelector('[data-slot="content"]')
    expect(content?.className).toContain('bg-popover')
    expect(listbox.className).toContain('overflow-y-auto')
  })

  it('toggles open state when clicking control', async () => {
    const options = [
      { label: 'Option A', value: 'a' },
      { label: 'Option B', value: 'b' },
    ]

    renderWithProvider(() => (
      <BaseSelect options={options}>
        <BaseSelect.Control data-testid="control">
          <BaseSelect.Input placeholder="Select..." />
        </BaseSelect.Control>
        <BaseSelect.Content>
          <BaseSelect.Listbox />
        </BaseSelect.Content>
      </BaseSelect>
    ))

    const control = screen.getByTestId('control')
    expect(document.querySelector('[data-slot="content"]')).toBeNull()

    // Click to open
    fireEvent.click(control)
    expect(document.querySelector('[data-slot="content"]')).not.toBeNull()
  })

  it('selects option via mouse click and supports BaseSelect.Clear', async () => {
    const onOptionSelect = vi.fn()
    const options = [
      { label: 'Apple', value: 'apple' },
      { label: 'Banana', value: 'banana' },
    ]

    renderWithProvider(() => (
      <BaseSelect defaultOpen options={options} onOptionSelect={onOptionSelect}>
        <BaseSelect.Control>
          <BaseSelect.Input data-testid="input" />
          <BaseSelect.Clear data-testid="clear" />
        </BaseSelect.Control>
        <BaseSelect.Content>
          <BaseSelect.Listbox />
        </BaseSelect.Content>
      </BaseSelect>
    ))

    const optionApple = screen.getByText('Apple')
    fireEvent.click(optionApple)

    expect(onOptionSelect).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'apple' }),
      expect.anything(),
    )

    // Test clear
    const clearBtn = screen.getByTestId('clear')
    fireEvent.click(clearBtn)
    expect(onOptionSelect).toHaveBeenCalledWith(null, expect.anything())
  })

  it('supports declarative BaseSelect.Item children inside Listbox', async () => {
    const [selected, setSelected] = createSignal<string | number>('')

    renderWithProvider(() => (
      <BaseSelect
        defaultOpen
        selectedValues={selected() ? [selected()] : []}
        onOptionSelect={(opt) => setSelected(opt?.value ?? '')}
      >
        <BaseSelect.Control>
          <BaseSelect.Input data-testid="input" />
        </BaseSelect.Control>
        <BaseSelect.Content>
          <BaseSelect.Listbox>
            <BaseSelect.Item value="one" data-testid="item-one">
              First item
            </BaseSelect.Item>
            <BaseSelect.Item value="two" data-testid="item-two">
              Second item
            </BaseSelect.Item>
          </BaseSelect.Listbox>
        </BaseSelect.Content>
      </BaseSelect>
    ))

    const itemOne = screen.getByTestId('item-one')
    const itemTwo = screen.getByTestId('item-two')

    expect(itemOne.getAttribute('role')).toBe('option')
    expect(itemOne.getAttribute('data-slot')).toBe('item')

    // Click item one
    fireEvent.click(itemOne)
    expect(untrack(selected)).toBe('one')
    expect(itemOne.getAttribute('data-selected')).toBe('')
    expect(itemTwo.getAttribute('data-selected')).toBeNull()
    expect(screen.getByTestId('input').textContent).toBe('First item')
  })

  it('navigates with keyboard ArrowDown and Enter', async () => {
    const onOptionSelect = vi.fn()
    const options = [
      { label: 'Red', value: 'red' },
      { label: 'Blue', value: 'blue' },
    ]

    renderWithProvider(() => (
      <BaseSelect defaultOpen options={options} onOptionSelect={onOptionSelect}>
        <BaseSelect.Control data-testid="control">
          <BaseSelect.Input />
        </BaseSelect.Control>
        <BaseSelect.Content>
          <BaseSelect.Listbox />
        </BaseSelect.Content>
      </BaseSelect>
    ))

    const control = screen.getByTestId('control')

    // Press ArrowDown to highlight second option
    fireEvent.keyDown(control, { key: 'ArrowDown' })

    // Press Enter to select
    fireEvent.keyDown(control, { key: 'Enter' })
    expect(onOptionSelect).toHaveBeenCalled()
  })

  it('navigates declarative items with the keyboard', () => {
    const onOptionSelect = vi.fn()

    renderWithProvider(() => (
      <BaseSelect defaultOpen onOptionSelect={onOptionSelect}>
        <BaseSelect.Control data-testid="control">
          <BaseSelect.Input />
        </BaseSelect.Control>
        <BaseSelect.Content>
          <BaseSelect.Listbox>
            <BaseSelect.Item value="red">Red</BaseSelect.Item>
            <BaseSelect.Item value="blue">Blue</BaseSelect.Item>
          </BaseSelect.Listbox>
        </BaseSelect.Content>
      </BaseSelect>
    ))

    const control = screen.getByTestId('control')
    fireEvent.keyDown(control, { key: 'ArrowDown' })
    fireEvent.keyDown(control, { key: 'Enter' })

    expect(onOptionSelect).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'blue' }),
      expect.anything(),
    )
  })

  it('handles onFormReset properly without _ prefix', async () => {
    const onFormReset = vi.fn()

    renderWithProvider(() => (
      <form data-testid="form">
        <BaseSelect
          name="color"
          options={[{ label: 'Green', value: 'green' }]}
          onFormReset={onFormReset}
          isValueControlled={false}
        >
          <BaseSelect.Control>
            <BaseSelect.Input />
          </BaseSelect.Control>
        </BaseSelect>
      </form>
    ))

    const form = screen.getByTestId('form') as HTMLFormElement
    form.reset()
    await Promise.resolve()

    expect(onFormReset).toHaveBeenCalled()
  })

  it('toggles open state when clicking BaseSelect.Trigger', async () => {
    const options = [
      { label: 'Alpha', value: 'a' },
      { label: 'Beta', value: 'b' },
    ]

    renderWithProvider(() => (
      <BaseSelect options={options}>
        <BaseSelect.Control>
          <BaseSelect.Input />
          <BaseSelect.Trigger data-testid="trigger" />
        </BaseSelect.Control>
        <BaseSelect.Content>
          <BaseSelect.Listbox />
        </BaseSelect.Content>
      </BaseSelect>
    ))

    const trigger = screen.getByTestId('trigger')
    expect(trigger.getAttribute('data-slot')).toBe('trigger')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.querySelector('[data-slot="content"]')).toBeNull()

    // Click trigger to open
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(document.querySelector('[data-slot="content"]')).not.toBeNull()

    // Click trigger to close
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('makes a standalone BaseSelect.Trigger keyboard-accessible', () => {
    renderWithProvider(() => (
      <BaseSelect options={[{ label: 'Alpha', value: 'a' }]}>
        <BaseSelect.Trigger data-testid="trigger" />
        <BaseSelect.Content>
          <BaseSelect.Listbox />
        </BaseSelect.Content>
      </BaseSelect>
    ))

    const trigger = screen.getByTestId<HTMLButtonElement>('trigger')
    expect(trigger.tabIndex).toBe(0)

    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })

  it('clears BaseSelect multiple values without a wrapper callback', () => {
    renderWithProvider(() => (
      <form data-testid="form">
        <BaseSelect multiple name="fruit" selectedValues={['apple']}>
          <BaseSelect.Control>
            <BaseSelect.Input />
            <BaseSelect.Clear data-testid="clear" />
          </BaseSelect.Control>
        </BaseSelect>
      </form>
    ))

    const form = screen.getByTestId<HTMLFormElement>('form')
    expect(new FormData(form).getAll('fruit')).toEqual(['apple'])

    fireEvent.click(screen.getByTestId('clear'))
    expect(new FormData(form).getAll('fruit')).toEqual([])
  })

  it('supports canonical namespace structure with function trigger and grouped items', async () => {
    const onOptionSelect = vi.fn()

    renderWithProvider(() => (
      <BaseSelect defaultOpen onOptionSelect={onOptionSelect}>
        <BaseSelect.Trigger data-testid="trigger">
          {(props) => (
            <span data-testid="trigger-status">{props.isOpen() ? 'Open' : 'Closed'}</span>
          )}
        </BaseSelect.Trigger>

        <BaseSelect.Content data-testid="content">
          <BaseSelect.Group data-testid="group">
            <BaseSelect.GroupLabel data-testid="group-label">Category A</BaseSelect.GroupLabel>
            <BaseSelect.Item value="a1" data-testid="item-a1">
              Option A1
            </BaseSelect.Item>
          </BaseSelect.Group>
          <BaseSelect.Separator data-testid="separator" />
          <BaseSelect.Item value="b1" data-testid="item-b1">
            Option B1
          </BaseSelect.Item>
        </BaseSelect.Content>
      </BaseSelect>
    ))

    const trigger = screen.getByTestId('trigger')
    expect(trigger).not.toBeNull()
    expect(screen.getByTestId('trigger-status').textContent).toBe('Open')

    const group = screen.getByTestId('group')
    expect(group.getAttribute('data-slot')).toBe('group')

    const groupLabel = screen.getByTestId('group-label')
    expect(groupLabel.getAttribute('data-slot')).toBe('label')
    expect(groupLabel.textContent).toBe('Category A')

    const separator = screen.getByTestId('separator')
    expect(separator.getAttribute('role')).toBe('separator')
    expect(separator.getAttribute('data-slot')).toBe('separator')

    const itemA1 = screen.getByTestId('item-a1')
    expect(itemA1.getAttribute('role')).toBe('option')

    const itemB1 = screen.getByTestId('item-b1')
    expect(itemB1.getAttribute('role')).toBe('option')

    // Click item to select
    fireEvent.click(itemA1)
    expect(onOptionSelect).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'a1' }),
      expect.anything(),
    )
  })

  it('supports BaseSelect.Label as alias for BaseSelect.GroupLabel', () => {
    expect(BaseSelect.Label).toBe(BaseSelect.GroupLabel)
  })
})
