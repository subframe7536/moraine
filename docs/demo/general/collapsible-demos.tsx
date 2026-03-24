import { createSignal } from 'solid-js'

import { Collapsible } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

function Uncontrolled() {
  return (
    <Collapsible
      defaultOpen={false}
      classes={{
        root: 'w-xl rounded-lg b-(1 border) bg-muted',
        trigger: 'w-full px-4 py-3 text-left text-sm font-medium flex items-center justify-between',
        content: 'px-4 pb-4 text-sm text-foreground',
      }}
      trigger={(props) => (
        <>
          <span>Release notes</span>
          <span
            class={`text-muted-foreground transition-transform ${props.open ? 'rotate-180' : ''}`}
          >
            <span class="i-lucide-chevron-down" />
          </span>
        </>
      )}
    >
      <p>Version 0.1 includes Tabs, Pagination, Breadcrumb, and Form primitives.</p>
    </Collapsible>
  )
}

function Controlled() {
  const [open, setOpen] = createSignal(true)

  return (
    <div class="max-w-xl space-y-3">
      <div class="flex gap-2">
        <button
          type="button"
          class="text-sm px-3 py-1.5 b-(1 border) rounded-md hover:bg-muted"
          onClick={() => setOpen((value) => !value)}
        >
          Toggle controlled panel
        </button>
      </div>

      <Collapsible
        open={open()}
        onOpenChange={setOpen}
        classes={{
          root: 'rounded-lg b-(1 border)',
          trigger:
            'w-full px-4 py-3 text-left text-sm font-medium flex items-center justify-between hover:bg-muted',
          content: 'px-4 pb-4 text-sm text-foreground',
        }}
        trigger={({ open: isOpen }) => (
          <>
            <span>Controlled state panel</span>
            <span
              class={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
            >
              <span class="i-lucide-chevron-down" />
            </span>
          </>
        )}
      >
        <p>Current state: {open() ? 'open' : 'closed'}</p>
      </Collapsible>
    </div>
  )
}

function DisabledForceMount() {
  const [quickPanelOpen, setQuickPanelOpen] = createSignal(false)

  return (
    <div class="gap-3 grid lg:grid-cols-2">
      <Collapsible
        disabled
        defaultOpen
        classes={{
          root: 'rounded-lg b-(1 border)',
          trigger:
            'w-full px-4 py-3 text-left text-sm font-medium flex items-center justify-between data-disabled:opacity-60',
          content: 'px-4 pb-4 text-sm text-foreground',
        }}
        trigger={({ open: isOpen }) => (
          <>
            <span>Disabled panel</span>
            <span
              class={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
            >
              <span class="i-lucide-chevron-down" />
            </span>
          </>
        )}
      >
        <p>Trigger is disabled, content keeps current state.</p>
      </Collapsible>

      <Collapsible
        forceMount
        open={quickPanelOpen()}
        onOpenChange={setQuickPanelOpen}
        classes={{
          root: 'rounded-lg b-(1 border)',
          trigger:
            'w-full px-4 py-3 text-left text-sm font-medium flex items-center justify-between',
          content: 'px-4 pb-4 text-sm text-foreground',
        }}
        trigger={({ open: isOpen }) => (
          <>
            <span>Force-mount panel</span>
            <span
              class={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
            >
              <span class="i-lucide-chevron-down" />
            </span>
          </>
        )}
      >
        <p>Content DOM stays mounted even when closed.</p>
      </Collapsible>
    </div>
  )
}

function CompactTriggerComposition() {
  return (
    <div class="max-w-xl space-y-2">
      <Collapsible
        defaultOpen
        classes={{
          root: 'rounded-lg b-(1 border)',
          trigger:
            'w-xl px-3 py-2 text-left text-xs font-semibold tracking-wide flex items-center justify-between',
          content: 'px-3 pb-3 text-sm text-foreground',
        }}
        trigger={({ open: isOpen }) => (
          <>
            <span class="text-muted-foreground uppercase">Quick panel</span>
            <span
              class={`rounded bg-muted inline-flex size-5 transition-transform items-center justify-center ${isOpen ? 'rotate-180' : ''}`}
            >
              <span class="i-lucide-chevron-down text-xs text-muted-foreground" />
            </span>
          </>
        )}
      >
        <p>Small trigger footprint for navigation and side content.</p>
      </Collapsible>
    </div>
  )
}

export default () => {
  return (
    <DemoPage componentKey="collapsible">
      <DemoSection
        title="Uncontrolled"
        description="Default closed panel using trigger render context."
        demo={Uncontrolled}
      />

      <DemoSection
        title="Controlled"
        description="External state controls the panel open status."
        demo={Controlled}
      />

      <DemoSection
        title="Disabled + Force Mount"
        description="Disabled trigger and force-mount content behavior."
        demo={DisabledForceMount}
      />

      <DemoSection
        title="Compact Trigger Composition"
        description="Use compact trigger UI for dense list and settings surfaces."
        demo={CompactTriggerComposition}
      />
    </DemoPage>
  )
}
