import { Button, Icon, Resizable } from '@src'
import { For, createSignal, Show } from 'solid-js'

const FOLDERS = [
  { icon: 'i-lucide:inbox', label: 'Inbox', count: '12', active: true },
  { icon: 'i-lucide:send', label: 'Sent' },
  { icon: 'i-lucide:star', label: 'Starred', count: '4' },
  { icon: 'i-lucide:archive', label: 'Archive' },
  { icon: 'i-lucide:trash-2', label: 'Trash' },
]

const MESSAGES = [
  {
    id: 1,
    sender: 'Sarah Lin',
    subject: 'Moraine 0.5.0 Release Candidate',
    snippet: 'Hey team, the draft release notes and bundle size audit are ready…',
    time: '10:42 AM',
    unread: true,
  },
  {
    id: 2,
    sender: 'GitHub',
    subject: 'Pull request #142 merged',
    snippet: 'chore(resizable): refresh documentation and interactive previews…',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: 3,
    sender: 'Vercel Bot',
    subject: 'Deployment preview succeeded',
    snippet: 'Your preview deployment for branch docs-resizable is live…',
    time: '2d ago',
    unread: false,
  },
]

export function Composition() {
  const [activeMessageId, setActiveMessageId] = createSignal(1)
  const activeMessage = () => MESSAGES.find((m) => m.id === activeMessageId())!

  return (
    <div class="border border-border/60 rounded-xl bg-card/30 h-80 w-full shadow-xs overflow-hidden">
      <Resizable defaultValue={['22%', '36%', '42%']}>
        {/* Column 1: Mailboxes */}
        <Resizable.Panel min="16%" max="30%" class="p-2 bg-muted/25 flex flex-col justify-between">
          <div class="space-y-1">
            <div class="text-xs text-foreground font-semibold px-2 py-1 flex gap-1.5 items-center">
              <Icon name="i-lucide:mail" class="text-primary size-3.5" />
              Mailboxes
            </div>
            <For each={FOLDERS}>
              {(folder) => (
                <div
                  class={`text-xs px-2 py-1.5 rounded-lg flex cursor-pointer transition-colors items-center justify-between ${
                    folder.active
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <div class="flex gap-2 truncate items-center">
                    <Icon name={folder.icon} class="shrink-0 size-3.5" />
                    <span class="truncate">{folder.label}</span>
                  </div>
                  <Show when={folder.count}>
                    <span class="text-[10px] text-muted-foreground font-mono px-1 rounded bg-muted">
                      {folder.count}
                    </span>
                  </Show>
                </div>
              )}
            </For>
          </div>
          <div class="text-[10px] text-muted-foreground p-2 border-t border-border/40">
            3 panes coordinated
          </div>
        </Resizable.Panel>

        <Resizable.Handle />

        {/* Column 2: Message list */}
        <Resizable.Panel min="26%" max="50%" class="bg-background/60 flex flex-col">
          <div class="p-2 border-b border-border/50 flex gap-2 items-center">
            <Icon name="i-lucide:search" class="text-muted-foreground size-3.5" />
            <input
              type="text"
              placeholder="Search messages…"
              class="text-xs outline-none bg-transparent w-full placeholder:text-muted-foreground/60"
            />
          </div>
          <div class="flex-1 overflow-auto divide-border/40 divide-y">
            <For each={MESSAGES}>
              {(msg) => (
                <div
                  onClick={() => setActiveMessageId(msg.id)}
                  class={`text-xs p-3 cursor-pointer transition-colors space-y-1 ${
                    activeMessageId() === msg.id
                      ? 'bg-muted/50'
                      : 'hover:bg-muted/20 text-muted-foreground'
                  }`}
                >
                  <div class="flex items-center justify-between">
                    <span
                      class={`font-medium truncate ${msg.unread ? 'text-primary' : 'text-foreground'}`}
                    >
                      {msg.sender}
                    </span>
                    <span class="text-[10px] text-muted-foreground shrink-0">{msg.time}</span>
                  </div>
                  <div class="text-foreground font-medium truncate">{msg.subject}</div>
                  <p class="text-[11px] text-muted-foreground line-clamp-1">{msg.snippet}</p>
                </div>
              )}
            </For>
          </div>
        </Resizable.Panel>

        <Resizable.Handle />

        {/* Column 3: Reading pane */}
        <Resizable.Panel min="30%" class="p-4 bg-background flex flex-col justify-between">
          <div class="space-y-4">
            <div class="pb-3 border-b border-border/40 flex items-start justify-between">
              <div>
                <div class="text-sm text-foreground font-semibold">{activeMessage().subject}</div>
                <div class="text-xs text-muted-foreground mt-0.5">
                  From: <span class="text-foreground">{activeMessage().sender}</span>
                </div>
              </div>
              <div class="flex gap-1 items-center">
                <Button variant="ghost" size="icon-xs" aria-label="Reply">
                  <Icon name="i-lucide:reply" class="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon-xs" aria-label="Archive">
                  <Icon name="i-lucide:archive" class="size-3.5" />
                </Button>
              </div>
            </div>

            <p class="text-xs text-muted-foreground leading-relaxed">
              {activeMessage().snippet} All test suites and hydration verification checks passed
              with zero warnings across both UnoCSS and Tailwind preset configurations.
            </p>
          </div>

          <div class="text-[11px] text-muted-foreground pt-2 border-t border-border/40 flex items-center justify-between">
            <span>Multi-pane responsive split view</span>
            <span class="text-[10px] font-mono">moraine.v0.5</span>
          </div>
        </Resizable.Panel>
      </Resizable>
    </div>
  )
}
