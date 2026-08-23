import { Accordion } from '@src'

export function DisabledCustomContent() {
  return (
    <Accordion
      defaultValue={['setup']}
      trailing="icon-plus"
      items={[
        {
          value: 'setup',
          label: 'Setup checklist',
          leading: 'i-lucide-list-checks',
          content: (
            <div class="space-y-2">
              <p>Complete these steps before inviting your team:</p>
              <ul class="pl-5 list-disc space-y-1">
                <li>Create workspace profile</li>
                <li>Configure authentication</li>
                <li>Enable notifications</li>
              </ul>
              <div class="text-xs text-muted-foreground p-2 rounded-md bg-muted">
                Tip: You can finish the checklist later from Settings.
              </div>
            </div>
          ),
        },
        {
          value: 'security',
          label: 'Security review (Locked)',
          leading: 'i-lucide-shield-check',
          disabled: true,
          content: 'Available on Pro plan and above.',
        },
        {
          value: 'integrations',
          label: 'Integrations',
          leading: 'i-lucide-plug',
          content: (
            <div class="pt-2 space-y-2">
              <p>Connect your tools to automate the workflow.</p>
              <p>
                Supported: <strong>GitHub</strong>, <strong>Slack</strong>, and{' '}
                <strong>Notion</strong>.
              </p>
            </div>
          ),
        },
      ]}
      classes={{
        root: 'max-w-xl rounded-lg b-1 b-border border-border bg-background',
        trigger: 'px-3',
        content: 'px-4 text-foreground',
      }}
    />
  )
}
