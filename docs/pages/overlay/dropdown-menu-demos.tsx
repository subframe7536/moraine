import { createMemo, createSignal } from 'solid-js'

import { Button, DropdownMenu } from '../../../src'
import type { DropdownMenuT } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

function AccountTeam() {
  const badgeClass =
    'rounded-md b-1 b-border border-border bg-muted px-1.5 py-0.5 font-medium text-[11px] text-foreground'

  const avatarClass =
    'grid size-4 place-items-center rounded-full bg-linear-to-br from-primary to-accent text-[10px] font-semibold text-primary-foreground'

  const [lastAction, setLastAction] = createSignal('None')

  return (
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <DropdownMenu
        items={[
          [
            { type: 'label', label: 'Account' },
            {
              label: (
                <div class="flex gap-2 items-center">
                  <span class="font-medium">Alex Morgan</span>
                  <span class={badgeClass}>Owner</span>
                </div>
              ),
              description: 'alex@flintui.dev',
              icon: <span class={avatarClass}>AM</span>,
              onSelect: () => setLastAction('Open account profile'),
            },
            { type: 'separator' },
            {
              label: 'Switch Workspace',
              icon: 'i-lucide-building-2',
              children: [
                [
                  { type: 'label', label: 'Recent Workspaces' },
                  {
                    label: 'Design System',
                    description: '12 teammates · shared tokens',
                    icon: 'i-lucide-palette',
                    onSelect: () => setLastAction('Switch to Design System'),
                  },
                  {
                    label: 'Platform Ops',
                    description: '8 teammates · deploy tooling',
                    icon: 'i-lucide-server',
                    onSelect: () => setLastAction('Switch to Platform Ops'),
                  },
                  {
                    label: 'Support Workspace',
                    description: '5 teammates · customer issues',
                    icon: 'i-lucide-life-buoy',
                    onSelect: () => setLastAction('Switch to Support Workspace'),
                  },
                ],
                [
                  { type: 'label', label: 'Actions' },
                  {
                    label: 'Create Workspace',
                    icon: 'i-lucide-plus',
                    onSelect: () => setLastAction('Create workspace'),
                  },
                ],
              ],
            },
            {
              label: 'Invite Teammates',
              icon: 'i-lucide-user-plus',
              kbds: ['⌘', 'I'],
              onSelect: () => setLastAction('Invite teammates'),
            },
            {
              label: 'Billing & Usage',
              icon: 'i-lucide-credit-card',
              onSelect: () => setLastAction('Billing & usage'),
            },
          ],
          [
            { type: 'label', label: 'Preferences' },
            {
              label: 'Account Settings',
              icon: 'i-lucide-settings-2',
              kbds: ['⌘', ','],
              onSelect: () => setLastAction('Account settings'),
            },
            {
              label: 'Keyboard Shortcuts',
              icon: 'i-lucide-command',
              kbds: ['⌘', 'K'],
              onSelect: () => setLastAction('Keyboard shortcuts'),
            },
            {
              label: 'Support Inbox',
              icon: 'i-lucide-life-buoy',
              onSelect: () => setLastAction('Support inbox'),
            },
          ],
          [
            {
              label: 'Sign Out',
              icon: 'i-lucide-log-out',
              color: 'destructive',
              onSelect: () => setLastAction('Sign out'),
            },
          ],
        ]}
      >
        <Button variant="outline">Open account menu</Button>
      </DropdownMenu>
      <p class="text-sm text-muted-foreground">
        Last action: <span class="font-medium">{lastAction()}</span>
      </p>
    </div>
  )
}

function EditorViewOptions() {
  const [showLineNumbers, setShowLineNumbers] = createSignal(true)
  const [showMinimap, setShowMinimap] = createSignal(true)
  const [previewTabs, setPreviewTabs] = createSignal(false)
  const [autoSave, setAutoSave] = createSignal(true)
  const [theme, setTheme] = createSignal<'light' | 'dark' | 'system'>('dark')

  const editorItems = createMemo<DropdownMenuT.Items>(() => [
    [
      { type: 'label', label: 'Editor' },
      {
        label: 'Command Palette',
        description: 'Jump to commands, files, and symbols',
        icon: 'i-lucide-search',
        kbds: ['⌘', 'K'],
      },
      {
        label: 'Go to File…',
        icon: 'i-lucide-file-search',
        kbds: ['⌘', 'P'],
      },
      {
        label: 'Open Recent',
        icon: 'i-lucide-history',
        children: [
          [
            { type: 'label', label: 'Recent Files' },
            {
              label: 'src/overlays/dropdown-menu/dropdown-menu.tsx',
              icon: 'i-lucide-file-code-2',
            },
            {
              label: 'docs/components/context-menu-demos.tsx',
              icon: 'i-lucide-file-code-2',
            },
            {
              label: 'Pinned Workspaces',
              icon: 'i-lucide-star',
              children: [
                [
                  {
                    label: 'Flint UI',
                    description: 'packages + docs',
                    icon: 'i-lucide-folder-kanban',
                  },
                  {
                    label: 'Docs Site',
                    description: 'marketing + guides',
                    icon: 'i-lucide-book-open',
                  },
                ],
              ],
            },
          ],
        ],
      },
    ],
    [
      { type: 'label', label: 'View' },
      {
        type: 'checkbox',
        label: 'Line Numbers',
        icon: 'i-lucide-list',
        checked: showLineNumbers(),
        onCheckedChange: (checked: boolean) => setShowLineNumbers(checked),
      },
      {
        type: 'checkbox',
        label: 'Minimap',
        icon: 'i-lucide-map',
        checked: showMinimap(),
        onCheckedChange: (checked: boolean) => setShowMinimap(checked),
      },
      {
        type: 'checkbox',
        label: 'Preview Tabs',
        icon: 'i-lucide-panel-top',
        checked: previewTabs(),
        onCheckedChange: (checked: boolean) => setPreviewTabs(checked),
      },
      {
        type: 'checkbox',
        label: 'Auto Save',
        icon: 'i-lucide-save',
        checked: autoSave(),
        onCheckedChange: (checked: boolean) => setAutoSave(checked),
      },
      { type: 'separator' },
      {
        label: 'Theme',
        icon: 'i-lucide-palette',
        children: [
          [
            { type: 'label', label: 'Appearance' },
            {
              label: 'Light',
              icon: theme() === 'light' ? 'i-lucide-check' : 'i-lucide-sun',
              onSelect: () => setTheme('light'),
            },
            {
              label: 'Dark',
              icon: theme() === 'dark' ? 'i-lucide-check' : 'i-lucide-moon',
              onSelect: () => setTheme('dark'),
            },
            {
              label: 'System',
              icon: theme() === 'system' ? 'i-lucide-check' : 'i-lucide-monitor',
              onSelect: () => setTheme('system'),
            },
          ],
        ],
      },
    ],
    [
      { type: 'label', label: 'Panels' },
      {
        label: 'Toggle Terminal',
        icon: 'i-lucide-square-terminal',
        kbds: ['⌃', '`'],
      },
      {
        label: 'Focus Problems',
        icon: 'i-lucide-triangle-alert',
        kbds: ['⇧', '⌘', 'M'],
      },
    ],
  ])

  return (
    <div class="flex flex-col gap-3">
      <div class="flex flex-wrap gap-3 items-center">
        <DropdownMenu items={editorItems()}>
          <Button variant="outline">Editor menu</Button>
        </DropdownMenu>
      </div>
      <div class="text-sm text-muted-foreground flex flex-wrap gap-4">
        <span>
          Line numbers: <span class="font-medium">{String(showLineNumbers())}</span>
        </span>
        <span>
          Minimap: <span class="font-medium">{String(showMinimap())}</span>
        </span>
        <span>
          Preview tabs: <span class="font-medium">{String(previewTabs())}</span>
        </span>
        <span>
          Auto save: <span class="font-medium">{String(autoSave())}</span>
        </span>
        <span>
          Theme: <span class="font-medium uppercase">{theme()}</span>
        </span>
      </div>
    </div>
  )
}

function ProjectReleaseActions() {
  const [lastAction, setLastAction] = createSignal('None')

  const badgeClass =
    'rounded-md b-1 b-border border-border bg-muted px-1.5 py-0.5 font-medium text-[11px] text-foreground'

  const projectItems: DropdownMenuT.Items = [
    [
      {
        type: 'label',
        label: (
          <div class="flex gap-2 items-center">
            <span>Project: flint-ui</span>
            <span class={badgeClass}>main</span>
          </div>
        ),
      },
      {
        label: 'New File',
        icon: 'i-lucide-file-plus',
        kbds: ['⌘', 'N'],
        onSelect: () => setLastAction('New file'),
      },
      {
        label: 'New Folder',
        icon: 'i-lucide-folder-plus',
        kbds: ['⇧', '⌘', 'N'],
        onSelect: () => setLastAction('New folder'),
      },
      {
        label: 'Rename Project',
        icon: 'i-lucide-pencil',
        kbds: ['F2'],
        onSelect: () => setLastAction('Rename project'),
      },
      { type: 'separator' },
      {
        label: 'Move To…',
        icon: 'i-lucide-folder-input',
        children: [
          [
            { type: 'label', label: 'Favorite Folders' },
            {
              label: 'src/components',
              icon: 'i-lucide-folder-open',
              onSelect: () => setLastAction('Move to src/components'),
            },
            {
              label: 'src/overlays',
              icon: 'i-lucide-folder-open',
              onSelect: () => setLastAction('Move to src/overlays'),
            },
            {
              label: 'More Destinations',
              icon: 'i-lucide-more-horizontal',
              children: [
                [
                  {
                    label: 'docs/content',
                    icon: 'i-lucide-folder-open',
                    onSelect: () => setLastAction('Move to docs/content'),
                  },
                  {
                    label: 'archive/2025',
                    icon: 'i-lucide-folder-open',
                    onSelect: () => setLastAction('Move to archive/2025'),
                  },
                ],
              ],
            },
          ],
        ],
      },
      {
        label: 'Copy Preview Link',
        icon: 'i-lucide-link',
        kbds: ['⌘', '⇧', 'C'],
        onSelect: () => setLastAction('Copy preview link'),
      },
    ],
    [
      { type: 'label', label: 'Release' },
      {
        label: 'Open Pull Request',
        icon: 'i-lucide-git-pull-request-arrow',
        onSelect: () => setLastAction('Open pull request'),
      },
      {
        label: 'Deploy Preview',
        description: 'Build preview for design review',
        icon: 'i-lucide-rocket',
        onSelect: () => setLastAction('Deploy preview'),
      },
      {
        label: (
          <div class="flex gap-2 items-center">
            <span>Ship to Production</span>
            <span class="text-[11px] text-amber-700 font-medium px-1.5 py-0.5 rounded-md bg-amber-100">
              Protected
            </span>
          </div>
        ),
        description: 'Requires review approval',
        icon: <span class="rounded-full bg-emerald-500 size-2 inline-block" />,
        onSelect: () => setLastAction('Ship to production'),
      },
    ],
    [
      {
        label: 'Archive Project',
        icon: 'i-lucide-archive',
        onSelect: () => setLastAction('Archive project'),
      },
      {
        label: 'Delete Project',
        icon: 'i-lucide-trash-2',
        color: 'destructive',
        onSelect: () => setLastAction('Delete Project'),
      },
    ],
  ]

  return (
    <>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DropdownMenu items={projectItems}>
          <Button>Project actions</Button>
        </DropdownMenu>
        <p class="text-sm text-muted-foreground">
          Tip: use arrow keys to walk the nested “Move To…” and release sections.
        </p>
      </div>
      <div class="text-sm text-muted-foreground">
        Last action: <span class="font-medium">{lastAction()}</span>
      </div>
    </>
  )
}

export default () => {
  return (
    <DemoPage componentKey="dropdown-menu">
      <DemoSection
        title="Account / Team"
        description="An account dropdown with grouped actions, workspace switching, shortcut hints, and a destructive sign-out row."
        demo={AccountTeam}
      />

      <DemoSection
        title="Editor / View Options"
        description="A workspace-style menu with recent files, nested submenus, checkbox toggles, and theme selection for keyboard and pointer testing."
        demo={EditorViewOptions}
      />

      <DemoSection
        title="Project / Release Actions"
        description="A heavier project menu with move flows, release actions, mixed-content labels, and destructive project operations."
        demo={ProjectReleaseActions}
      />
    </DemoPage>
  )
}
