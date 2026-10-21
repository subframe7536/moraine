import { Alert } from '@src'

export function Basic() {
  return (
    <div class="flex flex-col gap-3 max-w-xl w-full">
      <Alert title="Default announcement" />
      <Alert type="info" title="Informational note for users" />
      <Alert type="success" title="Success! Operation completed successfully" />
      <Alert type="warning" title="Warning: Please check your configuration" />
      <Alert type="error" title="Error: An unexpected error occurred" />
    </div>
  )
}
