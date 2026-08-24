import { Accordion } from '@src'

export function Multiple() {
  return (
    <Accordion
      multiple
      defaultValue={['general', 'security']}
      items={[
        {
          value: 'general',
          label: 'General Workspace Information',
          leading: 'i-lucide:settings',
          content: 'Configure your organization name, slug, avatar, and default language settings.',
        },
        {
          value: 'security',
          label: 'Security & Access Control',
          leading: 'i-lucide:shield-alert',
          content:
            'Manage SSO providers, enforce two-factor authentication, and review active sessions.',
        },
        {
          value: 'billing',
          label: 'Subscription & Invoices',
          leading: 'i-lucide:credit-card',
          content:
            'View current plan usage, payment methods, and download historical invoice receipts.',
        },
      ]}
      classes={{
        root: 'max-w-xl rounded-xl b-1 b-border border-border bg-card',
        trigger: 'px-4',
        content: 'px-4 text-foreground text-sm',
      }}
    />
  )
}
