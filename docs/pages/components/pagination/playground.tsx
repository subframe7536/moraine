import { Pagination } from '@src'
import { createSignal } from 'solid-js'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function PaginationPlayground() {
  const [page, setPage] = createSignal(1)

  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'tone',
          label: 'Tone',
          defaultValue: 'neutral',
          options: [
            { label: 'Neutral', value: 'neutral' },
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
            { label: 'Danger', value: 'danger' },
            { label: 'Info', value: 'info' },
            { label: 'Success', value: 'success' },
            { label: 'Warning', value: 'warning' },
          ],
        },
        {
          kind: 'select',
          prop: 'variant',
          label: 'Variant',
          defaultValue: 'ghost',
          options: [
            { label: 'Ghost', value: 'ghost' },
            { label: 'Solid', value: 'solid' },
            { label: 'Soft', value: 'soft' },
            { label: 'Outline', value: 'outline' },
            { label: 'Link', value: 'link' },
          ],
        },
        {
          kind: 'select',
          prop: 'activeVariant',
          label: 'Active variant',
          defaultValue: 'outline',
          options: [
            { label: 'Outline', value: 'outline' },
            { label: 'Solid', value: 'solid' },
            { label: 'Soft', value: 'soft' },
            { label: 'Ghost', value: 'ghost' },
            { label: 'Link', value: 'link' },
          ],
        },
        {
          kind: 'select',
          prop: 'size',
          label: 'Size',
          defaultValue: 'md',
          options: [
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
          ],
        },
        {
          kind: 'input',
          prop: 'itemsPerPage',
          label: 'Items per page',
          defaultValue: 10,
          inputType: 'number',
        },
        { kind: 'switch', prop: 'showControls', label: 'Show arrows', defaultValue: true },
      ]}
    >
      {(props) => {
        const itemsPerPage = () =>
          Number.isFinite(props.itemsPerPage) ? Math.max(1, Math.trunc(props.itemsPerPage)) : 10
        const pageCount = () => Math.ceil(100 / itemsPerPage())
        const currentPage = () => Math.min(page(), pageCount())
        return (
          <div class="flex flex-col gap-3 items-center">
            <Pagination
              total={100}
              page={currentPage()}
              onPageChange={setPage}
              itemsPerPage={itemsPerPage()}
              size={props.size}
              variant={props.variant}
              activeVariant={props.activeVariant}
              tone={props.tone}
              showControls={props.showControls}
            />
            <span class="text-xs text-muted-foreground font-mono">
              Current Page: {currentPage()} of {pageCount()}
            </span>
          </div>
        )
      }}
    </DocsPlayground>
  )
}
