import type { JSX } from '@solidjs/web'
import type { Accessor } from 'solid-js'
import { Loading, Show, createEffect, createSignal, lazy, onSettled, omit } from 'solid-js'

import { Button, KbdGroup } from '../../../../src'
import type { CommandPaletteT, DialogT } from '../../../../src'

import { DOCS_HEADER_CONTROL_CLASS } from './docs-header.recipe'
import type { SidebarPage } from './sidebar'

export type DocsCommandPaletteVariant = 'responsive' | 'mobile' | 'desktop'

export interface DocsCommandPaletteProps {
  pages: Array<SidebarPage>
  onNavigate: (path: string) => void
  open: Accessor<boolean>
  setOpen: (open: boolean) => void
  variant?: DocsCommandPaletteVariant
}

export interface DocsCommandItem extends CommandPaletteT.Item {
  href: string
  icon?: string
}

const loadCommandPaletteDialog = () => import('./docs-command-palette-dialog')
const LazyCommandPaletteDialog = lazy(loadCommandPaletteDialog)

export function buildDocsCommandItems(
  pages: Array<SidebarPage>,
  includeSections = true,
): Array<CommandPaletteT.Group<DocsCommandItem>> {
  const pageItems: Array<DocsCommandItem> = []
  const sectionItems: Array<DocsCommandItem> = []
  const destinations = new Set<string>()

  for (const page of pages) {
    if (!destinations.has(page.path)) {
      const surfaceIcon =
        page.surface === 'components'
          ? 'i-lucide:layout-grid'
          : page.surface === 'hooks'
            ? 'i-lucide:anchor'
            : 'i-lucide:book-open'

      pageItems.push({
        href: page.path,
        value: page.path,
        label: page.label,
        description: `${page.surface === 'docs' ? 'Docs' : page.surface === 'hooks' ? 'Hooks' : 'Components'} · ${page.section[0]?.toUpperCase()}${page.section.slice(1)}`,
        keywords: [...page.tags, page.path, page.description],
        icon: surfaceIcon,
      })
      destinations.add(page.path)
    }

    if (includeSections) {
      for (const section of page.sections) {
        const href = `${page.path}#${encodeURIComponent(section.id)}`
        if (destinations.has(href)) {
          continue
        }

        sectionItems.push({
          href,
          value: href,
          label: section.label,
          description: page.label,
          keywords: [page.label, page.description, ...page.tags, page.path, section.id],
          icon: 'i-lucide:hash',
        })
        destinations.add(href)
      }
    }
  }

  const groups: Array<CommandPaletteT.Group<DocsCommandItem>> = [
    {
      type: 'group',
      label: 'Pages',
      children: pageItems,
    },
  ]
  if (sectionItems.length > 0) {
    groups.push({
      type: 'group',
      label: 'Sections',
      children: sectionItems,
    })
  }
  return groups
}

export function DocsSearchTrigger(
  props: DialogT.TriggerProps & { variant?: DocsCommandPaletteVariant },
): JSX.Element {
  const triggerProps = omit(props, 'variant')
  const variant = () => props.variant ?? 'responsive'

  return (
    <Button
      {...triggerProps}
      aria-label="Open search"
      aria-keyshortcuts="Meta+K Control+K"
      variant={variant() === 'desktop' ? 'outline' : 'ghost'}
      size={variant() === 'desktop' ? 'sm' : 'icon-sm'}
      leading="i-lucide-search"
      class={[
        DOCS_HEADER_CONTROL_CLASS,
        variant() === 'mobile'
          ? 'size-11'
          : variant() === 'desktop'
            ? 'ms-1 me-2 h-9 w-52 justify-start border-border bg-muted/40 hover:bg-muted/70'
            : 'size-11 lg:ms-1 lg:me-2 lg:px-2 lg:h-9 lg:w-52 lg:text-xs lg:justify-start lg:border-border lg:bg-muted/40 lg:hover:bg-muted/70',
      ]}
      classes={{ label: variant() === 'responsive' ? 'hidden lg:block lg:flex-1' : 'flex-1' }}
    >
      <Show when={variant() !== 'mobile'}>
        <span class="text-sm flex gap-3 w-full items-center justify-between">
          <span>Search docs</span>
          <KbdGroup items={['⌘', 'K']} separator="" size="sm" variant="outline" />
        </span>
      </Show>
    </Button>
  )
}

export function DocsCommandPalette(props: DocsCommandPaletteProps): JSX.Element {
  const [hasOpened, setHasOpened] = createSignal(false)

  createEffect(
    () => props.open(),
    (isOpen) => {
      if (isOpen) {
        setHasOpened(true)
      }
    },
  )

  const handleKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null
    const isEditable =
      target?.tagName === 'INPUT' ||
      target?.tagName === 'TEXTAREA' ||
      target?.isContentEditable === true

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      event.stopImmediatePropagation()
      props.setOpen(!props.open())
      return
    }

    if (event.key === '/' && !isEditable && !props.open()) {
      event.preventDefault()
      props.setOpen(true)
    }
  }

  onSettled(() => {
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  })

  const renderFallbackTrigger = () => (
    <DocsSearchTrigger
      type="button"
      variant={props.variant}
      aria-haspopup="dialog"
      aria-expanded={props.open() ? 'true' : 'false'}
      onPointerEnter={() => {
        void loadCommandPaletteDialog()
      }}
      onFocus={() => {
        void loadCommandPaletteDialog()
      }}
      onClick={() => {
        props.setOpen(true)
      }}
    />
  )

  return (
    <Show when={hasOpened()} fallback={renderFallbackTrigger()}>
      <Loading fallback={renderFallbackTrigger()}>
        <LazyCommandPaletteDialog
          pages={props.pages}
          onNavigate={props.onNavigate}
          open={props.open}
          setOpen={props.setOpen}
          variant={props.variant}
        />
      </Loading>
    </Show>
  )
}
