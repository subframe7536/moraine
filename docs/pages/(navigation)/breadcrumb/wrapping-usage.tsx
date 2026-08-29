import { Breadcrumb } from '@src'

const LONG_PATH = [
  { label: 'Workspace root', href: '/' },
  { label: 'Engineering department', href: '/departments' },
  { label: 'Infrastructure & cloud platform', href: '/teams' },
  { label: 'Kubernetes cluster configurations and rollout policies' },
]

export function WrappingUsage() {
  return (
    <div class="p-3 b-(1 border) rounded-lg max-w-xs w-full">
      <Breadcrumb items={LONG_PATH} />
    </div>
  )
}
