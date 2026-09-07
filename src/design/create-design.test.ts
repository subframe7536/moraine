// @vitest-environment jsdom

import { describe, expect, test } from 'vitest'

import { createDesign } from './create-design.ts'
import { getEmptyDesign } from './empty-design.ts'
import { SLOT_SKELETONS } from './slots.ts'

describe('createDesign', () => {
  test('creates official design by default with all component slots', () => {
    const design = createDesign()

    expect(design.button).toBeDefined()
    expect(typeof design.button.recipe).toBe('function')
    expect(design.button.recipe.slots).toEqual(SLOT_SKELETONS.button)

    const defaultBtn = design.button.recipe({ variant: 'default', size: 'md' })
    expect(defaultBtn.root).toContain('bg-primary')

    const outlineBtn = design.button.recipe({ variant: 'outline', size: 'sm' })
    expect(outlineBtn.root).toContain('border-border')
    expect(outlineBtn.root).toContain('h-7')
  })

  test('creates unstyled design with preset: false', () => {
    const unstyled = createDesign({ preset: false })

    const btn = unstyled.button.recipe({ variant: 'default', size: 'md' })
    expect(btn.root).toBeUndefined()
    expect(btn.label).toBeUndefined()
  })

  test('retains root-only component slots in custom and unstyled Designs', () => {
    const custom = createDesign({
      form: { base: { root: 'form-root' } },
      icon: { base: { root: 'icon-root' } },
      kbd: { base: { root: 'kbd-root' } },
      separator: { base: { root: 'separator-root' } },
    })
    const unstyled = createDesign({ preset: false })

    expect(custom.form.recipe().root).toContain('form-root')
    expect(custom.icon.recipe().root).toContain('icon-root')
    expect(custom.kbd.recipe().root).toContain('kbd-root')
    expect(custom.separator.recipe().root).toContain('separator-root')
    expect(unstyled.form.recipe.slots).toEqual(['root'])
    expect(unstyled.icon.recipe.slots).toEqual(['root'])
    expect(unstyled.kbd.recipe.slots).toEqual(['root'])
    expect(unstyled.separator.recipe.slots).toEqual(['root'])
  })

  test('merges base slots using cn and preserves existing variants', () => {
    const custom = createDesign({
      button: {
        base: { root: 'shadow-2xl' },
      },
    })

    const btn = custom.button.recipe({ variant: 'default', size: 'md' })
    expect(btn.root).toContain('bg-primary')
    expect(btn.root).toContain('shadow-2xl')
  })

  test('supports variant overrides on unstyled base with complete slot skeleton', () => {
    const unstyledCustom = createDesign({
      preset: false,
      button: {
        variants: {
          variant: {
            outline: { label: 'custom-outline-label' },
          },
        },
      },
    })

    const resolved = unstyledCustom.button.recipe({ variant: 'outline' })
    expect(resolved.label).toBe('custom-outline-label')
    expect(resolved.root).toBeUndefined()
  })

  test('appends compound variants parent-first', () => {
    const baseDesign = createDesign({
      preset: false,
      button: {
        compoundVariants: [
          {
            variants: { variant: 'outline', size: 'sm' },
            class: { root: 'compound-first' },
          },
        ],
      },
    })

    const extendedDesign = createDesign({
      extends: baseDesign,
      button: {
        compoundVariants: [
          {
            variants: { variant: 'outline', size: 'sm' },
            class: { root: 'compound-second' },
          },
        ],
      },
    })

    const classes = extendedDesign.button.recipe({ variant: 'outline', size: 'sm' })
    expect(classes.root).toBe('compound-first compound-second')
  })

  test('shallow merges defaultVariants', () => {
    const custom = createDesign({
      button: {
        defaultVariants: { size: 'lg' },
      },
    })

    expect(custom.button.defaultVariants?.size).toBe('lg')
    expect(custom.button.defaultVariants?.variant).toBe('default')
  })

  test('undefined defaults preserve inherited values and leave the parent unchanged', () => {
    const parent = createDesign({ button: { defaultVariants: { size: 'lg' } } })
    const child = createDesign({
      extends: parent,
      button: { defaultVariants: { size: undefined, variant: 'outline' } },
    })

    expect(child.button.defaultVariants).toEqual({ size: 'lg', variant: 'outline' })
    expect(parent.button.defaultVariants).toEqual({ size: 'lg', variant: 'default' })
    expect(child.button.recipe().root).toContain('h-9')
  })

  test('extends inherits parent design completely without re-applying official preset', () => {
    const parent = createDesign({
      preset: false,
      button: {
        base: { root: 'parent-only-class' },
      },
    })

    const child = createDesign({
      extends: parent,
      button: {
        base: { label: 'child-label' },
      },
    })

    const resolved = child.button.recipe()
    expect(resolved.root).toBe('parent-only-class')
    expect(resolved.label).toBe('child-label')
    // Official classes must not appear
    expect(resolved.root).not.toContain('bg-primary')
  })

  test('preset: false does not strip inherited parent presentation when extending', () => {
    const parent = createDesign({
      button: {
        base: { root: 'custom-parent' },
      },
    })

    const child = createDesign({
      extends: parent,
      preset: false,
      button: {
        base: { label: 'child-label' },
      },
    })

    const resolved = child.button.recipe({ variant: 'default' })
    expect(resolved.root).toContain('custom-parent')
    expect(resolved.label).toBe('min-w-0 truncate child-label')
  })

  test('design objects are frozen and immutable', () => {
    const design = createDesign()

    expect(Object.isFrozen(design)).toBe(true)
    expect(() => {
      // @ts-expect-error mutating frozen object
      design.button = {}
    }).toThrow()
  })

  test('empty class value does not delete inherited classes', () => {
    const parent = createDesign({
      preset: false,
      button: {
        base: { root: 'existing-class' },
      },
    })

    const child = createDesign({
      extends: parent,
      button: {
        base: { root: '' },
      },
    })

    expect(child.button.recipe().root).toBe('existing-class')
  })

  test('getEmptyDesign returns stable unstyled design instance', () => {
    const empty1 = getEmptyDesign()
    const empty2 = getEmptyDesign()

    expect(empty1).toBe(empty2)
    expect(empty1.button.recipe().root).toBeUndefined()
  })
})
