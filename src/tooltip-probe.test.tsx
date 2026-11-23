import { render, fireEvent } from '@solidjs/testing-library'
import { test, vi } from 'vitest'

import { Tooltip } from './components/tooltip'

test('probe switch', async () => {
  vi.useFakeTimers()
  const screen = render(() => (
    <div>
      <Tooltip>
        <Tooltip.Trigger as="button" type="button">
          First
        </Tooltip.Trigger>
        <Tooltip.Content>First tooltip</Tooltip.Content>
      </Tooltip>
      <Tooltip>
        <Tooltip.Trigger as="button" type="button">
          Second
        </Tooltip.Trigger>
        <Tooltip.Content>Second tooltip</Tooltip.Content>
      </Tooltip>
    </div>
  ))
  const firstTrigger = screen.getByText('First').closest('[data-slot="tooltip-trigger"]')!
  const secondTrigger = screen.getByText('Second').closest('[data-slot="tooltip-trigger"]')!
  fireEvent.pointerEnter(firstTrigger)
  await vi.advanceTimersByTimeAsync(600)
  fireEvent.pointerLeave(firstTrigger)
  fireEvent.pointerEnter(secondTrigger)
  await Promise.resolve()
  console.log('T0', document.body.querySelectorAll('[role=tooltip]').length)
  await vi.advanceTimersByTimeAsync(0)
  const els = document.body.querySelectorAll('[role=tooltip]')
  console.log(
    'T1',
    els.length,
    [...els].map(
      (e) => `${e.textContent}|[${[...e.attributes].map((a) => `${a.name}=${a.value}`).join(' ')}]`,
    ),
  )
})
