import { For, Show, createMemo, createSignal } from 'solid-js'

import {
  Alert,
  AvatarGroup,
  Badge,
  BoldSlider,
  Button,
  ButtonGroup,
  Card,
  Checkbox,
  Combobox,
  CopyButton,
  Dialog,
  Drawer,
  Field,
  Icon,
  Input,
  InputGroup,
  KbdGroup,
  NumberInput,
  Popover,
  Progress,
  RadioGroup,
  ScrollArea,
  Select,
  Switch,
  Table,
  Tabs,
  Toast,
  ToggleButton,
  cn,
  createTree,
} from '../../../../src'
import { createMediaQuery } from '../../../../src/utils'

interface ThemePreset {
  id: string
  name: string
  primary: string
  foreground: string
  radius: string
  spacing: string
  inputVariant: 'outline' | 'subtle'
  density: 'sm' | 'md'
}

const PRESETS: ThemePreset[] = [
  {
    id: 'default',
    name: 'Default',
    primary: 'hsl(221.2 83.2% 53.3%)',
    foreground: 'hsl(210 40% 98%)',
    radius: '0.625rem',
    spacing: '0.25rem',
    inputVariant: 'outline',
    density: 'md',
  },
  {
    id: 'zinc-sharp',
    name: 'Zinc Sharp',
    primary: 'light-dark(#18181b, #f4f4f5)',
    foreground: 'light-dark(#fafafa, #18181b)',
    radius: '0px',
    spacing: '0.21875rem',
    inputVariant: 'outline',
    density: 'sm',
  },
  {
    id: 'emerald-dense',
    name: 'Emerald Dense',
    primary: 'hsl(142.1 76.2% 36.3%)',
    foreground: 'hsl(355.7 100% 97.3%)',
    radius: '0.375rem',
    spacing: '0.21875rem',
    inputVariant: 'outline',
    density: 'sm',
  },
  {
    id: 'violet-soft',
    name: 'Violet Soft',
    primary: 'hsl(262.1 83.3% 57.8%)',
    foreground: 'hsl(210 20% 98%)',
    radius: '0.875rem',
    spacing: '0.28125rem',
    inputVariant: 'subtle',
    density: 'md',
  },
]

const ACCENTS = [
  { name: 'Blue', primary: 'hsl(221.2 83.2% 53.3%)', foreground: 'hsl(210 40% 98%)' },
  { name: 'Zinc', primary: 'light-dark(#18181b, #f4f4f5)', foreground: 'light-dark(#fafafa, #18181b)' },
  { name: 'Emerald', primary: 'hsl(142.1 76.2% 36.3%)', foreground: 'hsl(355.7 100% 97.3%)' },
  { name: 'Violet', primary: 'hsl(262.1 83.3% 57.8%)', foreground: 'hsl(210 20% 98%)' },
  { name: 'Amber', primary: 'hsl(24.6 95% 53.1%)', foreground: 'hsl(60 9.1% 97.8%)' },
] as const

const RADIUS_ITEMS = [
  { label: '0', value: '0px' },
  { label: 'sm', value: '0.375rem' },
  { label: 'md', value: '0.625rem' },
  { label: 'lg', value: '0.875rem' },
]

const INPUT_VARIANT_ITEMS = [
  { label: 'outline', value: 'outline' },
  { label: 'subtle', value: 'subtle' },
]

const DENSITY_ITEMS = [
  { label: 'sm', value: 'sm' },
  { label: 'md', value: 'md' },
]

interface FileNode {
  id: string
  name: string
  children?: FileNode[]
}

const WORKSPACE_FILES: FileNode[] = [
  {
    id: 'src',
    name: 'src',
    children: [
      { id: 'theme', name: 'theme.ts' },
      { id: 'tokens', name: 'tokens.css' },
      { id: 'app', name: 'app.tsx' },
    ],
  },
  { id: 'config', name: 'unocss.config.ts' },
  { id: 'pkg', name: 'package.json' },
]

const DEPLOYMENTS = [
  { id: 'dep-41', env: 'Production', branch: 'main', status: 'Ready', tone: 'success' as const },
  { id: 'dep-40', env: 'Preview', branch: 'feat/theme', status: 'Building', tone: 'warning' as const },
  { id: 'dep-39', env: 'Staging', branch: 'release/0.9', status: 'Ready', tone: 'success' as const },
]

const FRAMEWORKS = [
  { label: 'SolidStart', value: 'solid-start' },
  { label: 'Vite + Solid', value: 'vite-solid' },
  { label: 'Astro + Solid', value: 'astro-solid' },
  { label: 'TanStack Start', value: 'tanstack-start' },
]

const ROLES = [
  { label: 'All environments', value: 'all' },
  { label: 'Production', value: 'Production' },
  { label: 'Preview', value: 'Preview' },
  { label: 'Staging', value: 'Staging' },
]

const REVIEWERS = [
  { alt: 'Alex Rivera', text: 'AR' },
  { alt: 'Maya Lin', text: 'ML' },
  { alt: 'Sam Park', text: 'SP' },
  { alt: 'Chris Wu', text: 'CW' },
  { alt: 'Dana Kim', text: 'DK' },
]

const TOAST_HOST_ID = 'landing-preview'

export function StylingShowcase() {
  const isDesktop = createMediaQuery('(min-width: 768px)')

  const [activePresetId, setActivePresetId] = createSignal(PRESETS[0]!.id)
  const [primary, setPrimary] = createSignal<string>(PRESETS[0]!.primary)
  const [foreground, setForeground] = createSignal<string>(PRESETS[0]!.foreground)
  const [radius, setRadius] = createSignal<string>(PRESETS[0]!.radius)
  const [spacing, setSpacing] = createSignal<string>(PRESETS[0]!.spacing)
  const [inputVariant, setInputVariant] = createSignal<'outline' | 'subtle'>(
    PRESETS[0]!.inputVariant,
  )
  const [density, setDensity] = createSignal<'sm' | 'md'>(PRESETS[0]!.density)
  const [slotOverride, setSlotOverride] = createSignal(false)
  const [inspectSlots, setInspectSlots] = createSignal(false)

  const [desktopScene, setDesktopScene] = createSignal('workspace')
  const [mobileScene, setMobileScene] = createSignal('controls')
  const [projectName, setProjectName] = createSignal('moraine-app')
  const [framework, setFramework] = createSignal<string | null>('vite-solid')
  const [envFilter, setEnvFilter] = createSignal<string | null>('all')
  const [concurrency, setConcurrency] = createSignal(65)
  const [replicas, setReplicas] = createSignal<number | null>(3)
  const [autoDeploy, setAutoDeploy] = createSignal(true)
  const [alertOpen, setAlertOpen] = createSignal(true)
  const [selectedRows, setSelectedRows] = createSignal<string[]>(['dep-41'])
  const [customizeOpen, setCustomizeOpen] = createSignal(false)
  const [codeOpen, setCodeOpen] = createSignal(false)

  const applyPreset = (preset: ThemePreset) => {
    setActivePresetId(preset.id)
    setPrimary(preset.primary)
    setForeground(preset.foreground)
    setRadius(preset.radius)
    setSpacing(preset.spacing)
    setInputVariant(preset.inputVariant)
    setDensity(preset.density)
  }

  const themeStyle = createMemo(() => ({
    '--primary': primary(),
    '--primary-foreground': foreground(),
    '--ring': primary(),
    '--radius': radius(),
    '--spacing': spacing(),
  }))

  const filteredDeployments = createMemo(() => {
    const filter = envFilter()
    if (!filter || filter === 'all') {
      return DEPLOYMENTS
    }
    return DEPLOYMENTS.filter((item) => item.env === filter)
  })

  const toggleRow = (id: string, checked: boolean) => {
    setSelectedRows((prev) => (checked ? [...prev, id] : prev.filter((item) => item !== id)))
  }

  const fileTree = createTree<FileNode>({
    items: () => WORKSPACE_FILES,
    getKey: (node) => node.id,
    getChildren: (node) => node.children,
    getLabel: (node) => node.name,
    defaultExpandedKeys: ['src'],
    defaultSelectedKeys: ['theme'],
    getIcon: (item) => (item.hasChildren ? 'i-lucide:folder' : 'i-lucide:file-code'),
  })

  const cssTokenSnippet = createMemo(
    () =>
      `:root {\n  --primary: ${primary()};\n  --primary-foreground: ${foreground()};\n  --ring: ${primary()};\n  --radius: ${radius()};\n  --spacing: ${spacing()};\n}`,
  )

  const defineThemeSnippet = createMemo(
    () =>
      `import { defineTheme } from 'moraine'\n\nexport const theme = defineTheme({\n  input: { defaultVariants: { variant: '${inputVariant()}', size: '${density()}' } },\n  button: { defaultVariants: { size: '${density()}' } },${
        slotOverride()
          ? `\n  card: { base: { title: 'font-mono uppercase tracking-wider text-xs' } },`
          : ''
      }\n})`,
  )

  const slotOverrideCardClasses = createMemo(() =>
    slotOverride() ? { title: 'font-mono uppercase tracking-wider text-xs' } : undefined,
  )
  const slotOverrideButtonClasses = createMemo(() =>
    slotOverride() ? { label: 'font-mono uppercase tracking-widest text-[11px]' } : undefined,
  )
  const slotOverrideInputClasses = createMemo(() =>
    slotOverride() ? { root: 'font-mono text-xs' } : undefined,
  )

  const triggerPreviewToast = () => {
    Toast.success({
      hostId: TOAST_HOST_ID,
      title: 'Preset applied',
      description: `Active radius ${radius()} · ${inputVariant()} controls.`,
    })
  }

  function CustomizerFields() {
    return (
      <div class="space-y-5">
        <div>
          <p class="text-xs text-muted-foreground font-medium mb-2.5">Accent</p>
          <div role="group" aria-label="Accent" class="flex flex-wrap gap-1.5">
            <For each={ACCENTS}>
              {(accent) => (
                <ToggleButton
                  size="sm"
                  variant="outline"
                  activeVariant="soft"
                  tone="neutral"
                  activeTone="primary"
                  aria-label={`Accent ${accent.name}`}
                  classes={{ label: 'inline-flex gap-1.5 items-center' }}
                  pressed={primary() === accent.primary}
                  onPressedChange={(pressed) => {
                    if (pressed) {
                      setActivePresetId('custom')
                      setPrimary(accent.primary)
                      setForeground(accent.foreground)
                    }
                  }}
                >
                  <span
                    class="rounded-full shrink-0 size-3"
                    style={{ 'background-color': accent.primary }}
                    aria-hidden="true"
                  />
                  {accent.name}
                </ToggleButton>
              )}
            </For>
          </div>
        </div>

        <div class="gap-4 grid grid-cols-2">
          <div>
            <p class="text-xs text-muted-foreground font-medium mb-2">Radius</p>
            <RadioGroup
              size="sm"
              variant="card"
              indicatorPosition="hidden"
              orientation="horizontal"
              aria-label="Radius"
              value={radius()}
              onValueChange={(value) => {
                setActivePresetId('custom')
                setRadius(value)
              }}
              items={RADIUS_ITEMS}
              classes={{
                root: 'gap-1.5 grid grid-cols-2',
                item: 'px-2 py-1.5 cursor-pointer justify-center',
                label: 'text-xs font-mono text-center',
              }}
            />
          </div>

          <div class="space-y-3">
            <div>
              <p class="text-xs text-muted-foreground font-medium mb-2">Input variant</p>
              <RadioGroup
                size="sm"
                variant="card"
                indicatorPosition="hidden"
                orientation="horizontal"
                aria-label="Input variant"
                value={inputVariant()}
                onValueChange={(value) => {
                  setActivePresetId('custom')
                  setInputVariant(value as 'outline' | 'subtle')
                }}
                items={INPUT_VARIANT_ITEMS}
                classes={{
                  root: 'gap-1.5 grid grid-cols-2',
                  item: 'px-2 py-1.5 cursor-pointer justify-center',
                  label: 'text-xs text-center',
                }}
              />
            </div>

            <div>
              <p class="text-xs text-muted-foreground font-medium mb-2">Density</p>
              <RadioGroup
                size="sm"
                variant="card"
                indicatorPosition="hidden"
                orientation="horizontal"
                aria-label="Density"
                value={density()}
                onValueChange={(value) => {
                  setActivePresetId('custom')
                  setDensity(value as 'sm' | 'md')
                }}
                items={DENSITY_ITEMS}
                classes={{
                  root: 'gap-1.5 grid grid-cols-2',
                  item: 'px-2 py-1.5 cursor-pointer justify-center',
                  label: 'text-xs font-mono text-center',
                }}
              />
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-border space-y-3">
          <Switch
            size="sm"
            label="Mono slot override"
            description="Applies classes overrides to Card, Input, and Button slots."
            checked={slotOverride()}
            onCheckedChange={setSlotOverride}
          />
          <Switch
            size="sm"
            label="Inspect data-slot"
            description="Highlight internal component slot boundaries in the canvas."
            checked={inspectSlots()}
            onCheckedChange={setInspectSlots}
          />
        </div>
      </div>
    )
  }

  function ThemeCodeTabs() {
    return (
      <Tabs
        size="sm"
        defaultValue="tokens"
        items={[
          {
            value: 'tokens',
            label: 'CSS Tokens',
            content: () => (
              <div class="pt-3 relative">
                <div class="right-2 top-5 absolute">
                  <CopyButton value={cssTokenSnippet()} size="icon-xs" variant="outline" />
                </div>
                <pre class="text-xs leading-5 p-3.5 border border-border rounded-lg bg-muted/40 overflow-x-auto">
                  <code>{cssTokenSnippet()}</code>
                </pre>
              </div>
            ),
          },
          {
            value: 'theme',
            label: 'defineTheme()',
            content: () => (
              <div class="pt-3 relative">
                <div class="right-2 top-5 absolute">
                  <CopyButton value={defineThemeSnippet()} size="icon-xs" variant="outline" />
                </div>
                <pre class="text-xs leading-5 p-3.5 border border-border rounded-lg bg-muted/40 overflow-x-auto">
                  <code>{defineThemeSnippet()}</code>
                </pre>
              </div>
            ),
          },
        ]}
      />
    )
  }

  function ControlsPanel() {
    return (
      <Card size={density()} classes={slotOverrideCardClasses()} class="h-full">
        <Card.Header>
          <Card.Title>Deployment settings</Card.Title>
          <Card.Description>Live form controls inheriting theme tokens and density.</Card.Description>
        </Card.Header>
        <Card.Body class="space-y-4">
          <Field label="Project name" size={density()}>
            <InputGroup size={density()} variant={inputVariant()}>
              <InputGroup.Leading>moraine/</InputGroup.Leading>
              <Input
                value={projectName()}
                onValueChange={setProjectName}
                classes={slotOverrideInputClasses()}
              />
            </InputGroup>
          </Field>

          <Field label="Framework" size={density()}>
            <Combobox
              size={density()}
              variant={inputVariant()}
              items={FRAMEWORKS}
              value={framework()}
              onValueChange={setFramework}
              placeholder="Select framework..."
              clearable
            />
          </Field>

          <BoldSlider
            size={density()}
            label="Rollout"
            value={concurrency()}
            min={0}
            max={100}
            step={5}
            valueLabel={({ value }) => `${value}%`}
            onValueChange={setConcurrency}
          />

          <Switch
            size={density()}
            label="Auto-deploy main"
            description="Trigger preview builds on push."
            checked={autoDeploy()}
            onCheckedChange={setAutoDeploy}
          />
        </Card.Body>
        <Card.Footer class="flex-wrap gap-2 justify-between">
          <ButtonGroup size={density()} aria-label="Deployment actions">
            <Button onClick={triggerPreviewToast} classes={slotOverrideButtonClasses()}>
              Deploy
            </Button>
            <Popover placement="top" align="end">
              <Popover.Trigger as={Button} variant="outline" aria-label="More deploy options">
                <Icon name="i-lucide:chevron-down" class="size-3.5" />
              </Popover.Trigger>
              <Popover.Content aria-label="Deploy options" class="p-3 w-52 space-y-2">
                <p class="text-xs font-medium">Preview target</p>
                <p class="text-xs text-muted-foreground">
                  Portaled overlays automatically inherit the active theme tokens.
                </p>
                <Button size="xs" variant="soft" class="w-full" onClick={triggerPreviewToast}>
                  Trigger Toast
                </Button>
              </Popover.Content>
            </Popover>
          </ButtonGroup>

          <Dialog>
            <Dialog.Trigger as={Button} size={density()} variant="outline">
              Inspect modal
            </Dialog.Trigger>
            <Dialog.Content
              title="Confirm production rollout"
              description={`Deploy ${projectName()} at ${concurrency()}% traffic.`}
              style={themeStyle()}
            >
              <Dialog.Body>
                <p class="text-sm text-muted-foreground">
                  This dialog renders through a portal while keeping the selected preset styling.
                </p>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.Close as={Button} variant="outline" size="sm">
                  Cancel
                </Dialog.Close>
                <Dialog.Close as={Button} size="sm" onClick={triggerPreviewToast}>
                  Confirm
                </Dialog.Close>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog>
        </Card.Footer>
      </Card>
    )
  }

  function DataPanel() {
    return (
      <div class="space-y-4">
        <Card size={density()} classes={slotOverrideCardClasses()}>
          <Card.Header>
            <Card.Title>Recent deployments</Card.Title>
            <Card.Action>
              <Select
                size="sm"
                variant={inputVariant()}
                items={ROLES}
                value={envFilter()}
                onValueChange={setEnvFilter}
                aria-label="Filter environment"
                class="w-36"
              />
            </Card.Action>
          </Card.Header>
          <Card.Body class="p-0">
            <ScrollArea orientation="horizontal">
              <Table size={density()} highlightOnHover>
                <Table.Header>
                  <Table.Row>
                    <Table.Head class="w-9">
                      <span class="sr-only">Select</span>
                    </Table.Head>
                    <Table.Head>Environment</Table.Head>
                    <Table.Head>Branch</Table.Head>
                    <Table.Head align="end">Status</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  <For each={filteredDeployments()}>
                    {(row) => (
                      <Table.Row selected={selectedRows().includes(row.id)}>
                        <Table.Cell>
                          <Checkbox
                            size="sm"
                            aria-label={`Select ${row.env}`}
                            checked={selectedRows().includes(row.id)}
                            onCheckedChange={(checked) => toggleRow(row.id, Boolean(checked))}
                          />
                        </Table.Cell>
                        <Table.Cell class="font-medium whitespace-nowrap">{row.env}</Table.Cell>
                        <Table.Cell class="text-xs text-muted-foreground font-mono whitespace-nowrap">
                          {row.branch}
                        </Table.Cell>
                        <Table.Cell align="end">
                          <Badge size="sm" variant="soft" tone={row.tone}>
                            {row.status}
                          </Badge>
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </For>
                </Table.Body>
              </Table>
            </ScrollArea>
          </Card.Body>
        </Card>

        <Card size={density()} classes={slotOverrideCardClasses()}>
          <Card.Body class="space-y-3">
            <Progress
              value={concurrency()}
              label="Edge rollout progress"
              valueLabel
              aria-label="Edge rollout progress"
            />
            <Show
              when={alertOpen()}
              fallback={
                <Button size="xs" variant="outline" onClick={() => setAlertOpen(true)}>
                  Restore status notice
                </Button>
              }
            >
              <Alert
                type="info"
                title="Zero-runtime recipes active"
                description="All 15+ controls in this canvas share one semantic token layer."
                closable
                open={alertOpen()}
                onOpenChange={setAlertOpen}
              />
            </Show>
          </Card.Body>
        </Card>
      </div>
    )
  }

  function ExplorerPanel() {
    return (
      <Card size={density()} classes={slotOverrideCardClasses()} class="flex flex-col h-full">
        <Card.Header>
          <Card.Title>Workspace</Card.Title>
          <Card.Action>
            <KbdGroup items={['meta', 'K']} size="sm" />
          </Card.Action>
        </Card.Header>
        <Card.Body class="flex-1 space-y-4">
          <fileTree.Tree aria-label="Workspace files" size="sm" />
          <div class="pt-3 border-t border-border flex items-center justify-between">
            <span class="text-xs text-muted-foreground">Reviewers</span>
            <AvatarGroup items={REVIEWERS} maxVisible={3} size="sm" />
          </div>
          <Field label="Replicas" size="sm">
            <NumberInput
              size="sm"
              min={1}
              max={12}
              value={replicas()}
              onValueChange={setReplicas}
              aria-label="Replicas"
            />
          </Field>
        </Card.Body>
      </Card>
    )
  }

  function OverlaysMobilePanel() {
    return (
      <Card size={density()} classes={slotOverrideCardClasses()}>
        <Card.Header>
          <Card.Title>Overlays &amp; feedback</Card.Title>
          <Card.Description>
            Test dialogs, popovers, drawers, and toasts with the active preset.
          </Card.Description>
        </Card.Header>
        <Card.Body class="gap-2.5 grid grid-cols-2">
          <Button size="sm" onClick={triggerPreviewToast} classes={slotOverrideButtonClasses()}>
            Show Toast
          </Button>
          <Dialog>
            <Dialog.Trigger as={Button} size="sm" variant="outline">
              Open Dialog
            </Dialog.Trigger>
            <Dialog.Content
              title="Dialog preview"
              description="Focus trapping and portal styling follow your preset."
              style={themeStyle()}
            >
              <Dialog.Footer>
                <Dialog.Close as={Button} size="sm">
                  Done
                </Dialog.Close>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog>
          <Popover placement="top" align="start">
            <Popover.Trigger as={Button} size="sm" variant="outline">
              Open Popover
            </Popover.Trigger>
            <Popover.Content aria-label="Popover preview" class="p-3 w-52">
              <p class="text-xs text-muted-foreground">
                Anchored floating panel with collision detection.
              </p>
            </Popover.Content>
          </Popover>
          <Drawer>
            <Drawer.Trigger as={Button} size="sm" variant="outline">
              Open Drawer
            </Drawer.Trigger>
            <Drawer.Content
              title="Swipeable drawer"
              description="Drag downward or tap outside to dismiss."
              style={themeStyle()}
            >
              <Drawer.Body>
                <p class="text-sm text-muted-foreground">
                  Native touch gestures and snap points built in.
                </p>
              </Drawer.Body>
              <Drawer.Footer>
                <Drawer.Close as={Button} size="sm" class="w-full">
                  Close
                </Drawer.Close>
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer>
        </Card.Body>
      </Card>
    )
  }

  return (
    <section aria-labelledby="styling-title" class="py-10 sm:py-14">
      <Toast id={TOAST_HOST_ID} placement="bottom" align="end" />

      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div class="max-w-2xl">
          <h2 id="styling-title" class="text-xl tracking-tight font-semibold sm:text-2xl">
            One theme system across every component.
          </h2>
          <p class="text-sm text-muted-foreground mt-1.5 sm:text-base">
            Switch presets, tune tokens, or inspect internal slots live across a multi-component
            workspace.
          </p>
        </div>
        <Button
          as="a"
          href="/docs/customization"
          size="sm"
          variant="link"
          trailing="icon-arrow-right"
          class="shrink-0 self-start sm:self-end"
        >
          Customization guide
        </Button>
      </div>

      {/* Control bar: sticky on mobile (<768px), inline on desktop */}
      <div class="py-2.5 border-y border-border bg-background/95 flex gap-2 items-center justify-between top-0 sticky z-20 backdrop-blur sm:px-3 sm:border sm:rounded-t-xl sm:static">
        <div
          role="group"
          aria-label="Theme presets"
          class="flex flex-1 gap-1.5 min-w-0 items-center overflow-x-auto"
        >
          <For each={PRESETS}>
            {(preset) => (
              <ToggleButton
                size={isDesktop() ? 'sm' : 'md'}
                variant="outline"
                activeVariant="soft"
                tone="neutral"
                activeTone="primary"
                pressed={activePresetId() === preset.id}
                onPressedChange={(pressed) => {
                  if (pressed) {
                    applyPreset(preset)
                  }
                }}
                class="shrink-0"
                classes={{ label: 'inline-flex gap-1.5 items-center' }}
              >
                <span
                  class="rounded-full shrink-0 size-2.5"
                  style={{ 'background-color': preset.primary }}
                  aria-hidden="true"
                />
                {preset.name}
              </ToggleButton>
            )}
          </For>
        </div>

        <div class="flex shrink-0 gap-1.5 items-center">
          <Show when={inspectSlots()}>
            <Badge
              size="md"
              variant="soft"
              tone="primary"
              leading="i-lucide:eye"
              class="px-2 rounded-md h-8 md:rounded-sm md:h-7"
            >
              <span class="hidden lg:inline">Inspecting data-slot</span>
              <span class="lg:hidden">Slots</span>
            </Badge>
          </Show>
          <Show
            when={isDesktop()}
            fallback={
              <>
                <Drawer
                  open={customizeOpen()}
                  onOpenChange={setCustomizeOpen}
                  snapPoints={[0.52, 0.88]}
                >
                  <Drawer.Trigger
                    as={Button}
                    size="icon-md"
                    variant="outline"
                    aria-label="Customize theme tokens"
                    leading="i-lucide:sliders-horizontal"
                  />
                  <Drawer.Content
                    title="Customize theme"
                    description="Tune tokens and inspect component slots live."
                  >
                    <Drawer.Body>
                      <CustomizerFields />
                    </Drawer.Body>
                  </Drawer.Content>
                </Drawer>

                <Drawer open={codeOpen()} onOpenChange={setCodeOpen}>
                  <Drawer.Trigger
                    as={Button}
                    size="icon-md"
                    variant="outline"
                    aria-label="Copy theme code"
                    leading="i-lucide:code"
                  />
                  <Drawer.Content
                    title="Theme code"
                    description="Copy the CSS tokens or defineTheme() config for this preset."
                  >
                    <Drawer.Body>
                      <ThemeCodeTabs />
                    </Drawer.Body>
                  </Drawer.Content>
                </Drawer>
              </>
            }
          >
            <Popover placement="bottom" align="end">
              <Popover.Trigger
                as={Button}
                size="sm"
                variant="outline"
                leading="i-lucide:sliders-horizontal"
              >
                Customize
              </Popover.Trigger>
              <Popover.Content aria-label="Customize theme" class="p-4 w-80">
                <CustomizerFields />
              </Popover.Content>
            </Popover>

            <Dialog open={codeOpen()} onOpenChange={setCodeOpen}>
              <Dialog.Trigger as={Button} size="sm" variant="outline" leading="i-lucide:code">
                Copy theme
              </Dialog.Trigger>
              <Dialog.Content
                title="Theme configuration"
                description="Paste these CSS variables or theme defaults into your app."
              >
                <Dialog.Body>
                  <ThemeCodeTabs />
                </Dialog.Body>
              </Dialog.Content>
            </Dialog>
          </Show>
        </div>
      </div>

      {/* Live Preview Canvas */}
      <div
        style={themeStyle()}
        class={cn(
          'p-4 border-b border-border bg-muted/20 min-w-0 sm:p-6 sm:border-x sm:rounded-b-xl',
          inspectSlots() &&
            '[&_[data-slot]]:outline [&_[data-slot]]:outline-1 [&_[data-slot]]:outline-dashed [&_[data-slot]]:outline-primary/60',
        )}
      >
        <Show
          when={isDesktop()}
          fallback={
            <Tabs
              size="sm"
              value={mobileScene()}
              onValueChange={setMobileScene}
              items={[
                {
                  value: 'controls',
                  label: 'Controls',
                  content: () => (
                    <div class="pt-4">
                      <ControlsPanel />
                    </div>
                  ),
                },
                {
                  value: 'data',
                  label: 'Data',
                  content: () => (
                    <div class="pt-4">
                      <DataPanel />
                    </div>
                  ),
                },
                {
                  value: 'overlays',
                  label: 'Overlays',
                  content: () => (
                    <div class="pt-4">
                      <OverlaysMobilePanel />
                    </div>
                  ),
                },
              ]}
            />
          }
        >
          <div class="mb-5">
            <Tabs
              size="sm"
              value={desktopScene()}
              onValueChange={setDesktopScene}
              items={[
                { value: 'workspace', label: 'Workspace' },
                { value: 'data', label: 'Data & Status' },
                { value: 'forms', label: 'Controls & Overlays' },
              ]}
            />
          </div>

          <Show when={desktopScene() === 'workspace'}>
            <div class="gap-4 grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.25fr)_minmax(0,1fr)] md:grid-cols-2">
              <ExplorerPanel />
              <DataPanel />
              <ControlsPanel />
            </div>
          </Show>

          <Show when={desktopScene() === 'data'}>
            <div class="gap-4 grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
              <DataPanel />
              <ExplorerPanel />
            </div>
          </Show>

          <Show when={desktopScene() === 'forms'}>
            <div class="gap-4 grid md:grid-cols-2">
              <ControlsPanel />
              <OverlaysMobilePanel />
            </div>
          </Show>
        </Show>
      </div>
    </section>
  )
}
