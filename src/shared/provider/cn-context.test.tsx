import { render } from '@solidjs/testing-library'
import { createComponent, createSignal, onCleanup } from 'solid-js'
import { Portal } from 'solid-js/web'
import { describe, expect, test, vi } from 'vitest'

import { Button } from '../../elements/button/button'
import { Input } from '../../forms/input/input'
import { SidebarFrame } from '../../navigation/sidebar-frame/sidebar-frame'
import { Modal } from '../../overlays/modal/modal'
import { createTheme } from '../../theme/create-theme'
import { emptyTheme } from '../../theme/types'
import type { MoraineTheme } from '../../theme/types'
import type { Cn, CnConfig } from '../style/cn'
import * as cnModule from '../style/cn'

import { useCn } from './cn-context'
import { MoraineProvider } from './moraine-provider'

const densityConfig: CnConfig = {
  extend: { classGroups: { density: ['density-roomy', 'density-compact'] } },
}
const keepPadding: CnConfig = { override: { classGroups: { p: [] } } }
const classes = 'p-2 p-4 density-roomy density-compact'

function Probe(props: { id: string }) {
  const cn = useCn()
  return <div data-testid={props.id} class={cn(classes)} />
}

describe('scoped cn', () => {
  test('uses defaults without a Provider and replaces or restores nested inheritance', () => {
    const [outer, setOuter] = createSignal(densityConfig)
    const [inner, setInner] = createSignal<CnConfig>()
    const screen = render(() => (
      <>
        <Probe id="default" />
        <MoraineProvider cnConfig={outer()}>
          <MoraineProvider cnConfig={inner()}>
            <MoraineProvider>
              <Probe id="nested" />
            </MoraineProvider>
          </MoraineProvider>
          <MoraineProvider cnConfig={{}}>
            <Probe id="reset" />
          </MoraineProvider>
          <MoraineProvider cnConfig={keepPadding}>
            <Probe id="sibling" />
          </MoraineProvider>
        </MoraineProvider>
      </>
    ))
    const nested = screen.getByTestId('nested')
    expect(screen.getByTestId('default').className).toBe(cnModule.cn(classes))
    expect(nested.className).toBe('p-4 density-compact')
    setInner(keepPadding)
    expect(nested.className).toBe(classes)
    setOuter({})
    expect(nested.className).toBe(classes)
    setInner(undefined)
    expect(nested.className).toBe(cnModule.cn(classes))
    setOuter(densityConfig)
    expect(nested.className).toBe('p-4 density-compact')
    expect(screen.getByTestId('reset').className).toBe(cnModule.cn(classes))
    expect(screen.getByTestId('sibling').className).toBe(classes)
    expect(cnModule.cn(classes)).toBe('p-4 density-roomy density-compact')
    screen.unmount()
    expect(cnModule.cn(classes)).toBe('p-4 density-roomy density-compact')
  })

  test('keeps captured handles current in events and async continuations', async () => {
    const [config, setConfig] = createSignal<CnConfig>({})
    let handle!: Cn
    let result: string | undefined
    let pending!: Promise<void>
    function Child() {
      handle = useCn()
      return (
        <button
          onClick={() => {
            pending = (async () => {
              await Promise.resolve()
              result = handle(classes)
            })()
          }}
        >
          Read
        </button>
      )
    }
    const screen = render(() => (
      <MoraineProvider cnConfig={config()}>
        <Child />
      </MoraineProvider>
    ))
    const original = handle
    screen.getByRole('button').click()
    setConfig(densityConfig)
    await pending
    expect(handle).toBe(original)
    expect(result).toBe('p-4 density-compact')
    expect(handle(classes)).toBe(result)
  })

  test('recomputes shared recipes when only cnConfig changes and keeps theme independent', () => {
    const theme = createTheme({
      button: {
        base: { root: 'p-2 density-roomy' },
        defaults: { size: 'sm' },
        variants: { size: { sm: { root: 'p-4 density-compact' } } },
        compoundVariants: [{ size: 'sm', class: { root: 'p-6' } }],
      },
    })
    const [config, setConfig] = createSignal<CnConfig>({})
    const [currentTheme, setTheme] = createSignal<MoraineTheme>(theme)
    const factory = vi.spyOn(cnModule, 'createCn')
    try {
      const screen = render(() => (
        <>
          <MoraineProvider theme={currentTheme()} cnConfig={config()}>
            <MoraineProvider>
              <Button>Live</Button>
            </MoraineProvider>
          </MoraineProvider>
          <MoraineProvider theme={theme} cnConfig={keepPadding}>
            <Button>Sibling</Button>
          </MoraineProvider>
        </>
      ))
      const live = screen.getByRole('button', { name: 'Live' })
      const sibling = screen.getByRole('button', { name: 'Sibling' })
      expect(live.className).toBe('density-roomy density-compact p-6')
      expect(sibling.className).toBe('p-2 density-roomy p-4 density-compact p-6')
      expect(factory).toHaveBeenCalledTimes(2)
      setConfig({ ...keepPadding, ...densityConfig })
      expect(live.className).toBe('p-2 p-4 density-compact p-6')
      expect(factory).toHaveBeenCalledTimes(3)
      setTheme(emptyTheme)
      expect(live.className).toBe('')
      setTheme(theme)
      expect(live.className).toBe('p-2 p-4 density-compact p-6')
      expect(factory).toHaveBeenCalledTimes(3)
      expect(screen.getByRole('button', { name: 'Live' })).toBe(live)
    } finally {
      factory.mockRestore()
    }
  })

  test('preserves JSX ownership, input edits, focus, selection, and open Portal content', () => {
    const [config, setConfig] = createSignal<CnConfig>({})
    let reads = 0
    let cleanups = 0
    function Content() {
      onCleanup(() => cleanups++)
      return (
        <>
          <Input defaultValue="hello" class="p-2 p-4" />
          <Modal defaultOpen>
            <Modal.Content overlay class="p-2 p-4" ariaLabel="Scoped modal">
              <Portal>
                <Probe id="portal" />
              </Portal>
            </Modal.Content>
          </Modal>
        </>
      )
    }
    const screen = render(() =>
      createComponent(MoraineProvider, {
        get cnConfig() {
          return config()
        },
        get children() {
          reads++
          return <Content />
        },
      }),
    )
    const input = screen.getByRole('textbox') as HTMLInputElement
    const surface = document.querySelector<HTMLElement>('[role=dialog]')!
    input.focus()
    input.value = 'draft'
    input.setSelectionRange(1, 3)
    setConfig({ ...keepPadding, ...densityConfig })
    expect(screen.getByRole('textbox')).toBe(input)
    expect(document.querySelector<HTMLElement>('[role=dialog]')!).toBe(surface)
    expect(surface.className).toBe('p-2 p-4')
    expect(input.parentElement?.className).toBe('p-2 p-4')
    expect(input.value).toBe('draft')
    expect(document.activeElement).toBe(input)
    expect([input.selectionStart, input.selectionEnd]).toEqual([1, 3])
    expect(document.querySelector<HTMLElement>('[data-testid=portal]')!.className).toBe(
      'p-2 p-4 density-compact',
    )
    expect([reads, cleanups]).toEqual([1, 0])
    screen.unmount()
    expect(cleanups).toBe(1)
  })
})

test('keeps independent part merging bound to its own Provider', () => {
  const screen = render(() => (
    <MoraineProvider cnConfig={densityConfig}>
      <SidebarFrame>
        <MoraineProvider cnConfig={keepPadding}>
          <SidebarFrame.Main class={classes}>Main</SidebarFrame.Main>
        </MoraineProvider>
      </SidebarFrame>
    </MoraineProvider>
  ))
  expect(screen.getByText('Main').className).toBe(classes)
})

test('preserves recipe merge boundaries with non-transitive conflicts', () => {
  const config: CnConfig = {
    extend: {
      classGroups: { a: ['app-a'], b: ['app-b'], c: ['app-c'] },
      conflictingClassGroups: { a: ['b'], b: ['c'] },
    },
  }
  const parent = createTheme({ button: { base: { root: 'app-c app-b' } } })
  const theme = createTheme({ extends: parent, button: { base: { root: 'app-a' } } })
  const screen = render(() => (
    <MoraineProvider theme={theme} cnConfig={config}>
      <Button>Grouped</Button>
    </MoraineProvider>
  ))
  expect(screen.getByRole('button').className).toBe('app-a')
  expect(cnModule.createCn(config)('app-c app-b app-a')).toBe('app-c app-a')
})
