import { Breadcrumb } from '@src'
import { For } from 'solid-js'

export function Sizes() {
  const items = [
    { label: 'Workspace', href: '#', icon: 'i-lucide:briefcase' },
    { label: 'Settings', href: '#', icon: 'i-lucide:settings' },
    { label: 'Danger Zone', href: '#', disabled: true, icon: 'i-lucide:triangle-alert' },
  ]
  return (
    <div class="flex flex-col gap-4">
      <For each={['xs', 'sm', 'md', 'lg', 'xl'] as const}>
        {(size) => <Breadcrumb size={size} items={items} />}
      </For>
    </div>
  )
}
