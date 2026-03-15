import 'uno.css'

// import { cls } from 'cls-variant'
import { Match, Switch, createSignal, onMount } from 'solid-js'
import { render } from 'solid-js/web'
// import { patchCN } from '../src'

import { AccordionDemos } from './components/accordion-demos'
import { AvatarDemos } from './components/avatar-demos'
import { BadgeDemos } from './components/badge-demos'
import { BreadcrumbDemos } from './components/breadcrumb-demos'
import { ButtonDemos } from './components/button-demos'
import { CardDemos } from './components/card-demos'
import { CollapsibleDemos } from './components/collapsible-demos'
import { CommandPaletteDemos } from './components/command-palette-demos'
import { Sidebar } from './components/common/sidebar'
import { ContextMenuDemos } from './components/context-menu-demos'
import { DialogDemos } from './components/dialog-demos'
import { DropdownMenuReactivityDemos } from './components/dialog-reactivity-demos'
import { DropdownMenuDemos } from './components/dropdown-menu-demos'
import { FileUploadDemos } from './components/file-upload-demos'
import { FormDemos } from './components/form-demos'
import { FormFieldDemos } from './components/form-field-demos'
import { IconDemos } from './components/icon-demos'
import { InputDemos } from './components/input-demos'
import { InputNumberDemos } from './components/input-number-demos'
import { KbdDemos } from './components/kbd-demos'
import { PaginationDemos } from './components/pagination-demos'
import { PopoverDemos } from './components/popover-demos'
import { PopupDemos } from './components/popup-demos'
import { ProgressDemos } from './components/progress-demos'
import { ResizableDemos } from './components/resizable-demos'
import { SelectDemos } from './components/select-demos'
import { SeparatorDemos } from './components/separator-demos'
import { SheetDemos } from './components/sheet-demos'
import { SliderDemos } from './components/slider-demos'
import { StepperDemos } from './components/stepper-demos'
import { TabsDemos } from './components/tabs-demos'
import { TooltipDemos } from './components/tooltip-demos'

// patchCN((...args) => (console.log(args[0]), cls(...args)))

const PAGES = [
  { key: 'avatar', label: 'Avatar', group: 'General' },
  { key: 'badge', label: 'Badge', group: 'General' },
  { key: 'button', label: 'Button', group: 'General' },
  { key: 'icon', label: 'Icon', group: 'General' },
  { key: 'kbd', label: 'Kbd', group: 'General' },
  { key: 'separator', label: 'Separator', group: 'General' },
  { key: 'card', label: 'Card', group: 'Layout' },
  { key: 'resizable', label: 'Resizable', group: 'Layout' },
  { key: 'breadcrumb', label: 'Breadcrumb', group: 'Navigation' },
  { key: 'pagination', label: 'Pagination', group: 'Navigation' },
  { key: 'stepper', label: 'Stepper', group: 'Navigation' },
  { key: 'tabs', label: 'Tabs', group: 'Navigation' },
  { key: 'accordion', label: 'Accordion', group: 'Disclosure' },
  { key: 'collapsible', label: 'Collapsible', group: 'Disclosure' },
  { key: 'progress', label: 'Progress', group: 'Feedback' },
  { key: 'command-palette', label: 'Command Palette', group: 'Overlay' },
  { key: 'tooltip', label: 'Tooltip', group: 'Overlay' },
  { key: 'popup', label: 'Popup', group: 'Overlay' },
  { key: 'popover', label: 'Popover', group: 'Overlay' },
  { key: 'dropdown-menu', label: 'Dropdown Menu', group: 'Overlay' },
  { key: 'dropdown-menu-reactivity', label: 'Dropdown Menu Reactivity', group: 'Overlay' },
  { key: 'context-menu', label: 'Context Menu', group: 'Overlay' },
  { key: 'dialog', label: 'Dialog', group: 'Overlay' },
  { key: 'sheet', label: 'Sheet', group: 'Overlay' },
  { key: 'input', label: 'Input & Textarea', group: 'Data Entry' },
  { key: 'input-number', label: 'Input Number', group: 'Data Entry' },
  { key: 'slider', label: 'Slider', group: 'Data Entry' },
  { key: 'file-upload', label: 'File Upload', group: 'Data Entry' },
  { key: 'select', label: 'Select', group: 'Data Entry' },
  { key: 'form-controls', label: 'Form Controls', group: 'Data Entry' },
  { key: 'form-field', label: 'Form & Validation', group: 'Data Entry' },
]

function App() {
  const [page, setPage] = createSignal(location.hash.slice(1) || 'button')

  onMount(() => {
    window.addEventListener('hashchange', () => {
      setPage(location.hash.slice(1) || 'button')
    })
  })

  const navigate = (key: string) => {
    location.hash = key
    setPage(key)
  }

  return (
    <div class="flex min-h-screen">
      <Sidebar pages={PAGES} activePage={page} setActivePage={navigate} />
      <div class="flex-1 overflow-y-auto">
        <Switch fallback={<ButtonDemos />}>
          <Match when={page() === 'button'}>
            <ButtonDemos />
          </Match>
          <Match when={page() === 'avatar'}>
            <AvatarDemos />
          </Match>
          <Match when={page() === 'badge'}>
            <BadgeDemos />
          </Match>
          <Match when={page() === 'breadcrumb'}>
            <BreadcrumbDemos />
          </Match>
          <Match when={page() === 'card'}>
            <CardDemos />
          </Match>
          <Match when={page() === 'collapsible'}>
            <CollapsibleDemos />
          </Match>
          <Match when={page() === 'accordion'}>
            <AccordionDemos />
          </Match>
          <Match when={page() === 'icon'}>
            <IconDemos />
          </Match>
          <Match when={page() === 'kbd'}>
            <KbdDemos />
          </Match>
          <Match when={page() === 'command-palette'}>
            <CommandPaletteDemos />
          </Match>
          <Match when={page() === 'tooltip'}>
            <TooltipDemos />
          </Match>
          <Match when={page() === 'popup'}>
            <PopupDemos />
          </Match>
          <Match when={page() === 'popover'}>
            <PopoverDemos />
          </Match>
          <Match when={page() === 'dropdown-menu'}>
            <DropdownMenuDemos />
          </Match>
          <Match when={page() === 'dropdown-menu-reactivity'}>
            <DropdownMenuReactivityDemos />
          </Match>
          <Match when={page() === 'context-menu'}>
            <ContextMenuDemos />
          </Match>
          <Match when={page() === 'dialog'}>
            <DialogDemos />
          </Match>
          <Match when={page() === 'pagination'}>
            <PaginationDemos />
          </Match>
          <Match when={page() === 'stepper'}>
            <StepperDemos />
          </Match>
          <Match when={page() === 'sheet'}>
            <SheetDemos />
          </Match>
          <Match when={page() === 'progress'}>
            <ProgressDemos />
          </Match>
          <Match when={page() === 'resizable'}>
            <ResizableDemos />
          </Match>
          <Match when={page() === 'separator'}>
            <SeparatorDemos />
          </Match>
          <Match when={page() === 'input'}>
            <InputDemos />
          </Match>
          <Match when={page() === 'input-number'}>
            <InputNumberDemos />
          </Match>
          <Match when={page() === 'slider'}>
            <SliderDemos />
          </Match>
          <Match when={page() === 'file-upload'}>
            <FileUploadDemos />
          </Match>
          <Match when={page() === 'select'}>
            <SelectDemos />
          </Match>
          <Match when={page() === 'form-controls'}>
            <FormDemos />
          </Match>
          <Match when={page() === 'form-field'}>
            <FormFieldDemos />
          </Match>
          <Match when={page() === 'tabs'}>
            <TabsDemos />
          </Match>
        </Switch>
      </div>
    </div>
  )
}

render(() => <App />, document.getElementById('app')!)
