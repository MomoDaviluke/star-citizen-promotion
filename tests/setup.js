// Global test setup - mock browser APIs not available in jsdom/happy-dom

// ---------------------------------------------------------------------------
// DBG-24: Node 25+/26 内置实验性 webstorage 兜底
//
// Node 25/26 内置了 experimental webstorage（需 --localstorage-file 启动参数才可用）。
// 缺该参数时其 getter 处于"存在但不可用"状态：getter 覆盖了 jsdom 注入的
// localStorage/sessionStorage（window === globalThis），访问即返回 undefined，
// 测试中 localStorage.clear() 直接 TypeError（useTheme 套件 11 连挂的根因）。
//
// 此处检测该坏态并用内存 polyfill 覆盖，使测试与 Node 版本解耦：
// - jsdom 正常注入（Node 20 / CI）→ 无 getter，不触碰，行为零变化
// - Node 自带 --localstorage-file 启动 → getter 返回真实 Storage，不触碰
// - 坏态（Node 25+/26 无参数）→ 覆盖为内存实现
// ---------------------------------------------------------------------------
function isBrokenStorage(name) {
  const desc = Object.getOwnPropertyDescriptor(globalThis, name)
  if (!desc || !desc.get) return false // 无 getter：jsdom 注入正常
  try {
    return desc.get.call(globalThis) == null // getter 返回 null/undefined：内置坏态
  } catch {
    return true // getter 直接抛错：同为坏态
  }
}
for (const storageName of ['localStorage', 'sessionStorage']) {
  if (!isBrokenStorage(storageName)) continue
  const backing = new Map()
  const polyfill = {
    getItem: (key) => (backing.has(String(key)) ? backing.get(String(key)) : null),
    setItem: (key, value) => {
      backing.set(String(key), String(value))
    },
    removeItem: (key) => {
      backing.delete(String(key))
    },
    clear: () => {
      backing.clear()
    },
    key: (index) => [...backing.keys()][index] ?? null,
    get length() {
      return backing.size
    },
  }
  Object.defineProperty(globalThis, storageName, {
    value: polyfill,
    configurable: true,
    writable: true,
  })
}

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
