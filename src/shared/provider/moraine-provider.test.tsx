import { render } from '@solidjs/testing-library'
import { createSignal, onMount } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { Button } from '../../elements/button/index.ts'
import * as elements from '../../elements/index.ts'
import * as forms from '../../forms/index.ts'
import * as navigation from '../../navigation/index.ts'
import * as overlays from '../../overlays/index.ts'
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
    slots: ['root', 'leading', 'label'],
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
      slots,
      provider,
      group,
      instance,
      stateCls,
      baseStyle,
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

  test('places dynamic group and state values before instance overrides', () => {
    const resolved = resolveComponentStyle({
      slots: testRecipe(),
      instance: {
        classes: { leading: 'text-instance' },
        styles: { leading: { color: 'green' } },
      },
    })

    expect(
      resolved.slotClass('leading', {
        group: 'text-group',
        state: 'text-state',
      }),
    ).toContain('text-instance')
    expect(resolved.slotClass('leading', { state: 'text-state' })).not.toContain('text-state')
    expect(
      resolved.slotStyle('leading', {
        group: { color: 'blue', width: '1px' },
        state: { color: 'red' },
      }),
    ).toEqual({ color: 'green', width: '1px' })
  })
})
