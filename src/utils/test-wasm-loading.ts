// 测试WASM模块加载
import { getWasmModule } from './wasm-loader'

export async function testWasmLoading() {
  try {
    console.log('Testing WASM module loading...')
    
    const wasmModule = await getWasmModule()
    console.log('✅ WASM module loaded successfully')
    
    // 测试一个简单的轮廓数据
    const testContours = [
      [
        {
          type: 'LINE',
          start: { x: 0, y: 0 },
          end: { x: 100, y: 0 }
        },
        {
          type: 'LINE',
          start: { x: 100, y: 0 },
          end: { x: 100, y: 100 }
        },
        {
          type: 'LINE',
          start: { x: 100, y: 100 },
          end: { x: 0, y: 100 }
        },
        {
          type: 'LINE',
          start: { x: 0, y: 100 },
          end: { x: 0, y: 0 }
        }
      ]
    ]
    
    const result = wasmModule.remove_overlap(JSON.stringify(testContours))
    const parsedResult = JSON.parse(result)
    
    console.log('✅ WASM function executed successfully')
    console.log('Result:', parsedResult)
    
    return true
  } catch (error) {
    console.error('❌ WASM test failed:', error)
    return false
  }
} 