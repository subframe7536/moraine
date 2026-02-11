import '@unocss/reset/tailwind-v4.css'
import 'uno.css'

import { render } from 'solid-js/web'

import { Button } from '../src/button/button'

render(
  () => (
    <div class="flex flex-col gap-4 h-100vh w-full items-center justify-center">
      <Button
        class="text-white px-3 py-2 rounded-lg bg-slate-900"
        leading={<div class="i-lucide:arrow-down" />}
      >
        Button
      </Button>
    </div>
  ),
  document.getElementById('app')!,
)
