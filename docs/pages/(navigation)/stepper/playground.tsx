import { Stepper } from '@src'
import type { StepperT } from '@src'

const ONBOARDING_STEPS: StepperT.Item[] = [
  {
    value: 'account',
    title: 'Account',
    description: 'Create credentials',
    icon: 'i-lucide:user',
    content: (
      <p class="text-xs text-muted-foreground p-3">
        Step 1: Set up your profile and login credentials.
      </p>
    ),
  },
  {
    value: 'workspace',
    title: 'Workspace',
    description: 'Team settings',
    icon: 'i-lucide:building-2',
    content: (
      <p class="text-xs text-muted-foreground p-3">
        Step 2: Define your organization name and invite collaborators.
      </p>
    ),
  },
  {
    value: 'confirm',
    title: 'Confirm',
    description: 'Launch project',
    icon: 'i-lucide:check-circle',
    content: (
      <p class="text-xs text-muted-foreground p-3">
        Step 3: Review settings and provision your instance.
      </p>
    ),
  },
]

export interface StepperPlaygroundProps {
  size?: StepperT.Variant['size']
  clickable?: boolean
  linear?: boolean
}

export function StepperPlayground(props: StepperPlaygroundProps) {
  return (
    <div class="max-w-xl w-full">
      <Stepper
        items={ONBOARDING_STEPS}
        defaultValue="account"
        size={props.size ?? 'md'}
        clickable={props.clickable ?? true}
        linear={props.linear ?? false}
      />
    </div>
  )
}
