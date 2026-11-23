/// <reference types="solid-file-router/client" />

import { createFileRouter } from 'solid-file-router'

import { registerDocsRouteInfo } from './docs-route'
export const Router = createFileRouter()
registerDocsRouteInfo(Router.routeInfo)
