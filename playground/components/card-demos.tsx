import { Button, Card, FormField, Icon, Input, Select } from '../../src'

import { DemoPage, DemoSection } from './common/demo-page'

const frameworkOptions = [
  { label: 'Vite', value: 'vite' },
  { label: 'Solid Start', value: 'solid-start' },
  { label: 'Tanstack Start', value: 'tanstack-start' },
  { label: 'Astro', value: 'astro' },
]

export const CardDemos = () => (
  <DemoPage
    eyebrow="Rock UI Playground"
    title="Card"
    description="Zaidan-style card surface with optional header, body, and footer slots."
  >
    <DemoSection title="Default" description="Create project form card from coss/ui.">
      <Card
        title="Create project"
        description="Deploy your new project in one-click."
        footer={
          <>
            <Button class="w-full" type="submit">
              Deploy
            </Button>
            <div class="text-xs text-muted-foreground m-a flex gap-1 items-center">
              <Icon name="i-lucide-circle-alert" class="h-lh shrink-0 size-3" />
              <p>This will take a few seconds to complete.</p>
            </div>
          </>
        }
        classes={{ root: 'w-full max-w-xs', footer: 'flex flex-col gap-3' }}
      >
        <div class="flex flex-col gap-4">
          <FormField label="Name">
            <Input placeholder="Name of your project" />
          </FormField>
          <FormField label="Framework">
            <Select options={frameworkOptions} value="vite" />
          </FormField>
        </div>
      </Card>
    </DemoSection>

    <DemoSection title="Sizes" description="Default and compact size presets.">
      <div class="flex gap-2">
        <Card
          compact
          header={
            <>
              <h3 class="font-semibold">Small Card</h3>
              <p class="text-xs text-muted-foreground">Compact</p>
            </>
          }
          footer={<Button size="sm">Action</Button>}
          classes={{ root: 'max-w-xs h-fit' }}
        >
          <p class="text-sm opacity-85">Compact spacing for dense layouts and sidebars.</p>
        </Card>

        <Card
          title="Default Card"
          description="Default"
          footer={<Button size="sm">Action</Button>}
          classes={{ root: 'max-w-xs h-fit' }}
        >
          <p class="text-sm opacity-85">Standard spacing for normal form and dashboard cards.</p>
        </Card>
      </div>
    </DemoSection>

    <DemoSection title="With Image" description="Media-first card using body slot customization.">
      <div class="max-w-sm">
        <Card
          classes={{ header: 'pb-6' }}
          header={
            <img
              src="https://images.unsplash.com/photo-1604076850742-4c7221f3101b?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Landscape by mymind on Unsplash"
              class="rounded-t-2xl w-full aspect-video object-cover brightness-60 grayscale"
            />
          }
          footer={<Button class="w-full">Open</Button>}
        >
          <h3 class="font-semibold">Beautiful Landscape</h3>
          <p class="text-sm text-muted-foreground mt-1">
            A compact media card style adapted to the sealed Rock Card API.
          </p>
        </Card>
      </div>
    </DemoSection>

    <DemoSection title="Header Action" description="Custom action area inside the header slot.">
      <div class="max-w-lg">
        <Card
          title="Meeting Notes"
          description="Transcript summary from the latest client sync."
          action={
            <Button size="sm" variant="outline">
              Transcribe
            </Button>
          }
          footer={
            <div class="flex gap-2 w-full justify-end">
              <Button size="sm" variant="outline">
                Dismiss
              </Button>
              <Button size="sm">Save</Button>
            </div>
          }
        >
          <ol class="text-sm pl-5 list-decimal opacity-85 flex flex-col gap-1.5">
            <li>Dashboard redesign should prioritize mobile layouts.</li>
            <li>Timeline target is six weeks with weekly milestones.</li>
            <li>Next review meeting is scheduled for Tuesday morning.</li>
          </ol>
        </Card>
      </div>
    </DemoSection>
  </DemoPage>
)
