// @vitest-environment jsdom

import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { afterEach, expect, test, vi } from 'vitest'

import { DEFAULT_ICON_SHORTCUTS } from '../../../../src/theme/style/icons.ts'

import { IconGallery } from './icon-gallery.tsx'

afterEach(() => {
  Reflect.deleteProperty(navigator, 'clipboard')
})

test('shows every built-in icon and copies the selected name', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })

  const view = render(() => <IconGallery />)
  expect(view.getAllByRole('button', { name: /^Copy icon-/ })).toHaveLength(
    DEFAULT_ICON_SHORTCUTS.length,
  )

  fireEvent.click(view.getByRole('button', { name: 'Copy icon-search' }))
  await waitFor(() => expect(writeText).toHaveBeenCalledWith('icon-search'))
  expect(view.getByRole('status').textContent).toBe('Copied')
})
