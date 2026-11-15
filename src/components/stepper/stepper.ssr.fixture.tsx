import { renderToString } from 'solid-js/web'

import { Stepper } from './stepper'

export function StepperHydrationFixture(props: { onContentRead?: () => void; vertical?: boolean }) {
  return (
    <Stepper
      id="ssr-stepper"
      navigation="free"
      orientation={props.vertical ? 'vertical' : 'horizontal'}
      items={[
        {
          value: 'first',
          label: <span>First step</span>,
          description: <span>Start here</span>,
          content: <p>First panel</p>,
        },
        {
          value: 'second',
          label: <span>Second step</span>,
          get content() {
            props.onContentRead?.()
            return <p>Second panel</p>
          },
        },
      ]}
    />
  )
}

export function renderStepperFixture(): string {
  return renderToString(() => <StepperHydrationFixture />)
}

export function renderVerticalStepperFixture(): string {
  return renderToString(() => <StepperHydrationFixture vertical />)
}

export function DuplicateStepperFixture() {
  return (
    <Stepper
      id="ssr-duplicate-stepper"
      value="billing address"
      items={[
        { value: 'billing address', label: 'First', content: 'First panel' },
        { value: 'billing address', label: 'Second', content: 'Second panel' },
      ]}
    />
  )
}

export function renderDuplicateStepperFixture(): string {
  return renderToString(() => <DuplicateStepperFixture />)
}
