import { render, waitFor } from '@solidjs/testing-library'
import { Suspense, createComponent } from 'solid-js'
import type { Component } from 'solid-js'
import { expect, test, vi } from 'vitest'

import { DOCS_MDX_COMPONENTS } from './mdx-components.tsx'

vi.mock('./intro-components', () => ({ IntroComponents: () => null }))
vi.mock('./markdown', () => ({ Markdown: () => null }))

test('loads the Preview descriptor once and mounts its client-only component once', async () => {
  let loads = 0
  let mounts = 0
  const Preview = DOCS_MDX_COMPONENTS.Preview as Component<{
    load: () => Promise<{ default: { component: Component } }>
  }>
  const view = render(() => (
    <Suspense>
      {createComponent(Preview, {
        get load() {
          loads++
          return async () => ({
            default: {
              component: () => {
                mounts++
                return <button>Live preview</button>
              },
            },
          })
        },
      })}
    </Suspense>
  ))
  expect(mounts).toBe(0)
  await waitFor(() => expect(view.getByRole('button', { name: 'Live preview' })).toBeTruthy())
  expect(loads).toBe(1)
  expect(mounts).toBe(1)
})
