import { Breadcrumb } from '@src'

const BREADCRUMB_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Components', href: '/button' },
  { label: 'Breadcrumb' },
]

export function ItemsPage() {
  return (
    <div class="max-w-md w-full">
      <Breadcrumb items={BREADCRUMB_ITEMS} />
    </div>
  )
}
