import {
  ItemIndicator,
  Portal,
  Group,
  Sub,
  Separator,
  SubTrigger,
  SubContent,
  CheckboxItem,
  Item,
  GroupLabel,
} from '@kobalte/core/dropdown-menu'
import type { ClassValueArray } from 'cls-variant'
import type { Component, JSX } from 'solid-js'
import { For, Match, Show, Switch } from 'solid-js'

import { Icon } from '../../elements/icon'
import type { IconName } from '../../elements/icon'
import { Kbd } from '../../elements/kbd'
import { cn } from '../../shared/utils'

import { overlayMenuContentVariants, overlayMenuItemVariants } from './menu.class'
import type { OverlayMenuItemVariantProps } from './menu.class'
import type {
  OverlayMenuSharedClasses,
  OverlayMenuSharedItem,
  OverlayMenuSharedItemRenderContext,
} from './types'
import { getOverlayMenuTextValue, normalizeOverlayMenuGroups } from './utils'
import type { OverlayMenuContentSlot, OverlayMenuItems, OverlayMenuSide } from './utils'

type OverlayMenuColor = NonNullable<OverlayMenuItemVariantProps['color']>
type OverlayMenuSize = NonNullable<OverlayMenuItemVariantProps['size']>

export interface OverlayMenuBaseContentProps<
  TItem extends OverlayMenuSharedItem<OverlayMenuColor, TItem>,
> {
  content: Component<any>
  items?: OverlayMenuItems<TItem>
  size?: OverlayMenuSize
  classes?: OverlayMenuSharedClasses
  checkedIcon?: IconName
  submenuIcon?: IconName
  itemRender?: (context: OverlayMenuSharedItemRenderContext<TItem>) => JSX.Element
  contentTop?: OverlayMenuContentSlot
  contentBottom?: OverlayMenuContentSlot
  rootSide: OverlayMenuSide
}

export function OverlayMenuBaseContent<
  TItem extends OverlayMenuSharedItem<OverlayMenuColor, TItem>,
>(props: OverlayMenuBaseContentProps<TItem>): JSX.Element {
  function getItemClass(item: TItem, ...cls: ClassValueArray): string {
    return overlayMenuItemVariants(
      {
        size: props.size,
        color: item.color,
      },
      ...cls,
    )
  }

  function RenderItemContent(contentProps: {
    item: TItem
    depth: number
    hasChildren: boolean
    isCheckbox: boolean
  }): JSX.Element {
    return (
      <Show
        when={!props.itemRender}
        fallback={props.itemRender!({
          item: contentProps.item,
          depth: contentProps.depth,
          hasChildren: contentProps.hasChildren,
          isCheckbox: contentProps.isCheckbox,
        })}
      >
        <Show when={contentProps.item.icon}>
          <span
            data-slot="itemLeading"
            class={cn(
              'col-start-1 inline-flex size-4 shrink-0 items-center justify-center',
              props.classes?.itemLeading,
            )}
          >
            <Icon name={contentProps.item.icon as IconName} />
          </span>
        </Show>

        <Show when={contentProps.item.label || contentProps.item.description}>
          <span
            data-slot="itemWrapper"
            class={cn('col-start-2 grid gap-0.5', props.classes?.itemWrapper)}
          >
            <Show when={contentProps.item.label}>
              <span data-slot="itemLabel" class={cn('truncate', props.classes?.itemLabel)}>
                {contentProps.item.label}
              </span>
            </Show>

            <Show when={contentProps.item.description}>
              <span
                data-slot="itemDescription"
                class={cn('truncate text-muted-foreground text-xs', props.classes?.itemDescription)}
              >
                {contentProps.item.description}
              </span>
            </Show>
          </span>
        </Show>

        <span
          data-slot="itemTrailing"
          class={cn(
            'col-start-3 inline-flex items-center justify-end gap-1.5',
            props.classes?.itemTrailing,
          )}
        >
          <Show when={contentProps.hasChildren}>
            <Icon name={props.submenuIcon} class={cn('text-sm', props.classes?.itemSub)} />
          </Show>

          <Show when={!contentProps.hasChildren}>
            <Kbd
              size="sm"
              slotPrefix="item"
              value={contentProps.item.kbds}
              classes={{
                root: props.classes?.itemKbds,
              }}
            />
          </Show>

          <Show when={contentProps.isCheckbox}>
            <ItemIndicator
              data-slot="itemIndicator"
              class={cn(
                'inline-flex items-center justify-center text-sm',
                props.classes?.itemIndicator,
              )}
            >
              <Icon name={props.checkedIcon} />
            </ItemIndicator>
          </Show>
        </span>
      </Show>
    )
  }

  function RenderItemNode(nodeProps: { item: TItem; depth: number }): JSX.Element {
    return (
      <Show
        when={normalizeOverlayMenuGroups(nodeProps.item.children).length > 0}
        fallback={
          <Switch
            fallback={
              <Item
                data-slot="item"
                textValue={getOverlayMenuTextValue(nodeProps.item)}
                disabled={nodeProps.item.disabled}
                onSelect={nodeProps.item.onSelect}
                class={getItemClass(nodeProps.item, props.classes?.item)}
              >
                <RenderItemContent
                  item={nodeProps.item}
                  depth={nodeProps.depth}
                  hasChildren={false}
                  isCheckbox={false}
                />
              </Item>
            }
          >
            <Match when={nodeProps.item.type === 'separator'}>
              <Separator
                data-slot="separator"
                class={cn('mx--1 my-1 h-px b-t-border', props.classes?.separator)}
              />
            </Match>

            <Match when={nodeProps.item.type === 'label'}>
              <GroupLabel
                data-slot="label"
                class={cn(
                  'px-1.5 py-1 font-medium text-muted-foreground text-xs',
                  props.classes?.label,
                )}
              >
                {nodeProps.item.label}
              </GroupLabel>
            </Match>

            <Match when={nodeProps.item.type === 'checkbox'}>
              <CheckboxItem
                data-slot="item"
                textValue={getOverlayMenuTextValue(nodeProps.item)}
                disabled={nodeProps.item.disabled}
                checked={nodeProps.item.checked}
                defaultChecked={nodeProps.item.defaultChecked}
                onChange={nodeProps.item.onCheckedChange}
                onSelect={nodeProps.item.onSelect}
                class={getItemClass(nodeProps.item, props.classes?.item)}
              >
                <RenderItemContent
                  item={nodeProps.item}
                  depth={nodeProps.depth}
                  hasChildren={false}
                  isCheckbox={true}
                />
              </CheckboxItem>
            </Match>
          </Switch>
        }
      >
        <Sub
          open={nodeProps.item.open}
          defaultOpen={nodeProps.item.defaultOpen}
          overflowPadding={2}
        >
          <SubTrigger
            data-slot="item"
            disabled={nodeProps.item.disabled}
            textValue={getOverlayMenuTextValue(nodeProps.item)}
            class={getItemClass(
              nodeProps.item,
              'data-expanded:(bg-accent text-accent-foreground)',
              props.classes?.item,
            )}
          >
            <RenderItemContent
              item={nodeProps.item}
              depth={nodeProps.depth}
              hasChildren={true}
              isCheckbox={false}
            />
          </SubTrigger>

          <Portal>
            <SubContent
              data-slot="content"
              class={overlayMenuContentVariants(
                { side: props.rootSide === 'left' ? 'left' : 'right' },
                props.classes?.content,
              )}
            >
              <Show when={props.contentTop}>{(slot) => slot()({ sub: true })}</Show>
              <RenderGroups sourceItems={nodeProps.item.children} depth={nodeProps.depth + 1} />
              <Show when={props.contentBottom}>{(slot) => slot()({ sub: true })}</Show>
            </SubContent>
          </Portal>
        </Sub>
      </Show>
    )
  }

  function RenderGroups(groupProps: {
    sourceItems: OverlayMenuItems<TItem> | undefined
    depth: number
  }): JSX.Element {
    return (
      <For each={normalizeOverlayMenuGroups(groupProps.sourceItems)}>
        {(group) => (
          <Group data-slot="group" class={cn(props.classes?.group)}>
            <For each={group}>
              {(item) => <RenderItemNode item={item} depth={groupProps.depth} />}
            </For>
          </Group>
        )}
      </For>
    )
  }

  return (
    <Portal>
      <props.content
        data-slot="content"
        class={overlayMenuContentVariants({ side: props.rootSide }, props.classes?.content)}
      >
        <Show when={props.contentTop}>{(slot) => slot()({ sub: false })}</Show>
        <RenderGroups sourceItems={props.items} depth={0} />
        <Show when={props.contentBottom}>{(slot) => slot()({ sub: false })}</Show>
      </props.content>
    </Portal>
  )
}
