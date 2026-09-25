import { createSignal } from 'solid-js'

import packageMetadata from '../../../../package.json' with { type: 'json' }
import { Badge, Button, Card, Dialog, Field, Input, Select, Slider, Switch } from '../../../../src'

export function HeroSpecimen() {
  const [name, setName] = createSignal('production-edge')
  const [region, setRegion] = createSignal('us-east')
  const [instances, setInstances] = createSignal(3)
  const [autoRollback, setAutoRollback] = createSignal(true)
  const [deploying, setDeploying] = createSignal(false)
  const [deployed, setDeployed] = createSignal(false)

  const handleDeploy = () => {
    setDeploying(true)
    setTimeout(() => {
      setDeploying(false)
      setDeployed(true)
    }, 1000)
  }

  return (
    <Card
      title="Deployment configurator"
      description="Fine-grained reactive workbench"
      action={
        <Badge variant={deployed() ? 'surface' : 'outline'} size="sm">
          {deployed() ? `Healthy · v${packageMetadata.version}` : 'Staged'}
        </Badge>
      }
      class="bg-card/90 min-w-0 w-full shadow-sm"
      classes={{ header: 'border-b border-border/70 mb-3' }}
    >
      <form
        class="pt-1 space-y-3.5"
        onSubmit={(e) => {
          e.preventDefault()
          handleDeploy()
        }}
      >
        <div class="gap-3 grid grid-cols-1 sm:grid-cols-2">
          <Field label="Service identifier">
            <Input
              value={name()}
              onValueChange={(val) => {
                setName(val)
                setDeployed(false)
              }}
            />
          </Field>

          <Field label="Target region">
            <Select
              items={[
                { label: 'US East (N. Virginia)', value: 'us-east' },
                { label: 'EU Central (Frankfurt)', value: 'eu-central' },
                { label: 'AP Tokyo (Tokyo)', value: 'ap-tokyo' },
              ]}
              value={region()}
              onValueChange={(val) => {
                setRegion(val ?? 'us-east')
                setDeployed(false)
              }}
            />
          </Field>
        </div>

        <Field
          label={`Replica count: ${instances()} node${instances() > 1 ? 's' : ''}`}
          description="Scale dynamic compute instances"
        >
          <Slider
            value={instances()}
            onValueChange={(val) => {
              setInstances(Array.isArray(val) ? val[0]! : val)
              setDeployed(false)
            }}
            min={1}
            max={8}
            step={1}
            variant="bold"
            divider
          />
        </Field>

        <Switch
          label="Instant rollback on failure"
          description="Revert to previous deployment tag automatically"
          class="mt-4"
          checked={autoRollback()}
          onCheckedChange={(val) => {
            setAutoRollback(val)
            setDeployed(false)
          }}
        />

        <div class="pt-3 flex flex-wrap gap-2 items-center justify-between">
          <div class="flex gap-2 items-center">
            <Button type="submit" size="sm" loading={deploying()}>
              Deploy service
            </Button>

            <Dialog>
              <Dialog.Trigger as={Button} type="button" variant="outline" size="sm">
                Payload
              </Dialog.Trigger>
              <Dialog.Content
                title="Configuration manifest"
                body={
                  <div class="text-xs font-mono p-3 border border-border/60 rounded-lg bg-muted/40 space-y-3">
                    <pre>
                      <code>
                        {JSON.stringify(
                          {
                            service: name() || 'untitled-service',
                            region: region(),
                            replicas: instances(),
                            autoRollback: autoRollback(),
                            runtime: 'SolidJS 1.9',
                          },
                          null,
                          2,
                        )}
                      </code>
                    </pre>
                  </div>
                }
              />
            </Dialog>
          </div>

          <output aria-live="polite" class="text-xs text-muted-foreground">
            {deployed() ? 'Active on cluster' : 'Ready to deploy'}
          </output>
        </div>
      </form>
    </Card>
  )
}
