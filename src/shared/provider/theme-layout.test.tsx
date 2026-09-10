import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { expect, test } from 'vitest'

import { Resizable } from '../../elements/resizable/resizable'
import { Separator } from '../../elements/separator/separator'
import { RadioGroup } from '../../forms/radio-group/radio-group'
import { Slider } from '../../forms/slider/slider'
import { SidebarFrame } from '../../navigation/sidebar-frame/sidebar-frame'
import { Stepper } from '../../navigation/stepper/stepper'
import { Tabs } from '../../navigation/tabs/tabs'
import { Sheet } from '../../overlays/sheet/sheet'
import { createTheme } from '../../theme/create-theme'
import { defaultTheme } from '../../theme/default-theme'

import { MoraineProvider } from './moraine-provider'

test('resolves layout defaults reactively for styles, semantics, and keyboard navigation', () => {
  const verticalTheme = createTheme({
    extends: defaultTheme,
    separator: { defaults: { orientation: 'vertical' } },
    slider: { defaults: { orientation: 'vertical' } },
    tabs: { defaults: { orientation: 'vertical' } },
    stepper: { defaults: { orientation: 'vertical' } },
    resizable: { defaults: { orientation: 'vertical' } },
    radioGroup: { defaults: { orientation: 'horizontal' } },
    sidebarFrame: { defaults: { side: 'right' } },
  })
  const [theme, setTheme] = createSignal(verticalTheme)
  const screen = render(() => (
    <MoraineProvider theme={theme()}>
      <Separator data-testid="separator" />
      <Separator data-testid="explicit" orientation="horizontal" />
      <Slider defaultValue={50} />
      <Tabs
        items={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ]}
      />
      <Stepper
        items={[
          { value: 'a', title: 'First' },
          { value: 'b', title: 'Second' },
        ]}
      />
      <RadioGroup items={['Basic', 'Pro']} />
      <Resizable data-testid="resizable">
        <Resizable.Panel>Left</Resizable.Panel>
        <Resizable.Handle />
        <Resizable.Panel>Right</Resizable.Panel>
      </Resizable>
      <SidebarFrame data-testid="sidebar" isMobile={false} />
    </MoraineProvider>
  ))
  expect(screen.getByTestId('separator').getAttribute('aria-orientation')).toBe('vertical')
  expect(screen.getByTestId('separator').classList.contains('w-px')).toBe(true)
  expect(screen.getByTestId('explicit').getAttribute('aria-orientation')).toBe('horizontal')
  expect(screen.getByRole('slider', { name: 'Thumb' }).getAttribute('aria-orientation')).toBe(
    'vertical',
  )
  for (const list of screen.getAllByRole('tablist')) {
    expect(list.getAttribute('aria-orientation')).toBe('vertical')
  }
  expect(screen.getByRole('radiogroup').getAttribute('aria-orientation')).toBe('horizontal')
  expect(screen.getByTestId('resizable').classList.contains('flex-col')).toBe(true)
  expect(screen.getByTestId('sidebar').classList.contains('flex-row-reverse')).toBe(true)
  const alpha = screen.getByRole('tab', { name: 'Alpha' })
  alpha.focus()
  fireEvent.keyDown(alpha, { key: 'ArrowDown' })
  expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Beta' }))

  setTheme(defaultTheme)
  expect(screen.getByTestId('separator').getAttribute('aria-orientation')).toBe('horizontal')
  expect(screen.getByRole('slider', { name: 'Thumb' }).getAttribute('aria-orientation')).toBe(
    'horizontal',
  )
  for (const list of screen.getAllByRole('tablist')) {
    expect(list.getAttribute('aria-orientation')).toBe('horizontal')
  }
  expect(screen.getByRole('radiogroup').getAttribute('aria-orientation')).toBe('vertical')
  expect(screen.getByTestId('resizable').classList.contains('flex-row')).toBe(true)
  expect(screen.getByTestId('sidebar').classList.contains('flex-row')).toBe(true)
})

test('uses the theme side for Sheet and lets explicit props override it', () => {
  const [side, setSide] = createSignal<'right' | undefined>()
  render(() => (
    <MoraineProvider
      theme={createTheme({ extends: defaultTheme, sheet: { defaults: { side: 'left' } } })}
    >
      <Sheet open>
        <Sheet.Content side={side()} body="Panel" />
      </Sheet>
    </MoraineProvider>
  ))
  const content = document.body.querySelector('[data-slot="content"]')!
  expect(content.classList.contains('left-0')).toBe(true)
  setSide('right')
  expect(content.classList.contains('right-0')).toBe(true)
})
