import { createSignal } from 'solid-js'

import { Pagination } from '../../src'

import { DemoPage, DemoSection } from './common/demo-page'

export const PaginationDemos = () => {
  const [page, setPage] = createSignal(3)

  return (
    <DemoPage
      eyebrow="Rock UI Playground"
      title="Pagination"
      description="Nova-inspired pagination spacing with controlled/uncontrolled modes and variant customization."
    >
      <DemoSection
        title="Controlled"
        description="Default ghost + outline controls with external page state management."
      >
        <div class="space-y-3">
          <Pagination
            page={page()}
            onPageChange={setPage}
            total={120}
            itemsPerPage={10}
            siblingCount={1}
          />
          <p class="text-xs text-zinc-600">Current page: {page()}</p>
        </div>
      </DemoSection>

      <DemoSection
        title="Custom Variants"
        description="Render controls as links and override variant pairing when needed."
      >
        <Pagination
          total={60}
          itemsPerPage={10}
          to={(nextPage) => `#pagination&page=${nextPage}`}
          variant="outline"
          activeVariant="default"
          controlVariant="secondary"
        />
      </DemoSection>

      <DemoSection
        title="Minimal"
        description="Hide prev/next controls and show only page buttons."
      >
        <Pagination total={80} itemsPerPage={10} showControls={false} />
      </DemoSection>
    </DemoPage>
  )
}
