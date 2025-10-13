/**
 * 防抖函数
 * @param fn 需要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  
  return function(this: any, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

/**
 * 节流函数
 * @param fn 需要节流的函数
 * @param delay 节流间隔（毫秒）
 * @param options 配置选项
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): (...args: Parameters<T>) => void {
  const { leading = true, trailing = true } = options
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastTime = 0
  let lastArgs: Parameters<T> | null = null
  
  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now()
    
    // 首次调用且 leading 为 false 时，设置 lastTime
    if (!lastTime && !leading) {
      lastTime = now
    }
    
    const remaining = delay - (now - lastTime)
    lastArgs = args
    
    if (remaining <= 0 || remaining > delay) {
      // 立即执行
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      lastTime = now
      fn.apply(this, args)
      lastArgs = null
    } else if (!timer && trailing) {
      // 设置 trailing 执行
      timer = setTimeout(() => {
        lastTime = leading ? Date.now() : 0
        timer = null
        if (lastArgs) {
          fn.apply(this, lastArgs)
          lastArgs = null
        }
      }, remaining)
    }
  }
}

/**
 * 使用 requestAnimationFrame 的节流函数
 * 确保每一帧最多执行一次，适合动画和拖拽场景
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null
  let latestArgs: Parameters<T> | null = null
  
  return function(this: any, ...args: Parameters<T>) {
    // 保存最新的参数
    latestArgs = args
    
    // 如果已经有待执行的 RAF，直接返回（不创建新的）
    if (rafId !== null) {
      return
    }
    
    // 创建新的 RAF
    rafId = requestAnimationFrame(() => {
      if (latestArgs !== null) {
        fn.apply(this, latestArgs)
      }
      rafId = null
      latestArgs = null
    })
  }
}