import { renderToString } from 'solid-js/web'

import { MoraineProvider } from '../provider/moraine-provider'

import { defineTheme } from './create-theme'
import { defineRecipe } from './recipe'
import { createDataAttributes } from './style-contract'
import { useRecipe } from './use-recipe'

type Slots = { root: string; label: string }
type Variants = { size: 'sm' | 'lg' }

const recipe = /* @__PURE__ */ defineRecipe<Slots, Variants>('useRecipeSsr', {
  base: { root: 'base-root', label: 'base-label', '--gap': '1px' },
  defaultVariants: { size: 'sm' },
  variants: {
    size: { sm: { root: 'size-sm', '--gap': '2px' }, lg: { root: 'size-lg', label: 'label-lg' } },
  },
})

const theme = /* @__PURE__ */ defineTheme({
  useRecipeSsr: { base: { label: 'themed-label' }, defaultVariants: { size: 'lg' } },
} as never)

export function UseRecipeSsrFixture() {
  const { slots, variants } = useRecipe(
    recipe,
    { class: 'user-root', styles: { label: { color: 'red' } } },
    {
      context: () => ({ classes: { label: 'ctx-label' } }),
      own: { root: () => ({ style: { '--own': 1 } }) },
      enforced: { label: () => ({ class: 'enforced-label' }) },
    },
  )
  // Server bindings recompute on every read; repeated reads must agree.
  const reads = [slots.root.class, slots.root.class, slots.label.class, slots.label.class]
  const styles = [slots.root.style, slots.root.style, slots.label.style]
  return (
    <div
      {...slots.root}
      data-size={variants.size}
      data-reads={JSON.stringify(reads)}
      data-styles={JSON.stringify(styles)}
    >
      <span {...slots.label} />
    </div>
  )
}

export function renderUseRecipeFixture(): string {
  return renderToString(() => <UseRecipeSsrFixture />)
}

const states = /* @__PURE__ */ createDataAttributes('expanded', 'disabled')
const bareRecipe = /* @__PURE__ */ defineRecipe<Slots>('useRecipeSsrBare', {
  base: { root: '', label: 'base-label' },
})

/** Root has no class or style; both slots carry data attributes. */
export function renderUseRecipeDataFixture(): string {
  function Fixture() {
    const { slots, slotWith } = useRecipe(
      bareRecipe,
      {},
      { data: { root: states(() => ({ expanded: open, disabled: false })) } },
    )
    const open = () => true
    return (
      <div {...slots.root}>
        <span {...slotWith('label', { data: states({ expanded: false, disabled: true }) })} />
      </div>
    )
  }
  return renderToString(() => <Fixture />)
}

export function renderUseRecipeThemedFixture(): string {
  return renderToString(() => (
    <MoraineProvider theme={theme}>
      <UseRecipeSsrFixture />
    </MoraineProvider>
  ))
}
