import { Checkbox } from '@src'

export function Variants() {
  return (
    <div class="gap-8 grid sm:grid-cols-2">
      <div class="space-y-3">
        <Checkbox
          label="Terms of Service"
          description="I agree to the Terms of Service and Privacy Policy."
          defaultChecked
        />
        <Checkbox
          label="Weekly digest"
          description="Receive a summary of workspace activity every Monday."
          indicator="end"
          defaultChecked
        />
        <Checkbox
          label="Auto-save drafts"
          description="Save document edits automatically to local cache."
          indicator="hidden"
          defaultChecked
        />
      </div>

      <div class="space-y-3">
        <Checkbox
          variant="card"
          label="Automatic renewal"
          description="Renews automatically on Oct 24 for $19/month."
          defaultChecked
        />
        <Checkbox
          variant="card"
          label="Two-factor authentication"
          description="Require a hardware key or TOTP code on login."
          indicator="end"
        />
        <Checkbox
          variant="card"
          label="Dedicated IP pool"
          description="Available exclusively on Enterprise tier plans."
          disabled
        />
      </div>
    </div>
  )
}
