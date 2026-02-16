import type { Accessor } from 'solid-js'
import { For, createMemo } from 'solid-js'

export interface SidebarPage {
  key: string
  label: string
  group: string
}

export interface SidebarProps {
  pages: SidebarPage[]
  activePage: Accessor<string>
  setActivePage: (key: string) => void
}

export const Sidebar = (props: SidebarProps) => {
  const grouped = createMemo(() => {
    const map = new Map<string, SidebarPage[]>()

    for (const page of props.pages) {
      const list = map.get(page.group) ?? []
      list.push(page)
      map.set(page.group, list)
    }

    return [...map.entries()]
  })

  return (
    <aside class="text-white p-4 bg-zinc-900 flex shrink-0 flex-col gap-6 w-56 overflow-y-auto">
      <div class="text-xs text-zinc-400 tracking-widest font-semibold px-2 uppercase">Rock UI</div>

      <For each={grouped()}>
        {([group, pages]) => (
          <div>
            <div class="text-[11px] text-zinc-500 tracking-wider font-medium mb-1.5 px-2 uppercase">
              {group}
            </div>
            <nav class="flex flex-col gap-0.5">
              <For each={pages}>
                {(page) => (
                  <button
                    type="button"
                    class={`text-sm px-2.5 py-1.5 text-left rounded-md transition-colors ${
                      props.activePage() === page.key
                        ? 'bg-zinc-700/80 font-medium text-white'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                    onClick={() => props.setActivePage(page.key)}
                  >
                    {page.label}
                  </button>
                )}
              </For>
            </nav>
          </div>
        )}
      </For>
    </aside>
  )
}
