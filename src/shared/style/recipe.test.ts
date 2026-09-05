import { describe, expect, test } from 'vitest'

import type { SlotRecipeOptions } from './recipe.ts'
import { recipe } from './recipe.ts'

// @ts-expect-error Slot recipes require a base map.
const missingSlotBase: SlotRecipeOptions<'root'> = {}
const unknownVariantSlot: SlotRecipeOptions<'root'> = {
  base: { root: 'root' },
  // @ts-expect-error Variant slots must be declared by base.
  variants: { state: { active: { leading: 'leading' } } },
}

void missingSlotBase
void unknownVariantSlot

describe('recipe', () => {
  describe('atomic recipe', () => {
    const button = recipe({
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
      defaultVariants: {
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

    test('preserves defaultVariants when { variant: undefined } or null is passed', () => {
      expect(button({ variant: undefined })).toBe(
        'inline-flex items-center py-2 bg-primary text-primary-foreground h-9 px-4 text-sm rounded-none',
      )
      expect(button({ variant: null, size: undefined })).toBe(
        'inline-flex items-center py-2 bg-primary text-primary-foreground h-9 px-4 text-sm rounded-none',
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
    const card = recipe({
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
          class: {
            root: 'border-border',
            content: 'italic',
          },
        },
        {
          variants: { variant: ['solid', 'ghost'], size: 'lg' },
          class: {
            footer: 'justify-end',
          },
        },
      ],
      defaultVariants: {
        variant: 'solid',
        bordered: false,
      },
    })

    test('exposes slots array', () => {
      expect(card.slots).toEqual(['root', 'header', 'content', 'footer', 'icon'])
    })

    test('applies defaults to multi-slot structure and pre-resolves classes', () => {
      const slots = card()
      expect(slots.classes.root).toBe('rounded-lg border border-border p-4 bg-muted')
      expect(slots.classes.header).toBe('font-semibold text-card-foreground mb-2')
      expect(slots.classes.content).toBe('text-card-foreground')
      expect(slots.classes.footer).toBe('mt-4 flex items-center')
      expect(slots.classes.icon).toBeUndefined()

      expect(slots.root()).toBe('rounded-lg border border-border p-4 bg-muted')
      expect(slots.header()).toBe('font-semibold text-card-foreground mb-2')
    })

    test('preserves defaultVariants when { variant: undefined } or null is passed', () => {
      const slots = card({ variant: undefined })
      expect(slots.classes.root).toBe('rounded-lg border border-border p-4 bg-muted')

      const slotsNull = card({ variant: null })
      expect(slotsNull.classes.root).toBe('rounded-lg border border-border p-4 bg-muted')
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

    test('slot functions accept extra classes with cn conflict resolution', () => {
      const slots = card()
      // override p-4 with p-8 on root
      expect(slots.root('p-8', 'opacity-50')).toBe(
        'rounded-lg border border-border bg-muted p-8 opacity-50',
      )
      // extra classes without arguments return pre-resolved
      expect(slots.root()).toBe(slots.classes.root)
    })

    test('returns new instance on each call without caching', () => {
      const run1 = card({ variant: 'ghost' })
      const run2 = card({ variant: 'ghost' })
      expect(run1).not.toBe(run2)
      expect(run1.classes).toEqual(run2.classes)
    })

    test('infers slots from base without runtime slots array', () => {
      const inferred = recipe({
        base: {
          root: 'flex flex-col',
          header: 'p-4 border-b',
          body: 'p-4',
        },
      })

      expect(inferred.slots).toEqual(['root', 'header', 'body'])
      const res = inferred()
      expect(res.classes.root).toBe('flex flex-col')
      expect(res.classes.header).toBe('p-4 border-b')
      expect(res.classes.body).toBe('p-4')
      expect(res.root()).toBe('flex flex-col')
    })
  })
})
