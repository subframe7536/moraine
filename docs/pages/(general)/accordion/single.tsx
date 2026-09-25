import { Accordion } from '@src'
import { createSignal } from 'solid-js'

export function Single() {
  const [openValue, setOpenValue] = createSignal<string[]>(['invite'])

  return (
    <div class="max-w-xl w-full space-y-3">
      <Accordion
        value={openValue()}
        onChange={setOpenValue}
        items={[
          {
            value: 'invite',
            label: 'What should I check before inviting a member?',
            leading: 'i-lucide:user-plus',
            content:
              'Confirm the email address and choose the role that gives the person only the access they need.',
          },
          {
            value: 'archive',
            label: 'When should I archive a project?',
            leading: 'i-lucide:archive',
            content:
              'Archive work that no longer needs active updates after your team has saved any reports it still needs.',
          },
          {
            value: 'status',
            label: 'Where should a release status be recorded?',
            leading: 'i-lucide:list-checks',
            content:
              'Keep the status on the release record so everyone sees the same source of truth.',
          },
        ]}
      />

      <p class="text-muted-foreground text-xs">
        Active section:{' '}
        <span class="text-foreground font-medium">{openValue()?.[0] ?? 'none'}</span>
      </p>
    </div>
  )
}
