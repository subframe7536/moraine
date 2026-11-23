import type { JSX } from '@solidjs/web'
import { announceRoutes } from 'solid-file-router'

import { Router } from './routes/router'

export default function App(): JSX.Element {
  announceRoutes()
  return <Router>{(props) => <>{props.children}</>}</Router>
}
