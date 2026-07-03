import { Accordion } from '@src'

export function Multiple() {
  return (
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
        root: 'max-w-xl rounded-lg b-1 b-border border-border bg-background',
        trigger: 'px-4',
        content: 'px-4 text-foreground',
      }}
    />
  )
}
