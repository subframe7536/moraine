import { Breadcrumb } from '@src'

export function Default() {
  const DEFAULT_ITEMS = [
    { label: 'Home', href: '#' },
    { label: 'Components', href: '#' },
    { label: 'Breadcrumb', href: '#', active: true },
  ]

  return <Breadcrumb items={DEFAULT_ITEMS} />
}
