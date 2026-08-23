import { Breadcrumb } from '@src'
import type { BreadcrumbT } from '@src'

const TRAIL_ITEMS: BreadcrumbT.Item[] = [
  { label: 'Home', href: '#', icon: 'i-lucide:home' },
  { label: 'Projects', href: '#' },
  { label: 'Design System', href: '#' },
  { label: 'Components' },
]

export interface BreadcrumbPlaygroundProps {
  separator?: string
  wrap?: boolean
}

export function BreadcrumbPlayground(props: BreadcrumbPlaygroundProps) {
  return (
    <Breadcrumb
      items={TRAIL_ITEMS}
      separator={props.separator || 'i-lucide:chevron-right'}
      wrap={props.wrap ?? false}
    />
  )
}
