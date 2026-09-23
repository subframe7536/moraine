import { Field, Pagination, Select } from '@src'
import type { SelectT } from '@src'
import { createMemo, createSignal, For } from 'solid-js'

const RESULTS = [
  'Account settings',
  'Billing history',
  'Connected apps',
  'Developer keys',
  'Email preferences',
  'Export requests',
  'Member invitations',
  'Notification rules',
  'Privacy controls',
  'Team permissions',
  'Usage reports',
  'Workspace details',
]

const PAGE_SIZES: SelectT.Item<number>[] = [
  { value: 3, label: '3 results' },
  { value: 6, label: '6 results' },
  { value: 12, label: '12 results' },
]

export function PageSize() {
  const [page, setPage] = createSignal(1)
  const [pageSize, setPageSize] = createSignal(3)
  const visible = createMemo(() => {
    const start = (page() - 1) * pageSize()
    return RESULTS.slice(start, start + pageSize())
  })

  return (
    <div class="max-w-md w-full space-y-4">
      <Field label="Results per page">
        <Select
          items={PAGE_SIZES}
          value={pageSize()}
          onChange={(value) => {
            if (value === null) {
              return
            }
            setPageSize(value)
            setPage(1)
          }}
        />
      </Field>
      <ul class="text-sm border-y border-border divide-border divide-y">
        <For each={visible()}>{(result) => <li class="py-2">{result}</li>}</For>
      </ul>
      <Pagination
        total={RESULTS.length}
        itemsPerPage={pageSize()}
        page={page()}
        onPageChange={setPage}
      />
    </div>
  )
}
