import { cleanup, fireEvent, render, screen, within } from '@solidjs/testing-library'
import { Show, createSignal } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'

import { SidebarFrame, useSidebarFrame } from '../../../../src'

import { Sidebar, SidebarHeader } from './sidebar'
import type { SidebarPage } from './sidebar'

const [pathname, setPathname] = createSignal('/components/button')

vi.mock('@solidjs/router', () => ({
  useLocation: () => ({
    get pathname() {
      return pathname()
    },
  }),
}))

afterEach(cleanup)

function page(path: string, label: string, surface: SidebarPage['surface']): SidebarPage {
  return {
    path,
    label,
    surface,
    section: 'overview',
    key: path,
    description: '',
    order: 0,
    tags: [],
    markdownPath: `${path}.md`,
    sections: [],
  }
}

function setup(mobile: boolean, path = '/components/button') {
  setPathname(path)
  let frame!: ReturnType<typeof useSidebarFrame>
  function Navigation() {
    frame = useSidebarFrame()
    return (
      <>
        <Show when={mobile}>
          <SidebarFrame.SidebarHeader>
            <SidebarHeader />
          </SidebarFrame.SidebarHeader>
        </Show>
        <SidebarFrame.SidebarBody>
          <Sidebar
            pages={[
              page('/docs/getting-started', 'Introduction', 'docs'),
              page('/components', 'Components overview', 'components'),
              page('/components/button', 'Button', 'components'),
            ]}
            activePage={pathname}
          />
        </SidebarFrame.SidebarBody>
      </>
    )
  }
  render(() => (
    <SidebarFrame isMobile={mobile}>
      <Navigation />
    </SidebarFrame>
  ))
  frame.setOpen(true)
  return { open: frame.isOpen, setOpen: frame.setOpen }
}

test('mobile sections are links above the current directory without tabs or a title row', () => {
  setup(true)
  const sections = within(screen.getByRole('navigation', { name: 'Documentation sections' }))
  expect(sections.getByRole('link', { name: 'Docs' }).getAttribute('href')).toBe(
    '/docs/getting-started',
  )
  expect(sections.getByRole('link', { name: 'Components' }).getAttribute('href')).toBe(
    '/components',
  )
  expect(sections.getByRole('link', { name: 'Components' }).getAttribute('aria-current')).toBe(
    'location',
  )
  expect(screen.getByRole('link', { name: 'Button' }).getAttribute('aria-current')).toBe('page')
  expect(screen.queryByRole('link', { name: 'Introduction' })).toBeNull()
  expect(screen.queryByRole('link', { name: 'Components overview' })).toBeNull()
  expect(screen.queryByRole('tablist')).toBeNull()
  expect(screen.queryByRole('heading', { name: 'Navigation' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Close sidebar' })).toBeNull()
})

test.each(['Docs', 'Button'])('mobile %s links close only for ordinary clicks', (label) => {
  const { open } = setup(true)
  const link = screen.getByRole('link', { name: label })
  for (const modifier of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey']) {
    fireEvent.click(link, { [modifier]: true })
    expect(open()).toBe(true)
  }
  fireEvent.click(link)
  expect(open()).toBe(false)
})

test('route changes update the selected section and its directory', () => {
  setup(true)
  setPathname('/docs/getting-started')
  expect(screen.getByRole('link', { name: 'Docs' }).getAttribute('aria-current')).toBe('location')
  expect(screen.getByRole('link', { name: 'Components' }).hasAttribute('aria-current')).toBe(false)
  expect(screen.getByRole('link', { name: 'Introduction' }).getAttribute('aria-current')).toBe(
    'page',
  )
  expect(screen.getByRole('link', { name: 'llms.txt' })).not.toBeNull()
  expect(screen.queryByRole('link', { name: 'Button' })).toBeNull()
})

test('desktop navigation keeps only the current directory and omits mobile sections', () => {
  const { open } = setup(false)
  expect(screen.queryByRole('navigation', { name: 'Documentation sections' })).toBeNull()
  expect(screen.getByRole('link', { name: 'Button' })).not.toBeNull()
  expect(screen.queryByRole('link', { name: 'Introduction' })).toBeNull()
  fireEvent.click(screen.getByRole('link', { name: 'Button' }))
  expect(open()).toBe(true)
})

test.each([
  ['/', 'Docs'],
  ['/docs/getting-started', 'Docs'],
  ['/components/button', 'Components'],
  ['/component/example', 'Components'],
])('mobile section follows the path surface at %s', (path, label) => {
  setup(true, path)
  expect(screen.getByRole('link', { name: label }).getAttribute('aria-current')).toBe('location')
})
