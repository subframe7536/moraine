import { Badge, Pagination } from '@src'
import { createMemo, createSignal, For } from 'solid-js'

export function Controlled() {
  const [page, setPage] = createSignal(1)
  const itemsPerPage = 3

  const ALL_CUSTOMERS = [
    { id: 1, name: 'Stripe Inc.', plan: 'Enterprise', status: 'Active', mrr: '$2,400' },
    { id: 2, name: 'Vercel Labs', plan: 'Enterprise', status: 'Active', mrr: '$1,800' },
    { id: 3, name: 'Linear App', plan: 'Pro', status: 'Active', mrr: '$450' },
    { id: 4, name: 'Supabase Inc.', plan: 'Enterprise', status: 'Active', mrr: '$3,200' },
    { id: 5, name: 'Resend Co.', plan: 'Pro', status: 'Active', mrr: '$600' },
    { id: 6, name: 'Raycast HQ', plan: 'Pro', status: 'Trial', mrr: '$0' },
    { id: 7, name: 'Figma Design', plan: 'Enterprise', status: 'Active', mrr: '$4,500' },
    { id: 8, name: 'Midjourney AI', plan: 'Enterprise', status: 'Active', mrr: '$6,000' },
  ]

  const currentRecords = createMemo(() => {
    const start = (page() - 1) * itemsPerPage
    return ALL_CUSTOMERS.slice(start, start + itemsPerPage)
  })

  return (
    <div class="p-4 b-(1 border) rounded-xl bg-card max-w-xl space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-semibold">Active Customers</h4>
        <span class="text-xs text-muted-foreground">
          Showing {(page() - 1) * itemsPerPage + 1}–
          {Math.min(page() * itemsPerPage, ALL_CUSTOMERS.length)} of {ALL_CUSTOMERS.length} records
        </span>
      </div>

      <div class="text-xs divide-border divide-y">
        <For each={currentRecords()}>
          {(customer) => (
            <div class="py-2.5 flex items-center justify-between">
              <div>
                <p class="text-foreground font-medium">{customer.name}</p>
                <p class="text-muted-foreground">{customer.plan} tier</p>
              </div>
              <div class="flex gap-3 items-center">
                <Badge variant={customer.status === 'Active' ? 'solid' : 'outline'} size="sm">
                  {customer.status}
                </Badge>
                <span class="font-medium font-mono">{customer.mrr}/mo</span>
              </div>
            </div>
          )}
        </For>
      </div>

      <div class="pt-2 border-t border-border flex justify-center">
        <Pagination
          page={page()}
          onPageChange={setPage}
          total={ALL_CUSTOMERS.length}
          itemsPerPage={itemsPerPage}
          siblingCount={1}
          prevText="Previous"
          nextText="Next"
        />
      </div>
    </div>
  )
}
