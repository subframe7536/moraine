import { Stepper } from '@src'
import type { StepperT } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

const ONBOARDING_STEPS: StepperT.Item[] = [
  {
    value: 'account',
    title: 'Account',
    description: 'Create credentials',
    icon: 'i-lucide:user',
    get content() {
      return <p>Set up your profile and login credentials.</p>
    },
  },
  {
    value: 'workspace',
    title: 'Workspace',
    description: 'Team settings',
    icon: 'i-lucide:building-2',
    get content() {
      return <p>Name your organization and invite collaborators.</p>
    },
  },
  {
    value: 'confirm',
    title: 'Confirm',
    description: 'Launch project',
    icon: 'i-lucide:check-circle',
    get content() {
      return <p>Review settings and provision your instance.</p>
    },
  },
]

export default function StepperPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'size',
          label: 'Size',
          defaultValue: 'md',
          options: [
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
          ],
        },
        { kind: 'switch', prop: 'clickable', label: 'Clickable', defaultValue: true },
        { kind: 'switch', prop: 'linear', label: 'Linear flow', defaultValue: false },
      ]}
    >
      {(props) => (
        <div class="max-w-xl w-full">
          <Stepper
            aria-label="Onboarding steps"
            items={ONBOARDING_STEPS}
            defaultValue="account"
            size={props.size}
            clickable={props.clickable}
            linear={props.linear}
          />
        </div>
      )}
    </DocsPlayground>
  )
}
