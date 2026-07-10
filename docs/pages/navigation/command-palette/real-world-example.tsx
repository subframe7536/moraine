import { Button, CommandPalette, Kbd, KbdGroup } from '@src'
import type { CommandPaletteT } from '@src'
import { createMemo, createSignal, onCleanup, onMount } from 'solid-js'

interface ShortcutBinding {
  key: string
  shiftKey?: boolean
}

interface AppCommand extends CommandPaletteT.Item {
  binding?: ShortcutBinding
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
  const [lastAction, setLastAction] = createSignal('Ready. Press Cmd/Ctrl + K to open the palette.')

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
          leadingRender: () => <span class="i-lucide-search-check" />,
          trailingRender: () => (
            <KbdGroup
              value={[modifierLabel(), 'Shift', 'P']}
              size="sm"
              class="text-muted-foreground"
            />
          ),
          binding: { key: 'p', shiftKey: true },
          onSelect: () => {
            setLastAction('Opened the project switcher.')
            setOpen(false)
          },
        },
        {
          value: 'go-issues',
          label: 'Go to issues',
          description: 'Open the active team issue board.',
          leadingRender: () => <span class="i-lucide-circle-dot" />,
          trailingRender: () => (
            <KbdGroup value={[modifierLabel(), 'I']} size="sm" class="text-muted-foreground" />
          ),
          binding: { key: 'i' },
          onSelect: () => {
            setLastAction('Navigated to the issue board.')
            setOpen(false)
          },
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
          leadingRender: () => <span class="i-lucide-file-plus-2" />,
          trailingRender: () => (
            <KbdGroup value={[modifierLabel(), 'N']} size="sm" class="text-muted-foreground" />
          ),
          binding: { key: 'n' },
          onSelect: () => {
            setLastAction('Created a new issue draft.')
            setOpen(false)
          },
        },
        {
          value: 'toggle-sidebar',
          label: 'Toggle sidebar',
          description: 'Collapse navigation to focus on the current editor.',
          leadingRender: () => <span class="i-lucide-panel-left-close" />,
          trailingRender: () => (
            <KbdGroup value={[modifierLabel(), 'B']} size="sm" class="text-muted-foreground" />
          ),
          binding: { key: 'b' },
          onSelect: () => {
            setLastAction('Toggled the workspace sidebar.')
            setOpen(false)
          },
        },
        {
          value: 'open-billing',
          label: 'Open billing',
          description: 'Restricted to workspace owners.',
          leadingRender: () => <span class="i-lucide-credit-card" />,
          disabled: true,
          trailingRender: () => <span class="text-xs text-muted-foreground">Owner only</span>,
        },
      ],
    },
  ])

  const commands = createMemo(() => groups().flatMap((group) => group.items ?? []))

  onMount(() => {
    setIsMac(/Mac|iPhone|iPad/.test(window.navigator.platform))

    const handler = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return
      }

      if (matchesBinding(event, { key: 'k' })) {
        event.preventDefault()
        setOpen((current) => !current)
        return
      }

      const matchedCommand = commands().find(
        (item) => item.binding && !item.disabled && matchesBinding(event, item.binding),
      )

      if (!matchedCommand) {
        return
      }

      event.preventDefault()
      matchedCommand.onSelect?.()
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

      <CommandPalette<AppCommand>
        open={open()}
        onOpenChange={setOpen}
        groups={groups()}
        showClose
        footerRender={() => (
          <div class="flex flex-wrap gap-3 items-center justify-between">
            <div class="flex flex-wrap gap-3 items-center">
              <span class="flex gap-2 items-center">
                <KbdGroup value={['↑', '↓']} size="sm" />
                <span class="text-xs">Navigate</span>
              </span>
              <span class="flex gap-2 items-center">
                <Kbd value="↵" size="sm" />
                <span class="text-xs">Run command</span>
              </span>
            </div>
            <span class="flex gap-2 items-center">
              <KbdGroup value={[modifierLabel(), 'K']} size="sm" />
              <span class="text-xs">Toggle palette</span>
            </span>
          </div>
        )}
      >
        <Button variant="outline" trailing={<KbdGroup value={[modifierLabel(), 'K']} size="sm" />}>
          Search projects, issues, and actions
        </Button>
      </CommandPalette>
    </div>
  )
}
