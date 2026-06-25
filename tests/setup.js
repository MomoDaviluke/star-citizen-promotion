// Global test setup - mock browser APIs not available in jsdom/happy-dom

// IntersectionObserver mock
class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback
  }
  observe() { return null }
  unobserve() { return null }
  disconnect() { return null }
}
globalThis.IntersectionObserver = IntersectionObserverMock

// ResizeObserver mock
class ResizeObserverMock {
  constructor(callback) {
    this.callback = callback
  }
  observe() { return null }
  unobserve() { return null }
  disconnect() { return null }
}
globalThis.ResizeObserver = ResizeObserverMock

// matchMedia mock
if (!globalThis.matchMedia) {
  globalThis.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  })
}

// requestAnimationFrame mock
if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0)
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
}
