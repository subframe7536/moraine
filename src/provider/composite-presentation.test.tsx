import { render, within } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { Collapsible } from '../element/collapsible'
import { BaseSelect } from '../form/base-select'
import { SidebarFrame } from '../navigation/sidebar-frame'
import { ContextMenu } from '../overlay/context-menu'
import { Dialog } from '../overlay/dialog'
import { DropdownMenu } from '../overlay/dropdown-menu'
import { Modal } from '../overlay/modal'
import { Popover } from '../overlay/popover'
import { Sheet } from '../overlay/sheet'
import { Tooltip } from '../overlay/tooltip'
import { defineTheme } from '../theme'
import type { CnConfig } from '../theme/style/cn'

import { MoraineProvider } from './moraine-provider'

const keepPadding: CnConfig = { override: { classGroups: { p: [] } } }

describe('composite family presentation', () => {
  test('resolves a portal part in its nearest Theme and cn scope with reactive layered overrides', () => {
    const outerTheme = defineTheme({ dialog: { base: { content: 'outer-theme p-1' } } })
    const [innerTheme, setInnerTheme] = createSignal(
      defineTheme({
        dialog: {
          base: { content: 'inner-theme p-2', contentClose: 'inner-close-theme' },
        },
      }),
    )
    const [config, setConfig] = createSignal<CnConfig>(keepPadding)
    const [instanceClass, setInstanceClass] = createSignal('instance p-3')
    const [instanceWidth, setInstanceWidth] = createSignal('20px')

    render(() => (
      <MoraineProvider theme={outerTheme}>
        <Dialog
          open
          classes={{ content: instanceClass() }}
          styles={{
            content: { width: instanceWidth(), color: 'orange', '--dialog-only': 'yes' },
          }}
          ariaLabel="Scoped dialog"
        >
          <Dialog.Trigger data-testid="dialog-trigger">Open</Dialog.Trigger>
          <MoraineProvider theme={innerTheme()} cnConfig={config()}>
            <Dialog.Content
              data-testid="dialog-content"

              classes={{ content: 'part p-4' }}
              styles={{ content: { color: 'green', height: '30px' } }}
              class="direct p-5"
              style={{ color: 'red' }}
            >
              <Dialog.Body>Body</Dialog.Body>
            </Dialog.Content>
          </MoraineProvider>
        </Dialog>
      </MoraineProvider>
    ))

    const content = within(document.body).getByTestId('dialog-content')
    const contentClose = document.body.querySelector<HTMLElement>(
      '[data-slot="dialog-content-close"]',
    )!
    expect(content.className).toContain('inner-theme')
    expect(contentClose.className).toContain('inner-close-theme')
    expect(content.className).not.toContain('outer-theme')
    for (const padding of ['p-2', 'p-3', 'p-4', 'p-5']) {
      expect(content.className).toContain(padding)
    }
    expect(content.style.width).toBe('20px')
    expect(content.style.height).toBe('30px')
    expect(content.style.color).toBe('red')
    expect(content.style.getPropertyValue('--dialog-only')).toBe('yes')
    expect(
      within(document.body).getByTestId('dialog-trigger').style.getPropertyValue('--dialog-only'),
    ).toBe('')

    setInnerTheme(
      defineTheme({
        dialog: { base: { content: 'next-theme p-6', contentClose: 'next-close-theme' } },
      }),
    )
    setInstanceClass('next-instance p-7')
    setInstanceWidth('40px')
    expect(within(document.body).getByTestId('dialog-content')).toBe(content)
    expect(document.body.querySelector('[data-slot="dialog-content-close"]')).toBe(contentClose)
    expect(content.className).toContain('next-theme')
    expect(contentClose.className).toContain('next-close-theme')
    expect(content.className).toContain('next-instance')
    expect(content.style.width).toBe('40px')

    setConfig({})
    expect(within(document.body).getByTestId('dialog-content')).toBe(content)
    expect(content.className).toContain('p-5')
    expect(content.className).not.toContain('p-7')
  })

  test('propagates headless-root family defaults to detached parts', () => {
    render(() => (
      <>
        <Modal open classes={{ overlay: 'modal-overlay', content: 'modal-content' }}>
          <Modal.Portal>
            <Modal.Overlay data-testid="modal-overlay" />
            <Modal.Content data-testid="modal-content">Modal</Modal.Content>
          </Modal.Portal>
        </Modal>
        <Sheet
          open
          classes={{ trigger: 'sheet-trigger', content: 'sheet-content' }}
          ariaLabel="Sheet"
        >
          <Sheet.Trigger data-testid="sheet-trigger">Open sheet</Sheet.Trigger>
          <Sheet.Content data-testid="sheet-content">
            <Sheet.Body>Sheet</Sheet.Body>
          </Sheet.Content>
        </Sheet>
        <Popover defaultOpen classes={{ trigger: 'popover-trigger', content: 'popover-content' }}>
          <Popover.Trigger data-testid="popover-trigger">Open popover</Popover.Trigger>
          <Popover.Content data-testid="popover-content">Popover</Popover.Content>
        </Popover>
        <Tooltip defaultOpen classes={{ trigger: 'tooltip-trigger', content: 'tooltip-content' }}>
          <Tooltip.Trigger data-testid="tooltip-trigger">Tooltip trigger</Tooltip.Trigger>
          <Tooltip.Content data-testid="tooltip-content" text="Tooltip" />
        </Tooltip>
        <DropdownMenu
          defaultOpen
          classes={{ trigger: 'dropdown-trigger', content: 'dropdown-content' }}
        >
          <DropdownMenu.Trigger data-testid="dropdown-trigger">Menu</DropdownMenu.Trigger>
          <DropdownMenu.Content data-testid="dropdown-content" items={[]} />
        </DropdownMenu>
        <ContextMenu
          defaultOpen
          classes={{ trigger: 'context-trigger', content: 'context-content' }}
        >
          <ContextMenu.Trigger data-testid="context-trigger">Context</ContextMenu.Trigger>
          <ContextMenu.Content data-testid="context-content" items={[]} />
        </ContextMenu>
      </>
    ))

    for (const id of [
      'modal-overlay',
      'modal-content',
      'sheet-trigger',
      'sheet-content',
      'popover-trigger',
      'popover-content',
      'tooltip-trigger',
      'tooltip-content',
      'dropdown-trigger',
      'dropdown-content',
      'context-trigger',
      'context-content',
    ]) {
      expect(within(document.body).getByTestId(id).className).toContain(id)
    }
  })

  test('shadows outer presentation at every nested family root', () => {
    render(() => (
      <>
        <Popover classes={{ trigger: 'popover-outer' }}>
          <Popover.Trigger data-testid="popover-outer">Outer</Popover.Trigger>
          <Popover classes={{ trigger: 'popover-inner' }}>
            <Popover.Trigger data-testid="popover-inner">Inner</Popover.Trigger>
          </Popover>
        </Popover>
        <Tooltip classes={{ trigger: 'tooltip-outer' }}>
          <Tooltip.Trigger data-testid="tooltip-outer">Outer</Tooltip.Trigger>
          <Tooltip classes={{ trigger: 'tooltip-inner' }}>
            <Tooltip.Trigger data-testid="tooltip-inner">Inner</Tooltip.Trigger>
          </Tooltip>
        </Tooltip>
        <DropdownMenu classes={{ trigger: 'menu-outer' }}>
          <DropdownMenu.Trigger data-testid="menu-outer">Outer</DropdownMenu.Trigger>
          <DropdownMenu classes={{ trigger: 'menu-inner' }}>
            <DropdownMenu.Trigger data-testid="menu-inner">Inner</DropdownMenu.Trigger>
          </DropdownMenu>
        </DropdownMenu>
        <ContextMenu classes={{ trigger: 'context-outer' }}>
          <ContextMenu.Trigger data-testid="context-outer">Outer</ContextMenu.Trigger>
          <ContextMenu classes={{ trigger: 'context-inner' }}>
            <ContextMenu.Trigger data-testid="context-inner">Inner</ContextMenu.Trigger>
          </ContextMenu>
        </ContextMenu>
        <Collapsible defaultOpen classes={{ trigger: 'collapsible-outer' }}>
          <Collapsible.Trigger data-testid="collapsible-outer">Outer</Collapsible.Trigger>
          <Collapsible defaultOpen classes={{ trigger: 'collapsible-inner' }}>
            <Collapsible.Trigger data-testid="collapsible-inner">Inner</Collapsible.Trigger>
          </Collapsible>
        </Collapsible>
        <SidebarFrame isMobile={false} classes={{ main: 'sidebar-outer' }}>
          <SidebarFrame.Main data-testid="sidebar-outer">
            <SidebarFrame isMobile={false} classes={{ main: 'sidebar-inner' }}>
              <SidebarFrame.Main data-testid="sidebar-inner" />
            </SidebarFrame>
          </SidebarFrame.Main>
        </SidebarFrame>
        <BaseSelect classes={{ trigger: 'select-outer' }}>
          <BaseSelect.Trigger data-testid="select-outer">Outer</BaseSelect.Trigger>
          <BaseSelect classes={{ trigger: 'select-inner' }}>
            <BaseSelect.Trigger data-testid="select-inner">Inner</BaseSelect.Trigger>
          </BaseSelect>
        </BaseSelect>
      </>
    ))

    for (const family of [
      'popover',
      'tooltip',
      'menu',
      'context',
      'collapsible',
      'sidebar',
      'select',
    ]) {
      expect(within(document.body).getByTestId(`${family}-outer`).className).toContain(
        `${family}-outer`,
      )
      expect(within(document.body).getByTestId(`${family}-inner`).className).toContain(
        `${family}-inner`,
      )
      expect(within(document.body).getByTestId(`${family}-inner`).className).not.toContain(
        `${family}-outer`,
      )
    }
  })

  test('SidebarFrame and BaseSelect parts resolve nested Provider themes locally', () => {
    const outer = defineTheme({
      sidebarFrame: { base: { main: 'sidebar-theme-outer' } },
      baseSelect: { base: { trigger: 'select-theme-outer' } },
    })
    const inner = defineTheme({
      sidebarFrame: { base: { main: 'sidebar-theme-inner' } },
      baseSelect: { base: { trigger: 'select-theme-inner' } },
    })
    render(() => (
      <MoraineProvider theme={outer}>
        <SidebarFrame isMobile={false} classes={{ main: 'sidebar-instance' }}>
          <MoraineProvider theme={inner}>
            <SidebarFrame.Main data-testid="scoped-sidebar" />
          </MoraineProvider>
        </SidebarFrame>
        <BaseSelect classes={{ trigger: 'select-instance' }}>
          <MoraineProvider theme={inner}>
            <BaseSelect.Trigger data-testid="scoped-select">Select</BaseSelect.Trigger>
          </MoraineProvider>
        </BaseSelect>
      </MoraineProvider>
    ))

    expect(within(document.body).getByTestId('scoped-sidebar').className).toContain(
      'sidebar-theme-inner',
    )
    expect(within(document.body).getByTestId('scoped-sidebar').className).toContain(
      'sidebar-instance',
    )
    expect(within(document.body).getByTestId('scoped-sidebar').className).not.toContain(
      'sidebar-theme-outer',
    )
    expect(within(document.body).getByTestId('scoped-select').className).toContain(
      'select-theme-inner',
    )
    expect(within(document.body).getByTestId('scoped-select').className).toContain(
      'select-instance',
    )
    expect(within(document.body).getByTestId('scoped-select').className).not.toContain(
      'select-theme-outer',
    )
  })

  test('same-family nested Dialog uses only the nearest instance presentation', () => {
    render(() => (
      <Dialog open classes={{ content: 'dialog-outer' }} ariaLabel="Outer">
        <Dialog.Content data-testid="dialog-outer">
          <Dialog.Body>
            <Dialog open classes={{ content: 'dialog-inner' }} ariaLabel="Inner">
              <Dialog.Content data-testid="dialog-inner">
                <Dialog.Body>Inner</Dialog.Body>
              </Dialog.Content>
            </Dialog>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    expect(within(document.body).getByTestId('dialog-outer').className).toContain('dialog-outer')
    expect(within(document.body).getByTestId('dialog-inner').className).toContain('dialog-inner')
    expect(within(document.body).getByTestId('dialog-inner').className).not.toContain(
      'dialog-outer',
    )
  })
})
