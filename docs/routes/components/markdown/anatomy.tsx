import { For, Show, useContext } from 'solid-js'

import { anatomyNodeKind, anatomyNodeLabel } from '../../../shared/anatomy'
import type { AnatomyConfig, AnatomyNode } from '../../../shared/anatomy'

import { ComponentDocContext } from './component-doc.context'

function AnatomyBranch(props: { nodes: AnatomyNode[] }) {
  return (
    <ul class="m-0 ps-3 list-none border-s border-border space-y-1 sm:ps-4">
      <For each={props.nodes}>
        {(node) => (
          <li class="min-w-0">
            <div class="py-1 flex flex-wrap gap-x-3 gap-y-1 min-w-0 items-baseline relative before:(border-t border-border w-2 content-empty top-3.5 absolute -start-3) sm:before:(w-3 -start-4)">
              <code class="text-foreground font-mono break-words text-sm">
                {anatomyNodeLabel(node)}
              </code>
              <span class="text-muted-foreground text-xs">{anatomyNodeKind(node)}</span>
              <Show when={node.part && node.slot}>
                <code class="text-muted-foreground font-mono text-xs">slot={node.slot}</code>
              </Show>
              <Show when={node.element}>
                <code class="text-muted-foreground font-mono break-words text-xs">
                  {'<'}
                  {node.element}
                  {'>'}
                </code>
              </Show>
            </div>
            <Show when={node.children?.length}>
              <AnatomyBranch nodes={node.children!} />
            </Show>
          </li>
        )}
      </For>
    </ul>
  )
}

/** Semantic, wrapping tree with the same source structure as agent Markdown. */
export function Anatomy(props: { value: AnatomyConfig }) {
  const component = useContext(ComponentDocContext)
  if (!component) {
    throw new Error('Anatomy requires a component docs context')
  }

  return (
    <div class="mb-3.5 text-sm" data-docs-anatomy>
      <ul class="m-0 p-0 list-none">
        <li>
          <div class="py-1.5 flex flex-wrap gap-x-3 gap-y-1 items-baseline">
            <code class="text-foreground font-medium font-mono break-words">{component.name}</code>
            <span class="text-muted-foreground text-xs">
              {props.value.root.noDom ? 'State-only / no DOM' : 'DOM root'}
            </span>
            <Show when={props.value.root.element}>
              <code class="text-muted-foreground font-mono text-xs">
                {'<'}
                {props.value.root.element}
                {'>'}
              </code>
            </Show>
          </div>
          <Show when={props.value.children?.length}>
            <AnatomyBranch nodes={props.value.children!} />
          </Show>
        </li>
      </ul>
    </div>
  )
}
