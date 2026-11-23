import { readFile } from 'node:fs/promises'

import { renderToString } from '@solidjs/web'
import { announcePages, staticPathsOf } from 'solid-file-router'
import manifest from 'virtual:routes'

import { Router } from './routes/router'
let template: string | undefined

export default async function handleRequest(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url)
  const app = renderToString(() => (
    <Router url={pathname}>{(props) => <>{props.children}</>}</Router>
  ))
  template ??= await readFile('dist/client/index.html', 'utf8')
  const headers = new Headers({ 'content-type': 'text/html; charset=utf-8' })
  announcePages(request, headers, staticPathsOf(manifest.map((route) => route.path)))
  return new Response(template.replace('<div id="app"></div>', `<div id="app">${app}</div>`), {
    headers,
  })
}
