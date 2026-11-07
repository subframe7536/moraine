import { Button, createForm, PinInput } from '@src'
import { createSignal } from 'solid-js'
import * as v from 'valibot'

export function FormIntegration() {
  const [submittedCode, setSubmittedCode] = createSignal('')
  const form = createForm({
    schema: v.object({
      code: v.pipe(
        v.string('Verification code is required'),
        v.length(6, 'Verification code must be 6 digits'),
        v.regex(/^\d+$/, 'Verification code must contain digits only'),
      ),
    }),
    initialInput: { code: '' },
    validate: 'submit',
  })

  return (
    <form.Form onSubmit={(output) => setSubmittedCode(output.code)}>
      <div class="max-w-md space-y-4">
        <form.Field
          name="code"
          label="Verification code"
          description="Enter the 6-digit code sent to your device."
          required
        >
          <PinInput length={6} separator type="number" otp />
        </form.Field>
        <div class="flex gap-3 items-center">
          <Button type="submit" variant="soft" tone="neutral" size="sm">
            Verify
          </Button>
          <p class="text-xs text-muted-foreground">Verified: {submittedCode() || 'none'}</p>
        </div>
      </div>
    </form.Form>
  )
}
