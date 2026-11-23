import '@subf/unocss/reset-tailwind-v4.css'
import 'uno.css'
import './code.css'

import { hydrate } from '@solidjs/web'

import { Router } from './routes/router'
hydrate(() => <Router>{(props) => <>{props.children}</>}</Router>, document.getElementById('app')!)
