import { Button, Checkbox, createForm } from '@src'
import { createSignal } from 'solid-js'
import * as v from 'valibot'

// Consent Mode expects 'granted' | 'denied' rather than booleans.
const ConsentState = v.picklist(['granted', 'denied'])

const consentSchema = v.object({
  analytics_storage: ConsentState,
  ad_storage: ConsentState,
  ad_personalization: ConsentState,
})

type ConsentUpdate = v.InferOutput<typeof consentSchema>

export function ConsentPreferences() {
  const [saved, setSaved] = createSignal<ConsentUpdate>()
  const form = createForm({
    schema: consentSchema,
    // Privacy-first default: nothing optional is granted until the visitor opts in.
    initialInput: {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_personalization: 'denied',
    },
  })

  return (
    <form.Form onSubmit={(output) => setSaved(output)}>
      <div class="p-4 b-1 b-border rounded-xl max-w-xl space-y-4">
        <div class="space-y-3">
          <form.Field name="analytics_storage">
            <Checkbox
              trueValue="granted"
              falseValue="denied"
              label="Analytics"
              description="Measure page views and feature usage to improve the product."
            />
          </form.Field>
          <form.Field name="ad_storage">
            <Checkbox
              trueValue="granted"
              falseValue="denied"
              label="Advertising"
              description="Store cookies that measure ad performance."
            />
          </form.Field>
          <form.Field name="ad_personalization">
            <Checkbox
              trueValue="granted"
              falseValue="denied"
              label="Personalized ads"
              description="Use activity on this site to tailor ads elsewhere."
            />
          </form.Field>
        </div>

        <Button type="submit" size="sm">
          Save preferences
        </Button>

        <pre class="text-xs font-mono p-3 rounded-md bg-muted overflow-x-auto">
          {saved()
            ? `gtag('consent', 'update', ${JSON.stringify(saved(), null, 2)})`
            : 'Save to see the consent update payload.'}
        </pre>
      </div>
    </form.Form>
  )
}
