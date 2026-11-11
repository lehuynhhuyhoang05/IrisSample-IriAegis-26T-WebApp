import React from 'react'
import { createRoot } from 'react-dom/client'
import Workspace from './Workspace.jsx'
import './android-tokens.css'
import './styles.css'
import './android-theme.css'
import './camera-layout.css'

createRoot(document.getElementById('root')).render(<React.StrictMode><Workspace /></React.StrictMode>)
