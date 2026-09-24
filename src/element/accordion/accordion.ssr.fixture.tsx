import { onCleanup } from 'solid-js'
import { renderToString } from 'solid-js/web'

import { Accordion } from './accordion.tsx'

export function AccordionHydrationFixture(props: { onMount?: () => void; onCleanup?: () => void }) {
  return (
    <Accordion
      id="ssr-accordion"
      defaultValue={['first']}
      trailing={
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
            props.onMount?.()
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
