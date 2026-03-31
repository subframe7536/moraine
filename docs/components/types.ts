import type { Component } from 'solid-js'

export interface MarkdownRenderSegment {
  type: 'markdown'
  html: string
}

export interface ExampleRenderSegment {
  type: 'example'
  component: Component
  code?: string
}

export interface WidgetRenderSegment {
  type: 'docs-header' | 'docs-api-reference' | 'intro-cards' | 'intro-components' | 'toast-hosts'
  props?: Record<string, unknown>
}

export interface CodeTabsRenderSegment {
  type: 'code-tabs'
  items: {
    label: string
    value: string
    html: string
  }[]
}

export type RenderSegment =
  | MarkdownRenderSegment
  | ExampleRenderSegment
  | WidgetRenderSegment
  | CodeTabsRenderSegment
