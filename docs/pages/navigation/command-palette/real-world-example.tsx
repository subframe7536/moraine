import { Button, CommandPalette, Icon, Kbd, KbdGroup, Modal } from '@src'
import type { CommandPaletteT } from '@src'
import { createMemo, createSignal, onCleanup, onMount } from 'solid-js'

interface ShortcutBinding {
  key: string
  shiftKey?: boolean
}

interface AppCommand extends CommandPaletteT.Item {
  binding?: ShortcutBinding
  result?: string
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tagName = target.tagName
  return (
    target.isContentEditable ||
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT'
  )
}

function matchesBinding(event: KeyboardEvent, binding: ShortcutBinding): boolean {
  return (
    (event.metaKey || event.ctrlKey) &&
    event.shiftKey === Boolean(binding.shiftKey) &&
    !event.altKey &&
    event.key.toLowerCase() === binding.key
  )
}

export function RealWorldExample() {
  const [open, setOpen] = createSignal(false)
  const [isMac, setIsMac] = createSignal(true)
  const [lastAction, setLastAction] = createSignal(
    'Ready. Open the palette from the trigger below.',
  )

  const modifierLabel = createMemo(() => (isMac() ? '⌘' : 'Ctrl'))

  const groups = createMemo<CommandPaletteT.Group<AppCommand>[]>(() => [
    {
      id: 'jump-to',
      label: 'Jump to',
      items: [
        {
          value: 'open-project-switcher',
          label: 'Open project switcher',
          description: 'Jump between projects, teams, and recent workspaces.',
          leadingRender: () => <Icon name="i-lucide-search-check" />,
          trailingRender: () => (
            <KbdGroup
              items={[modifierLabel(), 'Shift', 'P']}
              size="sm"
              class="text-muted-foreground"
            />
          ),
          binding: { key: 'p', shiftKey: true },
          result: 'Opened the project switcher.',
        },
        {
          value: 'go-issues',
          label: 'Go to issues',
          description: 'Open the active team issue board.',
          leadingRender: () => <Icon name="i-lucide-circle-dot" />,
          trailingRender: () => (
            <KbdGroup items={[modifierLabel(), 'I']} size="sm" class="text-muted-foreground" />
          ),
          binding: { key: 'i' },
          result: 'Navigated to the issue board.',
        },
      ],
    },
    {
      id: 'workspace',
      label: 'Workspace',
      items: [
        {
          value: 'new-issue',
          label: 'Create issue',
          description: 'Capture a bug or task without leaving the current page.',
          leadingRender: () => <Icon name="i-lucide-file-plus-2" />,
          trailingRender: () => (
            <KbdGroup items={[modifierLabel(), 'N']} size="sm" class="text-muted-foreground" />
          ),
          binding: { key: 'n' },
          result: 'Created a new issue draft.',
        },
        {
          value: 'toggle-sidebar',
          label: 'Toggle sidebar',
          description: 'Collapse navigation to focus on the current editor.',
          leadingRender: () => <Icon name="i-lucide-panel-left-close" />,
          trailingRender: () => (
            <KbdGroup items={[modifierLabel(), 'B']} size="sm" class="text-muted-foreground" />
          ),
          binding: { key: 'b' },
          result: 'Toggled the workspace sidebar.',
        },
        {
          value: 'open-billing',
          label: 'Open billing',
          description: 'Restricted to workspace owners.',
          leadingRender: () => <Icon name="i-lucide-credit-card" />,
          disabled: true,
          trailingRender: () => <span class="text-xs text-muted-foreground">Owner only</span>,
        },
      ],
    },
  ])

  const commands = createMemo(() => groups().flatMap((group) => group.items ?? []))

  const onSelect = (item: AppCommand) => {
    setLastAction(item.result ?? `Selected ${item.label ?? item.value}.`)
    setOpen(false)
  }

  onMount(() => {
    setIsMac(/Mac|iPhone|iPad/.test(window.navigator.platform))

    const handler = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return
      }

      const matchedCommand = commands().find(
        (item) => item.binding && !item.disabled && matchesBinding(event, item.binding),
      )

      if (!matchedCommand) {
        return
      }

      event.preventDefault()
      onSelect(matchedCommand)
    }

    window.addEventListener('keydown', handler)
    onCleanup(() => window.removeEventListener('keydown', handler))
  })

  return (
    <div class="flex flex-col gap-3 max-w-full w-xl">
      <div class="p-3 border border-border rounded-lg bg-muted/20">
        <p class="text-sm font-medium">Global shortcuts and palette commands stay in sync.</p>
        <p class="text-sm text-muted-foreground mt-1">{lastAction()}</p>
      </div>

      <Modal open={open()} onOpenChange={setOpen}>
        <Modal.Trigger>
          {(props) => (
            <Button {...props} variant="outline">
              Search projects, issues, and actions
            </Button>
          )}
        </Modal.Trigger>
        <Modal.Content
          overlay
          ariaLabel="Search projects, issues, and actions"
          contentRender={(context) => (
            <CommandPalette<AppCommand>
              groups={groups()}
              showClose
              onSelect={onSelect}
              onClose={context.close}
              footerRender={() => (
                <div class="flex flex-wrap gap-3 items-center justify-between">
                  <div class="flex flex-wrap gap-3 items-center">
                    <span class="flex gap-2 items-center">
                      <KbdGroup items={['↑', '↓']} size="sm" />
                      <span class="text-xs">Navigate</span>
                    </span>
                    <span class="flex gap-2 items-center">
                      <Kbd value="↵" size="sm" />
                      <span class="text-xs">Run command</span>
                    </span>
                  </div>
                </div>
              )}
            />
          )}
        />
      </Modal>
    </div>
  )
}
