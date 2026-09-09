import { renderToString } from 'solid-js/web'

import { Button } from '../../elements/button/button.tsx'
import { Input } from '../../forms/input/input.tsx'
import { Textarea } from '../../forms/textarea/textarea.tsx'
import { createTheme } from '../../theme/create-theme.ts'
import { defaultTheme } from '../../theme/default-theme.ts'
import type { MoraineTheme } from '../../theme/types.ts'
import type { CnConfig } from '../style/cn.ts'

import { MoraineProvider } from './moraine-provider.tsx'

export const fixtureTheme = createTheme({
  extends: defaultTheme,
  button: { defaults: { size: 'sm' }, base: { root: 'rounded-none' } },
})

export function ThemeHydrationFixture(props: { theme?: MoraineTheme }) {
  return (
    <MoraineProvider theme={props.theme}>
      <Button loading>Save</Button>
      <Input id="theme-input" defaultValue="Input draft" aria-describedby="caller" />
      <Textarea id="theme-textarea" defaultValue="Textarea draft" />
    </MoraineProvider>
  )
}

export function renderThemeFixture() {
  return renderToString(() => <ThemeHydrationFixture theme={fixtureTheme} />)
}

export function renderHeadlessThemeFixture() {
  return renderToString(() => <ThemeHydrationFixture />)
}

export const fixtureCnConfig: CnConfig = { override: { classGroups: { p: [] } } }

export function CnHydrationFixture(props: { cnConfig?: CnConfig }) {
  return (
    <MoraineProvider cnConfig={props.cnConfig} theme={fixtureTheme}>
      <Button class="p-2 p-4">Save</Button>
      <Input defaultValue="Input draft" class="p-2 p-4" />
    </MoraineProvider>
  )
}

export function renderCnFixture() {
  return renderToString(() => <CnHydrationFixture cnConfig={fixtureCnConfig} />)
}

export function renderDefaultCnFixture() {
  return renderToString(() => <CnHydrationFixture />)
}
