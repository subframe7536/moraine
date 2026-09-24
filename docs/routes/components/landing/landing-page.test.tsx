import { fireEvent, render, within } from '@solidjs/testing-library'
import { expect, test } from 'vitest'

import { MoraineProvider } from '../../../../src'

import { LandingPage } from './landing-page'

test('the landing specimen and canvas respond to local actions', async () => {
  const view = render(() => (
    <MoraineProvider>
      <LandingPage />
    </MoraineProvider>
  ))

  expect(view.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  const releaseInput = view.getByRole('textbox', { name: 'Release name' })
  expect(view.getByText('Release name').closest('label')?.htmlFor).toBe(releaseInput.id)
  fireEvent.input(releaseInput, {
    target: { value: 'Winter release' },
  })
  fireEvent.click(view.getByRole('button', { name: 'Save changes' }))
  expect(view.getByText('Changes saved')).toBeTruthy()
  fireEvent.click(view.getByRole('combobox', { name: 'Audience' }))
  fireEvent.click(within(document.body).getByRole('option', { name: 'Public' }))
  expect(view.getByText('Not saved')).toBeTruthy()

  const projects = within(
    view.getByRole('tab', { name: 'Projects' }).closest('[data-slot="tabs"]')!,
  )
  fireEvent.click(view.getByRole('button', { name: 'New' }))
  expect(projects.getByText('New project')).toBeTruthy()
  fireEvent.input(view.getByRole('textbox', { name: 'Filter projects' }), {
    target: { value: 'Documentation' },
  })
  expect(projects.queryByText('New project')).toBeNull()
  expect(projects.getByText('Documentation')).toBeTruthy()

  const select = view.getByRole('combobox', { name: 'View' })
  expect(view.getByText('View').closest('label')?.htmlFor).toBe(select.id)
  fireEvent.click(select)
  expect(select.getAttribute('aria-expanded')).toBe('true')
  fireEvent.click(within(document.body).getByRole('option', { name: 'Activity' }))
  expect(view.getByRole('tab', { name: 'Activity' }).getAttribute('aria-selected')).toBe('true')
  expect(view.getByRole('tabpanel').textContent).toContain('Documentation moved to review')

  fireEvent.click(view.getByRole('switch', { name: 'Email updates' }))
  expect(view.getByRole('switch', { name: 'Email updates' }).getAttribute('aria-checked')).toBe(
    'false',
  )

  fireEvent.click(view.getByRole('button', { name: 'Review note' }))
  const reviewNote = await within(document.body).findByRole('dialog', {
    name: 'Documentation review note',
  })
  fireEvent.click(within(reviewNote).getByRole('button', { name: 'Mark ready' }))
  expect(
    within(view.getByRole('region', { name: 'A working set' })).getByText('Ready'),
  ).toBeTruthy()
  expect(
    within(reviewNote).getByRole('button', { name: 'Marked ready' }).hasAttribute('disabled'),
  ).toBe(true)

  fireEvent.click(view.getAllByRole('button', { name: 'Create project' })[0]!)
  expect(view.getByRole('button', { name: 'Project created' })).toBeTruthy()
})
