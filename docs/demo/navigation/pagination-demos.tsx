import { createSignal } from 'solid-js'

import { Pagination } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

function Controlled() {
  const [page, setPage] = createSignal(3)

  return (
    <div class="space-y-3">
      <Pagination
        page={page()}
        onPageChange={setPage}
        total={120}
        itemsPerPage={10}
        siblingCount={1}
        prevText="Previous"
        nextText="Next"
      />
      <p class="text-xs text-muted-foreground">Current page: {page()}</p>
    </div>
  )
}

function CustomVariants() {
  return (
    <Pagination
      total={60}
      itemsPerPage={10}
      to={(nextPage) => `#pagination&page=${nextPage}`}
      variant="outline"
      activeVariant="default"
      controlVariant="secondary"
    />
  )
}

function Minimal() {
  return <Pagination total={80} itemsPerPage={10} showControls={false} />
}

export default () => {
  return (
    <DemoPage componentKey="pagination">
      <DemoSection
        title="Controlled"
        description="Default ghost + outline controls with external page state management."
        demo={Controlled}
      />

      <DemoSection
        title="Custom Variants"
        description="Render controls as links and override variant pairing when needed."
        demo={CustomVariants}
      />

      <DemoSection
        title="Minimal"
        description="Hide prev/next controls and show only page buttons."
        demo={Minimal}
      />
    </DemoPage>
  )
}
