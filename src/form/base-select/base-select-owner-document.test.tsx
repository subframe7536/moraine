import { fireEvent, render } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { MoraineProvider } from '../../provider/index.ts'
import { Combobox } from '../combobox/combobox.tsx'
import { MultiSelect } from '../multi-select/multi-select.tsx'
import { Select } from '../select/select.tsx'

const ITEMS = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
]

const fixtures: [string, () => JSX.Element][] = [
  ['Select', () => <Select items={ITEMS} defaultOpen />],
  ['Combobox', () => <Combobox items={ITEMS} defaultOpen />],
  ['MultiSelect', () => <MultiSelect items={ITEMS} defaultOpen />],
]

describe('BaseSelect owner document', () => {
  test.each(fixtures)(
    '%s keeps its portal, ARIA target, and dismissal in the trigger document',
    async (_, fixture) => {
      const frame = document.createElement('iframe')
      document.body.append(frame)
      const frameDocument = frame.contentDocument!
      const mount = frameDocument.createElement('div')
      const outside = frameDocument.createElement('button')
      outside.type = 'button'
      outside.textContent = 'Outside'
      frameDocument.body.append(mount, outside)

      const screen = render(() => <MoraineProvider>{fixture()}</MoraineProvider>, {
        container: mount,
      })

      try {
        await Promise.resolve()
        const trigger = mount.querySelector<HTMLElement>('[role="combobox"]')!
        const controlledId = trigger.getAttribute('aria-controls')!
        const listbox = frameDocument.getElementById(controlledId)

        expect(listbox?.ownerDocument).toBe(frameDocument)
        expect(document.getElementById(controlledId)).toBeNull()

        fireEvent.pointerDown(outside, { button: 0, pointerType: 'mouse' })
        expect(trigger.getAttribute('aria-expanded')).toBe('false')
      } finally {
        screen.unmount()
        frame.remove()
      }
    },
  )
})
