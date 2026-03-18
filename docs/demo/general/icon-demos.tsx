import { For } from 'solid-js'

import { Icon } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

const ICON_NAMES = [
  'i-lucide-search',
  'i-lucide-home',
  'i-lucide-settings',
  'i-lucide-user',
  'i-lucide-star',
  'i-lucide-heart',
  'i-lucide-bell',
  'i-lucide-mail',
  'i-lucide-calendar',
  'i-lucide-folder',
  'i-lucide-file',
  'i-lucide-trash',
]

const ICON_SIZES = [12, 16, 20, 24, 32, 48]

export default () => (
  <DemoPage componentKey="icon">
    <DemoSection
      title="Icon Gallery"
      description="Common Lucide icons rendered via UnoCSS classes."
    >
      <div class="gap-4 grid grid-cols-4 sm:grid-cols-6">
        <For each={ICON_NAMES}>
          {(name) => (
            <div class="p-3 b-1 b-border border-zinc-200 rounded-lg flex flex-col gap-2 items-center">
              <Icon name={name} size={24} />
              <span class="text-[10px] text-zinc-500 truncate">
                {name.replace('i-lucide-', '')}
              </span>
            </div>
          )}
        </For>
      </div>
    </DemoSection>

    <DemoSection title="Icon Sizes" description="Numeric pixel sizes from 12 to 48.">
      <div class="flex flex-wrap gap-6 items-end">
        <For each={ICON_SIZES}>
          {(size) => (
            <div class="flex flex-col gap-1 items-center">
              <Icon name="i-lucide-star" size={size} />
              <span class="text-[10px] text-zinc-500">{size}px</span>
            </div>
          )}
        </For>
      </div>
    </DemoSection>

    <DemoSection
      title="Icon as JSX"
      description="Pass a JSX element or render function instead of a string name."
    >
      <div class="flex flex-wrap gap-6 items-center">
        <div class="flex flex-col gap-1 items-center">
          <Icon
            name={
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            }
          />
          <span class="text-[10px] text-zinc-500">JSX element</span>
        </div>
        <div class="flex flex-col gap-1 items-center">
          <Icon name={() => <div class="i-lucide-zap size-6" />} />
          <span class="text-[10px] text-zinc-500">Render function</span>
        </div>
      </div>
    </DemoSection>
  </DemoPage>
)
