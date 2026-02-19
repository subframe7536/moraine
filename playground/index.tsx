import '@unocss/reset/tailwind-v4.css'
import 'uno.css'

import { Match, Switch, createSignal, onMount } from 'solid-js'
import { render } from 'solid-js/web'

import { ButtonDemos } from './components/button-demos'
import { Sidebar } from './components/common/sidebar'
import { FileUploadDemos } from './components/file-upload-demos'
import { FormDemos } from './components/form-demos'
import { FormFieldDemos } from './components/form-field-demos'
import { IconDemos } from './components/icon-demos'
import { InputDemos } from './components/input-demos'
import { InputNumberDemos } from './components/input-number-demos'
import { SelectDemos } from './components/select-demos'
import { SliderDemos } from './components/slider-demos'
import { TooltipDemos } from './components/tooltip-demos'

const PAGES = [
  { key: 'button', label: 'Button', group: 'General' },
  { key: 'icon', label: 'Icon', group: 'General' },
  { key: 'tooltip', label: 'Tooltip', group: 'Feedback' },
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
          <Match when={page() === 'icon'}>
            <IconDemos />
          </Match>
          <Match when={page() === 'tooltip'}>
            <TooltipDemos />
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
        </Switch>
      </div>
    </div>
  )
}

render(() => <App />, document.getElementById('app')!)
