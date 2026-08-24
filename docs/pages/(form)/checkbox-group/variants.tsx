import { CheckboxGroup } from '@src'

export function Variants() {
  const NOTIFICATIONS = [
    { value: 'email', label: 'Email alerts', description: 'Weekly digests and activity summaries' },
    {
      value: 'push',
      label: 'Push notifications',
      description: 'Real-time incident updates on mobile',
    },
    { value: 'sms', label: 'SMS alerts', description: 'Critical security alerts only' },
  ]

  const SECURITY = [
    {
      value: '2fa',
      label: 'Two-factor authentication',
      description: 'Enforce TOTP for all team members',
    },
    {
      value: 'ip-allowlist',
      label: 'IP allowlist',
      description: 'Restrict access to corporate VPN',
    },
    {
      value: 'session-timeout',
      label: 'Short session timeout',
      description: 'Auto-logout after 15 minutes of inactivity',
    },
  ]

  const SCOPES = [
    {
      value: 'repo:read',
      label: 'Repository read',
      description: 'Clone and read public/private repos',
    },
    {
      value: 'pkg:write',
      label: 'Packages write',
      description: 'Publish npm and container packages',
    },
    { value: 'admin:org', label: 'Admin organization', description: 'Manage billing and members' },
  ]

  return (
    <div class="gap-4 grid lg:grid-cols-3 sm:grid-cols-2">
      <div class="p-4 b-(1 border) rounded-xl">
        <CheckboxGroup
          legend="Notification channels"
          items={NOTIFICATIONS}
          defaultValue={['email', 'push']}
        />
      </div>
      <div class="p-4 b-(1 border) rounded-xl">
        <CheckboxGroup
          legend="Security policies"
          items={SECURITY}
          variant="card"
          defaultValue={['2fa']}
        />
      </div>
      <div class="p-4 b-(1 border) rounded-xl">
        <CheckboxGroup
          legend="API token scopes"
          items={SCOPES}
          variant="table"
          defaultValue={['repo:read']}
        />
      </div>
    </div>
  )
}
