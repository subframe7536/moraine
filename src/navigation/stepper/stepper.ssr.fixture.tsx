import { renderToString } from 'solid-js/web'

import { Stepper } from './stepper.tsx'

export function StepperHydrationFixture(props: { onContentRead?: () => void; vertical?: boolean }) {
  return (
    <Stepper
      id="ssr-stepper"
      clickable
      linear={false}
      orientation={props.vertical ? 'vertical' : 'horizontal'}
      items={[
        {
          value: 'first',
          title: <span>First step</span>,
          description: <span>Start here</span>,
          content: <p>First panel</p>,
        },
        {
          value: 'second',
          title: <span>Second step</span>,
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
        { value: 'billing address', title: 'First', content: 'First panel' },
        { value: 'billing address', title: 'Second', content: 'Second panel' },
      ]}
    />
  )
}

export function renderDuplicateStepperFixture(): string {
  return renderToString(() => <DuplicateStepperFixture />)
}
