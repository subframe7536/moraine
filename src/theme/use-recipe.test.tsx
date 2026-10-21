import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { buttonRecipe } from '../element/button/button.recipe'
import type { ButtonT } from '../element/button/button.types'
import { tooltipRecipe } from '../overlay/tooltip/tooltip.recipe'
import { MoraineProvider } from '../provider/moraine-provider'

import { defineTheme } from './create-theme'
import { defineRecipe } from './recipe'
import type { MoraineTheme } from './types'
import { useRecipe } from './use-recipe'

describe('useRecipe', () => {
  test('keeps undefined-only precedence reactive and preserves node identity', () => {
    const base = defineTheme({
      button: {
        base: { root: 'p-2' },
        variants: {
          size: { sm: { root: 'text-sm' }, lg: { root: 'text-lg' } },
        },
        defaultVariants: { size: 'sm' },
      },
    })
    const [theme, setTheme] = createSignal(base)
    const [size, setSize] = createSignal<ButtonT.Variants['size']>()
    const [inherited, setInherited] = createSignal<ButtonT.Variants['size']>()
    function Fixture() {
      const { slots } = useRecipe(
        buttonRecipe,
        {
          get size() {
            return size()
          },
        },
        {
          contextVariants: () => ({ size: inherited() }),
        },
      )
      return <button {...slots.root}>Save</button>
    }
    const screen = render(() => (
      <MoraineProvider theme={theme()}>
        <Fixture />
      </MoraineProvider>
    ))
    const button = screen.getByRole('button')
    expect(button.className).toContain('p-2')
    expect(button.className).toContain('text-sm')
    setTheme(
      defineTheme({
        extends: base,
        button: { base: { root: 'p-4' }, defaultVariants: { size: 'lg' } },
      }),
    )
    expect(button.className).toContain('text-lg')
    expect(button.className).toContain('p-4')
    setInherited('sm')
    expect(button.className).toContain('text-sm')
    expect(button.className).toContain('p-4')
    setSize('lg')
    expect(button.className).toContain('text-lg')
    expect(button.className).toContain('p-4')
    setSize(undefined)
    expect(button.className).toContain('text-sm')
    expect(button.className).toContain('p-4')
    expect(screen.getByRole('button')).toBe(button)
  })

  test('merges context, own, user, and enforced layers with undefined skip', () => {
    const [classes, setClasses] = createSignal<ButtonT.Classes>({ root: 'p-3', label: 'text-lg' })
    const [slotStyles, setSlotStyles] = createSignal<ButtonT.Styles>({ root: { color: 'blue' } })
    function Fixture() {
      const { slots } = useRecipe(
        buttonRecipe,
        {
          class: 'p-4',
          get classes() {
            return classes()
          },
          style: { color: 'red' },
          get styles() {
            return slotStyles()
          },
        },
        {
          contextSlots: () => ({
            classes: { root: 'p-2' },
            styles: { root: { color: 'green', width: '20px' } },
          }),
          own: () => ({
            root: { class: 'own-root', style: { opacity: '0.5', width: undefined } },
          }),
          enforced: () => ({
            root: { class: 'enforced-root', style: { position: 'absolute', color: 'purple' } },
          }),
        },
      )
      return (
        <button {...slots.root}>
          <span {...slots.label}>Save</span>
        </button>
      )
    }
    const screen = render(() => <Fixture />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('p-4')
    expect(button.className).toContain('own-root')
    expect(button.className).toContain('enforced-root')
    expect(button.style.color).toBe('purple')
    expect(button.style.width).toBe('20px')
    expect(button.style.position).toBe('absolute')
    expect(button.style.opacity).toBe('0.5')
    const label = screen.getByText('Save')
    expect(label.className).toContain('text-lg')
    expect(label.style.color).toBe('')
    setClasses({ root: 'p-5', label: 'text-sm' })
    setSlotStyles({ root: { width: '30px' }, label: { color: 'orange' } })
    expect(button.className).toContain('p-4')
    expect(button.style.color).toBe('purple')
    expect(button.style.width).toBe('30px')
    expect(label.className).toContain('text-sm')
    expect(label.style.color).toBe('orange')
    expect(screen.getByText('Save')).toBe(label)
  })

  test('preserves false over context and theme defaults', () => {
    const theme = defineTheme({
      tooltip: {
        base: { '--tooltip-color': 'purple' },
        defaultVariants: { invert: true },
        variants: {
          invert: {
            true: { content: 'inverted' },
            false: { content: 'plain' },
          },
        },
      },
    })
    const [invert, setInvert] = createSignal<boolean | undefined>(false)
    function Fixture() {
      const { slots } = useRecipe(
        tooltipRecipe,
        {
          get invert() {
            return invert()
          },
        },
        { slot: 'content', contextVariants: () => ({ invert: true }) },
      )
      return <div data-testid="select" {...slots.content} />
    }
    const screen = render(() => (
      <MoraineProvider theme={theme}>
        <Fixture />
      </MoraineProvider>
    ))
    const root = screen.getByTestId('select')
    expect(root.className).toContain('plain')
    expect(root.style.getPropertyValue('--tooltip-color')).toBe('purple')
    setInvert(undefined)
    expect(root.className).toContain('inverted')
  })

  test('fine-grained slot memos only recompute affected slots and skip unread ones', () => {
    type Slots = { root: string; label: string; idle: string }
    type Variants = { size: 'sm' | 'lg'; tone: 'a' | 'b' }
    const recipe = defineRecipe<Slots, Variants>('fineGrainFixture', {
      base: { root: 'base-root', label: 'base-label', idle: 'base-idle' },
      defaultVariants: { size: 'sm', tone: 'a' },
      variants: {
        size: {
          sm: { root: 'size-sm' },
          lg: { root: 'size-lg' },
        },
        tone: {
          a: { label: 'tone-a' },
          b: { label: 'tone-b' },
        },
      },
    })
    const [size, setSize] = createSignal<Variants['size']>('sm')
    const [tone, setTone] = createSignal<Variants['tone']>('a')
    let ownReads = 0
    let slots!: ReturnType<typeof useRecipe<typeof recipe>>['slots']

    function Fixture() {
      const result = useRecipe(
        recipe,
        {
          get size() {
            return size()
          },
          get tone() {
            return tone()
          },
        },
        {
          own: () => {
            ownReads += 1
            return {}
          },
        },
      )
      slots = result.slots
      return null
    }

    render(() => <Fixture />)

    expect(ownReads).toBe(0)

    const rootClass = slots.root.class
    const afterRootClass = ownReads
    expect(afterRootClass).toBe(1)
    expect(rootClass).toContain('size-sm')
    expect(slots.root.class).toBe(rootClass)
    expect(ownReads).toBe(afterRootClass)

    void slots.root.style
    const afterRootStyle = ownReads
    expect(afterRootStyle).toBe(afterRootClass + 1)

    const labelClass = slots.label.class
    const afterLabelClass = ownReads
    expect(afterLabelClass).toBe(afterRootStyle + 1)
    expect(labelClass).toContain('tone-a')
    expect(slots.label.class).toBe(labelClass)
    expect(ownReads).toBe(afterLabelClass)

    // idle unread → no additional own reads
    expect(ownReads).toBe(afterLabelClass)

    setSize('lg')
    expect(slots.root.class).toContain('size-lg')
    // Because own is isolated in its own memo and own did not change, own is NOT re-read on variant changes
    expect(ownReads).toBe(afterLabelClass)
    expect(slots.label.class).toBe(labelClass)
    expect(ownReads).toBe(afterLabelClass)

    setTone('b')
    expect(slots.label.class).toContain('tone-b')
    expect(ownReads).toBe(afterLabelClass)
    expect(slots.root.class).toContain('size-lg')
    expect(ownReads).toBe(afterLabelClass)
  })

  test('updating own for one slot does not recompute other slot memos', () => {
    type Slots = { root: string; label: string }
    const recipe = defineRecipe<Slots>('layerIsolation', {
      base: { root: 'base-root', label: 'base-label' },
    })
    const [effectRoot, setEffectRoot] = createSignal('initial-root')
    let slots!: ReturnType<typeof useRecipe<typeof recipe>>['slots']

    function Fixture2() {
      const { slots: s } = useRecipe(
        recipe,
        {},
        {
          own: () => ({
            root: { class: effectRoot() },
            label: { class: 'fixed-label' },
          }),
        },
      )
      // Read inside effect-like subscriptions
      slots = s
      return null
    }

    render(() => <Fixture2 />)

    // Initial read
    expect(slots.root.class).toContain('initial-root')
    expect(slots.label.class).toContain('fixed-label')

    // Track downstream slot reactivity
    const rootClassBefore = slots.root.class
    const labelClassBefore = slots.label.class
    expect(rootClassBefore).toContain('initial-root')
    expect(labelClassBefore).toContain('fixed-label')

    setEffectRoot('updated-root')
    expect(slots.root.class).toContain('updated-root')
    // label slot returns the exact same cached string and did not change
    expect(slots.label.class).toBe(labelClassBefore)
  })

  test('class change does not recompute style memo and vice versa', () => {
    const [rootClass, setRootClass] = createSignal('user-a')
    const [rootColor, setRootColor] = createSignal('red')
    let slots!: ReturnType<typeof useRecipe<typeof buttonRecipe>>['slots']
    function Fixture() {
      const result = useRecipe(buttonRecipe, {
        get classes() {
          return { root: rootClass() }
        },
        get styles() {
          return { root: { color: rootColor() } }
        },
      })
      slots = result.slots
      return <button {...slots.root}>Save</button>
    }
    render(() => <Fixture />)
    const styleA = slots.root.style
    expect(slots.root.class).toContain('user-a')
    setRootClass('user-b')
    expect(slots.root.class).toContain('user-b')
    expect(slots.root.style).toBe(styleA)
    const classB = slots.root.class
    setRootColor('blue')
    expect(slots.root.style.color).toBe('blue')
    expect(slots.root.class).toBe(classB)
  })

  test('overrides helper provides reactive forwarders with slot mapping', () => {
    const [color, setColor] = createSignal('red')
    const [extraClass, setExtraClass] = createSignal('dynamic-class')

    function Fixture() {
      const { overrides } = useRecipe(buttonRecipe, {
        get classes() {
          return { root: extraClass(), leading: 'fixed-leading' }
        },
        get styles() {
          return { root: { color: color() }, leading: { width: '10px' } }
        },
      })

      // Test zero-arg call (all slots)
      const allOverrides = overrides()
      expect(allOverrides.styles?.root?.color).toBe(color())
      expect(allOverrides.styles?.leading?.width).toBe('10px')
      expect(allOverrides.classes?.root).toContain(extraClass())
      expect(allOverrides.classes?.leading).toContain('fixed-leading')

      // Test array mapping
      const subsetOverrides = overrides(['root', 'leading'])
      expect(subsetOverrides.styles?.root?.color).toBe(color())
      expect(subsetOverrides.styles?.leading?.width).toBe('10px')

      // Test target-to-source mapping
      const mappedOverrides = overrides({ targetRoot: 'root', targetLeading: 'leading' })
      expect(mappedOverrides.styles?.targetRoot?.color).toBe(color())
      expect(mappedOverrides.styles?.targetLeading?.width).toBe('10px')
      expect(mappedOverrides.classes?.targetRoot).toContain(extraClass())

      return <button style={allOverrides.styles?.root}>Button</button>
    }

    const screen = render(() => <Fixture />)
    const button = screen.getByRole('button')
    expect(button.style.color).toBe('red')

    setColor('green')
    setExtraClass('updated-class')
    expect(button.style.color).toBe('green')
  })
})

test.each([undefined, 'label'] as const)(
  'inherits theme variables on %s and removes stale values without replacing nodes',
  (varsSlot) => {
    const parent = defineTheme({
      button: {
        defaultVariants: { size: 'sm' },
        base: { '--shared': 'parent' },
        variants: {
          size: {
            sm: { '--size': '8px' },
            lg: { '--size': '16px', '--large': 'yes' },
          },
        },
      },
    })
    const child = defineTheme({
      extends: parent,
      button: {
        defaultVariants: { size: 'lg' },
        base: { '--shared': 'child' },
      },
    })
    const [theme, setTheme] = createSignal<MoraineTheme | null>(child)
    const [size, setSize] = createSignal<ButtonT.Variants['size']>()
    const [inherited, setInherited] = createSignal<ButtonT.Variants['size']>()
    function Fixture() {
      const { slots } = useRecipe(
        buttonRecipe,
        {
          get size() {
            return size()
          },
        },
        {
          varsSlot,
          contextVariants: () => ({ size: inherited() }),
        },
      )
      return (
        <button {...slots.root}>
          <span {...slots.label}>Save</span>
        </button>
      )
    }
    const screen = render(() => (
      <MoraineProvider theme={theme()}>
        <Fixture />
      </MoraineProvider>
    ))
    const button = screen.getByRole('button')
    const label = screen.getByText('Save')
    const target = varsSlot === 'label' ? label : button
    const other = varsSlot === 'label' ? button : label
    expect(target.style.getPropertyValue('--size')).toBe('16px')
    expect(target.style.getPropertyValue('--shared')).toBe('child')
    expect(other.getAttribute('style')).toBeNull()
    setInherited('sm')
    expect(target.style.getPropertyValue('--size')).toBe('8px')
    expect(target.style.getPropertyValue('--large')).toBe('')
    setSize('lg')
    expect(target.style.getPropertyValue('--size')).toBe('16px')
    setSize(undefined)
    expect(target.style.getPropertyValue('--size')).toBe('8px')
    setTheme(null)
    expect(target.style.getPropertyValue('--size')).toBe('')
    expect(target.style.getPropertyValue('--shared')).toBe('')
    expect(target.style.getPropertyValue('--large')).toBe('')
    expect(screen.getByRole('button')).toBe(button)
    expect(screen.getByText('Save')).toBe(label)
  },
)

test('applies instance variables after recipe keys and before context and caller styles', () => {
  const theme = defineTheme({
    button: {
      base: { '--size': '4px', '--shared': 'recipe' },
    },
  })
  const [size, setSize] = createSignal('8px')
  function Fixture() {
    const { slots } = useRecipe(
      buttonRecipe,
      {
        styles: { root: { '--shared': 'slot' } },
        style: { '--root': 'root' },
      },
      {
        contextSlots: () => ({ styles: { root: { '--shared': 'group', '--group': 'group' } } }),
        vars: () => ({
          '--size': size(),
          '--shared': 'instance',
          '--empty': undefined,
        }),
      },
    )
    return <button {...slots.root}>Save</button>
  }
  const screen = render(() => (
    <MoraineProvider theme={theme}>
      <Fixture />
    </MoraineProvider>
  ))
  const button = screen.getByRole('button')
  expect(button.style.getPropertyValue('--size')).toBe('8px')
  expect(button.style.getPropertyValue('--shared')).toBe('slot')
  expect(button.style.getPropertyValue('--group')).toBe('group')
  expect(button.style.getPropertyValue('--root')).toBe('root')
  expect(button.style.getPropertyValue('--empty')).toBe('')
  setSize('16px')
  expect(button.style.getPropertyValue('--size')).toBe('16px')
  expect(screen.getByRole('button')).toBe(button)
})

test.each(['root', 'label'] as const)(
  'layers theme variables on %s before group, slot, and root styles',
  (slot) => {
    const theme = defineTheme({
      button: {
        base: {
          '--theme': 'theme',
          '--dynamic': 'theme',
          '--group': 'theme',
          '--slot': 'theme',
          '--root': 'theme',
        },
      },
    })
    function Fixture() {
      const { slots } = useRecipe(
        buttonRecipe,
        {
          styles: { [slot]: { '--slot': 'slot', '--root': 'slot' } },
          style: { '--root': 'root' },
        },
        {
          slot,
          varsSlot: slot,
          contextSlots: () => ({
            styles: { [slot]: { '--group': 'group', '--slot': 'group', '--root': 'group' } },
          }),
        },
      )
      return <button {...slots[slot]}>Save</button>
    }
    const screen = render(() => (
      <MoraineProvider theme={theme}>
        <Fixture />
      </MoraineProvider>
    ))
    for (const name of ['theme', 'group', 'slot', 'root']) {
      expect(screen.getByRole('button').style.getPropertyValue(`--${name}`)).toBe(name)
    }
  },
)

test('slotWith accepts accessors and reacts to dynamic style updates', () => {
  const [extraClass, setExtraClass] = createSignal('item-custom')
  const [pos, setPos] = createSignal('10px')

  function Fixture() {
    const { slotWith } = useRecipe(buttonRecipe, {})
    const item = slotWith(
      'root',
      // oxlint-disable-next-line subf/solid-reactivity -- slotWith extra accessor.
      () => ({ class: extraClass() }),
      // oxlint-disable-next-line subf/solid-reactivity -- slotWith enforcedExtra accessor.
      () => ({ style: { left: pos() } }),
    )
    return <button {...item}>Click</button>
  }

  const screen = render(() => <Fixture />)
  const button = screen.getByRole('button')
  expect(button.className).toContain('item-custom')
  expect(button.style.left).toBe('10px')

  setExtraClass('item-updated')
  setPos('25px')
  expect(button.className).toContain('item-updated')
  expect(button.style.left).toBe('25px')
})

test('ensureVariant is lazy and preserves owner when theme variants are introduced', () => {
  type Slots = { root: string }
  type Variants = { size: 'sm' | 'lg'; custom?: 'a' | 'b' }
  const recipe = defineRecipe<Slots, Variants>('button', {
    base: { root: 'base-root' },
    defaultVariants: { size: 'sm' },
    variants: {
      size: { sm: { root: 'size-sm' }, lg: { root: 'size-lg' } },
    },
  })
  const theme = defineTheme({
    button: {
      variants: {
        custom: {
          a: { root: 'custom-a' },
          b: { root: 'custom-b' },
        },
      },
    } as any,
  })

  const [custom, setCustom] = createSignal<'a' | 'b' | undefined>('a')
  let capturedVariants!: ReturnType<typeof useRecipe<typeof recipe>>['variants']

  function Fixture() {
    const result = useRecipe(recipe, {
      get custom() {
        return custom()
      },
    } as any)
    capturedVariants = result.variants
    return <button {...result.slots.root}>Save</button>
  }

  const screen = render(() => (
    <MoraineProvider theme={theme}>
      <Fixture />
    </MoraineProvider>
  ))

  const button = screen.getByRole('button')
  expect(button.className).toContain('custom-a')
  expect((capturedVariants as any).custom).toBe('a')

  setCustom('b')
  expect(button.className).toContain('custom-b')
  expect((capturedVariants as any).custom).toBe('b')
})

test('per-slot own accessor map provides fine-grained slot isolation', () => {
  type TestSlots = { root: string; leading: string; trailing: string }
  const recipe = defineRecipe<TestSlots>('test', {
    base: {
      root: 'root-base',
      leading: 'leading-base',
      trailing: 'trailing-base',
    },
  })

  const [leadingActive, setLeadingActive] = createSignal(false)
  const [trailingActive, setTrailingActive] = createSignal(false)
  let leadingReads = 0
  let trailingReads = 0

  let slots!: ReturnType<typeof useRecipe<typeof recipe>>['slots']

  function Fixture() {
    const result = useRecipe(
      recipe,
      {},
      {
        own: {
          leading: () => {
            leadingReads += 1
            return { class: leadingActive() ? 'leading-active' : undefined }
          },
          trailing: () => {
            trailingReads += 1
            return { class: trailingActive() ? 'trailing-active' : undefined }
          },
        },
      },
    )
    slots = result.slots
    return null
  }

  render(() => <Fixture />)

  // Unread slots do not evaluate own accessors
  expect(leadingReads).toBe(0)
  expect(trailingReads).toBe(0)

  // Read leading slot class
  expect(slots.leading.class).toBe('leading-base')
  expect(leadingReads).toBe(1)
  expect(trailingReads).toBe(0)

  // Read trailing slot class
  expect(slots.trailing.class).toBe('trailing-base')
  expect(leadingReads).toBe(1)
  expect(trailingReads).toBe(1)

  // Update leading signal - trailing accessor must NOT run
  setLeadingActive(true)
  expect(slots.leading.class).toBe('leading-base leading-active')
  expect(leadingReads).toBe(2)
  expect(trailingReads).toBe(1)

  // Update trailing signal - leading accessor must NOT run
  setTrailingActive(true)
  expect(slots.trailing.class).toBe('trailing-base trailing-active')
  expect(leadingReads).toBe(2)
  expect(trailingReads).toBe(2)
})
