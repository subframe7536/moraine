import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { expect, test } from 'vitest'

import { Resizable } from '../element/resizable/resizable'
import { Separator } from '../element/separator/separator'
import { RadioGroup } from '../form/radio-group/radio-group'
import { Slider } from '../form/slider/slider'
import { SidebarFrame } from '../navigation/sidebar-frame/sidebar-frame'
import { useSidebarFrame } from '../navigation/sidebar-frame/sidebar-frame-context'
import { Stepper } from '../navigation/stepper/stepper'
import { Tabs } from '../navigation/tab/tabs'
import { Sheet } from '../overlay/sheet/sheet'
import { defineTheme } from '../theme/create-theme'
import type { MoraineTheme } from '../theme/types'

import { MoraineProvider } from './moraine-provider'

test('resolves layout defaults reactively for styles, semantics, and keyboard navigation', () => {
  const verticalTheme = defineTheme({
    separator: { defaultVariants: { orientation: 'vertical' } },
    slider: { defaultVariants: { orientation: 'vertical' } },
    tabs: { defaultVariants: { orientation: 'vertical' } },
    stepper: { defaultVariants: { orientation: 'vertical' } },
    resizable: { defaultVariants: { orientation: 'vertical' } },
    radioGroup: { defaultVariants: { orientation: 'horizontal' } },
    sidebarFrame: { defaultVariants: { side: 'right' } },
  })
  const [theme, setTheme] = createSignal<MoraineTheme | null>(verticalTheme)
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

  setTheme(null)
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
    <MoraineProvider theme={defineTheme({ sheet: { defaultVariants: { side: 'left' } } })}>
      <Sheet open>
        <Sheet.Content side={side()} body="Panel" />
      </Sheet>
    </MoraineProvider>
  ))
  const content = document.body.querySelector('[data-slot="sheet-content"]')!
  expect(content.classList.contains('left-0')).toBe(true)
  setSide('right')
  expect(content.classList.contains('right-0')).toBe(true)
})

test('inherits built-in defaultVariants on theme layers unless explicitly overridden', async () => {
  const customBaseTheme = defineTheme({
    sidebarFrame: {
      base: {
        root: 'custom-frame-root',
        sidebar: 'custom-sidebar',
      },
    },
    slider: {
      base: {
        root: 'custom-slider-root',
      },
    },
  })

  function FrameToggle() {
    const frame = useSidebarFrame()
    return (
      <button type="button" onClick={frame.toggle}>
        Toggle Sidebar
      </button>
    )
  }

  const [theme, setTheme] = createSignal<MoraineTheme>(customBaseTheme)
  const screen = render(() => (
    <MoraineProvider theme={theme()}>
      <SidebarFrame isMobile={true}>
        <SidebarFrame.Sidebar>Sidebar Content</SidebarFrame.Sidebar>
        <SidebarFrame.Main>
          <FrameToggle />
        </SidebarFrame.Main>
      </SidebarFrame>
      <Slider defaultValue={50} />
    </MoraineProvider>
  ))

  // Slider inherits built-in orientation: 'horizontal'
  expect(screen.getByRole('slider', { name: 'Thumb' }).getAttribute('aria-orientation')).toBe(
    'horizontal',
  )

  // SidebarFrame inherits built-in side: 'left', so mobile Sheet opens on the left (left-0, not right-0)
  fireEvent.click(screen.getByText('Toggle Sidebar'))
  await waitFor(() => {
    const content = document.body.querySelector('[data-slot="sheet-content"]')!
    expect(content).not.toBeNull()
    expect(content.classList.contains('left-0')).toBe(true)
    expect(content.classList.contains('right-0')).toBe(false)
  })

  // Theme can explicitly override defaultVariants
  setTheme(
    defineTheme({
      sidebarFrame: {
        base: {
          root: 'custom-frame-root',
          sidebar: 'custom-sidebar',
        },
        defaultVariants: { side: 'right' },
      },
      slider: {
        base: {
          root: 'custom-slider-root',
        },
        defaultVariants: { orientation: 'vertical' },
      },
    }),
  )

  expect(
    screen.getByRole('slider', { name: 'Thumb', hidden: true }).getAttribute('aria-orientation'),
  ).toBe('vertical')
  await waitFor(() => {
    const content = document.body.querySelector('[data-slot="sheet-content"]')!
    expect(content.classList.contains('right-0')).toBe(true)
    expect(content.classList.contains('left-0')).toBe(false)
  })
})
