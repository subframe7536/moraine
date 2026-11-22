import { Alert } from '@src'

export function Basic() {
  return (
    <div class="flex flex-col gap-3 max-w-xl w-full">
      <Alert tone="default" title="Default announcement" />
      <Alert tone="info" title="Informational note for users" />
      <Alert tone="success" title="Success! Operation completed successfully" />
      <Alert tone="warning" title="Warning: Please check your configuration" />
      <Alert tone="danger" title="Error: An unexpected error occurred" />
    </div>
  )
}
