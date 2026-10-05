import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ACTIVITIES } from './lib/activities'
import Home from './screens/Home'
import HourDetail from './screens/HourDetail'
import Search from './screens/Search'
import Tune from './screens/Tune'
import { StoreProvider, useStore } from './state/store'

/** Night activities get the navy palette from the Stitch stargazing variant. */
function Theme() {
  const { activity } = useStore()
  const dark = Boolean(ACTIVITIES[activity].nightOnly)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b1220' : '#fcf9f8')
  }, [dark])
  return null
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    // Braces matter: newer browsers return a Promise from scrollTo, which React rejects as a cleanup.
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Theme />
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hour/:time" element={<HourDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/tune" element={<Tune />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
