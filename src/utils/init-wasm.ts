import { initWasmModule } from './wasm-loader'

// 初始化WASM模块
export async function initializeWasm() {
  try {
    console.log('Initializing WASM module...')
    await initWasmModule()
    console.log('WASM module initialized successfully')
    return true
  } catch (error) {
    console.warn('Failed to initialize WASM module, will use fallback implementation:', error)
    return false
  }
}

// 检查WASM是否可用
export function isWasmAvailable(): boolean {
  return typeof WebAssembly !== 'undefined'
}

// 获取WASM状态信息
export function getWasmStatus() {
  return {
    available: isWasmAvailable(),
    initialized: false, // 这个状态会在初始化后更新
  }
} 