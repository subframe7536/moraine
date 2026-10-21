import { Icon, MultiSelect } from '@src'
import type { MultiSelectT } from '@src'

interface LabelItem extends MultiSelectT.Item {
  color: string
}

const LABELS: LabelItem[] = [
  {
    label: 'bug',
    value: 'bug',
    color: 'bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-400',
  },
  {
    label: 'feature',
    value: 'feature',
    color: 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-400',
  },
  {
    label: 'documentation',
    value: 'docs',
    color: 'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-400',
  },
  {
    label: 'performance',
    value: 'perf',
    color: 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400',
  },
  {
    label: 'security',
    value: 'security',
    color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
  },
]

export function CustomTags() {
  return (
    <div class="max-w-md w-full space-y-2">
      <label class="text-xs text-muted-foreground font-medium block">Issue Labels</label>
      <MultiSelect<LabelItem>
        items={LABELS}
        defaultValue={['bug', 'perf']}
        search
        openOnControlClick
        placeholder="Select labels..."
        tagRender={(props) => {
          const color = () => props.item?.color ?? 'bg-muted border-border text-foreground'
          return (
            <span
              class={`text-xs font-medium px-2 py-0.5 border rounded-full inline-flex gap-1.5 items-center ${color()}`}
            >
              <span class="rounded-full bg-current opacity-70 h-1.5 w-1.5" />
              <span>{props.label}</span>
              <button
                type="button"
                aria-label={`Remove ${props.value}`}
                onClick={(event) => {
                  event.stopPropagation()
                  props.onClose()
                }}
                class="p-0.5 rounded-full inline-flex transition-opacity items-center justify-center hover:opacity-80"
              >
                <Icon name="i-lucide:x" size={11} />
              </button>
            </span>
          )
        }}
      />
    </div>
  )
}
