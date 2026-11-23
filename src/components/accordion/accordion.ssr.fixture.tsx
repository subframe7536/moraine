import { renderToString } from '@solidjs/web'
import { onCleanup } from 'solid-js'

import { Accordion } from './accordion'
export function AccordionHydrationFixture(props: {
  onSettled?: () => void
  onCleanup?: () => void
}) {
  return (
    <Accordion
      id="ssr-accordion"
      defaultValue={['first']}
      expandIcon={
        <svg data-testid="trailing">
          <path d="M0 0h1" />
        </svg>
      }
      items={[
        { value: 'first', label: <span>First</span>, content: <p>First panel</p> },
        {
          value: 'second',
          label: <span>Second</span>,
          get content() {
            props.onSettled?.()
            onCleanup(() => props.onCleanup?.())
            return <p>Second panel</p>
          },
        },
      ]}
    />
  )
}

export function renderAccordionFixture(): string {
  return renderToString(() => <AccordionHydrationFixture />)
}
