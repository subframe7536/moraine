import { render, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { defaultKbdMessages } from '../../element/kbd/kbd.messages'
import { defaultResizableMessages } from '../../element/resizable/resizable.messages'
import { defaultComboboxMessages } from '../../form/combobox/combobox.messages'
import { defaultFileUploadMessages } from '../../form/file-upload/file-upload.messages'
import { defaultFormMessages } from '../../form/form/form.messages'
import { InputNumber } from '../../form/input-number/input-number'
import { defaultInputNumberMessages } from '../../form/input-number/input-number.messages'
import { defaultMultiSelectMessages } from '../../form/multi-select/multi-select.messages'
import { defaultSelectMessages } from '../../form/select/select.messages'
import { defaultTagsFieldMessages } from '../../form/shared/select/tags-field.messages'
import { defaultSliderMessages } from '../../form/slider/slider.messages'
import { defaultBreadcrumbMessages } from '../../navigation/breadcrumb/breadcrumb.messages'
import { defaultCommandPaletteMessages } from '../../navigation/command-palette/command-palette.messages'
import { Pagination } from '../../navigation/pagination/pagination'
import { defaultPaginationMessages } from '../../navigation/pagination/pagination.messages'
import { defaultSidebarFrameMessages } from '../../navigation/sidebar-frame/sidebar-frame.messages'
import { Dialog } from '../../overlay/dialog/dialog'
import { defaultDialogMessages } from '../../overlay/dialog/dialog.messages'
import { defaultSheetMessages } from '../../overlay/sheet/sheet.messages'
import { MoraineProvider } from '../moraine-provider'

import { useLocale, useLocaleAccessor, useMessages } from './locale-context'
import type { MoraineMessagesInput, MoraineMessages } from './messages.types'

const DEFAULT_MESSAGES: MoraineMessages = Object.freeze({
  dialog: defaultDialogMessages,
  sheet: defaultSheetMessages,
  breadcrumb: defaultBreadcrumbMessages,
  commandPalette: defaultCommandPaletteMessages,
  select: defaultSelectMessages,
  combobox: defaultComboboxMessages,
  multiSelect: defaultMultiSelectMessages,
  slider: defaultSliderMessages,
  pagination: defaultPaginationMessages,
  inputNumber: defaultInputNumberMessages,
  fileUpload: defaultFileUploadMessages,
  tagsField: defaultTagsFieldMessages,
  resizable: defaultResizableMessages,
  sidebarFrame: defaultSidebarFrameMessages,
  form: defaultFormMessages,
  kbd: defaultKbdMessages,
})

function controlValue(element: HTMLElement): string {
  if (!(element instanceof HTMLInputElement)) {
    throw new Error('expected an input')
  }
  return element.value
}

function LocaleProbe() {
  const locale = useLocale()
  const dialog = useMessages('dialog', defaultDialogMessages)
  const sheet = useMessages('sheet', defaultSheetMessages)
  return (
    <i
      data-locale={locale.locale() ?? ''}
      data-dir={locale.dir() ?? ''}
      data-close={dialog().close}
      data-sheet={sheet().close}
    />
  )
}

describe('Moraine locale', () => {
  test('uses English messages and en-US locale without a provider', () => {
    const language = vi.spyOn(navigator, 'language', 'get').mockReturnValue('fr-FR')
    try {
      const screen = render(() => (
        <>
          <LocaleProbe />
          <Pagination total={10} />
          <InputNumber aria-label="Quantity" defaultValue={12.5} />
        </>
      ))

      const probe = screen.container.querySelector('i')!
      expect(probe.dataset.locale).toBe('en-US')
      expect(language).not.toHaveBeenCalled()
      expect(probe.dataset.dir).toBe('')
      expect(probe.dataset.close).toBe(DEFAULT_MESSAGES.dialog.close)
      expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeTruthy()
      expect(controlValue(screen.getByRole('spinbutton', { name: 'Quantity' }))).toBe('12.5')
    } finally {
      language.mockRestore()
    }
  })

  test('returns stable default resolved locale without a provider', () => {
    const first = useLocaleAccessor()()
    const second = useLocaleAccessor()()
    expect(first).toBe(second)
  })

  test('detectLocale={false} stays en-US', () => {
    const language = vi.spyOn(navigator, 'language', 'get').mockReturnValue('fr-FR')
    try {
      const screen = render(() => (
        <MoraineProvider detectLocale={false}>
          <LocaleProbe />
        </MoraineProvider>
      ))
      expect(screen.container.querySelector('i')!.dataset.locale).toBe('en-US')
      expect(language).not.toHaveBeenCalled()
    } finally {
      language.mockRestore()
    }
  })

  test('root provider detects the browser after mount and a microtask', async () => {
    const language = vi.spyOn(navigator, 'language', 'get').mockReturnValue('fr-FR')
    try {
      const screen = render(() => (
        <MoraineProvider>
          <LocaleProbe />
        </MoraineProvider>
      ))

      const probe = screen.container.querySelector('i')!
      expect(probe.dataset.locale).toBe('en-US')
      await waitFor(() => {
        expect(probe.dataset.locale).toBe('fr-FR')
      })

      language.mockReturnValue('de-DE')
      window.dispatchEvent(new Event('languagechange'))
      await waitFor(() => {
        expect(probe.dataset.locale).toBe('de-DE')
      })
    } finally {
      language.mockRestore()
    }
  })

  test('explicit locale wins over detectLocale', async () => {
    const language = vi.spyOn(navigator, 'language', 'get').mockReturnValue('fr-FR')
    try {
      const screen = render(() => (
        <MoraineProvider locale="zh-CN">
          <LocaleProbe />
        </MoraineProvider>
      ))

      const probe = screen.container.querySelector('i')!
      expect(probe.dataset.locale).toBe('zh-CN')
      await Promise.resolve()
      await Promise.resolve()
      expect(probe.dataset.locale).toBe('zh-CN')
      expect(language).not.toHaveBeenCalled()
    } finally {
      language.mockRestore()
    }
  })

  test('nested detectLocale={false} inherits the parent tag', () => {
    const language = vi.spyOn(navigator, 'language', 'get').mockReturnValue('fr-FR')
    try {
      const screen = render(() => (
        <MoraineProvider locale="zh-CN">
          <LocaleProbe />
          <MoraineProvider detectLocale={false}>
            <LocaleProbe />
          </MoraineProvider>
        </MoraineProvider>
      ))

      const [parent, child] = screen.container.querySelectorAll('i')
      expect(parent?.dataset.locale).toBe('zh-CN')
      expect(child?.dataset.locale).toBe('zh-CN')
      expect(language).not.toHaveBeenCalled()
    } finally {
      language.mockRestore()
    }
  })

  test('nested provider omitting locale inherits the parent detected tag', async () => {
    const language = vi.spyOn(navigator, 'language', 'get').mockReturnValue('fr-FR')
    try {
      const screen = render(() => (
        <MoraineProvider>
          <LocaleProbe />
          <MoraineProvider>
            <LocaleProbe />
          </MoraineProvider>
        </MoraineProvider>
      ))

      const [parent, child] = screen.container.querySelectorAll('i')
      expect(parent?.dataset.locale).toBe('en-US')
      expect(child?.dataset.locale).toBe('en-US')
      await waitFor(() => {
        expect(parent?.dataset.locale).toBe('fr-FR')
        expect(child?.dataset.locale).toBe('fr-FR')
      })
    } finally {
      language.mockRestore()
    }
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

  test('clears inherited direction back to document detection when dir is null', () => {
    const screen = render(() => (
      <MoraineProvider dir="rtl">
        <LocaleProbe />
        <MoraineProvider dir={null}>
          <LocaleProbe />
        </MoraineProvider>
      </MoraineProvider>
    ))

    const [outer, cleared] = screen.container.querySelectorAll('i')
    expect(outer?.dataset.dir).toBe('rtl')
    expect(cleared?.dataset.dir).toBe('')
  })

  test('ignores undefined message patch values to preserve base strings', () => {
    render(() => (
      <MoraineProvider messages={{ dialog: { close: undefined } }}>
        <Dialog open>
          <Dialog.Content>Hi</Dialog.Content>
        </Dialog>
      </MoraineProvider>
    ))

    const button = document.body.querySelector(
      '[data-slot="dialog-content-close"]',
    ) as HTMLButtonElement
    expect(button.getAttribute('aria-label')).toBe('Close')
  })

  test('nested providers merge and inherit locale state', () => {
    function NestedProbe() {
      const locale = useLocale()
      const dialog = useMessages('dialog', defaultDialogMessages)
      const pagination = useMessages('pagination', defaultPaginationMessages)
      return (
        <i
          data-locale={locale.locale() ?? ''}
          data-dir={locale.dir() ?? ''}
          data-close={dialog().close}
          data-pagination={pagination().label}
        />
      )
    }

    const screen = render(() => (
      <MoraineProvider
        locale="en-US"
        dir="ltr"
        messages={{
          dialog: { close: 'Close' },
          pagination: { label: 'Pages' },
        }}
      >
        <MoraineProvider
          locale="zh-CN"
          messages={{
            dialog: { close: '关闭' },
          }}
        >
          <NestedProbe />
          <MoraineProvider dir={null}>
            <NestedProbe />
          </MoraineProvider>
        </MoraineProvider>
      </MoraineProvider>
    ))

    const [nested, clearedDir] = screen.container.querySelectorAll('i')
    expect(nested?.dataset).toMatchObject({
      locale: 'zh-CN',
      dir: 'ltr',
      close: '关闭',
      pagination: 'Pages',
    })
    expect(clearedDir?.dataset).toMatchObject({
      locale: 'zh-CN',
      dir: '',
      close: '关闭',
      pagination: 'Pages',
    })
  })

  test('MoraineMessagesInput enforces kbd key constraints', () => {
    const valid: MoraineMessagesInput = {
      kbd: {
        alt: 'Option',
        arrowdown: 'Down',
      },
    }
    expect(valid.kbd?.alt).toBe('Option')

    // @ts-expect-error totallyInvalidKey must not be allowed by MoraineMessagesInput
    const _invalid: MoraineMessagesInput = { kbd: { totallyInvalidKey: 'xxx' } }
    expect(_invalid).toBeDefined()
  })
})
