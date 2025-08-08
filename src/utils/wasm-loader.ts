// WASM模块加载器
let wasmModule: any = null;
let isInitialized = false;

// 定义WASM模块的接口
interface OverlapRemoverWasm {
  remove_overlap: (contoursJson: string) => string;
}

// 扩展Window接口
declare global {
  interface Window {
    overlapWasmModule?: OverlapRemoverWasm;
    overlap_wasm?: any;
  }
}

// 加载WASM模块
export async function loadWasmModule(): Promise<OverlapRemoverWasm> {
  if (isInitialized && wasmModule) {
    return wasmModule;
  }

  try {
    // 使用动态import加载WASM模块
    const wasmModule = await import(new URL('/overlap_wasm.js', import.meta.url).href);
    
    // 初始化WASM模块
    await wasmModule.default();
    
    isInitialized = true;
    return wasmModule as OverlapRemoverWasm;
  } catch (error) {
    console.error('Failed to load WASM module:', error);
    throw new Error('Failed to load overlap remover WASM module');
  }
}

// 获取WASM模块实例
export async function getWasmModule(): Promise<OverlapRemoverWasm> {
  if (!isInitialized) {
    return await loadWasmModule();
  }
  return wasmModule;
}

// 初始化WASM模块
export async function initWasmModule(): Promise<void> {
  try {
    wasmModule = await loadWasmModule();
    console.log('WASM module initialized successfully');
  } catch (error) {
    console.error('Failed to initialize WASM module:', error);
    throw error;
  }
} 