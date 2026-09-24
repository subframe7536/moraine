import { createSignal } from 'solid-js'

import { Badge, Button, Card, Checkbox, Dialog, Field, Input, Select } from '../../../../src'

export function HeroSpecimen() {
  const [release, setRelease] = createSignal('Autumn release')
  const [audience, setAudience] = createSignal('team')
  const [previews, setPreviews] = createSignal(true)
  const [saved, setSaved] = createSignal(false)

  return (
    <Card
      compact
      title="Release settings"
      description="Prepare your next update"
      action={<Badge variant="outline">Draft</Badge>}
      class="min-w-0 w-full shadow-sm"
      classes={{ header: 'border-b border-border/70' }}
    >
      <form
        class="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          setSaved(true)
        }}
      >
        <Field label="Release name" description="Appears in the update list.">
          <Input
            value={release()}
            onValueChange={(value) => {
              setRelease(value)
              setSaved(false)
            }}
          />
        </Field>
        <Field label="Audience">
          <Select
            items={[
              { label: 'Team', value: 'team' },
              { label: 'Public', value: 'public' },
            ]}
            value={audience()}
            onChange={(value) => {
              setAudience(value ?? 'team')
              setSaved(false)
            }}
          />
        </Field>
        <Checkbox
          label="Include component previews"
          checked={previews()}
          onChange={(value) => {
            setPreviews(value)
            setSaved(false)
          }}
        />
        <div class="pt-3 border-t border-border/70 flex flex-wrap gap-2 items-center">
          <Button type="submit" size="sm">
            Save changes
          </Button>
          <Dialog>
            <Dialog.Trigger as={Button} type="button" variant="outline" size="sm">
              Review
            </Dialog.Trigger>
            <Dialog.Content
              title="Release preview"
              body={
                <div class="text-sm space-y-2">
                  <p>{release() || 'Untitled release'} is ready for review.</p>
                  <p class="text-muted-foreground">
                    Audience: {audience() === 'team' ? 'Team' : 'Public'} · Component previews{' '}
                    {previews() ? 'included' : 'excluded'}.
                  </p>
                </div>
              }
            />
          </Dialog>
          <output aria-live="polite" class="text-xs text-muted-foreground ms-auto">
            {saved() ? 'Changes saved' : 'Not saved'}
          </output>
        </div>
      </form>
    </Card>
  )
}
