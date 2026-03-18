import { createSignal } from 'solid-js'

import { Accordion } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

export default () => {
  const [openValue, setOpenValue] = createSignal<string[]>(['shipping'])

  return (
    <DemoPage componentKey="accordion">
      <DemoSection
        title="Single"
        description="Single-open mode with controlled state and icon leading/trailing slots."
      >
        <div class="max-w-xl space-y-3">
          <Accordion
            value={openValue()}
            onChange={setOpenValue}
            items={[
              {
                value: 'shipping',
                label: 'Shipping information',
                leading: 'i-lucide-truck',
                content:
                  'Orders are processed in 1-2 business days and delivered in 3-5 business days.',
              },
              {
                value: 'returns',
                label: 'Returns policy',
                leading: 'i-lucide-rotate-ccw',
                content: 'Returns are accepted within 30 days of delivery.',
              },
              {
                value: 'support',
                label: 'Support',
                leading: 'i-lucide-life-buoy',
                content: 'Reach support any time at support@example.com.',
              },
            ]}
          />

          <p class="text-xs text-zinc-600">Current open value: {openValue()?.[0] ?? 'none'}</p>
        </div>
      </DemoSection>

      <DemoSection title="Multiple" description="Multiple-open mode with custom trailing icons.">
        <Accordion
          multiple
          defaultValue={['a']}
          items={[
            {
              value: 'a',
              label: 'Account setup',
              content: 'Create your account and verify email.',
            },
            {
              value: 'b',
              label: 'Team invite',
              content: 'Invite teammates to your workspace.',
            },
            {
              value: 'c',
              label: 'Billing',
              content: 'Add a payment method to continue.',
            },
          ]}
          classes={{
            root: 'max-w-xl rounded-lg b-1 b-border border-zinc-200 bg-white',
            trigger: 'px-4',
            content: 'px-4 text-zinc-700',
          }}
        />
      </DemoSection>

      <DemoSection
        title="Disabled + Custom Content"
        description="Mix disabled items with rich JSX content blocks."
      >
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
                  <div class="text-xs text-zinc-600 p-2 rounded-md bg-zinc-100">
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
            root: 'max-w-xl rounded-lg b-1 b-border border-zinc-200 bg-white',
            trigger: 'px-3',
            content: 'px-4 text-zinc-700',
          }}
        />
      </DemoSection>
    </DemoPage>
  )
}
