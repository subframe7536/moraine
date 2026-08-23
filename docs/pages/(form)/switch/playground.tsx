import { Switch } from '@src'
import type { SwitchT } from '@src'

export interface SwitchPlaygroundProps {
  label?: string
  size?: SwitchT.Variant['size']
  disabled?: boolean
  loading?: boolean
}

export function SwitchPlayground(props: SwitchPlaygroundProps) {
  return (
    <Switch
      label={props.label ?? 'Email alerts'}
      description="Receive a notification when a deployment completes."
      size={props.size ?? 'md'}
      defaultChecked
      disabled={props.disabled ?? false}
      loading={props.loading ?? false}
    />
  )
}
