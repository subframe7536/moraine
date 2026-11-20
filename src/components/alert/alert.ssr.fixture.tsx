import { renderToString } from 'solid-js/web'

import { Alert } from './alert'
import type { AlertT } from './alert.types'

export function AlertHydrationFixture(props: {
  tone?: AlertT.Variants['tone']
  variant?: AlertT.Variants['variant']
  title?: string
  description?: string
  closable?: boolean
  fullWidth?: boolean
}) {
  return (
    <Alert
      tone={props.tone ?? 'info'}
      variant={props.variant ?? 'subtle'}
      title={props.title ?? 'Alert title'}
      description={props.description}
      closable={props.closable}
      fullWidth={props.fullWidth}
    />
  )
}

export function renderAlertFixture(): string {
  return renderToString(() => (
    <AlertHydrationFixture title="Alert title" description="Detailed alert description" closable />
  ))
}

export function renderMinimalAlertFixture(): string {
  return renderToString(() => <AlertHydrationFixture tone="default" title="Minimal alert" />)
}
