import { render } from '@solidjs/testing-library'
import { createSignal, onMount } from 'solid-js'
import { describe, expect, test } from 'vitest'

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
    Collapsible: 'collapsible',
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
    Modal: 'modal',
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
    CollapsibleTrigger: 'collapsible',
    CollapsibleContent: 'collapsible',
    ModalTrigger: 'modal',
    ModalTriggerRenderer: 'modal',
    SidebarFrameSheetOnlyRender: 'sidebarFrame',
    SidebarFrameSheetResizableRender: 'sidebarFrame',
  }

  test('derives every package-root component and maps it to exactly one provider key', () => {
    const allBarrels = { ...elements, ...forms, ...navigation, ...overlays }
    const componentNames = Object.keys(allBarrels).filter((name) => {
      // Components are PascalCase and functions
      if (!/^[A-Z]/.test(name)) return false
      const exp = (allBarrels as Record<string, unknown>)[name]
      return typeof exp === 'function'
    })

    const assigned = new Map<string, string>()

    for (const name of componentNames) {
      if (assigned.has(name)) {
        throw new Error(`Duplicate public component export: ${name}`)
      }
      const ownerKey = STANDALONE_MAP[name] ?? OWNER_MAP[name]
      if (!ownerKey) {
        throw new Error(
          `Unassigned public component: ${name}. Must be added to standalone or owner map.`,
        )
      }
      assigned.set(name, ownerKey)
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
  test('mergeComponentStyle shallow-merges defaultProps, merges classes with cn, and deep-merges styles', () => {
    const parent: ComponentDefaultStyle<any, any, any> = {
      defaultProps: { size: 'sm', variant: 'primary' },
      class: 'p-4 text-sm',
      classes: { root: 'p-root', header: 'p-header' },
      style: { color: 'red', margin: '4px' },
      styles: {
        root: { color: 'red', '--p': '1' },
      },
    }
    const child: ComponentDefaultStyle<any, any, any> = {
      defaultProps: { size: 'lg' },
      class: 'text-base',
      classes: { root: 'c-root' },
      style: { color: 'blue' },
      styles: {
        root: { color: 'blue', '--c': '2' },
      },
    }

    const merged = mergeComponentStyle(parent, child)
    expect(merged?.defaultProps).toEqual({ size: 'lg', variant: 'primary' })
    expect(merged?.class).toBe('p-4 text-base') // cn merges text-sm and text-base -> text-base
    expect(merged?.classes?.root).toBe('p-root c-root')
    expect((merged?.classes as any)?.header).toBe('p-header')
    expect(merged?.style).toEqual({ color: 'blue', margin: '4px' })
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
      button: { defaultProps: { size: 'sm' }, class: 'btn-parent' },
      badge: { defaultProps: { variant: 'outline' } },
    }
    const child: MoraineConfig = {
      button: { defaultProps: { variant: 'outline' }, class: 'btn-child' },
    }

    const merged = mergeMoraineConfig(parent, child)
    expect(merged.button?.defaultProps).toEqual({ size: 'sm', variant: 'outline' })
    expect(merged.button?.class).toBe('btn-parent btn-child')
    expect(merged.badge?.defaultProps).toEqual({ variant: 'outline' })
  })
})

describe('MoraineProvider Solid Integration', () => {
  test('provides reactive config changes without remounting descendants', () => {
    const [config, setConfig] = createSignal<MoraineConfig>({
      button: { class: 'initial-btn' },
    })

    let mountCount = 0

    function Consumer() {
      onMount(() => {
        mountCount++
      })
      const cfg = useMoraineConfig()
      return <div data-testid="consumer">{String(cfg().button?.class ?? '')}</div>
    }

    const { getByTestId } = render(() => (
      <MoraineProvider config={config()}>
        <Consumer />
      </MoraineProvider>
    ))

    expect(getByTestId('consumer').textContent).toBe('initial-btn')
    expect(mountCount).toBe(1)

    // Update signal
    setConfig({ button: { class: 'updated-btn' } })
    expect(getByTestId('consumer').textContent).toBe('updated-btn')
    expect(mountCount).toBe(1) // must NOT remount!
  })

  test('nested MoraineProvider deep-merges with parent provider', () => {
    const outer: MoraineConfig = {
      button: { defaultProps: { size: 'sm', variant: 'default' }, class: 'outer-class' },
    }
    const inner: MoraineConfig = {
      button: { defaultProps: { variant: 'outline' }, class: 'inner-class' },
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

    expect(resolvedButtonConfig.defaultProps).toEqual({ size: 'sm', variant: 'outline' })
    expect(resolvedButtonConfig.class).toBe('outer-class inner-class')
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
      class: 'p-class text-base', // text-base overrides text-sm
      classes: { root: 'p-slot-root', leading: 'p-slot-leading' },
      style: { color: 'red', margin: '4px' },
      styles: {
        root: { color: 'orange', '--p': '1' },
        leading: { '--p-lead': '1' },
      },
    }

    const group = {
      class: 'g-class',
      classes: { root: 'g-slot-root', leading: 'g-slot-leading' },
      style: { color: 'blue' },
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
    // recipe slots -> provider.class -> provider.classes.root -> group.class -> group.classes.root -> stateCls.root -> instance.classes.root -> instance.class
    expect(resolved.rootClass()).toBe(
      'recipe-root h-8 px-2 p-class text-base p-slot-root g-class g-slot-root i-slot-root i-class',
    )

    // Leading slot class order:
    // recipe slots -> provider.classes.slot -> group.classes.slot -> stateCls.slot -> instance.classes.slot
    expect(resolved.slotClass('leading')).toBe(
      'recipe-leading size-3.5 p-slot-leading g-slot-leading s-leading i-slot-leading',
    )

    // Root style order (rightmost wins for color):
    expect(resolved.rootStyle()).toEqual({
      '--base': '0',
      margin: '4px',
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
})
