import { renderToString } from 'solid-js/web'

import { RadioGroup } from './radio-group'

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

export function renderSparseRadioGroupFixture(): string {
  return renderToString(() => (
    <RadioGroup
      id="plans"
      name="plan"
      value="pro"
      items={[
        { value: 'basic', description: 'Basic description' },
        { value: 'pro', label: 'Pro' },
        { value: 'enterprise' },
      ]}
    />
  ))
}
