import { renderToString } from 'solid-js/web'

import { Button } from '../elements/button/button'
import { Input } from '../forms/input/input'
import { Textarea } from '../forms/textarea/textarea'
import { defineTheme } from '../theme/create-theme'
import type { CnConfig } from '../theme/style/cn'
import type { MoraineTheme } from '../theme/types'

import { MoraineProvider } from './moraine-provider'

export const fixtureTheme = defineTheme({
  button: { defaultVariants: { size: 'sm' }, base: { root: 'rounded-none' } },
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
