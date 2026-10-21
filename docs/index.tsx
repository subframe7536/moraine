import '@subf/unocss/reset-tailwind-v4.css'
import 'uno.css'
import './code.css'
import 'virtual:shiki.css'

import { createClientEntry } from 'solid-file-router'
import { FileRouter } from 'virtual:routes'

createClientEntry(() => <FileRouter />, document.getElementById('app')!)
