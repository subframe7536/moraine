import { Switch } from '@src'

export interface SwitchPlaygroundProps {
  label?: string
  disabled?: boolean
  loading?: boolean
}

export function SwitchPlayground(props: SwitchPlaygroundProps) {
  return (
    <Switch
      label={props.label ?? 'Email alerts'}
      description="Receive a notification when a deployment completes."
      defaultChecked
      disabled={props.disabled ?? false}
      loading={props.loading ?? false}
    />
  )
}
