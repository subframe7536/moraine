import 'uno.css'
import 'virtual:docs-expressive-code.css'
import 'virtual:docs-expressive-code-client'

import { createClientEntry } from 'solid-file-router'
import { FileRouter } from 'virtual:routes'

createClientEntry(() => <FileRouter />, document.getElementById('app')!)
