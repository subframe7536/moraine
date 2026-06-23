import { Breadcrumb } from '@src'

export function Default() {
  const DEFAULT_ITEMS = [
    { label: 'Home', href: '#', icon: 'i-lucide:house' },
    { label: 'Library', href: '#', icon: 'i-lucide:folder' },
    { label: 'Components', href: '#', icon: 'i-lucide:box' },
    { label: 'Breadcrumb', href: '#', icon: 'i-lucide:bell-ring', active: true },
  ]

  return <Breadcrumb items={DEFAULT_ITEMS} />
}
