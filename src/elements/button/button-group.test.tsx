import { render } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { DropdownMenu } from '../../overlays/dropdown-menu'
import { Popover } from '../../overlays/popover'
import { MoraineProvider } from '../../provider'
import { defineTheme } from '../../theme'

import { Button } from './button'
import { ButtonGroup } from './button-group'

describe('ButtonGroup', () => {
  test('renders component defaults when provider is absent', () => {
    const screen = render(() => (
      <ButtonGroup aria-label="History controls">
        <Button>Back</Button>
        <Button>Forward</Button>
      </ButtonGroup>
    ))

    const group = screen.getByRole('group', { name: 'History controls' })
    expect(group.className).not.toBe('')
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]?.className).not.toBe('')
    expect(buttons[1]?.className).not.toBe('')
  })

  test('renders related buttons with group semantics and joined horizontal edges', () => {
    const screen = render(() => (
      <MoraineProvider>
        <ButtonGroup aria-label="History controls">
          <Button>Back</Button>
          <Button>Forward</Button>
        </ButtonGroup>
      </MoraineProvider>
    ))

    const group = screen.getByRole('group', { name: 'History controls' })
    expect(group.getAttribute('data-slot')).toBe('root')
    expect(group.hasAttribute('data-orientation')).toBe(false)
    expect(group.className).toContain('size-fit')
    expect(group.className).toContain('-me-px')
    expect(group.className).toContain('border-e-0')
    expect(group.className).toContain('[&>*:not(:first-child)]:rounded-s-none')
    expect(group.className).toContain('[&>*:not(:last-child)]:rounded-e-none')
    expect(group.querySelectorAll('[data-slot="button-group-separator"]')).toHaveLength(0)
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  test('attaches the Separator namespace part', () => {
    expect(ButtonGroup.Separator).toBeTypeOf('function')

    const screen = render(() => <ButtonGroup.Separator />)
    const separator = screen.getByRole('separator')

    expect(separator.getAttribute('data-slot')).toBe('button-group-separator')
  })

  test('renders an explicit separator with generic separator semantics', () => {
    const screen = render(() => (
      <MoraineProvider>
        <ButtonGroup aria-label="Clipboard actions">
          <Button>Copy</Button>
          <ButtonGroup.Separator />
          <Button>Paste</Button>
        </ButtonGroup>
      </MoraineProvider>
    ))

    const group = screen.getByRole('group', { name: 'Clipboard actions' })
    const separator = screen.getByRole('separator')

    expect(group.querySelectorAll('[data-slot="button-group-separator"]')).toHaveLength(1)
    expect(separator.parentElement).toBe(group)
    expect(separator.getAttribute('data-slot')).toBe('button-group-separator')
    expect(separator.getAttribute('role')).toBe('separator')
    expect(separator.getAttribute('aria-orientation')).toBe('vertical')
    expect(separator.getAttribute('data-orientation')).toBe('vertical')
    expect(separator.className).toContain('relative')
    expect(separator.className).toContain('self-stretch')
    expect(separator.className).toContain('my-px')
    expect(separator.className).toContain('h-auto')
  })

  test('allows ButtonGroup.Separator orientation to be overridden independently', () => {
    const screen = render(() => (
      <MoraineProvider>
        <ButtonGroup.Separator orientation="horizontal" />
      </MoraineProvider>
    ))
    const separator = screen.getByRole('separator')

    expect(separator.getAttribute('aria-orientation')).toBe('horizontal')
    expect(separator.getAttribute('data-orientation')).toBe('horizontal')
    expect(separator.className).toContain('mx-px')
    expect(separator.className).toContain('w-auto')
  })

  test('applies ButtonGroup separator theme and local slot overrides', () => {
    const theme = defineTheme({
      buttonGroup: { base: { separator: 'theme-separator' } },
    })
    const screen = render(() => (
      <MoraineProvider theme={theme}>
        <ButtonGroup classes={{ separator: 'group-separator' }}>
          <Button>Copy</Button>
          <ButtonGroup.Separator class="instance-separator" />
          <Button>Paste</Button>
        </ButtonGroup>
      </MoraineProvider>
    ))
    const separator = screen.getByRole('separator')

    expect(separator.className).toContain('theme-separator')
    expect(separator.className).toContain('group-separator')
    expect(separator.className).toContain('instance-separator')
  })

  test('reuses resolved getter-backed children without a separator', () => {
    let reads = 0
    const screen = render(() =>
      createComponent(ButtonGroup, {
        get children() {
          reads += 1
          return [<Button>Back</Button>, <Button>Forward</Button>]
        },
      }),
    )

    expect(reads).toBe(1)
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  test('joins overlay trigger roots as direct children', () => {
    const screen = render(() => (
      <MoraineProvider>
        <ButtonGroup>
          <Button>Export</Button>
          <DropdownMenu>
            <DropdownMenu.Trigger as="button" type="button">
              Open export options
            </DropdownMenu.Trigger>
            <DropdownMenu.Content items={[{ label: 'Open options' }]} />
          </DropdownMenu>
        </ButtonGroup>
      </MoraineProvider>
    ))

    const group = screen.getByRole('group')
    expect(group.className).toContain('-me-px')
    expect(group.className).toContain('border-e-0')
    expect(group.className).toContain('[&>*:not(:first-child)]:rounded-s-none')
    expect(group.className).toContain('[&>*:not(:last-child)]:rounded-e-none')
    expect(group.querySelector('[data-slot="trigger"]')?.parentElement).toBe(group)
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  test('joins a polymorphic popover trigger root as a direct child', () => {
    const screen = render(() => (
      <ButtonGroup>
        <Button>Save</Button>
        <Popover>
          <Popover.Trigger as={Button} size="icon-md" aria-label="Open save options">
            Options
          </Popover.Trigger>
          <Popover.Content>
            <div>Save options</div>
          </Popover.Content>
        </Popover>
      </ButtonGroup>
    ))

    const group = screen.getByRole('group')
    const trigger = group.querySelector('[data-slot="trigger"]')
    expect(trigger?.parentElement).toBe(group)
    expect(trigger?.tagName).toBe('BUTTON')
    expect(trigger?.querySelector('button')).toBeNull()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  test.each([
    ['sm', 'h-7'],
    ['md', 'h-8'],
    ['lg', 'h-9'],
  ] as const)('provides the %s size to nested buttons', (size, expectedClass) => {
    const screen = render(() => (
      <MoraineProvider>
        <ButtonGroup size={size}>
          <Button>{size}</Button>
        </ButtonGroup>
      </MoraineProvider>
    ))

    const button = screen.getByRole('button', { name: size })
    expect(button.hasAttribute('data-size')).toBe(false)
    expect(button.className).toContain(expectedClass)
  })

  test.each([
    ['default', 'bg-primary'],
    ['secondary', 'bg-secondary'],
    ['outline', 'border-border'],
    ['ghost', 'hover:text-foreground'],
    ['link', 'hover:underline'],
    ['destructive', 'bg-destructive'],
  ] as const)('provides the %s variant to nested buttons', (variant, expectedClass) => {
    const screen = render(() => (
      <MoraineProvider>
        <ButtonGroup variant={variant}>
          <Button>{variant}</Button>
        </ButtonGroup>
      </MoraineProvider>
    ))

    const button = screen.getByRole('button', { name: variant })
    expect(button.hasAttribute('data-variant')).toBe(false)
    expect(button.className).toContain(expectedClass)
  })

  test('allows a nested button to override group size and variant defaults', () => {
    const screen = render(() => (
      <MoraineProvider>
        <ButtonGroup size="lg" variant="secondary">
          <Button size="sm" variant="destructive">
            Remove
          </Button>
        </ButtonGroup>
      </MoraineProvider>
    ))

    const button = screen.getByRole('button', { name: 'Remove' })
    expect(button.className).toContain('h-7')
    expect(button.className).toContain('bg-destructive')
  })

  test('supports a cohesive vertical orientation', () => {
    const screen = render(() => (
      <MoraineProvider>
        <ButtonGroup orientation="vertical">
          <Button>Up</Button>
          <Button>Down</Button>
        </ButtonGroup>
      </MoraineProvider>
    ))

    const group = screen.getByRole('group')
    expect(group.hasAttribute('data-orientation')).toBe(false)
    expect(group.className).toContain('flex-col')
    expect(group.className).toContain('-mb-px')
    expect(group.className).toContain('border-b-0')
    expect(group.className).toContain('[&>*:not(:first-child)]:rounded-t-none')
    expect(group.className).toContain('[&>*:not(:last-child)]:rounded-b-none')
  })

  test('keeps an explicit horizontal separator as the only vertical action boundary', () => {
    const screen = render(() => (
      <MoraineProvider>
        <ButtonGroup orientation="vertical" aria-label="Move actions">
          <Button>Move up</Button>
          <ButtonGroup.Separator orientation="horizontal" />
          <Button>Move down</Button>
        </ButtonGroup>
      </MoraineProvider>
    ))

    const group = screen.getByRole('group', { name: 'Move actions' })
    const separator = screen.getByRole('separator')

    expect(group.className).toContain('border-b-0')
    expect(separator.getAttribute('aria-orientation')).toBe('horizontal')
    expect(separator.className).toContain('mx-px')
    expect(separator.className).toContain('w-auto')
  })

  test('joins overlay trigger roots as direct children vertically', () => {
    const screen = render(() => (
      <MoraineProvider>
        <ButtonGroup orientation="vertical">
          <Button>Export</Button>
          <DropdownMenu>
            <DropdownMenu.Trigger as="button" type="button">
              Open export options
            </DropdownMenu.Trigger>
            <DropdownMenu.Content items={[{ label: 'Open options' }]} />
          </DropdownMenu>
        </ButtonGroup>
      </MoraineProvider>
    ))

    const group = screen.getByRole('group')
    expect(group.className).toContain('-mb-px')
    expect(group.className).toContain('border-b-0')
    expect(group.className).toContain('[&>*:not(:first-child)]:rounded-t-none')
    expect(group.className).toContain('[&>*:not(:last-child)]:rounded-b-none')
    expect(group.querySelector('[data-slot="trigger"]')?.parentElement).toBe(group)
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  test('keeps inherited button defaults reactive', () => {
    const [size, setSize] = createSignal<'sm' | 'lg'>('sm')
    const [variant, setVariant] = createSignal<'outline' | 'secondary'>('outline')
    const screen = render(() => (
      <MoraineProvider>
        <ButtonGroup size={size()} variant={variant()}>
          <Button>Action</Button>
        </ButtonGroup>
      </MoraineProvider>
    ))
    const button = screen.getByRole('button', { name: 'Action' })

    expect(button.className).toContain('h-7')
    expect(button.className).toContain('border-border')

    setSize('lg')
    setVariant('secondary')

    expect(button.className).toContain('h-9')
    expect(button.className).toContain('bg-secondary')
  })

  test('merges root classes and styles while forwarding div attributes', () => {
    const screen = render(() => (
      <ButtonGroup
        id="actions"
        class="root-override"
        classes={{ root: 'slot-override' }}
        style={{ width: '200px' }}
        styles={{ root: { height: '40px' } }}
      >
        <Button>Action</Button>
      </ButtonGroup>
    ))

    const group = screen.getByRole('group')
    expect(group.id).toBe('actions')
    expect(group.className).toContain('root-override')
    expect(group.className).toContain('slot-override')
    expect(group.style.width).toBe('200px')
    expect(group.style.height).toBe('40px')
  })
})
