import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // 👈 رجعنا السطر ده عشان نشوف هل الـ CSS هو اللي بيخفي الكونتنت ولا لأ

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)