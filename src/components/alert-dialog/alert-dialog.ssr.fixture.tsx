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
  const confirmed = await AlertDialog.confirm({ title: 'Server title' }).result()
  const informed = await AlertDialog.info({ host: 'billing', title: 'Server info' }).result()
  const first = AlertDialog.show({ title: 'First' })
  const second = AlertDialog.show({ title: 'Second' })
  AlertDialog.close()
  AlertDialog.close('billing')
  AlertDialog.close({ host: 'billing' })
  return `${confirmed}:${informed}:${first.id === second.id ? 'same' : 'unique'}`
}
