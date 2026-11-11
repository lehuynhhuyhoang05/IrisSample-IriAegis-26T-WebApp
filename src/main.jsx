import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './android-tokens.css'
import './styles.css'
import './android-theme.css'
import './camera-layout.css'

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
