import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { onMount } from 'solid-js'
import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { Kbd } from '../element/kbd/kbd'
import { Resizable } from '../element/resizable/resizable'
import { Combobox } from '../form/combobox/combobox'
import { Field } from '../form/field/field'
import { FileUpload } from '../form/file-upload/file-upload'
import { createForm } from '../form/form'
import { InputNumber } from '../form/input-number/input-number'
import { MultiSelect } from '../form/multi-select/multi-select'
import { Select } from '../form/select/select'
import { Slider } from '../form/slider/slider'
import { Breadcrumb } from '../navigation/breadcrumb/breadcrumb'
import { CommandPalette } from '../navigation/command-palette/command-palette'
import { Pagination } from '../navigation/pagination/pagination'
import { SidebarFrame } from '../navigation/sidebar-frame/sidebar-frame'
import { useSidebarFrame } from '../navigation/sidebar-frame/sidebar-frame-context'
import { Dialog } from '../overlay/dialog/dialog'
import { Sheet } from '../overlay/sheet/sheet'
import { renderWithOwner } from '../test-util/owner-render'

import { MoraineProvider } from './moraine-provider'

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
        <CommandPalette groups={[]} autofocus={false} showClose placeholder="Find" />
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
      const frame = useSidebarFrame()
      onMount(() => frame.setOpen(true))
      return <SidebarFrame.Sidebar ariaLabel={props.label}>Links</SidebarFrame.Sidebar>
    }

    render(() => (
      <MoraineProvider messages={{ sidebarFrame: { label: 'Navigation laterale' } }}>
        <SidebarFrame isMobile>
          <OpenSidebar />
        </SidebarFrame>
        <SidebarFrame isMobile>
          <OpenSidebar label="Primary" />
        </SidebarFrame>
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

  test('uses slider thumb message', () => {
    const screen = render(() => (
      <MoraineProvider
        messages={{
          slider: {
            thumb: ({ index, total }) => `Curseur ${index + 1}/${total}`,
          },
        }}
      >
        <Slider defaultValue={[20, 80]} />
      </MoraineProvider>
    ))

    expect(screen.getByRole('slider', { name: 'Curseur 1/2' })).toBeTruthy()
    expect(screen.getByRole('slider', { name: 'Curseur 2/2' })).toBeTruthy()
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
