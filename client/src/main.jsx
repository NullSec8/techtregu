import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

const savedTheme = localStorage.getItem('theme')
if (savedTheme === 'neon') {
  document.documentElement.setAttribute('data-theme', 'neon')
}

const root = createRoot(document.getElementById('root'))
root.render(React.createElement(App))

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(console.error)
}

if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission().catch(console.error)
}
