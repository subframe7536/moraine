import { Field, Switch } from '@src'

export function InheritedState() {
  return (
    <Field label="Notifications" size="sm" required>
      <Switch label="Email alerts" />
    </Field>
  )
}
