import { useLocation } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { For, Show, createEffect, createMemo, createSignal, on, onCleanup, onMount } from 'solid-js'

import { useTableOfContents } from '../../hooks/use-table-of-contents'
import type { OnThisPageEntry } from '../../hooks/use-table-of-contents'

function getOnThisPageIndentStyle(level: number) {
  const indentLevel = Math.max(0, level - 1)
  return { 'padding-inline-start': `${indentLevel * 0.75}rem` }
}

export function OnThisPage(props: { entries: OnThisPageEntry[]; class?: string }) {
  const location = useLocation()
  const [nav, setNav] = createSignal<HTMLElement>()
  const [list, setList] = createSignal<HTMLElement>()
  const [positions, setPositions] = createSignal(new Map<string, [number, number]>())
  const [listHeight, setListHeight] = createSignal(0)
  const { activeIds, primaryActiveId } = useTableOfContents(
    () => props.entries,
    () => location.hash || (typeof window === 'undefined' ? '' : window.location.hash),
    () => nav()?.closest<HTMLElement>('[data-slot="sidebar-frame-main"]') ?? undefined,
  )

  const measure = () => {
    const element = list()
    if (!element) {
      return
    }
    const next = new Map<string, [number, number]>()
    for (const anchor of element.querySelectorAll<HTMLAnchorElement>('a[data-toc-id]')) {
      next.set(anchor.dataset.tocId!, [anchor.offsetTop, anchor.offsetTop + anchor.offsetHeight])
    }
    setPositions(next)
    setListHeight(element.offsetHeight)
  }

  onMount(() => {
    const element = list()
    if (!element) {
      return
    }
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(element)
    measure()
    onCleanup(() => resizeObserver.disconnect())
  })

  createEffect(on(() => props.entries, measure))

  const blockStyle = createMemo((): JSX.CSSProperties => {
    const ids = activeIds()
    const cached = positions()
    const first = ids.length ? cached.get(ids[0]!) : undefined
    const last = ids.length ? cached.get(ids[ids.length - 1]!) : undefined
    if (!first || !last) {
      return { 'clip-path': 'inset(0 0 100% 0 round 8px)', visibility: 'hidden' }
    }
    return {
      'clip-path': `inset(${first[0]}px 0 ${Math.max(0, listHeight() - last[1])}px 0 round 8px)`,
      visibility: 'visible',
    }
  })

  return (
    <nav ref={setNav} aria-label="On This Page" class={props.class}>
      <p class="text-[0.68rem] text-muted-foreground/80 tracking-[0.14em] font-semibold uppercase">
        On This Page
      </p>
      <Show
        when={props.entries.length > 0}
        fallback={<p class="text-xs text-muted-foreground mt-3">No sections</p>}
      >
        <div ref={setList} class="mt-2.5 flex flex-col gap-0.5 relative">
          <div
            data-toc-active-range
            aria-hidden="true"
            class="rounded-lg pointer-events-none transition-[clip-path] duration-300 ease-out inset-0 absolute from-primary/10 to-primary/5 bg-gradient-to-r motion-reduce:transition-none"
            style={blockStyle()}
          />
          <For each={props.entries}>
            {(entry) => (
              <a
                href={`#${encodeURIComponent(entry.id)}`}
                target="_self"
                data-toc-id={entry.id}
                aria-current={primaryActiveId() === entry.id ? 'location' : undefined}
                data-active={activeIds().includes(entry.id) ? '' : undefined}
                class="text-xs text-muted-foreground leading-7 px-2 py-0.5 transition-colors relative data-active:(text-primary font-medium) hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span class="block truncate" style={getOnThisPageIndentStyle(entry.level)}>
                  <Show
                    when={entry.label.startsWith('`') && entry.label.endsWith('`')}
                    fallback={entry.label}
                  >
                    <code class="docs-inline-code">{entry.label.slice(1, -1)}</code>
                  </Show>
                </span>
              </a>
            )}
          </For>
        </div>
      </Show>
    </nav>
  )
}
