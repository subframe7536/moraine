import { FormField, RadioGroup } from '@src'

export function Variants() {
  const PLANS = [
    { value: 'free', label: 'Hobby', description: 'Free forever for side projects' },
    { value: 'pro', label: 'Pro ($20/mo)', description: 'For growing engineering teams' },
    { value: 'enterprise', label: 'Enterprise', description: 'Dedicated support & custom SLAs' },
  ]

  const PAYMENTS = [
    { value: 'card', label: 'Credit Card', description: 'Visa, Mastercard, Amex' },
    { value: 'paypal', label: 'PayPal', description: 'Instant account checkout' },
    { value: 'invoice', label: 'Bank Wire / Invoice', description: 'Net 30 payment terms' },
  ]

  const BACKUPS = [
    { value: 'hourly', label: 'Hourly', description: 'Continuous point-in-time recovery' },
    { value: 'daily', label: 'Daily (Default)', description: 'Retained for 30 days' },
    { value: 'weekly', label: 'Weekly', description: 'Long-term cold storage archive' },
  ]

  return (
    <div class="gap-4 grid lg:grid-cols-3 sm:grid-cols-1">
      <div class="p-4 b-(1 border) rounded-xl">
        <FormField label="Subscription Plan (Card)">
          <RadioGroup items={PLANS} variant="card" defaultValue="pro" />
        </FormField>
      </div>

      <div class="p-4 b-(1 border) rounded-xl">
        <FormField label="Payment Method (List)">
          <RadioGroup items={PAYMENTS} defaultValue="card" />
        </FormField>
      </div>

      <div class="p-4 b-(1 border) rounded-xl">
        <FormField label="Backup Schedule (Table)">
          <RadioGroup items={BACKUPS} variant="table" orientation="vertical" defaultValue="daily" />
        </FormField>
      </div>
    </div>
  )
}
