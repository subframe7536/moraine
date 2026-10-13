import type { JSX } from 'solid-js'
import { renderToString } from 'solid-js/web'

import { AlertDialog } from './alert-dialog'

export function AlertDialogFixture(): JSX.Element {
  return <AlertDialog />
}

export function renderAlertDialogFixture(): string {
  return renderToString(() => <AlertDialogFixture />)
}

export async function renderServerAlertCallFixture(): Promise<string> {
  const confirmed = await AlertDialog.confirm({ title: 'Server title' })
  const informed = await AlertDialog.info({ id: 'billing', title: 'Server info' })
  AlertDialog.destroyAll()
  AlertDialog.destroyAll('billing')
  return `${confirmed}:${informed}`
}
