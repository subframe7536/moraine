import { Breadcrumb } from '@src'

export function CustomSeparatorDisabled() {
  return (
    <Breadcrumb
      separator={() => '/'}
      classes={{
        separator: 'size-unset',
      }}
      items={[
        { label: 'Workspace', href: '#', icon: 'i-lucide:briefcase' },
        { label: 'Settings', href: '#', icon: 'i-lucide:settings' },
        { label: 'Danger Zone', href: '#', disabled: true, icon: 'i-lucide:triangle-alert' },
      ]}
    />
  )
}
