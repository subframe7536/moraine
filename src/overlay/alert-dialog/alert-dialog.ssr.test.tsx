import { describe, expect, test } from 'vitest'

import { hydrateFixture, renderSsrFixture } from '../../test-util/ssr-test'

import { AlertDialogFixture } from './alert-dialog.ssr.fixture'

describe('AlertDialog SSR', () => {
  test('hydrates an empty host', () => {
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
    expect(document.body.querySelector('[role="alertdialog"]')).toBeNull()
  })

  test('settles server calls as api without a host', () => {
    expect(
      renderSsrFixture(
        '/src/overlay/alert-dialog/alert-dialog.ssr.fixture.tsx',
        'renderServerAlertCallFixture',
      ),
    ).toBe('api:api:unique')
  })
})
