import { render, waitFor } from '@solidjs/testing-library'
import { createComponent, createSignal, onMount } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { createDesign } from '../../design.ts'
import { ButtonGroup } from '../../elements/button/button-group.tsx'
import { Button } from '../../elements/button/index.ts'
import { Checkbox } from '../../forms/checkbox/checkbox.tsx'
import { Input } from '../../forms/input/input.tsx'
import { MultiSelect } from '../../forms/select/multi-select.tsx'
import { Select } from '../../forms/select/select.tsx'
import { Switch } from '../../forms/switch/switch.tsx'
import { Tooltip } from '../../overlays/tooltip/tooltip.tsx'
import { recipe } from '../style/recipe.ts'

import { MoraineProvider, resolveComponentStyle } from './moraine-provider.tsx'

describe('MoraineProvider Design context', () => {
  test('keeps form visual states unstyled without the official preset', () => {
    const screen = render(() => (
      <MoraineProvider design={createDesign({ preset: false })}>
        <Input type="file" loading />
        <Checkbox disabled label="Disabled checkbox" />
        <Switch required label="Required switch" />
        <Select options={[{ label: 'One', value: 'One' }]} placeholder="Choose" search={false} />
        <MultiSelect options={[{ label: 'One', value: 'One' }]} defaultValue={['One']} loading />
      </MoraineProvider>
    ))
    for (const element of screen.container.querySelectorAll('[class]')) {
      const classes = element.getAttribute('class') ?? ''
      expect(classes).not.toMatch(/opacity-|cursor-|animate-|text-muted-|after:|file:|truncate/)
    }
  })
  test('warns once per missing-provider owner tree and keeps components unstyled', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const first = render(() => (
        <div>
          <Button>First</Button>
          <Button>Second</Button>
        </div>
      ))
      expect(warning).toHaveBeenCalledTimes(1)
      expect(first.getByRole('button', { name: 'First' }).className).toBe('')
      const second = render(() => <Button>Third</Button>)
      expect(warning).toHaveBeenCalledTimes(2)
      first.unmount()
      second.unmount()
    } finally {
      warning.mockRestore()
    }
  })

  test('replaces a nested Design without inheriting its parent or remounting descendants', () => {
    const parent = createDesign({
      button: { base: { root: 'parent-only' }, defaultVariants: { size: 'lg' } },
    })
    const [child, setChild] = createSignal(
      createDesign({ preset: false, button: { base: { root: 'first-child' } } }),
    )
    let mounts = 0
    function Probe() {
      onMount(() => {
        mounts += 1
      })
      return <Button>Child</Button>
    }
    const screen = render(() => (
      <MoraineProvider design={parent}>
        <Button>Parent</Button>
        <MoraineProvider design={child()}>
          <Probe />
        </MoraineProvider>
      </MoraineProvider>
    ))
    const button = screen.getByRole('button', { name: 'Child' })
    button.focus()
    expect(button.className).toBe('first-child')
    expect(button.getAttribute('data-size')).toBe('md')
    setChild(
      createDesign({
        preset: false,
        button: { base: { root: 'next-child' }, defaultVariants: { size: 'sm' } },
      }),
    )
    expect(screen.getByRole('button', { name: 'Child' })).toBe(button)
    expect(button.className).toBe('next-child')
    expect(button.getAttribute('data-size')).toBe('sm')
    expect(document.activeElement).toBe(button)
    expect(mounts).toBe(1)
    expect(screen.getByRole('button', { name: 'Parent' }).className).toContain('parent-only')
  })

  test('reads its JSX children once', () => {
    let reads = 0
    render(() =>
      createComponent(MoraineProvider, {
        design: createDesign(),
        get children() {
          reads += 1
          return <Button>Child</Button>
        },
      }),
    )
    expect(reads).toBe(1)
  })
})

describe('Precedence Contract & resolveComponentStyle', () => {
  const testRecipe = recipe({
    base: {
      root: 'recipe-root text-sm',
      leading: 'recipe-leading size-4',
      label: 'recipe-label',
    },
    variants: {
      size: {
        sm: { root: 'h-8 px-2', leading: 'size-3.5' },
        lg: { root: 'h-10 px-4', leading: 'size-5' },
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  })

  test('matches the normative precedence table (§3.5.4)', () => {
    const slots = testRecipe()

    const design = {
      classes: { root: 'p-slot-root', leading: 'p-slot-leading' },
      styles: {
        root: { color: 'orange', '--p': '1' },
        leading: { '--p-lead': '1' },
      },
    }

    const group = {
      classes: { root: 'g-slot-root', leading: 'g-slot-leading' },
      styles: {
        root: { color: 'purple', '--g': '2' },
        leading: { '--g-lead': '2' },
      },
    }

    const instance = {
      class: 'i-class',
      classes: { root: 'i-slot-root', leading: 'i-slot-leading' },
      style: { color: 'green' },
      styles: {
        root: { color: 'yellow', '--i': '3' },
        leading: { '--i-lead': '3' },
      },
    }

    const stateCls = {
      leading: 's-leading',
    }

    const baseStyle = {
      '--base': '0',
    }

    const resolved = resolveComponentStyle({
      base: {
        classes: slots,
        styles: { root: baseStyle },
      },
      design,
      group,
      instance,
      state: {
        classes: stateCls,
      },
    })

    // Root class order:
    // recipe slots -> design.classes.root -> group.classes.root -> stateCls.root -> instance.classes.root -> instance.class
    expect(resolved.rootClass()).toBe(
      'recipe-root text-sm h-8 px-2 p-slot-root g-slot-root i-slot-root i-class',
    )

    // Leading slot class order:
    // recipe slots -> design.classes.slot -> group.classes.slot -> stateCls.slot -> instance.classes.slot
    expect(resolved.slotClass('leading')).toBe(
      'recipe-leading size-3.5 p-slot-leading g-slot-leading s-leading i-slot-leading',
    )

    // Root style order (rightmost wins for color):
    expect(resolved.rootStyle()).toEqual({
      '--base': '0',
      '--p': '1',
      '--g': '2',
      '--i': '3',
      color: 'green', // instance.style wins
    })

    // Slot style order:
    expect(resolved.slotStyle('leading')).toEqual({
      '--p-lead': '1',
      '--g-lead': '2',
      '--i-lead': '3',
    })
  })

  test('merges an atomic base class before design and instance root overrides', () => {
    const resolved = resolveComponentStyle({
      base: {
        classes: { root: 'recipe-root px-2' },
      },
      design: { classes: { root: 'design-root px-3' } },
      instance: { class: 'instance-root px-4' },
    })

    expect(resolved.rootClass()).toBe('recipe-root design-root instance-root px-4')
  })

  test('places group and state values before instance overrides', () => {
    const resolved = resolveComponentStyle({
      base: {
        classes: testRecipe(),
      },
      instance: {
        classes: { leading: 'text-instance' },
        styles: { leading: { color: 'green' } },
      },
    })

    expect(
      resolved.slotClass('leading', {
        group: { class: 'text-group' },
        state: { class: 'text-state' },
      }),
    ).toContain('text-instance')
    expect(
      resolved.slotClass('leading', {
        state: { class: 'text-state' },
      }),
    ).not.toContain('text-state')
    expect(
      resolved.slotStyle('leading', {
        group: { style: { color: 'blue', width: '1px' } },
        state: { style: { color: 'red' } },
      }),
    ).toEqual({ color: 'green', width: '1px' })
  })

  test('slotClassAndStyle and rootClassAndStyle provide reactive class and style bindings', () => {
    const resolved = resolveComponentStyle({
      base: {
        classes: testRecipe(),
      },
      instance: {
        class: 'root-inst-class',
        style: { margin: '8px' },
        classes: { leading: 'lead-inst-class' },
        styles: { leading: { color: 'blue' } },
      },
    })

    const rootBinding = resolved.rootClassAndStyle()
    expect(rootBinding.class).toContain('root-inst-class')
    expect(rootBinding.style).toEqual({ margin: '8px' })

    const slotBinding = resolved.slotClassAndStyle('leading', {
      state: { class: 'lead-state-class' },
    })
    expect(slotBinding.class).toContain('lead-inst-class')
    expect(slotBinding.style).toEqual({ color: 'blue' })
  })
})

describe('Unified style layers', () => {
  test('uses the same precedence for root and slots, including per-call overrides', () => {
    const layer = (index: number) => ({
      classes: { surface: `p-${index}`, label: `p-${index}` },
      styles: { surface: { '--level': `${index}` }, label: { '--level': `${index}` } },
    })
    const inputs = {
      rootSlot: 'surface' as const,
      base: layer(1),
      design: layer(2),
      group: layer(3),
      state: layer(5),
      instance: { ...layer(7), class: 'p-8', style: { '--level': '8' } },
    }
    const resolved = resolveComponentStyle(inputs)
    const override = {
      group: { class: 'p-4', style: { '--level': '4', '--group': 'yes' } },
      state: { class: 'p-6', style: { '--level': '6', '--state': 'yes' } },
    }
    expect(resolved.rootClass(override)).toBe('p-8')
    expect(resolved.rootStyle(override)).toEqual({
      '--level': '8',
      '--group': 'yes',
      '--state': 'yes',
    })
    expect(resolved.slotClass('surface', override)).toBe(resolved.rootClass(override))
    expect(resolved.slotStyle('surface', override)).toEqual(resolved.rootStyle(override))
    expect(resolved.slotClass('label', override)).toBe('p-7')
    expect(resolved.slotStyle('label', override)['--level']).toBe('7')

    // Remove each level to expose the preceding one, in both channels.
    const cascade = resolveComponentStyle<'surface'>({
      base: inputs.base,
      design: inputs.design,
      group: inputs.group,
      state: inputs.state,
    })
    expect(cascade.slotClass('surface', override)).toBe('p-6')
    expect(cascade.slotStyle('surface', override)['--level']).toBe('6')
    expect(cascade.slotClass('surface', { group: override.group })).toBe('p-5')
    expect(cascade.slotStyle('surface', { group: override.group })['--level']).toBe('5')
    const group = resolveComponentStyle<'surface'>({
      base: inputs.base,
      design: inputs.design,
      group: inputs.group,
    })
    expect(group.slotClass('surface', { group: override.group })).toBe('p-4')
    expect(group.slotStyle('surface', { group: override.group })['--level']).toBe('4')
  })

  test('retains bindings across layer replacements and removes obsolete inline properties', () => {
    const [enabled, setEnabled] = createSignal(true)
    const resolved = resolveComponentStyle<'surface' | 'label'>({
      rootSlot: 'surface',
      base: { classes: { surface: 'p-1' }, styles: { surface: { color: 'red' } } },
      get design() {
        return enabled()
          ? {
              classes: { surface: 'p-2' },
              styles: { surface: { color: 'blue', width: '10px' } },
            }
          : undefined
      },
      instance: {
        get style() {
          return enabled() ? { color: undefined } : undefined
        },
      },
    })
    const root = resolved.rootClassAndStyle({
      get state() {
        return enabled() ? { class: 'p-3', style: { '--active': 'yes' } } : undefined
      },
    })
    const label = resolved.slotClassAndStyle('label', {
      get group() {
        return enabled() ? { class: 'p-4', style: { height: '12px' } } : undefined
      },
    })
    const screen = render(() => (
      <div {...root}>
        <span {...label}>Label</span>
      </div>
    ))
    const span = screen.getByText('Label')
    const element = span.parentElement!
    expect(element.className).toBe('p-3')
    expect(element.style.color).toBe('')
    expect(element.style.width).toBe('10px')
    expect(element.style.getPropertyValue('--active')).toBe('yes')
    expect(span.className).toBe('p-4')
    expect(span.style.height).toBe('12px')

    setEnabled(false)
    expect(element.className).toBe('p-1')
    expect(element.style.color).toBe('red')
    expect(element.style.width).toBe('')
    expect(element.style.getPropertyValue('--active')).toBe('')
    expect(span.getAttribute('class') ?? '').toBe('')
    expect(span.style.height).toBe('')
    screen.unmount()
  })
})

describe('Component style reactivity', () => {
  test('updates grouped button variants and restores Design classes after instance removal', () => {
    const [active, setActive] = createSignal(true)
    const screen = render(() => (
      <MoraineProvider
        design={createDesign({
          preset: false,
          button: {
            base: { root: active() ? 'p-2 text-blue-500' : 'p-3 text-red-500' },
          },
        })}
      >
        <ButtonGroup size={active() ? 'sm' : 'lg'}>
          <Button
            class={active() ? 'p-8' : undefined}
            style={active() ? { color: 'green', width: '80px' } : undefined}
          >
            Action
          </Button>
        </ButtonGroup>
      </MoraineProvider>
    ))
    const button = screen.getByRole('button', { name: 'Action' })
    expect(button.getAttribute('data-size')).toBe('sm')
    expect(button.classList.contains('p-8')).toBe(true)
    expect(button.classList.contains('p-2')).toBe(false)
    expect(button.style.color).toBe('green')
    setActive(false)
    expect(button.getAttribute('data-size')).toBe('lg')
    expect(button.classList.contains('p-3')).toBe(true)
    expect(button.classList.contains('p-8')).toBe(false)
    expect(button.style.color).toBe('')
    expect(button.classList.contains('text-red-500')).toBe(true)
    expect(button.style.width).toBe('')
    screen.unmount()
  })

  test('keeps input and select slots reactive through nested control resolvers', () => {
    const [active, setActive] = createSignal(true)
    const designEntry = () => ({
      base: { input: active() ? 'p-2 text-blue-500' : 'p-3 text-red-500' },
    })
    const props = {
      get size() {
        return active() ? ('sm' as const) : ('lg' as const)
      },
      get classes() {
        return { input: active() ? 'p-8' : undefined }
      },
      get styles() {
        return { input: active() ? { color: 'green', width: '80px' } : undefined }
      },
    }
    const screen = render(() => (
      <MoraineProvider
        design={createDesign({
          preset: false,
          input: designEntry(),
          select: designEntry(),
          multiSelect: designEntry(),
        })}
      >
        <Input {...props} />
        <Select
          {...props}
          search
          options={[
            { label: 'Apple', value: 'apple' },
            { label: 'Banana', value: 'banana' },
          ]}
        />
        <MultiSelect
          {...props}
          search
          options={[
            { label: 'Apple', value: 'apple' },
            { label: 'Banana', value: 'banana' },
          ]}
        />
      </MoraineProvider>
    ))
    const inputs = screen.container.querySelectorAll<HTMLInputElement>('input[data-slot="input"]')
    expect(inputs).toHaveLength(3)
    for (const input of inputs) {
      expect(input.classList.contains('p-8')).toBe(true)
      expect(input.classList.contains('p-2')).toBe(false)
      expect(input.style.color).toBe('green')
    }
    setActive(false)
    for (const input of inputs) {
      expect(input.classList.contains('p-3')).toBe(true)
      expect(input.classList.contains('p-8')).toBe(false)
      expect(input.style.color).toBe('')
      expect(input.classList.contains('text-red-500')).toBe(true)
      expect(input.style.width).toBe('')
    }
    screen.unmount()
  })
})

test('updates overlay content overrides and maps root props to the trigger slot', async () => {
  const [active, setActive] = createSignal(true)
  const screen = render(() => (
    <MoraineProvider
      design={createDesign({
        preset: false,
        tooltip: {
          base: { trigger: 'p-2 text-blue-500', content: 'p-3 text-red-500' },
        },
      })}
    >
      <Tooltip open>
        <Tooltip.Trigger
          as="button"
          class={active() ? 'p-8' : undefined}
          style={active() ? { color: 'green' } : undefined}
        >
          Open details
        </Tooltip.Trigger>
        <Tooltip.Content
          text="Details"
          classes={{ content: active() ? 'p-9' : undefined }}
          styles={{ content: active() ? { color: 'purple', width: '80px' } : undefined }}
        />
      </Tooltip>
    </MoraineProvider>
  ))
  const trigger = screen.getByRole('button', { name: 'Open details' })
  const content = await waitFor(() => {
    const element = document.body.querySelector<HTMLElement>('[role="tooltip"]')
    expect(element).not.toBeNull()
    return element!
  })
  expect(trigger.classList.contains('p-8')).toBe(true)
  expect(trigger.style.color).toBe('green')
  expect(content.classList.contains('p-9')).toBe(true)
  expect(content.style.color).toBe('purple')
  setActive(false)
  await waitFor(() => {
    expect(trigger.classList.contains('p-2')).toBe(true)
    expect(trigger.classList.contains('p-8')).toBe(false)
    expect(trigger.style.color).toBe('')
    expect(trigger.classList.contains('text-blue-500')).toBe(true)
    expect(content.classList.contains('p-3')).toBe(true)
    expect(content.classList.contains('p-9')).toBe(false)
    expect(content.style.color).toBe('')
    expect(content.classList.contains('text-red-500')).toBe(true)
    expect(content.style.width).toBe('')
  })
  screen.unmount()
})

test.each([
  { name: 'Select', Control: Select },
  { name: 'MultiSelect', Control: MultiSelect },
])('$name keeps popup state styles below instance overrides', async ({ Control }) => {
  const [override, setOverride] = createSignal(true)
  const designEntry = { base: { item: 'p-2 text-blue-500' } }
  const screen = render(() => (
    <MoraineProvider
      design={createDesign({ preset: false, select: designEntry, multiSelect: designEntry })}
    >
      <Control
        open
        options={[{ label: 'Apple', value: 'apple' }]}
        itemProps={() => ({ class: 'p-4', style: { color: 'red', height: '30px' } })}
        classes={{ item: override() ? 'p-8' : undefined }}
        styles={{ item: override() ? { color: 'green' } : undefined }}
      />
    </MoraineProvider>
  ))
  const item = await waitFor(() => {
    const element = document.body.querySelector<HTMLElement>('[role="option"]')
    expect(element).not.toBeNull()
    return element!
  })
  expect(item.classList.contains('p-8')).toBe(true)
  expect(item.classList.contains('p-4')).toBe(false)
  expect(item.style.color).toBe('green')
  expect(item.style.height).toBe('30px')
  setOverride(false)
  expect(item.classList.contains('p-4')).toBe(true)
  expect(item.classList.contains('p-8')).toBe(false)
  expect(item.style.color).toBe('red')
  screen.unmount()
})
