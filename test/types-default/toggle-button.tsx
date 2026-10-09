import { ToggleButton } from 'moraine'
import type { ToggleButtonT } from 'moraine'
import { defineTheme } from 'moraine/theme'

const variants: ToggleButtonT.Variant = {
  variant: 'outline',
  activeVariant: 'default',
  size: 'icon-sm',
}
;<ToggleButton {...variants} pressed onPressedChange={(pressed: boolean) => void pressed}>
  {(state) => (
    <span>
      {state.pressed ? 'On' : 'Off'} {state.loading ? 'Loading' : ''}
    </span>
  )}
</ToggleButton>
defineTheme({
  toggleButton: {
    defaultVariants: { variant: 'ghost', activeVariant: 'secondary' },
  },
})
// @ts-expect-error ToggleButton does not support activeEffect and always uses 'none' internally.
;<ToggleButton activeEffect="none" />
;<ToggleButton as="a" href="/docs" />
// @ts-expect-error ToggleButton<'a'> exposes anchor props and rejects button-only props.
;<ToggleButton as="a" formAction="/submit" />
// @ts-expect-error Pressed semantics are owned by the component.
const unsupportedAria: ToggleButtonT.Props = { 'aria-pressed': 'mixed' }
void unsupportedAria
// @ts-expect-error Only existing Button variants are supported.
;<ToggleButton activeVariant="selected" />
// @ts-expect-error Style accepts objects only.
;<ToggleButton style="color: red" />
