import { fireEvent, render, within } from '@solidjs/testing-library'
import { expect, test } from 'vitest'

import { MoraineProvider } from '../../../../src'

import { LandingPage } from './landing-page'

test('the landing specimen and canvas respond to local actions', () => {
  const view = render(() => (
    <MoraineProvider>
      <LandingPage />
    </MoraineProvider>
  ))

  expect(view.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  fireEvent.input(view.getByRole('textbox', { name: 'Release name' }), {
    target: { value: 'Winter release' },
  })
  fireEvent.click(view.getByRole('button', { name: 'Save changes' }))
  expect(view.getByText('Changes saved')).toBeTruthy()

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

  fireEvent.click(view.getAllByRole('button', { name: 'Create project' })[0]!)
  expect(view.getByRole('button', { name: 'Project created' })).toBeTruthy()
})
