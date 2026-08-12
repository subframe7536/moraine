import { renderToString } from 'solid-js/web'

import { Breadcrumb } from './breadcrumb.tsx'
import type { BreadcrumbT } from './breadcrumb.tsx'

export function renderBreadcrumbItem(context: BreadcrumbT.ItemRenderProps) {
  return (
    <a
      data-slot="custom-link"
      href={context.disabled ? undefined : context.item.href}
      aria-current={context.current ? 'page' : undefined}
      onClick={context.item.onClick}
    >
      {context.item.label}
    </a>
  )
}

export function renderBreadcrumbFixture(): string {
  return renderToString(() => (
    <Breadcrumb
      aria-label="Fixture breadcrumbs"
      itemRender={renderBreadcrumbItem}
      items={[
        { label: 0, href: '/zero' },
        { label: 'Current', href: '/current' },
      ]}
    />
  ))
}
