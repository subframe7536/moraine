import 'uno.css'

import { createClientEntry } from 'solid-file-router'
import { FileRouter } from 'virtual:routes'

createClientEntry(() => <FileRouter />, document.getElementById('app')!)
