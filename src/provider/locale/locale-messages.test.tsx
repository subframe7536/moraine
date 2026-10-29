import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createSignal, onMount } from 'solid-js'
import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { AlertDialog } from '../../components/alert-dialog/alert-dialog'
import { Alert } from '../../components/alert/alert'
import { Breadcrumb } from '../../components/breadcrumb/breadcrumb'
import { Combobox } from '../../components/combobox/combobox'
import { CommandPalette } from '../../components/command-palette/command-palette'
import { Dialog } from '../../components/dialog/dialog'
import { Field } from '../../components/field/field'
import { FileUpload } from '../../components/file-upload/file-upload'
import { createForm } from '../../components/form'
import { InputNumber } from '../../components/input-number/input-number'
import { Kbd } from '../../components/kbd/kbd'
import { MultiSelect } from '../../components/multi-select/multi-select'
import { Pagination } from '../../components/pagination/pagination'
import { Progress } from '../../components/progress/progress'
import { Resizable } from '../../components/resizable/resizable'
import { Select } from '../../components/select/select'
import { Sheet } from '../../components/sheet/sheet'
import { Sidebar } from '../../components/sidebar/sidebar'
import { useSidebar } from '../../components/sidebar/sidebar-context'
import { Slider } from '../../components/slider/slider'
import { Toast } from '../../components/toast/toast'
import { renderWithOwner } from '../../test-util/owner-render'
import { MoraineProvider } from '../moraine-provider'

const FRUIT = [{ label: 'Apple', value: 'apple' }]

describe('localized component text', () => {
  test('uses dialog and sheet close messages', () => {
    render(() => (
      <MoraineProvider
        messages={{ dialog: { close: 'Fermer' }, sheet: { close: 'Fermer la feuille' } }}
      >
        <Dialog open>
          <Dialog.Content>Hi</Dialog.Content>
        </Dialog>
        <Sheet open>
          <Sheet.Content>Hi</Sheet.Content>
        </Sheet>
      </MoraineProvider>
    ))

    expect(
      document.body.querySelector('[data-slot="dialog-content-close"]')?.getAttribute('aria-label'),
    ).toBe('Fermer')
    expect(
      document.body.querySelector('[data-slot="sheet-content-close"]')?.getAttribute('aria-label'),
    ).toBe('Fermer la feuille')
  })

  test('uses toast close and viewport messages', async () => {
    Toast.close()
    render(() => (
      <MoraineProvider
        messages={{
          toast: {
            close: 'Fermer la notification',
            viewport: 'Notifications',
          },
        }}
      >
        <Toast closable />
      </MoraineProvider>
    ))

    Toast.show({ title: 'Bonjour', closable: true })
    const region = document.body.querySelector('[data-slot="toast"]')
    expect(region?.getAttribute('aria-label')).toBe('Notifications')
    await waitFor(() => {
      expect(
        document.body.querySelector('[data-slot="toast-close"]')?.getAttribute('aria-label'),
      ).toBe('Fermer la notification')
    })
    Toast.close()
  })

  test('uses select, combobox, and multi-select messages unless a prop sets the text', () => {
    const screen = render(() => (
      <MoraineProvider
        messages={{
          select: { clear: 'Effacer', placeholder: 'Choisir' },
          combobox: { clear: 'Vider', empty: 'Aucun', loading: 'Chargement', toggle: 'Ouvrir' },
          multiSelect: { clear: 'Tout effacer', placeholder: 'Choisir plusieurs', empty: 'Vide' },
          tagsField: { remove: ({ title }) => `Retirer ${title}` },
        }}
      >
        <Select items={FRUIT} defaultValue="apple" allowClear />
        <Select items={FRUIT} />
        <Select items={FRUIT} placeholder="Fruit" />
        <Combobox items={FRUIT} allowClear defaultValue="apple" loading />
        <MultiSelect items={FRUIT} defaultValue={['apple']} allowClear />
      </MoraineProvider>
    ))

    expect(screen.getAllByRole('button', { name: 'Effacer' }).length).toBeGreaterThan(0)
    expect(screen.getByText('Choisir')).toBeTruthy()
    expect(screen.getByText('Fruit')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Vider' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Chargement' })).toBeTruthy()
    const empty = render(() => (
      <MoraineProvider messages={{ combobox: { empty: 'Aucun' } }}>
        <Combobox items={[]} defaultOpen />
      </MoraineProvider>
    ))
    expect(document.body.querySelector('[data-slot="combobox-empty"]')?.textContent).toBe('Aucun')
    empty.unmount()
    expect(screen.getByRole('button', { name: 'Tout effacer' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Retirer Apple' })).toBeTruthy()
  })

  test('uses command palette messages and lets placeholder win', () => {
    const screen = render(() => (
      <MoraineProvider
        messages={{
          commandPalette: { placeholder: 'Chercher', close: 'Fermer', empty: 'Rien' },
        }}
      >
        <CommandPalette groups={[]} autofocus={false} closable placeholder="Find" />
        <CommandPalette groups={[]} autofocus={false} />
      </MoraineProvider>
    ))

    expect(screen.getByRole('combobox', { name: 'Find' })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Chercher' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeTruthy()
    expect(screen.getAllByText('Rien')).toHaveLength(2)
  })

  test('uses pagination messages and lets aria-label win', () => {
    const screen = render(() => (
      <MoraineProvider
        messages={{
          pagination: {
            label: 'Seiten',
            currentPage: ({ page, total }) => `Seite ${page} von ${total}`,
            prev: () => 'Zuruck',
            next: () => 'Weiter',
          },
        }}
      >
        <Pagination total={30} aria-label="Pages" />
      </MoraineProvider>
    ))

    expect(screen.getByRole('navigation', { name: 'Pages' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Seite 1 von 3' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Zuruck' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeTruthy()
  })

  test('uses input number control messages', () => {
    const screen = render(() => (
      <MoraineProvider messages={{ inputNumber: { increment: 'Plus', decrement: 'Moins' } }}>
        <InputNumber aria-label="Quantity" />
      </MoraineProvider>
    ))

    expect(screen.getByRole('button', { name: 'Plus' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Moins' })).toBeTruthy()
  })

  test('uses file upload messages unless a field label names the control', () => {
    const file = new File(['a'], 'notes.txt', { type: 'text/plain' })
    const screen = render(() => (
      <MoraineProvider
        messages={{
          fileUpload: { label: 'Televerser', remove: ({ name }) => `Supprimer ${name}` },
        }}
      >
        <FileUpload multiple defaultValue={[file]} />
        <Field label="Documents">
          <FileUpload />
        </Field>
      </MoraineProvider>
    ))

    expect(screen.getByRole('button', { name: 'Televerser' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Supprimer notes.txt' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Documents' })).toBeTruthy()
  })

  test('uses file upload messages unless aria-label names the control', () => {
    const screen = render(() => (
      <MoraineProvider messages={{ fileUpload: { label: 'Televerser' } }}>
        <FileUpload aria-label="Workspace files" />
      </MoraineProvider>
    ))

    expect(screen.getByRole('button', { name: 'Workspace files' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Televerser' })).toBeNull()
  })

  test('uses resizable grip messages and lets aria-label win', () => {
    const screen = render(() => (
      <MoraineProvider messages={{ resizable: { collapse: 'Reduire', expand: 'Etendre' } }}>
        <Resizable>
          <Resizable.Panel collapsible>Left</Resizable.Panel>
          <Resizable.Handle action="collapse" />
          <Resizable.Panel>Right</Resizable.Panel>
        </Resizable>
        <Resizable>
          <Resizable.Panel collapsible>Left</Resizable.Panel>
          <Resizable.Handle action="collapse" aria-label="Resize panels" />
          <Resizable.Panel>Right</Resizable.Panel>
        </Resizable>
      </MoraineProvider>
    ))

    expect(screen.getByRole('button', { name: 'Reduire' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Resize panels' })).toBeTruthy()
  })

  test('uses the sidebar message and lets ariaLabel win', async () => {
    function OpenSidebar(props: { label?: string }) {
      const frame = useSidebar()
      onMount(() => frame.setOpen(true))
      return <Sidebar.Panel aria-label={props.label}>Links</Sidebar.Panel>
    }

    render(() => (
      <MoraineProvider messages={{ sidebar: { label: 'Navigation laterale' } }}>
        <Sidebar isMobile>
          <OpenSidebar />
        </Sidebar>
        <Sidebar isMobile>
          <OpenSidebar label="Primary" />
        </Sidebar>
      </MoraineProvider>
    ))

    await waitFor(() => {
      const labels = Array.from(document.body.querySelectorAll('[data-slot="sheet-content"]')).map(
        (element) => element.getAttribute('aria-label'),
      )
      expect(labels).toEqual(['Navigation laterale', 'Primary'])
    })
  })

  test('uses the form message when a submit handler rejects without a message', async () => {
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ name: v.string() }),
          initialInput: { name: 'Ada' },
        }),
      (form) => (
        <MoraineProvider messages={{ form: { unknownError: 'Erreur inconnue' } }}>
          <form.Form onSubmit={() => Promise.reject(null)}>
            <button type="submit">Save</button>
          </form.Form>
        </MoraineProvider>
      ),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(form.errors).toEqual(['Erreur inconnue']))
  })

  test('uses kbd messages and lets label win', () => {
    const screen = render(() => (
      <MoraineProvider messages={{ kbd: { meta: 'Commande' } }}>
        <Kbd value="meta" />
        <Kbd value="meta" label="Primary" />
      </MoraineProvider>
    ))

    expect(screen.getByLabelText('Commande').textContent).toBe('⌘')
    expect(screen.getByLabelText('Primary').textContent).toBe('⌘')
  })

  test('uses progress indeterminate message', () => {
    const screen = render(() => (
      <MoraineProvider messages={{ progress: { indeterminate: 'progression indéterminée' } }}>
        <Progress aria-label="Scan" />
      </MoraineProvider>
    ))

    expect(screen.getByRole('progressbar').getAttribute('aria-valuetext')).toBe(
      'progression indéterminée',
    )
  })

  test('lets a native kbd aria-label win over messages', () => {
    const screen = render(() => (
      <MoraineProvider messages={{ kbd: { meta: 'Commande' } }}>
        <Kbd value="meta" aria-label="Super key" />
      </MoraineProvider>
    ))

    expect(screen.getByLabelText('Super key').textContent).toBe('⌘')
  })

  test('uses multi-select overflow and create messages', async () => {
    const screen = render(() => (
      <MoraineProvider
        messages={{
          multiSelect: {
            overflow: ({ count }) => `+${count} autres`,
            create: ({ value }) => `Créer «${value}»`,
          },
        }}
      >
        <MultiSelect items={FRUIT} defaultValue={['apple']} maxTagCount={0} />
        <MultiSelect
          items={[]}
          createItem={(input) => ({ value: input, label: input })}
          defaultOpen
        />
      </MoraineProvider>
    ))

    expect(screen.getByLabelText('+1 autres')).toBeTruthy()
    const input = screen.getAllByRole('combobox')[1] as HTMLInputElement
    fireEvent.input(input, { target: { value: 'banana' } })
    await waitFor(() => {
      expect(document.body.textContent).toContain('Créer «banana»')
    })
  })

  test('uses slider thumb and valueText messages', () => {
    const screen = render(() => (
      <MoraineProvider
        messages={{
          slider: {
            thumb: ({ index, total }) => `Curseur ${index + 1}/${total}`,
            valueText: ({ value, index, total }) => `${value} plage ${index + 1}/${total}`,
          },
        }}
      >
        <Slider defaultValue={[20, 80]} />
      </MoraineProvider>
    ))

    expect(screen.getByRole('slider', { name: 'Curseur 1/2' })).toBeTruthy()
    expect(screen.getByRole('slider', { name: 'Curseur 2/2' })).toBeTruthy()
    const thumbs = screen.container.querySelectorAll('[data-slot="slider-thumb"]')
    expect(thumbs[0]?.getAttribute('aria-valuetext')).toBe('20 plage 1/2')
    expect(thumbs[1]?.getAttribute('aria-valuetext')).toBe('80 plage 2/2')
  })

  test('uses breadcrumb message and lets aria-label win', () => {
    const screen = render(() => (
      <MoraineProvider messages={{ breadcrumb: { label: 'Fil d’Ariane' } }}>
        <Breadcrumb items={[{ label: 'Home' }]} />
        <Breadcrumb items={[{ label: 'Home' }]} aria-label="Navigation" />
      </MoraineProvider>
    ))

    expect(screen.getByRole('navigation', { name: 'Fil d’Ariane' })).toBeTruthy()
    expect(screen.getByRole('navigation', { name: 'Navigation' })).toBeTruthy()
  })
})

describe('component translations prop', () => {
  test('uses alert, kbd, progress, and resizable translations', () => {
    const screen = render(() => (
      <>
        <Alert closable translations={{ close: 'Dismiss banner' }} />
        <Kbd value="meta" translations={{ meta: 'Command-Key' }} />
        <Progress aria-label="Task" translations={{ indeterminate: 'Working...' }} />
        <Resizable translations={{ collapse: 'Fold panel' }}>
          <Resizable.Panel collapsible>Left</Resizable.Panel>
          <Resizable.Handle action="collapse" />
          <Resizable.Panel>Right</Resizable.Panel>
        </Resizable>
      </>
    ))

    expect(
      screen.container.querySelector('[data-slot="alert-close"]')?.getAttribute('aria-label'),
    ).toBe('Dismiss banner')
    expect(screen.getByLabelText('Command-Key')).toBeTruthy()
    expect(screen.getByRole('progressbar').getAttribute('aria-valuetext')).toBe('Working...')
    expect(screen.getByRole('button', { name: 'Fold panel' })).toBeTruthy()
  })

  test('uses select, combobox, and multi-select translations including tag removal', () => {
    const screen = render(() => (
      <>
        <Select
          items={FRUIT}
          defaultValue="apple"
          allowClear
          translations={{ clear: 'Clear fruit' }}
        />
        <Combobox items={[]} defaultOpen translations={{ empty: 'Nothing found' }} />
        <MultiSelect
          items={FRUIT}
          defaultValue={['apple']}
          allowClear
          translations={{
            clear: 'Reset all',
            remove: ({ title }) => `Drop ${title}`,
          }}
        />
      </>
    ))

    expect(screen.getByRole('button', { name: 'Clear fruit' })).toBeTruthy()
    expect(document.body.querySelector('[data-slot="combobox-empty"]')?.textContent).toBe(
      'Nothing found',
    )
    expect(screen.getByRole('button', { name: 'Reset all' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Drop Apple' })).toBeTruthy()
  })

  test('uses file upload, input number, and slider translations', () => {
    const screen = render(() => (
      <>
        <FileUpload translations={{ label: 'Upload document' }} />
        <InputNumber aria-label="Qty" translations={{ increment: 'Up', decrement: 'Down' }} />
        <Slider defaultValue={[40]} translations={{ thumb: ({ index }) => `Knob ${index + 1}` }} />
      </>
    ))

    expect(screen.getByRole('button', { name: 'Upload document' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Up' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Down' })).toBeTruthy()
    expect(screen.getByRole('slider', { name: 'Knob 1' })).toBeTruthy()
  })

  test('uses breadcrumb, command palette, and pagination translations', () => {
    const screen = render(() => (
      <>
        <Breadcrumb items={[{ label: 'Home' }]} translations={{ label: 'Path' }} />
        <CommandPalette
          groups={[]}
          autofocus={false}
          translations={{ placeholder: 'Type command...' }}
        />
        <Pagination
          total={30}
          translations={{
            prev: () => 'Previous step',
            next: () => 'Next step',
          }}
        />
      </>
    ))

    expect(screen.getByRole('navigation', { name: 'Path' })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Type command...' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Previous step' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Next step' })).toBeTruthy()
  })

  test('uses dialog, sheet, toast, and alert-dialog translations', async () => {
    Toast.close()
    render(() => (
      <>
        <Dialog open translations={{ close: 'Close popup' }}>
          <Dialog.Content>Modal</Dialog.Content>
        </Dialog>
        <Sheet open translations={{ close: 'Close drawer' }}>
          <Sheet.Content>Drawer</Sheet.Content>
        </Sheet>
        <Toast closable translations={{ viewport: 'Alerts', close: 'Dismiss toast' }} />
        <AlertDialog />
      </>
    ))

    expect(
      document.body.querySelector('[data-slot="dialog-content-close"]')?.getAttribute('aria-label'),
    ).toBe('Close popup')
    expect(
      document.body.querySelector('[data-slot="sheet-content-close"]')?.getAttribute('aria-label'),
    ).toBe('Close drawer')

    const region = document.body.querySelector('[data-slot="toast"]')
    expect(region?.getAttribute('aria-label')).toBe('Alerts')

    Toast.show({ title: 'Notice', closable: true })
    await waitFor(() => {
      expect(
        document.body.querySelector('[data-slot="toast-close"]')?.getAttribute('aria-label'),
      ).toBe('Dismiss toast')
    })
    Toast.close()

    AlertDialog.confirm({
      title: 'Proceed?',
      translations: { ok: 'Yes please', cancel: 'No thanks' },
    })
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="alert-dialog-action"]')?.textContent).toBe(
        'Yes please',
      )
      expect(document.body.querySelector('[data-slot="alert-dialog-cancel"]')?.textContent).toBe(
        'No thanks',
      )
    })
    AlertDialog.close()
  })

  test('uses form translations on rejected submission', async () => {
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ name: v.string() }),
          initialInput: { name: 'Ada' },
        }),
      (form) => (
        <form.Form
          onSubmit={() => Promise.reject(null)}
          translations={{ unknownError: 'Custom error' }}
        >
          <button type="submit">Submit</button>
        </form.Form>
      ),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(form.errors).toEqual(['Custom error']))
  })

  test('component translations override MoraineProvider messages while explicit props win over both', () => {
    const screen = render(() => (
      <MoraineProvider
        messages={{
          dialog: { close: 'Provider close' },
          pagination: { label: 'Provider pages' },
        }}
      >
        {/* Component translations override provider */}
        <Dialog open translations={{ close: 'Component close' }}>
          <Dialog.Content>Content</Dialog.Content>
        </Dialog>
        {/* Explicit prop wins over component translations */}
        <Pagination
          total={30}
          aria-label="Explicit pages"
          translations={{ label: 'Component pages' }}
        />
      </MoraineProvider>
    ))

    expect(
      document.body.querySelector('[data-slot="dialog-content-close"]')?.getAttribute('aria-label'),
    ).toBe('Component close')
    expect(screen.getByRole('navigation', { name: 'Explicit pages' })).toBeTruthy()
  })

  test('translations prop updates reactively without remounting', () => {
    const [messages, setMessages] = createSignal({ close: 'Close 1' })
    render(() => (
      <Dialog open translations={messages()}>
        <Dialog.Content>Content</Dialog.Content>
      </Dialog>
    ))

    const button = document.body.querySelector('[data-slot="dialog-content-close"]')
    expect(button?.getAttribute('aria-label')).toBe('Close 1')

    setMessages({ close: 'Close 2' })
    expect(button?.getAttribute('aria-label')).toBe('Close 2')
  })
})
