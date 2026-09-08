import { ContextMenu } from '@src'
import { createSignal } from 'solid-js'

export function ComplexExample() {
  const [readOnly, setReadOnly] = createSignal(false)
  const [formatOnSave, setFormatOnSave] = createSignal(true)
  const [gitBranch, setGitBranch] = createSignal('main')

  return (
    <div class="p-6 flex items-center justify-center">
      <ContextMenu>
        <ContextMenu.Trigger
          as="div"
          class="p-4 border border-border rounded-xl border-dashed bg-muted/20 flex gap-3 w-80 cursor-context-menu select-none transition-colors items-center hover:bg-muted/30"
        >
          <div class="text-primary rounded-lg bg-primary/10 flex shrink-0 size-10 items-center justify-center">
            <span class="i-lucide:file-code-2 size-5" />
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-sm text-foreground font-semibold truncate">Navigation.tsx</span>
            <span class="text-xs text-muted-foreground truncate">TypeScript JSX • 4.2 KB</span>
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Content
          class="w-60"
          items={[
            {
              icon: 'i-lucide:external-link',
              label: 'Open in New Tab',
              kbds: ['⌘', 'O'],
            },
            {
              icon: 'i-lucide:app-window',
              label: 'Open With',
              children: [
                {
                  icon: 'i-lucide:code',
                  label: 'Code Editor',
                },
                {
                  icon: 'i-lucide:file-text',
                  label: 'Text Previewer',
                },
                {
                  icon: 'i-lucide:terminal',
                  label: 'Integrated Terminal',
                },
              ],
            },
            { type: 'separator' },
            {
              icon: 'i-lucide:scissors',
              label: 'Cut',
              kbds: ['⌘', 'X'],
            },
            {
              icon: 'i-lucide:copy',
              label: 'Copy',
              kbds: ['⌘', 'C'],
            },
            {
              icon: 'i-lucide:copy-check',
              label: 'Copy Relative Path',
              kbds: ['⌥', '⌘', 'C'],
            },
            { type: 'separator' },
            {
              type: 'checkbox',
              icon: 'i-lucide:lock',
              label: 'Read-Only',
              checked: readOnly(),
              onSelect: () => setReadOnly((prev) => !prev),
            },
            {
              type: 'checkbox',
              icon: 'i-lucide:sparkles',
              label: 'Format on Save',
              checked: formatOnSave(),
              onSelect: () => setFormatOnSave((prev) => !prev),
            },
            {
              icon: 'i-lucide:git-branch',
              label: 'Target Branch',
              children: [
                {
                  type: 'radio',
                  group: 'git-branch',
                  value: 'main',
                  label: 'main',
                  checked: gitBranch() === 'main',
                  onSelect: () => setGitBranch('main'),
                },
                {
                  type: 'radio',
                  group: 'git-branch',
                  value: 'feature/nav-refactor',
                  label: 'feature/nav-refactor',
                  checked: gitBranch() === 'feature/nav-refactor',
                  onSelect: () => setGitBranch('feature/nav-refactor'),
                },
                {
                  type: 'radio',
                  group: 'git-branch',
                  value: 'staging',
                  label: 'staging',
                  checked: gitBranch() === 'staging',
                  onSelect: () => setGitBranch('staging'),
                },
              ],
            },
            { type: 'separator' },
            {
              icon: 'i-lucide:edit-3',
              label: 'Rename...',
              kbds: ['F2'],
            },
            {
              icon: 'i-lucide:trash-2',
              label: 'Delete File',
              color: 'destructive',
              kbds: ['⌘', '⌫'],
            },
          ]}
        />
      </ContextMenu>
    </div>
  )
}
