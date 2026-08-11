import { renderToString } from 'solid-js/web'

import { RadioGroup } from './radio-group.tsx'

export function renderRadioGroupFixture(): string {
  return renderToString(() => (
    <RadioGroup
      id="plans"
      name="plan"
      value="pro"
      items={[
        { value: 'basic', label: 'Basic', description: 'Basic description' },
        { value: 'pro', label: 'Pro', description: 'Pro description' },
        { value: 'enterprise', label: 'Enterprise', description: 'Enterprise description' },
      ]}
    />
  ))
}
