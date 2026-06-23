import { Button, Card, FormField, Icon, Input, Select } from '@src'

export function Default() {
  const frameworkOptions = [
    { label: 'Vite', value: 'vite' },
    { label: 'Solid Start', value: 'solid-start' },
    { label: 'Tanstack Start', value: 'tanstack-start' },
    { label: 'Astro', value: 'astro' },
  ]

  return (
    <Card
      title="Create project"
      description="Deploy your new project in one-click."
      footer={
        <>
          <Button classes={{ root: 'w-full' }} type="submit">
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
  )
}
