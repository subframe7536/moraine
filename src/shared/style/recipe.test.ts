import { createMemo, createRoot, createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import type { ComponentRecipeConfig } from './recipe'
import { atomicRecipe, slotRecipe } from './recipe'

interface RootSlot {
  root?: unknown
}

interface StateVariant {
  state?: 'active'
}

interface CardSlot {
  root?: unknown
  header?: unknown
  content?: unknown
  footer?: unknown
  icon?: unknown
}

interface CardVariant {
  variant?: 'solid' | 'ghost'
  size?: 'sm' | 'lg'
  bordered?: boolean
}

interface InferredSlot {
  root?: unknown
  header?: unknown
  body?: unknown
}

interface SparseVariant {
  enabled?: boolean
  count?: number
  label?: string
}

const missingSlotBase: ComponentRecipeConfig<RootSlot, never> = {}
const unknownVariantSlot: ComponentRecipeConfig<RootSlot, StateVariant> = {
  base: { root: 'root' },
  variants: {
    state: {
      active: {
        // @ts-expect-error Variant slots must be declared by the component Slot contract.
        leading: 'leading',
      },
    },
  },
}

void missingSlotBase
void unknownVariantSlot

describe('recipe', () => {
  describe('atomic recipe', () => {
    const button = atomicRecipe({
      base: 'inline-flex items-center px-4 py-2 text-sm',
      variants: {
        variant: {
          primary: 'bg-primary text-primary-foreground',
          secondary: 'bg-secondary text-secondary-foreground',
          outline: 'border border-border bg-background',
        },
        size: {
          sm: 'h-8 px-3 text-xs',
          md: 'h-9 px-4 text-sm',
          lg: 'h-10 px-6 text-base',
        },
        rounded: {
          true: 'rounded-full',
          false: 'rounded-none',
        },
      },
      compoundVariants: [
        {
          variants: { variant: 'outline', size: 'lg' },
          class: 'border-2',
        },
        {
          variants: { variant: ['primary', 'secondary'], rounded: true },
          class: 'shadow-lg',
        },
      ],
      defaults: {
        variant: 'primary',
        size: 'md',
        rounded: false,
      },
    })
    const atomicClass: string | undefined = button()

    void atomicClass

    test('applies defaults when no options provided', () => {
      expect(button()).toBe(
        'inline-flex items-center py-2 bg-primary text-primary-foreground h-9 px-4 text-sm rounded-none',
      )
    })

    test('uses defaults for undefined and suppresses them for null', () => {
      expect(button({ variant: undefined })).toBe(
        'inline-flex items-center py-2 bg-primary text-primary-foreground h-9 px-4 text-sm rounded-none',
      )
      expect(button({ variant: null, size: undefined })).toBe(
        'inline-flex items-center py-2 h-9 px-4 text-sm rounded-none',
      )
    })

    test('applies selected variants and boolean variants', () => {
      expect(button({ variant: 'secondary', size: 'sm', rounded: true })).toBe(
        'inline-flex items-center py-2 bg-secondary text-secondary-foreground h-8 px-3 text-xs rounded-full shadow-lg',
      )
    })

    test('applies compound variants with single matcher and array matcher', () => {
      // Single matcher: outline + lg -> border-2 overrides border
      expect(button({ variant: 'outline', size: 'lg' })).toBe(
        'inline-flex items-center py-2 border-border bg-background h-10 px-6 text-base rounded-none border-2',
      )

      // Array matcher: primary + rounded: true -> shadow-lg
      expect(button({ variant: 'primary', rounded: true })).toBe(
        'inline-flex items-center py-2 bg-primary text-primary-foreground h-9 px-4 text-sm rounded-full shadow-lg',
      )
      // Array matcher: secondary + rounded: true -> shadow-lg
      expect(button({ variant: 'secondary', rounded: true })).toBe(
        'inline-flex items-center py-2 bg-secondary text-secondary-foreground h-9 px-4 text-sm rounded-full shadow-lg',
      )
    })

    test('supports flat compound variants and numeric variant values', () => {
      const spacing = atomicRecipe({
        base: 'block',
        variants: {
          columns: {
            1: 'grid-cols-1',
            2: 'grid-cols-2',
          },
        },
        compoundVariants: [{ columns: 2, class: 'gap-4' }],
      })

      expect(spacing({ columns: 2 })).toBe('block grid-cols-2 gap-4')
    })

    test('matches boolean variants against string compound matchers', () => {
      const toggle = atomicRecipe({
        base: 'inline-flex',
        variants: {
          active: {
            true: 'opacity-100',
            false: 'opacity-50',
          },
        },
        compoundVariants: [{ variants: { active: 'true' }, class: 'font-bold' }],
      })

      expect(toggle({ active: true })).toBe('inline-flex opacity-100 font-bold')
    })

    test('returns undefined when no classes are selected', () => {
      expect(atomicRecipe({ base: '' })()).toBeUndefined()
    })

    test('applies extra classes with cn conflict resolution and ordering', () => {
      // Extra class px-8 should override px-4
      expect(button({ size: 'md' }, 'px-8', 'font-bold')).toBe(
        'inline-flex items-center py-2 bg-primary text-primary-foreground h-9 text-sm rounded-none px-8 font-bold',
      )
    })

    test('returns new class evaluation without caching or object identity dependence', () => {
      const res1 = button({ variant: 'secondary' })
      const res2 = button({ variant: 'secondary' })
      expect(res1).toBe(res2)
    })
  })

  describe('multi-slot recipe', () => {
    const card = slotRecipe<CardSlot, CardVariant>({
      base: {
        root: 'rounded-lg border border-border bg-card p-4',
        header: 'font-semibold text-card-foreground mb-2',
        content: 'text-card-foreground',
        footer: 'mt-4 flex items-center',
        icon: '',
      },
      variants: {
        variant: {
          solid: {
            root: 'bg-muted',
          },
          ghost: {
            root: 'border-transparent shadow-none',
          },
        },
        size: {
          sm: {
            root: 'p-2 text-xs',
            header: 'text-sm mb-1',
          },
          lg: {
            root: 'p-6 text-base',
            header: 'text-lg mb-3',
          },
        },
        bordered: {
          true: {
            root: 'border-2',
          },
          false: {},
        },
      },
      compoundVariants: [
        {
          variants: { variant: 'ghost', bordered: true },
          root: 'border-border',
          content: 'italic',
        },
        {
          variants: { variant: ['solid', 'ghost'], size: 'lg' },
          footer: 'justify-end',
        },
      ],
      defaults: {
        variant: 'solid',
        bordered: false,
      },
    })

    test('applies defaults to multi-slot structure and resolves class strings', () => {
      const slots = card()
      expect(slots.classes.root).toBe('rounded-lg border border-border p-4 bg-muted')
      expect(slots.classes.header).toBe('font-semibold text-card-foreground mb-2')
      expect(slots.classes.content).toBe('text-card-foreground')
      expect(slots.classes.footer).toBe('mt-4 flex items-center')
      expect(slots.classes.icon).toBeUndefined()
    })

    test('uses defaults for undefined and suppresses them for null', () => {
      const slots = card({ variant: undefined })
      expect(slots.classes.root).toBe('rounded-lg border border-border p-4 bg-muted')

      const slotsNull = card({ variant: null })
      expect(slotsNull.classes.root).toBe('rounded-lg border border-border bg-card p-4')
    })

    test('applies cross-slot compound variants and array matchers', () => {
      const slots = card({ variant: 'ghost', bordered: true, size: 'lg' })
      // ghost + bordered: true -> root gets border-2 and border-border, content gets italic
      // ghost + size: lg -> footer gets justify-end
      expect(slots.classes.root).toBe(
        'rounded-lg bg-card shadow-none p-6 text-base border-2 border-border',
      )
      expect(slots.classes.content).toBe('text-card-foreground italic')
      expect(slots.classes.footer).toBe('mt-4 flex items-center justify-end')
    })

    test('returns new instance on each call without caching', () => {
      const run1 = card({ variant: 'ghost' })
      const run2 = card({ variant: 'ghost' })
      expect(run1).not.toBe(run2)
      expect(run1).toEqual(run2)
    })

    test('resolves declared slots without a runtime slots array', () => {
      const inferred = slotRecipe<InferredSlot, never>({
        base: {
          root: 'flex flex-col',
          header: 'p-4 border-b',
          body: 'p-4',
        },
      })

      const res = inferred()
      expect(res.classes.root).toBe('flex flex-col')
      expect(res.classes.header).toBe('p-4 border-b')
      expect(res.classes.body).toBe('p-4')
    })

    test('derives classes from reactive getter variants in caller memos', () => {
      createRoot((dispose) => {
        const [atomicVariant, setAtomicVariant] = createSignal<'primary' | 'secondary'>('primary')
        const [slotVariant, setSlotVariant] = createSignal<'solid' | 'ghost'>('solid')
        const reactiveButton = atomicRecipe({
          base: 'inline-flex',
          variants: {
            variant: {
              primary: 'bg-primary',
              secondary: 'bg-secondary',
            },
          },
        })
        const atomicClass = createMemo(() =>
          reactiveButton({
            get variant() {
              return atomicVariant()
            },
          }),
        )
        const slotClass = createMemo(
          () =>
            card({
              get variant() {
                return slotVariant()
              },
            }).classes.root,
        )

        // oxlint-disable-next-line subf/solid-reactivity
        expect(atomicClass()).toContain('bg-primary')
        // oxlint-disable-next-line subf/solid-reactivity
        expect(slotClass()).toContain('bg-muted')

        setAtomicVariant('secondary')
        setSlotVariant('ghost')

        // oxlint-disable-next-line subf/solid-reactivity
        expect(atomicClass()).toContain('bg-secondary')
        // oxlint-disable-next-line subf/solid-reactivity
        expect(slotClass()).toContain('border-transparent')
        dispose()
      })
    })
  })
})

test('matches sparse compound-only keys and preserves false, zero, empty string, and null', () => {
  const sparse = slotRecipe<RootSlot, SparseVariant>({
    defaults: { enabled: false, count: 0, label: '' },
    compoundVariants: [{ variants: { enabled: false, count: 0, label: '' }, root: 'p-2' }],
  })
  expect(sparse()).toEqual({ classes: { root: 'p-2' }, style: {} })
  expect(sparse({ count: undefined })).toEqual({ classes: { root: 'p-2' }, style: {} })
  expect(sparse({ count: null })).toEqual({ classes: {}, style: {} })
})

test('resolves base, variant, compound, and extra classes with an explicit merger', async () => {
  const { cn, createCn } = await import('./cn')
  const customCn = createCn({ override: { classGroups: { p: [] } } })
  const atomic = atomicRecipe({
    base: 'p-2',
    variants: { active: { true: 'p-4' } },
    compoundVariants: [{ active: true, class: 'p-6' }],
  })
  const slots = slotRecipe<RootSlot, { active?: boolean }>({
    base: { root: 'p-2' },
    variants: { active: { true: { root: 'p-4' } } },
    compoundVariants: [{ variants: { active: true }, root: 'p-6' }],
  })
  expect(atomic({ active: true }, 'p-8')).toBe('p-8')
  expect(atomic.resolve({ active: true }, customCn, 'p-8')).toBe('p-2 p-4 p-6 p-8')
  expect(slots({ active: true })).toEqual({ classes: { root: 'p-6' }, style: {} })
  expect(slots.resolve({ active: true }, customCn)).toEqual({
    classes: { root: 'p-2 p-4 p-6' },
    style: {},
  })
  expect(slots.resolve({ active: true }, cn)).toEqual(slots({ active: true }))
  expect(slots.options.base).toEqual({ root: 'p-2' })
})

test('resolves classes and variables from the same matched branches', () => {
  const recipe = slotRecipe<RootSlot, { size: 'sm' | 'lg'; enabled: boolean; count: 0 | 1 }>({
    defaults: { size: 'sm', enabled: true, count: 1 },
    base: {
      root: 'p-2',
      '--size': '4px',
      '--retained': 'base',
      '--empty': null,
    },
    variants: {
      size: {
        sm: { '--size': '8px' },
        lg: { root: 'p-4', '--size': '16px' },
      },
      enabled: { false: { '--enabled': 0 } },
      count: { 0: { '--count': 0 } },
    },
    compoundVariants: [
      { variants: {}, '--unmatched': 1 },
      {
        variants: { size: ['lg'], enabled: false, count: 0 },
        root: 'p-6',
        '--size': '24px',
        '--retained': undefined,
      },
    ],
  })
  let reads = 0
  const result = recipe({
    get size() {
      reads++
      return 'lg' as const
    },
    enabled: false,
    count: 0,
  })
  expect(reads).toBe(1)
  expect(result).toEqual({
    classes: { root: 'p-6' },
    style: { '--size': '24px', '--retained': 'base', '--enabled': 0, '--count': 0 },
  })
  expect(recipe({ size: undefined }).style['--size']).toBe('8px')
  expect(recipe({ size: null }).style['--size']).toBe('4px')
  expect(recipe()).not.toBe(recipe())
})

test('supports variable-only recipes and scoped merging without changing style output', async () => {
  const { createCn } = await import('./cn.ts')
  const recipe = slotRecipe<RootSlot, never>({
    base: { '--zero': 0, '--length': '20px' },
  })
  expect(recipe()).toEqual({ classes: {}, style: { '--zero': 0, '--length': '20px' } })
  expect(recipe.resolve(undefined, createCn({}))).toEqual(recipe())
})

const invalidVariable = slotRecipe<RootSlot, never>({
  // @ts-expect-error Custom property names must start with --.
  base: { size: '4px' },
})
void invalidVariable
