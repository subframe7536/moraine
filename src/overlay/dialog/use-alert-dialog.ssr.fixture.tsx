import type { JSX } from 'solid-js'
import { renderToString } from 'solid-js/web'

import { useAlertDialog } from './use-alert-dialog'

export function AlertDialogFixture(): JSX.Element {
  const [alert, Holder] = useAlertDialog()
  void alert.confirm({
    title: 'Server title',
    description: 'Server description',
    content: 'Server body',
  })
  return <Holder />
}

export function renderAlertDialogFixture(): string {
  return renderToString(() => <AlertDialogFixture />)
}
