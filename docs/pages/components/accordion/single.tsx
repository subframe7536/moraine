import { Accordion } from '@src'
export function Single() {
  return (
    <div class="max-w-xl w-full">
      <Accordion
        defaultValue={['invite']}
        items={[
          {
            value: 'invite',
            label: 'What should I check before inviting a member?',
            icon: 'i-lucide:user-plus',
            content:
              'Confirm the email address and choose the role that gives the person only the access they need.',
          },
          {
            value: 'archive',
            label: 'When should I archive a project?',
            icon: 'i-lucide:archive',
            content:
              'Archive work that no longer needs active updates after your team has saved any reports it still needs.',
          },
          {
            value: 'status',
            label: 'Where should a release status be recorded?',
            icon: 'i-lucide:list-checks',
            content:
              'Keep the status on the release record so everyone sees the same source of truth.',
          },
        ]}
      />
    </div>
  )
}
