/**
 * Mobile chrome sync: visible viewport box + measured bottom nav height.
 *
 * Android Chrome keeps a taller layout viewport when the address bar is shown.
 * A fixed app shell must match the *visible* box (height + offsetTop), and the
 * scroll region must be sized explicitly — flex alone is unreliable on Android.
 */
const MOBILE_MAX_WIDTH = 1024
const LAYOUT_SYNC_DELAYS_MS = [0, 100, 300, 600, 1200]

let navResizeObserver = null
let domObserver = null
let layoutSyncTimers = []

export function getVisualViewportBox(viewport = typeof window !== 'undefined' ? window.visualViewport : null) {
  if (typeof window === 'undefined') {
    return { height: 0, offsetTop: 0 }
  }

  if (!viewport) {
    return {
      height: Math.round(window.innerHeight),
      offsetTop: 0,
    }
  }

  const offsetTop = Math.max(0, Math.round(viewport.offsetTop))
  const layoutHeight = window.innerHeight
  const clientHeight = document.documentElement.clientHeight

  let height = viewport.height

  // Never size the shell taller than the visible layout box (Android address bar).
  height = Math.min(height, layoutHeight - offsetTop)

  if (clientHeight > 0) {
    height = Math.min(height, clientHeight - offsetTop)
  }

  return {
    height: Math.max(0, Math.round(height)),
    offsetTop,
  }
}

export function applyViewportBox({ height, offsetTop }) {
  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty('--vvh', `${Math.max(0, Math.round(height))}px`)
  document.documentElement.style.setProperty('--vv-offset-top', `${Math.max(0, Math.round(offsetTop))}px`)
}

export function syncViewportHeight() {
  if (typeof window === 'undefined') return
  applyViewportBox(getVisualViewportBox())
}

export function syncMobileNavOffset() {
  if (typeof window === 'undefined' || window.innerWidth > MOBILE_MAX_WIDTH) return

  const nav = document.querySelector('.mobile-nav')
  if (!nav) return

  const height = Math.ceil(nav.getBoundingClientRect().height)
  if (height <= 0) return

  document.documentElement.style.setProperty('--mobile-nav-offset', `${height}px`)
  document.documentElement.style.setProperty('--mobile-bottom-inset', `${height + 24}px`)
}

export function syncContentAreaHeight() {
  if (typeof window === 'undefined' || window.innerWidth > MOBILE_MAX_WIDTH) return

  const shellHeight = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--vvh')
  ) || getVisualViewportBox().height

  const navOffset = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--mobile-nav-offset')
  ) || 64

  const header = document.querySelector('.top-header')
  const headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 64
  const contentHeight = Math.max(0, Math.round(shellHeight - headerHeight - navOffset))

  document.documentElement.style.setProperty('--content-area-height', `${contentHeight}px`)
}

export function syncMobileLayout() {
  syncViewportHeight()
  syncMobileNavOffset()
  syncContentAreaHeight()
}

function scheduleLayoutSync() {
  layoutSyncTimers.forEach((id) => window.clearTimeout(id))
  layoutSyncTimers = LAYOUT_SYNC_DELAYS_MS.map((delay) =>
    window.setTimeout(syncMobileLayout, delay)
  )
}

function observeMobileNav() {
  const nav = document.querySelector('.mobile-nav')
  if (!nav || navResizeObserver) return

  navResizeObserver = new ResizeObserver(() => {
    syncMobileLayout()
  })
  navResizeObserver.observe(nav)
  syncMobileLayout()
}

export function installMobileChromeSync() {
  if (typeof window === 'undefined') return

  const run = () => {
    syncMobileLayout()
    window.requestAnimationFrame(syncMobileLayout)
    scheduleLayoutSync()
  }

  run()

  window.visualViewport?.addEventListener('resize', run)
  window.visualViewport?.addEventListener('scroll', run)
  window.addEventListener('resize', run)
  window.addEventListener('orientationchange', run)
  window.addEventListener('pageshow', run)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') run()
  })

  domObserver = new MutationObserver(() => {
    observeMobileNav()
    syncMobileLayout()
  })
  domObserver.observe(document.body, { childList: true, subtree: true })

  observeMobileNav()
}
