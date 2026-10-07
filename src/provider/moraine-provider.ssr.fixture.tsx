import { renderToString } from 'solid-js/web'

import { Button } from '../element/button/button'
import { Input } from '../form/input/input'
import { Textarea } from '../form/textarea/textarea'
import { Pagination } from '../navigation/pagination/pagination'
import { Dialog } from '../overlay/dialog/dialog'
import type { CnConfig } from '../theme/cn'
import { defineTheme } from '../theme/create-theme'
import type { MoraineTheme } from '../theme/types'

import type { MoraineMessagesInput } from './locale/messages.types'
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

export const localeMessages = {
  dialog: { close: 'Fermer' },
  pagination: {
    label: 'Pages',
    currentPage: ({ page, total }) => `Seite ${page} von ${total}`,
  },
} satisfies MoraineMessagesInput

export function LocaleHydrationFixture() {
  return (
    <MoraineProvider messages={localeMessages}>
      <Pagination total={30} page={1} />
      <Dialog open>
        <Dialog.Trigger as="button" type="button">
          Open
        </Dialog.Trigger>
        <Dialog.Content title="Title">Body</Dialog.Content>
      </Dialog>
    </MoraineProvider>
  )
}

export function renderLocaleFixture() {
  return renderToString(() => <LocaleHydrationFixture />)
}
