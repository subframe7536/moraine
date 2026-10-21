import { Alert } from '@src'

export function Description() {
  return (
    <div class="flex flex-col gap-3 max-w-xl w-full">
      <Alert
        type="info"
        title="Account verification"
        description="We have sent a verification code to your email. Please confirm it within 24 hours."
      />
      <Alert
        type="success"
        title="Payment received"
        description="Your subscription is now active. Your next billing date is November 21, 2026."
      />
      <Alert
        type="warning"
        title="Storage limit approaching"
        description="You have used 85% of your available storage capacity. Consider upgrading your plan."
      />
      <Alert
        type="error"
        title="Deployment failed"
        description="The build process encountered syntax errors in src/index.ts. Check pipeline logs for details."
      />
    </div>
  )
}
