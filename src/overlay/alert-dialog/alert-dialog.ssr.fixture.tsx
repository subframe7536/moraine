import type { JSX } from 'solid-js'
import { renderToString } from 'solid-js/web'

import { AlertDialog } from './alert-dialog'

function OpenAlert(): JSX.Element {
  void AlertDialog.confirm({
    title: 'Server title',
    description: 'Server description',
    content: 'Server body',
  })
  return <></>
}

export function AlertDialogFixture(): JSX.Element {
  return (
    <>
      <AlertDialog />
      <OpenAlert />
    </>
  )
}

export function renderAlertDialogFixture(): string {
  return renderToString(() => <AlertDialogFixture />)
}
