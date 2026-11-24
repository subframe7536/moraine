/// <reference types="solid-file-router/client" />

import { createFileRouter } from 'solid-file-router'
import { pageRoutes } from 'virtual:routes'
import type { FileRouteTreeEntry } from 'virtual:routes'

import * as appRouteModule from './_app'
import { registerDocsRouteInfo } from './docs-route'

import * as indexRouteModule from './index'

function makeRootEager(entries: readonly FileRouteTreeEntry[]): FileRouteTreeEntry[] {
  return entries.map((entry) => {
    if (entry.id === '/(app)') {
      return {
        ...entry,
        $component: { require: () => appRouteModule },
        children: entry.children ? makeRootEager(entry.children) : undefined,
      }
    }
    if (entry.id === '/') {
      return {
        ...entry,
        $component: { require: () => indexRouteModule },
      }
    }
    return entry
  })
}

export const Router = createFileRouter({ routes: makeRootEager(pageRoutes) })
registerDocsRouteInfo(Router.routeInfo)
