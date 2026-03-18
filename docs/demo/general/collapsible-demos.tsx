import { createSignal } from 'solid-js'

import { Collapsible } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

export default () => {
  const [open, setOpen] = createSignal(true)

  return (
    <DemoPage componentKey="collapsible">
      <DemoSection
        title="Uncontrolled"
        description="Default closed panel using the built-in trigger slot."
      >
        <Collapsible
          defaultOpen={false}
          classes={{
            root: 'max-w-xl rounded-lg b-1 b-border border-zinc-200 bg-white',
            trigger:
              'w-full px-4 py-3 text-left text-sm font-medium flex items-center justify-between hover:bg-zinc-50',
            content: 'px-4 pb-4 text-sm text-zinc-700',
          }}
          trigger={(props) => (
            <>
              <span>Release notes</span>
              <span class={`text-zinc-500 transition-transform ${props.open ? 'rotate-180' : ''}`}>
                <span class="i-lucide-chevron-down" />
              </span>
            </>
          )}
        >
          <p>
            Version 0.1 includes initial Tabs, Pagination, Navigation Menu, and Breadcrumb ports.
          </p>
        </Collapsible>
      </DemoSection>

      <DemoSection title="Controlled" description="External state control and disabled handling.">
        <div class="max-w-xl space-y-3">
          <div class="flex gap-2">
            <button
              type="button"
              class="text-sm px-3 py-1.5 b-1 b-border border-zinc-300 rounded-md hover:bg-zinc-100"
              onClick={() => setOpen((value) => !value)}
            >
              Toggle controlled panel
            </button>
          </div>

          <Collapsible
            open={open()}
            onOpenChange={setOpen}
            classes={{
              root: 'rounded-lg b-1 b-border border-zinc-200 bg-white',
              trigger:
                'w-full px-4 py-3 text-left text-sm font-medium flex items-center justify-between hover:bg-zinc-50',
              content: 'px-4 pb-4 text-sm text-zinc-700',
            }}
            trigger={({ open: isOpen }) => (
              <>
                <span>Controlled state panel</span>
                <span class={`text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                  <span class="i-lucide-chevron-down" />
                </span>
              </>
            )}
          >
            <p>Current state: {open() ? 'open' : 'closed'}</p>
          </Collapsible>
        </div>
      </DemoSection>
    </DemoPage>
  )
}
