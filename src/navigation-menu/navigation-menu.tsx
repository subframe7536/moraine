import * as KobalteAccordion from '@kobalte/core/accordion'
import * as KobalteNavigationMenu from '@kobalte/core/navigation-menu'
import type { JSX } from 'solid-js'
import { For, Match, Show, Switch, createMemo, mergeProps, splitProps } from 'solid-js'

import { Icon } from '../icon'
import type { IconName } from '../icon'
import { Popover } from '../popover'
import type { PopoverProps } from '../popover'
import { cn } from '../shared/utils'
import { Tooltip } from '../tooltip'
import type { TooltipProps } from '../tooltip'

import {
  navigationMenuChildListVariants,
  navigationMenuContentVariants,
  navigationMenuLinkVariants,
  navigationMenuListVariants,
  navigationMenuRootVariants,
} from './navigation-menu.class'
import type { NavigationMenuVariantProps } from './navigation-menu.class'

type NavigationMenuType = 'single' | 'multiple'
type NavigationMenuOrientation = NonNullable<NavigationMenuVariantProps['orientation']>
type NavigationMenuColor = NonNullable<NavigationMenuVariantProps['color']>
type NavigationMenuVariant = NonNullable<NavigationMenuVariantProps['variant']>
type NavigationMenuContentOrientation = NonNullable<
  NavigationMenuVariantProps['contentOrientation']
>

const NAVIGATION_MENU_ITEM_CLASS = 'min-w-0'
const NAVIGATION_MENU_LABEL_CLASS =
  'w-full px-2.5 py-1.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide'
const NAVIGATION_MENU_LEADING_CLASS = 'inline-flex shrink-0 items-center justify-center'
const NAVIGATION_MENU_LABEL_TEXT_CLASS = 'truncate'
const NAVIGATION_MENU_TRAILING_CLASS = 'ms-auto inline-flex items-center gap-1.5'
const NAVIGATION_MENU_BADGE_CLASS =
  'inline-flex items-center rounded-full border border-border px-1.5 py-0 text-[10px] leading-4'
const NAVIGATION_MENU_TRAILING_ICON_CLASS =
  'inline-flex size-4 shrink-0 items-center justify-center transition-transform group-data-[expanded]:rotate-180'
const NAVIGATION_MENU_CHILD_ITEM_CLASS = 'min-w-0'
const NAVIGATION_MENU_CHILD_LINK_CLASS =
  'group flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left text-sm outline-none focus-visible:(border-ring ring-3 ring-ring/50)'
const NAVIGATION_MENU_CHILD_DESCRIPTION_CLASS = 'text-muted-foreground text-xs'
const NAVIGATION_MENU_SEPARATOR_CLASS = 'h-px bg-border'
const NAVIGATION_MENU_VIEWPORT_WRAPPER_CLASS =
  'absolute top-full left-0 z-40 flex w-full justify-center'
const NAVIGATION_MENU_VIEWPORT_CLASS =
  'relative mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md ring-1 ring-foreground/10'
const NAVIGATION_MENU_INDICATOR_CLASS =
  'absolute bottom-0 z-50 flex h-2 w-$kb-navigation-menu-indicator-size translate-x-$kb-navigation-menu-indicator-position items-end justify-center overflow-hidden'
const NAVIGATION_MENU_ARROW_CLASS =
  'relative top-[50%] size-2 rotate-45 border border-border bg-popover'

export interface NavigationMenuChildItem {
  label?: JSX.Element
  description?: JSX.Element
  icon?: IconName
  avatar?: JSX.Element
  to?: string
  href?: string
  target?: string
  rel?: string
  disabled?: boolean
  active?: boolean
  onSelect?: (event: Event) => void
  class?: string
  children?: NavigationMenuChildItem[]
}

export interface NavigationMenuItem extends NavigationMenuChildItem {
  badge?: string | number | JSX.Element
  chip?: boolean | JSX.Element
  trailingIcon?: IconName
  type?: 'label' | 'trigger' | 'link'
  value?: string
  tooltip?: boolean | Omit<TooltipProps, 'children' | 'text'>
  popover?: boolean | Omit<PopoverProps, 'children' | 'content'>
  content?: JSX.Element
}

export type NavigationMenuItems = NavigationMenuItem[] | NavigationMenuItem[][]

export interface NavigationMenuClasses {
  root?: string
  list?: string
  item?: string
  label?: string
  link?: string
  leading?: string
  linkLabel?: string
  trailing?: string
  badge?: string
  trailingIcon?: string
  content?: string
  childList?: string
  childItem?: string
  childLink?: string
  childLabel?: string
  childDescription?: string
  separator?: string
  viewportWrapper?: string
  viewport?: string
  indicator?: string
  arrow?: string
}

export interface NavigationMenuBaseProps extends Pick<
  NavigationMenuVariantProps,
  'orientation' | 'color' | 'variant' | 'highlight' | 'contentOrientation' | 'collapsed'
> {
  items?: NavigationMenuItems
  type?: NavigationMenuType
  value?: string | string[]
  defaultValue?: string | string[]
  onValueChange?: (value: string | string[] | undefined) => void
  trailingIcon?: IconName
  externalIcon?: boolean | IconName
  tooltip?: boolean | Omit<TooltipProps, 'children' | 'text'>
  popover?: boolean | Omit<PopoverProps, 'children' | 'content'>
  arrow?: boolean
  classes?: NavigationMenuClasses
}

export type NavigationMenuProps = NavigationMenuBaseProps &
  Omit<
    KobalteNavigationMenu.NavigationMenuRootProps,
    | keyof NavigationMenuBaseProps
    | 'children'
    | 'class'
    | 'value'
    | 'defaultValue'
    | 'onValueChange'
  >

function isNestedItems(items: NavigationMenuItems | undefined): items is NavigationMenuItem[][] {
  return Array.isArray(items) && Array.isArray(items[0])
}

function resolveLists(items: NavigationMenuItems | undefined): NavigationMenuItem[][] {
  if (!items?.length) {
    return []
  }

  if (isNestedItems(items)) {
    return items
  }

  return [items]
}

function resolveItemValue(
  item: NavigationMenuItem | NavigationMenuChildItem,
  index: number,
  level: number,
): string {
  if ('value' in item && item.value) {
    return item.value
  }

  return `item-${level}-${index}`
}

function resolveHref(item: NavigationMenuItem | NavigationMenuChildItem): string | undefined {
  return item.to ?? item.href
}

export function NavigationMenu(props: NavigationMenuProps): JSX.Element {
  const merged = mergeProps(
    {
      orientation: 'horizontal' as NavigationMenuOrientation,
      contentOrientation: 'horizontal' as NavigationMenuContentOrientation,
      type: 'multiple' as NavigationMenuType,
      color: 'primary' as NavigationMenuColor,
      variant: 'pill' as NavigationMenuVariant,
      highlight: false,
      collapsed: false,
      trailingIcon: 'icon-chevron-down' as IconName,
      externalIcon: 'icon-external' as IconName,
      tooltip: false,
      popover: false,
      arrow: false,
      forceMount: true,
    },
    props,
  ) as NavigationMenuProps

  const [styleProps, iconProps, stateProps, contentProps, rootProps] = splitProps(
    merged,
    [
      'orientation',
      'contentOrientation',
      'type',
      'color',
      'variant',
      'highlight',
      'collapsed',
      'classes',
    ],
    ['trailingIcon', 'externalIcon'],
    ['value', 'defaultValue', 'onValueChange', 'tooltip', 'popover', 'arrow'],
    ['items'],
  )

  const lists = createMemo(() => resolveLists(contentProps.items))

  const externalIcon = createMemo<IconName | undefined>(() => {
    if (iconProps.externalIcon === false) {
      return undefined
    }

    if (typeof iconProps.externalIcon === 'string') {
      return iconProps.externalIcon
    }

    return 'icon-external'
  })

  const horizontalValue = createMemo(() => {
    if (Array.isArray(stateProps.value)) {
      return undefined
    }

    return stateProps.value
  })

  const horizontalDefaultValue = createMemo(() => {
    if (Array.isArray(stateProps.defaultValue)) {
      return undefined
    }

    return stateProps.defaultValue
  })

  const verticalValue = createMemo(() => {
    if (Array.isArray(stateProps.value)) {
      return stateProps.value
    }

    if (!stateProps.value) {
      return undefined
    }

    return [stateProps.value]
  })

  const verticalDefaultValue = createMemo(() => {
    if (Array.isArray(stateProps.defaultValue)) {
      return stateProps.defaultValue
    }

    if (!stateProps.defaultValue) {
      return undefined
    }

    return [stateProps.defaultValue]
  })

  const shouldShowTooltip = (item: NavigationMenuItem | NavigationMenuChildItem): boolean => {
    if (styleProps.orientation !== 'vertical' || !styleProps.collapsed) {
      return false
    }

    if ('tooltip' in item && item.tooltip !== undefined) {
      return Boolean(item.tooltip)
    }

    return Boolean(stateProps.tooltip)
  }

  const shouldShowPopover = (item: NavigationMenuItem): boolean => {
    if (styleProps.orientation !== 'vertical' || !styleProps.collapsed) {
      return false
    }

    if (!item.children?.length) {
      return false
    }

    if (item.popover !== undefined) {
      return Boolean(item.popover)
    }

    return Boolean(stateProps.popover)
  }

  const tooltipProps = (
    item: NavigationMenuItem | NavigationMenuChildItem,
  ): Omit<TooltipProps, 'children' | 'text'> => {
    if ('tooltip' in item && item.tooltip && typeof item.tooltip === 'object') {
      return item.tooltip
    }

    if (stateProps.tooltip && typeof stateProps.tooltip === 'object') {
      return stateProps.tooltip
    }

    return {}
  }

  const popoverProps = (item: NavigationMenuItem): Omit<PopoverProps, 'children' | 'content'> => {
    if (item.popover && typeof item.popover === 'object') {
      return item.popover
    }

    if (stateProps.popover && typeof stateProps.popover === 'object') {
      return stateProps.popover
    }

    return {}
  }

  const renderItemBody = (
    item: NavigationMenuItem | NavigationMenuChildItem,
    options: { active?: boolean; hasChildren?: boolean; level?: number; expanded?: boolean },
  ): JSX.Element => {
    const itemBadge = () => ('badge' in item ? item.badge : undefined)
    const itemTrailingIcon = () => ('trailingIcon' in item ? item.trailingIcon : undefined)
    const hasBadge = () => itemBadge() !== undefined && itemBadge() !== null

    return (
      <>
        <Show when={item.avatar || item.icon}>
          <span
            data-slot="leading"
            class={cn(NAVIGATION_MENU_LEADING_CLASS, styleProps.classes?.leading)}
          >
            <Show
              when={item.avatar}
              fallback={
                <Switch>
                  <Match when={'chip' in item && item.chip}>
                    <span class="p-0.5 border border-border rounded-full inline-flex items-center justify-center">
                      <Icon name={item.icon as IconName} />
                    </span>
                  </Match>
                  <Match when={true}>
                    <Icon name={item.icon as IconName} />
                  </Match>
                </Switch>
              }
            >
              {item.avatar}
            </Show>
          </span>
        </Show>

        <Show when={item.label}>
          <span
            data-slot="link-label"
            class={cn(NAVIGATION_MENU_LABEL_TEXT_CLASS, styleProps.classes?.linkLabel)}
          >
            {item.label}

            <Show when={item.target === '_blank' && externalIcon()}>
              <Icon
                name={externalIcon() as IconName}
                classes={{ root: 'ms-1 inline-flex text-xs' }}
              />
            </Show>
          </span>
        </Show>

        <Show when={hasBadge() || options.hasChildren || itemTrailingIcon()}>
          <span
            data-slot="trailing"
            class={cn(NAVIGATION_MENU_TRAILING_CLASS, styleProps.classes?.trailing)}
          >
            <Show when={hasBadge()}>
              <span
                data-slot="badge"
                class={cn(NAVIGATION_MENU_BADGE_CLASS, styleProps.classes?.badge)}
              >
                {itemBadge()}
              </span>
            </Show>

            <Show when={options.hasChildren || itemTrailingIcon()}>
              <span
                data-slot="trailing-icon"
                data-expanded={options.expanded ? '' : undefined}
                class={cn(NAVIGATION_MENU_TRAILING_ICON_CLASS, styleProps.classes?.trailingIcon)}
              >
                <Icon
                  name={
                    itemTrailingIcon() || (options.hasChildren ? iconProps.trailingIcon : undefined)
                  }
                />
              </span>
            </Show>
          </span>
        </Show>
      </>
    )
  }

  const renderLink = (
    item: NavigationMenuItem | NavigationMenuChildItem,
    options: {
      active?: boolean
      hasChildren?: boolean
      level?: number
      expanded?: boolean
      class?: string
      onClick?: (event: MouseEvent) => void
    },
  ): JSX.Element => {
    const href = resolveHref(item)
    const linkClass = navigationMenuLinkVariants(
      {
        orientation: styleProps.orientation,
        variant: styleProps.variant,
        color: styleProps.color,
        active: Boolean(item.active || options.active),
        disabled: Boolean(item.disabled),
        highlight: Boolean(styleProps.highlight),
        level: Boolean(options.level && options.level > 0),
        collapsed: Boolean(styleProps.collapsed),
      },
      styleProps.classes?.link,
      item.class,
      options.class,
    )

    if (href) {
      return (
        <a
          data-slot="link"
          href={href}
          target={item.target}
          rel={item.rel}
          aria-disabled={item.disabled ? true : undefined}
          class={linkClass}
          onClick={(event) => {
            if (item.disabled) {
              event.preventDefault()
              return
            }

            item.onSelect?.(event)
            options.onClick?.(event)
          }}
        >
          {renderItemBody(item, options)}
        </a>
      )
    }

    return (
      <button
        data-slot="link"
        type="button"
        disabled={item.disabled}
        class={linkClass}
        onClick={(event) => {
          item.onSelect?.(event)
          options.onClick?.(event)
        }}
      >
        {renderItemBody(item, options)}
      </button>
    )
  }

  const wrapWithTooltip = (
    item: NavigationMenuItem | NavigationMenuChildItem,
    node: JSX.Element,
  ): JSX.Element => {
    if (!shouldShowTooltip(item)) {
      return node
    }

    return (
      <Tooltip text={item.label} {...tooltipProps(item)}>
        {node}
      </Tooltip>
    )
  }

  const renderChildItems = (
    items: NavigationMenuChildItem[] | undefined,
    level: number,
    orientation: NavigationMenuOrientation,
  ): JSX.Element => {
    return (
      <ul
        data-slot="child-list"
        class={cn(
          navigationMenuChildListVariants({
            orientation,
            contentOrientation: styleProps.contentOrientation,
          }),
          styleProps.classes?.childList,
        )}
      >
        <For each={items ?? []}>
          {(child) => {
            const hasChildren = () => Boolean(child.children?.length)

            return (
              <li
                data-slot="child-item"
                class={cn(NAVIGATION_MENU_CHILD_ITEM_CLASS, styleProps.classes?.childItem)}
              >
                {wrapWithTooltip(
                  child,
                  renderLink(child, {
                    hasChildren: hasChildren(),
                    level,
                    class: cn(NAVIGATION_MENU_CHILD_LINK_CLASS, styleProps.classes?.childLink),
                  }),
                )}

                <Show when={child.description}>
                  <p
                    data-slot="child-description"
                    class={cn(
                      NAVIGATION_MENU_CHILD_DESCRIPTION_CLASS,
                      styleProps.classes?.childDescription,
                    )}
                  >
                    {child.description}
                  </p>
                </Show>

                <Show when={hasChildren() && !styleProps.collapsed}>
                  {renderChildItems(child.children, level + 1, orientation)}
                </Show>
              </li>
            )
          }}
        </For>
      </ul>
    )
  }

  const renderHorizontalItem = (item: NavigationMenuItem, index: number): JSX.Element => {
    const hasChildren = () => Boolean(item.children?.length || item.content)
    const value = resolveItemValue(item, index, 0)

    if (item.type === 'label') {
      return (
        <li data-slot="item" class={cn(NAVIGATION_MENU_ITEM_CLASS, styleProps.classes?.item)}>
          <div data-slot="label" class={cn(NAVIGATION_MENU_LABEL_CLASS, styleProps.classes?.label)}>
            {item.label}
          </div>
        </li>
      )
    }

    return (
      <li data-slot="item" class={cn(NAVIGATION_MENU_ITEM_CLASS, styleProps.classes?.item)}>
        <Show
          when={hasChildren()}
          fallback={wrapWithTooltip(
            item,
            renderLink(item, {
              hasChildren: false,
            }),
          )}
        >
          <KobalteNavigationMenu.Menu value={value}>
            <KobalteNavigationMenu.Trigger
              data-slot="trigger"
              class={cn('w-full', styleProps.classes?.link)}
            >
              {renderItemBody(item, { hasChildren: true })}
            </KobalteNavigationMenu.Trigger>

            <KobalteNavigationMenu.Portal>
              <KobalteNavigationMenu.Content
                data-slot="content"
                class={cn(
                  navigationMenuContentVariants({
                    side: 'bottom',
                    orientation: 'horizontal',
                    contentOrientation: styleProps.contentOrientation,
                  }),
                  styleProps.classes?.content,
                )}
              >
                <Show
                  when={item.content}
                  fallback={renderChildItems(item.children, 1, 'horizontal')}
                >
                  {item.content}
                </Show>
              </KobalteNavigationMenu.Content>
            </KobalteNavigationMenu.Portal>
          </KobalteNavigationMenu.Menu>
        </Show>
      </li>
    )
  }

  const renderVerticalItem = (
    item: NavigationMenuItem,
    index: number,
    level: number,
  ): JSX.Element => {
    const hasChildren = () => Boolean(item.children?.length || item.content)
    const value = resolveItemValue(item, index, level)

    if (item.type === 'label' && !styleProps.collapsed) {
      return (
        <li data-slot="item" class={cn(NAVIGATION_MENU_ITEM_CLASS, styleProps.classes?.item)}>
          <div data-slot="label" class={cn(NAVIGATION_MENU_LABEL_CLASS, styleProps.classes?.label)}>
            {item.label}
          </div>
        </li>
      )
    }

    if (hasChildren() && !styleProps.collapsed) {
      return (
        <KobalteAccordion.Item
          data-slot="item"
          value={value}
          class={cn(NAVIGATION_MENU_ITEM_CLASS, styleProps.classes?.item)}
        >
          <KobalteAccordion.Header as="div">
            <KobalteAccordion.Trigger
              data-slot="trigger"
              class={cn(
                navigationMenuLinkVariants({
                  orientation: 'vertical',
                  variant: styleProps.variant,
                  color: styleProps.color,
                  highlight: styleProps.highlight,
                }),
                styleProps.classes?.link,
              )}
            >
              {renderItemBody(item, { hasChildren: true })}
            </KobalteAccordion.Trigger>
          </KobalteAccordion.Header>

          <KobalteAccordion.Content
            data-slot="content"
            class={cn(
              'overflow-hidden data-[expanded]:(animate-in fade-in-0) data-[closed]:(animate-out fade-out-0)',
              styleProps.classes?.content,
            )}
          >
            <Show
              when={item.content}
              fallback={renderChildItems(item.children, level + 1, 'vertical')}
            >
              {item.content}
            </Show>
          </KobalteAccordion.Content>
        </KobalteAccordion.Item>
      )
    }

    const linkNode = renderLink(item, {
      hasChildren: hasChildren(),
      level,
    })

    if (item.type === 'trigger') {
      return <li data-slot="item">{linkNode}</li>
    }

    if (shouldShowPopover(item)) {
      return (
        <li data-slot="item" class={cn(NAVIGATION_MENU_ITEM_CLASS, styleProps.classes?.item)}>
          <Popover
            mode="hover"
            placement="right-start"
            content={renderChildItems(item.children, level + 1, 'vertical')}
            classes={{ content: styleProps.classes?.content }}
            {...popoverProps(item)}
          >
            {wrapWithTooltip(item, linkNode)}
          </Popover>
        </li>
      )
    }

    return (
      <li data-slot="item" class={cn(NAVIGATION_MENU_ITEM_CLASS, styleProps.classes?.item)}>
        {wrapWithTooltip(item, linkNode)}
      </li>
    )
  }

  return (
    <Switch>
      <Match when={styleProps.orientation === 'vertical'}>
        <div
          data-slot="root"
          data-collapsed={styleProps.collapsed ? '' : undefined}
          class={cn(
            navigationMenuRootVariants({ orientation: 'vertical' }),
            styleProps.classes?.root,
          )}
        >
          <For each={lists()}>
            {(list, listIndex) => (
              <>
                <KobalteAccordion.Root
                  data-slot="list"
                  class={cn(
                    navigationMenuListVariants({ orientation: 'vertical' }),
                    styleProps.classes?.list,
                  )}
                  multiple={styleProps.type === 'multiple'}
                  collapsible
                  value={verticalValue()}
                  defaultValue={verticalDefaultValue()}
                  onChange={(value) => {
                    if (styleProps.type === 'single') {
                      stateProps.onValueChange?.(value[0])
                      return
                    }

                    stateProps.onValueChange?.(value)
                  }}
                >
                  <For each={list.map((item, index) => ({ item, index }))}>
                    {(entry) => renderVerticalItem(entry.item, entry.index, 0)}
                  </For>
                </KobalteAccordion.Root>

                <Show when={listIndex() < lists().length - 1}>
                  <div
                    data-slot="separator"
                    class={cn(NAVIGATION_MENU_SEPARATOR_CLASS, styleProps.classes?.separator)}
                  />
                </Show>
              </>
            )}
          </For>
        </div>
      </Match>

      <Match when={true}>
        <KobalteNavigationMenu.Root
          data-slot="root"
          class={cn(
            navigationMenuRootVariants({ orientation: 'horizontal' }),
            styleProps.classes?.root,
          )}
          orientation="horizontal"
          value={horizontalValue()}
          defaultValue={horizontalDefaultValue()}
          onValueChange={(value) => stateProps.onValueChange?.(value ?? undefined)}
          {...rootProps}
        >
          <For each={lists()}>
            {(list, listIndex) => (
              <>
                <ul
                  data-slot="list"
                  class={cn(
                    navigationMenuListVariants({ orientation: 'horizontal' }),
                    styleProps.classes?.list,
                  )}
                >
                  <For each={list.map((item, index) => ({ item, index }))}>
                    {(entry) => renderHorizontalItem(entry.item, entry.index)}
                  </For>
                </ul>

                <Show when={listIndex() < lists().length - 1}>
                  <div
                    data-slot="separator"
                    class={cn(NAVIGATION_MENU_SEPARATOR_CLASS, styleProps.classes?.separator)}
                  />
                </Show>
              </>
            )}
          </For>

          <div
            data-slot="viewport-wrapper"
            class={cn(NAVIGATION_MENU_VIEWPORT_WRAPPER_CLASS, styleProps.classes?.viewportWrapper)}
          >
            <Show when={Boolean(stateProps.arrow)}>
              <div
                data-slot="indicator"
                class={cn(NAVIGATION_MENU_INDICATOR_CLASS, styleProps.classes?.indicator)}
              >
                <div
                  data-slot="arrow"
                  class={cn(NAVIGATION_MENU_ARROW_CLASS, styleProps.classes?.arrow)}
                />
              </div>
            </Show>

            <KobalteNavigationMenu.Viewport
              data-slot="viewport"
              class={cn(NAVIGATION_MENU_VIEWPORT_CLASS, styleProps.classes?.viewport)}
            />
          </div>
        </KobalteNavigationMenu.Root>
      </Match>
    </Switch>
  )
}
