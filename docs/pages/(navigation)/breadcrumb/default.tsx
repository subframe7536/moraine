import { Breadcrumb } from '@src'

export function Default() {
  const ITEMS = [
    { label: 'Acme Corp', href: '#', icon: 'i-lucide:building-2' },
    { label: 'Production Clusters', href: '#', icon: 'i-lucide:server' },
    { label: 'Services', href: '#', icon: 'i-lucide:cpu' },
    { label: 'payments-api', href: '#', active: true, icon: 'i-lucide:radio' },
  ]

  return <Breadcrumb items={ITEMS} />
}
