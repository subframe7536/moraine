import { render, waitFor } from '@solidjs/testing-library'
import { createSignal, onMount } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { ButtonGroup } from '../../elements/button/button-group.tsx'
import { Button } from '../../elements/button/index.ts'
import * as elements from '../../elements/index.ts'
import * as forms from '../../forms/index.ts'
import { Input } from '../../forms/input/input.tsx'
import { MultiSelect } from '../../forms/select/multi-select.tsx'
import { Select } from '../../forms/select/select.tsx'
import * as navigation from '../../navigation/index.ts'
import * as overlays from '../../overlays/index.ts'
import { Tooltip } from '../../overlays/tooltip/tooltip.tsx'
import { recipe } from '../style/recipe.ts'

import {
  MoraineProvider,
  mergeComponentStyle,
  mergeMoraineConfig,
  resolveComponentStyle,
  useMoraineConfig,
} from './moraine-provider.tsx'
import type { ComponentDefaultStyle, MoraineConfig } from './moraine-provider.tsx'

describe('Component Ownership Inventory', () => {
  const STANDALONE_MAP: Record<string, keyof MoraineConfig> = {
    Accordion: 'accordion',
    Avatar: 'avatar',
    AvatarGroup: 'avatarGroup',
    Badge: 'badge',
    Breadcrumb: 'breadcrumb',
    Button: 'button',
    ButtonGroup: 'buttonGroup',
    Card: 'card',
    Checkbox: 'checkbox',
    CheckboxGroup: 'checkboxGroup',
    CommandPalette: 'commandPalette',
    ContextMenu: 'contextMenu',
    Dialog: 'dialog',
    DropdownMenu: 'dropdownMenu',
    FileUpload: 'fileUpload',
    Form: 'form',
    FormField: 'formField',
    Icon: 'icon',
    Input: 'input',
    InputNumber: 'inputNumber',
    Kbd: 'kbd',
    KbdGroup: 'kbdGroup',
    List: 'list',
    MultiSelect: 'multiSelect',
    Pagination: 'pagination',
    Popover: 'popover',
    Progress: 'progress',
    RadioGroup: 'radioGroup',
    Resizable: 'resizable',
    Select: 'select',
    Separator: 'separator',
    Sheet: 'sheet',
    SidebarFrame: 'sidebarFrame',
    Slider: 'slider',
    Stepper: 'stepper',
    Switch: 'switch',
    Tabs: 'tabs',
    Textarea: 'textarea',
    Tooltip: 'tooltip',
  }

  const OWNER_MAP: Record<string, keyof MoraineConfig> = {
    AccordionItem: 'accordion',
    AccordionTrigger: 'accordion',
    AccordionContent: 'accordion',
    AvatarFace: 'avatar',
    SidebarFrameSheetOnlyRender: 'sidebarFrame',
    SidebarFrameSheetResizableRender: 'sidebarFrame',
  }

  test('derives every package-root component and maps it to exactly one provider key', () => {
    const allBarrels = { ...elements, ...forms, ...navigation, ...overlays }
    const componentNames = Object.keys(allBarrels).filter((name) => {
      // Components are PascalCase and functions
      if (!/^[A-Z]/.test(name)) {
        return false
      }
      const exp = (allBarrels as Record<string, unknown>)[name]
      return typeof exp === 'function'
    })

    const assigned = new Map<string, string>()

    for (const name of componentNames) {
      if (assigned.has(name)) {
        throw new Error(`Duplicate public component export: ${name}`)
      }
      const ownerKey = STANDALONE_MAP[name] ?? OWNER_MAP[name]
      if (!ownerKey && name !== 'Collapsible' && name !== 'Modal') {
        throw new Error(
          `Unassigned public component: ${name}. Must be added to standalone or owner map.`,
        )
      }
      if (ownerKey) {
        assigned.set(name, ownerKey)
      }
    }

    // Account for createForm() bound Form component mapped to 'form'
    assigned.set('createForm.Form', 'form')

    // Verify all standalone keys are represented
    const coveredKeys = new Set(assigned.values())
    const missingKeys = Object.values(STANDALONE_MAP).filter((key) => !coveredKeys.has(key))
    expect(missingKeys, `Missing standalone keys: ${missingKeys.join(', ')}`).toEqual([])
  })
})

describe('Deep Merge & Provider Inheritance', () => {
  test('mergeComponentStyle shallow-merges variants, merges classes with cn, and deep-merges styles', () => {
    const parent: ComponentDefaultStyle<any, any, any> = {
      variants: { size: 'sm', variant: 'primary' },
      classes: { root: 'p-root', header: 'p-header' },
      styles: {
        root: { color: 'red', '--p': '1' },
      },
    }
    const child: ComponentDefaultStyle<any, any, any> = {
      variants: { size: 'lg' },
      classes: { root: 'c-root' },
      styles: {
        root: { color: 'blue', '--c': '2' },
      },
    }

    const merged = mergeComponentStyle(parent, child)
    expect(merged?.variants).toEqual({ size: 'lg', variant: 'primary' })
    expect(merged?.classes?.root).toBe('p-root c-root')
    expect((merged?.classes as any)?.header).toBe('p-header')
    expect(merged?.styles?.root).toEqual({ color: 'blue', '--p': '1', '--c': '2' })
  })

  test('guards against null in styles', () => {
    const parent: ComponentDefaultStyle<any, any, any> = {
      styles: { root: { color: 'red' } },
    }
    const child: ComponentDefaultStyle<any, any, any> = {
      styles: { root: null as any },
    }

    const merged = mergeComponentStyle(parent, child)
    expect(merged?.styles?.root).toEqual({ color: 'red' })
  })

  test('mergeMoraineConfig merges nested configs across components', () => {
    const parent: MoraineConfig = {
      button: { variants: { size: 'sm' } },
      badge: { variants: { variant: 'outline' } },
    }
    const child: MoraineConfig = {
      button: { variants: { variant: 'outline' } },
    }

    const merged = mergeMoraineConfig(parent, child)
    expect(merged.button?.variants).toEqual({ size: 'sm', variant: 'outline' })
    expect(merged.badge?.variants).toEqual({ variant: 'outline' })
  })
})

describe('MoraineProvider Solid Integration', () => {
  test('provides reactive config changes without remounting descendants', () => {
    const [config, setConfig] = createSignal<MoraineConfig>({
      button: { classes: { root: 'initial-btn' } },
    })

    let mountCount = 0

    function Consumer() {
      onMount(() => {
        mountCount++
      })
      const cfg = useMoraineConfig()
      const className = () => {
        const value = cfg().button?.classes?.root
        return typeof value === 'string' ? value : ''
      }
      return <div data-testid="consumer">{className()}</div>
    }

    const { getByTestId } = render(() => (
      <MoraineProvider config={config()}>
        <Consumer />
      </MoraineProvider>
    ))

    expect(getByTestId('consumer').textContent).toBe('initial-btn')
    expect(mountCount).toBe(1)

    // Update signal
    setConfig({ button: { classes: { root: 'updated-btn' } } })
    expect(getByTestId('consumer').textContent).toBe('updated-btn')
    expect(mountCount).toBe(1) // must NOT remount!
  })

  test('updates provider and instance classes/styles without remounting the component', () => {
    const [config, setConfig] = createSignal<MoraineConfig>({
      button: {
        classes: {
          root: 'provider-slot-root-initial',
          leading: 'provider-leading-initial',
        },
        styles: {
          root: { color: 'red', background: 'red' },
          leading: { color: 'red' },
        },
      },
    })
    const [instanceClasses, setInstanceClasses] = createSignal({
      root: 'instance-root-initial',
      leading: 'instance-leading-initial',
    })
    const [instanceStyles, setInstanceStyles] = createSignal({
      root: { border: '1px solid red' },
      leading: { background: 'red' },
    })

    const screen = render(() => (
      <MoraineProvider config={config()}>
        <Button
          data-testid="button"
          leading="icon-star"
          classes={instanceClasses()}
          styles={instanceStyles()}
        >
          Reactive button
        </Button>
      </MoraineProvider>
    ))

    const button = screen.getByTestId('button')
    const leading = button.querySelector('[data-slot="leading"]')!

    expect(button.className).toContain('provider-slot-root-initial')
    expect(button.className).toContain('instance-root-initial')
    expect(leading.className).toContain('provider-leading-initial')
    expect(leading.className).toContain('instance-leading-initial')
    expect(button.style.color).toBe('red')
    expect(button.style.background).toBe('red')
    expect(button.style.border).toBe('1px solid red')
    expect(leading.getAttribute('style')).toContain('color: red')
    expect(leading.getAttribute('style')).toContain('background: red')

    setConfig({
      button: {
        classes: {
          root: 'provider-slot-root-updated',
          leading: 'provider-leading-updated',
        },
        styles: {
          root: { color: 'blue', background: 'blue' },
          leading: { color: 'blue' },
        },
      },
    })

    expect(screen.getByTestId('button')).toBe(button)
    expect(button.className).toContain('provider-slot-root-updated')
    expect(leading.className).toContain('provider-leading-updated')
    expect(leading.className).not.toContain('provider-leading-initial')
    expect(button.style.color).toBe('blue')
    expect(button.style.background).toBe('blue')
    expect(leading.getAttribute('style')).toContain('color: blue')

    setInstanceClasses({
      root: 'instance-root-updated',
      leading: 'instance-leading-updated',
    })
    setInstanceStyles({
      root: { border: '1px solid blue' },
      leading: { background: 'blue' },
    })

    expect(button.className).toContain('instance-root-updated')
    expect(button.className).not.toContain('instance-root-initial')
    expect(leading.className).toContain('instance-leading-updated')
    expect(leading.className).not.toContain('instance-leading-initial')
    expect(button.style.border).toBe('1px solid blue')
    expect(leading.getAttribute('style')).toContain('background: blue')
  })

  test('nested MoraineProvider deep-merges with parent provider', () => {
    const outer: MoraineConfig = {
      button: { variants: { size: 'sm', variant: 'default' } },
    }
    const inner: MoraineConfig = {
      button: { variants: { variant: 'outline' } },
    }

    let resolvedButtonConfig: any

    function Consumer() {
      const cfg = useMoraineConfig()
      resolvedButtonConfig = cfg().button
      return <div>Test</div>
    }

    render(() => (
      <MoraineProvider config={outer}>
        <MoraineProvider config={inner}>
          <Consumer />
        </MoraineProvider>
      </MoraineProvider>
    ))

    expect(resolvedButtonConfig.variants).toEqual({ size: 'sm', variant: 'outline' })
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

    const provider = {
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
      provider,
      group,
      instance,
      state: {
        classes: stateCls,
      },
    })

    // Root class order:
    // recipe slots -> provider.classes.root -> group.classes.root -> stateCls.root -> instance.classes.root -> instance.class
    expect(resolved.rootClass()).toBe(
      'recipe-root text-sm h-8 px-2 p-slot-root g-slot-root i-slot-root i-class',
    )

    // Leading slot class order:
    // recipe slots -> provider.classes.slot -> group.classes.slot -> stateCls.slot -> instance.classes.slot
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

  test('merges an atomic base class before provider and instance root overrides', () => {
    const resolved = resolveComponentStyle({
      base: {
        classes: { root: 'recipe-root px-2' },
      },
      provider: { classes: { root: 'provider-root px-3' } },
      instance: { class: 'instance-root px-4' },
    })

    expect(resolved.rootClass()).toBe('recipe-root provider-root instance-root px-4')
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
      provider: layer(2),
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
      provider: inputs.provider,
      group: inputs.group,
      state: inputs.state,
    })
    expect(cascade.slotClass('surface', override)).toBe('p-6')
    expect(cascade.slotStyle('surface', override)['--level']).toBe('6')
    expect(cascade.slotClass('surface', { group: override.group })).toBe('p-5')
    expect(cascade.slotStyle('surface', { group: override.group })['--level']).toBe('5')
    const group = resolveComponentStyle<'surface'>({
      base: inputs.base,
      provider: inputs.provider,
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
      get provider() {
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
  test('updates grouped button variants and restores provider styles after instance removal', () => {
    const [active, setActive] = createSignal(true)
    const screen = render(() => (
      <MoraineProvider
        config={{
          button: {
            classes: { root: active() ? 'p-2' : 'p-3' },
            styles: { root: { color: active() ? 'blue' : 'red' } },
          },
        }}
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
    expect(button.style.color).toBe('red')
    expect(button.style.width).toBe('')
    screen.unmount()
  })

  test('keeps input and select slots reactive through nested control resolvers', () => {
    const [active, setActive] = createSignal(true)
    const provider = () => ({
      classes: { input: active() ? 'p-2' : 'p-3' },
      styles: { input: { color: active() ? 'blue' : 'red' } },
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
      <MoraineProvider config={{ input: provider(), select: provider(), multiSelect: provider() }}>
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
      expect(input.style.color).toBe('red')
      expect(input.style.width).toBe('')
    }
    screen.unmount()
  })
})

test('updates overlay content overrides and maps root props to the trigger slot', async () => {
  const [active, setActive] = createSignal(true)
  const screen = render(() => (
    <MoraineProvider
      config={{
        tooltip: {
          classes: { trigger: 'p-2', content: 'p-3' },
          styles: { trigger: { color: 'blue' }, content: { color: 'red' } },
        },
      }}
    >
      <Tooltip
        open
        text="Details"
        class={active() ? 'p-8' : undefined}
        style={active() ? { color: 'green' } : undefined}
        classes={{ content: active() ? 'p-9' : undefined }}
        styles={{ content: active() ? { color: 'purple', width: '80px' } : undefined }}
      >
        {(props) => <button {...props}>Open details</button>}
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
    expect(trigger.style.color).toBe('blue')
    expect(content.classList.contains('p-3')).toBe(true)
    expect(content.classList.contains('p-9')).toBe(false)
    expect(content.style.color).toBe('red')
    expect(content.style.width).toBe('')
  })
  screen.unmount()
})

test.each([
  { name: 'Select', Control: Select },
  { name: 'MultiSelect', Control: MultiSelect },
])('$name keeps popup state styles below instance overrides', async ({ Control }) => {
  const [override, setOverride] = createSignal(true)
  const provider = { classes: { item: 'p-2' }, styles: { item: { color: 'blue' } } }
  const screen = render(() => (
    <MoraineProvider config={{ select: provider, multiSelect: provider }}>
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
