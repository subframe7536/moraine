import { Stepper } from '@src'
import type { StepperT } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

const ONBOARDING_STEPS: StepperT.Item[] = [
  {
    value: 'account',
    title: 'Account',
    description: 'Create credentials',
    icon: 'i-lucide:user',
    get contentRender() {
      return (
        <p class="text-xs text-muted-foreground p-3">
          Step 1: Set up your profile and login credentials.
        </p>
      )
    },
  },
  {
    value: 'workspace',
    title: 'Workspace',
    description: 'Team settings',
    icon: 'i-lucide:building-2',
    get contentRender() {
      return (
        <p class="text-xs text-muted-foreground p-3">
          Step 2: Define your organization name and invite collaborators.
        </p>
      )
    },
  },
  {
    value: 'confirm',
    title: 'Confirm',
    description: 'Launch project',
    icon: 'i-lucide:check-circle',
    get contentRender() {
      return (
        <p class="text-xs text-muted-foreground p-3">
          Step 3: Review settings and provision your instance.
        </p>
      )
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
        {
          kind: 'select',
          prop: 'navigation',
          label: 'Navigation',
          defaultValue: 'free',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Linear', value: 'linear' },
            { label: 'Free', value: 'free' },
          ],
        },
      ]}
    >
      {(props) => (
        <div class="max-w-xl w-full">
          <Stepper
            aria-label="Onboarding steps"
            items={ONBOARDING_STEPS}
            defaultValue="account"
            size={props.size}
            navigation={props.navigation}
          />
        </div>
      )}
    </DocsPlayground>
  )
}
