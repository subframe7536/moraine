import { AlertDialog, Button } from '@src'

export function AlertTypes() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Button
        variant="outline"
        leading="i-lucide:refresh-cw"
        onClick={() =>
          void AlertDialog.info({
            title: 'System update available',
            description:
              'Version 2.5.0 has been downloaded in the background. Restart your workspace to apply performance improvements.',
            okText: 'Restart now',
          })
        }
      >
        Update ready
      </Button>
      <Button
        variant="outline"
        leading="i-lucide:alert-triangle"
        onClick={() =>
          void AlertDialog.warning({
            title: 'Storage threshold reached',
            description:
              'Your team organization has utilized 92% of allocated disk capacity. Automatic snapshots may be throttled soon.',
            okText: 'Manage quota',
          })
        }
      >
        Storage warning
      </Button>
      <Button
        variant="outline"
        leading="i-lucide:alert-circle"
        onClick={() =>
          void AlertDialog.error({
            title: 'Pipeline deployment failed',
            description:
              'Worker process exited with code 137 (Out of Memory) during asset minification. Inspect build logs for diagnostics.',
            okText: 'View logs',
          })
        }
      >
        Build failure
      </Button>
      <Button
        variant="outline"
        leading="i-lucide:check"
        onClick={() =>
          void AlertDialog.success({
            title: 'Database snapshot completed',
            description:
              'Encrypted database backup "prod_db_20261013" was successfully uploaded to cold storage.',
            okText: 'Done',
          })
        }
      >
        Backup created
      </Button>
    </div>
  )
}
