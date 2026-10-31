import { Accordion } from '@src'

export function Multiple() {
  return (
    <div class="max-w-xl w-full">
      <Accordion
        multiple
        defaultValue={['general', 'security']}
        items={[
          {
            value: 'general',
            label: 'General Workspace Information',
            leading: 'i-lucide:settings',
            content:
              'Configure your organization name, slug, avatar, and default language settings.',
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
      />
    </div>
  )
}
