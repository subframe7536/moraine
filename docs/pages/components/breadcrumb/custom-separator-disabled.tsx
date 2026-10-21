import { Breadcrumb } from '@src'

export function CustomSeparatorDisabled() {
  return (
    <Breadcrumb
      separator={() => <span>/</span>}
      classes={{
        separator: 'size-unset',
      }}
      items={[
        { label: 'Home', href: '/', icon: 'i-lucide:home' },
        { label: 'Private workspace', href: '/breadcrumb', disabled: true, icon: 'i-lucide:lock' },
        { label: 'Activity' },
      ]}
    />
  )
}
