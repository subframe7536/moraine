import { createMemo, createRoot, createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { cn } from './cn'
import type { RecipeConfig, RecipeVariantSelection } from './recipe'
import { defineRecipe, resolveRecipe } from './recipe'

function testRecipe<S extends object, V = never>(key: string, config: RecipeConfig<S, V>) {
  const definition = defineRecipe<S, V>(key, config)
  const fn = (variants?: RecipeVariantSelection<V>) => resolveRecipe(definition, variants, cn)
  return Object.assign(fn, {
    resolve: (variants: RecipeVariantSelection<V> | undefined, merge: typeof cn) =>
      resolveRecipe(definition, variants, merge),
  })
}

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

// @ts-expect-error Component recipe base is required.
const missingSlotBase: RecipeConfig<RootSlot, never> = {}
const unknownVariantSlot: RecipeConfig<RootSlot, StateVariant> = {
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
  describe('multi-slot recipe', () => {
    const card = testRecipe<CardSlot, CardVariant>('card', {
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
      defaultVariants: {
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

    test('resolves declared slots without a runtime slots array', () => {
      const inferred = testRecipe<InferredSlot>('inferred', {
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
        const [slotVariant, setSlotVariant] = createSignal<'solid' | 'ghost'>('solid')
        const slotClass = createMemo(
          () =>
            card({
              get variant() {
                return slotVariant()
              },
            }).classes.root,
        )

        // oxlint-disable-next-line subf/solid-reactivity
        expect(slotClass()).toContain('bg-muted')

        setSlotVariant('ghost')

        // oxlint-disable-next-line subf/solid-reactivity
        expect(slotClass()).toContain('border-transparent')
        dispose()
      })
    })
  })
})

test('matches sparse compound-only keys and preserves false, zero, empty string, and null', () => {
  const sparse = testRecipe<RootSlot, SparseVariant>('sparse', {
    base: { root: '' },
    defaultVariants: { enabled: false, count: 0, label: '' },
    compoundVariants: [{ variants: { enabled: false, count: 0, label: '' }, root: 'p-2' }],
  })
  expect(sparse()).toEqual({ classes: { root: 'p-2' }, style: {} })
  expect(sparse({ count: undefined })).toEqual({ classes: { root: 'p-2' }, style: {} })
  expect(sparse({ count: null })).toEqual({ classes: {}, style: {} })
})

test('resolves base, variant, and compound classes with an explicit merger', async () => {
  const { cn, createCn } = await import('./cn')
  const customCn = createCn({ override: { classGroups: { p: [] } } })
  const slots = testRecipe<RootSlot, { active?: boolean }>('slots', {
    base: { root: 'p-2' },
    variants: { active: { true: { root: 'p-4' } } },
    compoundVariants: [{ variants: { active: true }, root: 'p-6' }],
  })
  expect(slots({ active: true })).toEqual({ classes: { root: 'p-6' }, style: {} })
  expect(slots.resolve({ active: true }, customCn)).toEqual({
    classes: { root: 'p-2 p-4 p-6' },
    style: {},
  })
  expect(slots.resolve({ active: true }, cn)).toEqual(slots({ active: true }))
  expect(slots()).toEqual({ classes: { root: 'p-2' }, style: {} })
})

test('resolves classes and variables from the same matched branches', () => {
  const recipe = testRecipe<RootSlot, { size: 'sm' | 'lg'; enabled: boolean; count: 0 | 1 }>(
    'vars',
    {
      defaultVariants: { size: 'sm', enabled: true, count: 1 },
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
    },
  )
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
})

test('supports variable-only recipes and scoped merging without changing style output', async () => {
  const { createCn } = await import('./cn')
  const recipe = testRecipe<RootSlot>('root', {
    base: { root: '', '--zero': 0, '--length': '20px' },
  })
  expect(recipe()).toEqual({
    classes: { root: undefined },
    style: { '--zero': 0, '--length': '20px' },
  })
  expect(recipe.resolve(undefined, createCn({}))).toEqual(recipe())
})

const invalidVariable = testRecipe<RootSlot>('root', {
  // @ts-expect-error Custom property names must start with --.
  base: { size: '4px' },
})
void invalidVariable

test.each([
  [1, true, 'block grid-cols-1 opacity-100'],
  [2, true, 'block grid-cols-2 opacity-100 gap-4'],
  [2, false, 'block grid-cols-2 opacity-50'],
] as const)('matches numeric and boolean variants (%i, %s)', (columns, enabled, expected) => {
  const recipe = testRecipe<RootSlot, { columns?: 1 | 2; enabled?: boolean }>('grid', {
    base: { root: 'block' },
    variants: {
      columns: { 1: { root: 'grid-cols-1' }, 2: { root: 'grid-cols-2' } },
      enabled: { true: { root: 'opacity-100' }, false: { root: 'opacity-50' } },
    },
    compoundVariants: [{ variants: { columns: 2, enabled: true }, root: 'gap-4' }],
  })
  expect(recipe({ columns, enabled }).classes.root).toBe(expected)
})
