import { Button, Tooltip } from '@src'

export function Placements() {
  return (
    <div class="flex flex-wrap gap-4 items-center">
      <Tooltip text="View global dashboard overview" placement="top">
        {(props) => (
          <Button {...props} variant="outline" size="sm" leading="i-lucide:layout-dashboard">
            Top (Dashboard)
          </Button>
        )}
      </Tooltip>

      <Tooltip text="Manage workspace members and permissions" placement="right">
        {(props) => (
          <Button {...props} variant="outline" size="sm" leading="i-lucide:users">
            Right (Members)
          </Button>
        )}
      </Tooltip>

      <Tooltip text="Configure billing methods and invoices" placement="bottom">
        {(props) => (
          <Button {...props} variant="outline" size="sm" leading="i-lucide:credit-card">
            Bottom (Billing)
          </Button>
        )}
      </Tooltip>

      <Tooltip text="Review system notifications and alerts" placement="left">
        {(props) => (
          <Button {...props} variant="outline" size="sm" leading="i-lucide:bell">
            Left (Notifications)
          </Button>
        )}
      </Tooltip>
    </div>
  )
}
