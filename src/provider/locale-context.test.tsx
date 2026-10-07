import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { InputNumber } from '../form/input-number/input-number'
import { Pagination } from '../navigation/pagination/pagination'
import { Dialog } from '../overlay/dialog/dialog'

import { useLocale, useMessages } from './locale-context'
import { enMessages } from './locale/en'
import { MoraineProvider } from './moraine-provider'

function controlValue(element: HTMLElement): string {
  if (!(element instanceof HTMLInputElement)) {
    throw new Error('expected an input')
  }
  return element.value
}

function LocaleProbe() {
  const locale = useLocale()
  const messages = useMessages()
  return (
    <i
      data-locale={locale.locale() ?? ''}
      data-dir={locale.dir() ?? ''}
      data-close={messages().dialog.close}
      data-sheet={messages().sheet.close}
    />
  )
}

describe('Moraine locale', () => {
  test('uses English messages and leaves locale and direction unset without a provider', () => {
    const screen = render(() => (
      <>
        <LocaleProbe />
        <Pagination total={10} />
      </>
    ))

    const probe = screen.container.querySelector('i')!
    expect(probe.dataset.locale).toBe('')
    expect(probe.dataset.dir).toBe('')
    expect(probe.dataset.close).toBe(enMessages.dialog.close)
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeTruthy()
  })

  test('inherits locale, direction, and messages, and lets a child replace them', () => {
    const screen = render(() => (
      <MoraineProvider
        locale="de-DE"
        dir="rtl"
        messages={{ dialog: { close: 'Parent' }, sheet: { close: 'Blatt' } }}
      >
        <LocaleProbe />
        <MoraineProvider>
          <LocaleProbe />
        </MoraineProvider>
        <MoraineProvider locale="en-US" dir="ltr" messages={{ dialog: { close: 'Child' } }}>
          <LocaleProbe />
        </MoraineProvider>
      </MoraineProvider>
    ))

    const [outer, inherited, replaced] = screen.container.querySelectorAll('i')
    expect(outer?.dataset).toMatchObject({
      locale: 'de-DE',
      dir: 'rtl',
      close: 'Parent',
      sheet: 'Blatt',
    })
    expect(inherited?.dataset).toMatchObject({
      locale: 'de-DE',
      dir: 'rtl',
      close: 'Parent',
      sheet: 'Blatt',
    })
    expect(replaced?.dataset).toMatchObject({
      locale: 'en-US',
      dir: 'ltr',
      close: 'Child',
      sheet: 'Blatt',
    })
  })

  test('formats InputNumber from the provider locale unless the prop sets one', () => {
    const screen = render(() => (
      <MoraineProvider locale="de-DE">
        <InputNumber aria-label="Inherited" defaultValue={12.5} />
        <MoraineProvider locale="en-US">
          <InputNumber aria-label="Replaced" defaultValue={12.5} />
        </MoraineProvider>
        <InputNumber aria-label="Explicit" defaultValue={12.5} locale="en-US" />
      </MoraineProvider>
    ))

    expect(controlValue(screen.getByRole('spinbutton', { name: 'Inherited' }))).toBe('12,5')
    expect(controlValue(screen.getByRole('spinbutton', { name: 'Replaced' }))).toBe('12.5')
    expect(controlValue(screen.getByRole('spinbutton', { name: 'Explicit' }))).toBe('12.5')
  })

  test('updates an already rendered label when messages change', () => {
    const [close, setClose] = createSignal('Close')
    render(() => (
      <MoraineProvider messages={{ dialog: { close: close() } }}>
        <Dialog open>
          <Dialog.Content>Hi</Dialog.Content>
        </Dialog>
      </MoraineProvider>
    ))

    const button = document.body.querySelector(
      '[data-slot="dialog-content-close"]',
    ) as HTMLButtonElement
    expect(button.getAttribute('aria-label')).toBe('Close')
    setClose('Fermer')
    expect(button.getAttribute('aria-label')).toBe('Fermer')
  })
})
