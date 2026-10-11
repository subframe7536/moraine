import { waitFor } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { hydrateFixture, renderSsrFixture } from '../../test-util/ssr-test'

import { AlertDialogFixture } from './alert-dialog.ssr.fixture'

describe('AlertDialog SSR', () => {
  test('hydrates the host and mounts the portaled alert dialog', async () => {
    const html = renderSsrFixture(
      '/src/overlay/alert-dialog/alert-dialog.ssr.fixture.tsx',
      'renderAlertDialogFixture',
    )
    expect(html).toBe('')

    const { container } = hydrateFixture(
      '/src/overlay/alert-dialog/alert-dialog.ssr.fixture.tsx',
      'renderAlertDialogFixture',
      () => <AlertDialogFixture />,
    )

    expect(container.innerHTML).toBe('')
    await waitFor(() => {
      expect(document.body.querySelector('[role="alertdialog"]')?.textContent).toContain(
        'Server title',
      )
    })
    const content = document.body.querySelector('[role="alertdialog"]')
    expect(content?.textContent).toContain('Server title')
    expect(content?.textContent).toContain('Server description')
    expect(content?.textContent).toContain('Server body')
    expect(document.body.querySelector('[data-slot="dialog-content-close"]')).toBeNull()
  })
})
