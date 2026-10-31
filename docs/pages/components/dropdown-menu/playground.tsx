import { Button, DropdownMenu } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function DropdownMenuPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'size',
          label: 'Size',
          defaultValue: 'md',
          options: [
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
          ],
        },
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
      ]}
    >
      {(props) => (
        <DropdownMenu disabled={props.disabled} size={props.size}>
          <DropdownMenu.Trigger as={Button} variant="outline" trailing="i-lucide:chevron-down">
            Account Actions
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            items={[
              {
                type: 'group',
                label: 'Account',
                children: [
                  {
                    label: 'Profile',
                    description: 'Manage your public profile',
                    icon: 'i-lucide:user',
                  },
                  { label: 'Billing', icon: 'i-lucide:credit-card' },
                  { label: 'Settings', icon: 'i-lucide:settings', kbds: ['⌘', 'S'] },
                  {
                    label: 'Workspace',
                    icon: 'i-lucide:building-2',
                    children: [
                      { label: 'Personal', icon: 'i-lucide:user' },
                      { label: 'Team', icon: 'i-lucide:users' },
                    ],
                  },
                ],
              },
              {
                type: 'group',
                children: [
                  { type: 'separator' },
                  {
                    type: 'checkbox',
                    label: 'Notifications',
                    icon: 'i-lucide:bell',
                    defaultChecked: true,
                  },
                  { label: 'Sign out', icon: 'i-lucide:log-out', variant: 'danger' },
                ],
              },
            ]}
          />
        </DropdownMenu>
      )}
    </DocsPlayground>
  )
}
