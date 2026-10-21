import { renderToString } from 'solid-js/web'

import { Alert } from './alert'
import type { AlertT } from './alert.types'

export function AlertHydrationFixture(props: {
  type?: AlertT.Variants['type']
  variant?: AlertT.Variants['variant']
  title?: string
  description?: string
  close?: boolean
  fullWidth?: boolean
}) {
  return (
    <Alert
      type={props.type ?? 'info'}
      variant={props.variant ?? 'subtle'}
      title={props.title ?? 'Alert title'}
      description={props.description}
      close={props.close}
      fullWidth={props.fullWidth}
    />
  )
}

export function renderAlertFixture(): string {
  return renderToString(() => (
    <AlertHydrationFixture title="Alert title" description="Detailed alert description" close />
  ))
}

export function renderMinimalAlertFixture(): string {
  return renderToString(() => <AlertHydrationFixture type="default" title="Minimal alert" />)
}
