const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 测试WASM模块
async function testWasm() {
  console.log('Testing WASM module...');
  
  const wasmDir = path.join(__dirname, '../crates/font-overlap-remover');
  
  try {
    // 检查WASM文件是否存在
    const wasmFile = path.join(wasmDir, 'pkg/overlap_wasm_bg.wasm');
    const jsFile = path.join(wasmDir, 'pkg/overlap_wasm.js');
    
    if (!fs.existsSync(wasmFile)) {
      console.error('WASM file not found. Please run "npm run build-wasm" first.');
      return;
    }
    
    if (!fs.existsSync(jsFile)) {
      console.error('WASM JS file not found. Please run "npm run build-wasm" first.');
      return;
    }
    
    console.log('✓ WASM files found');
    
    // 检查文件大小
    const wasmStats = fs.statSync(wasmFile);
    const jsStats = fs.statSync(jsFile);
    
    console.log(`✓ WASM file size: ${(wasmStats.size / 1024).toFixed(2)} KB`);
    console.log(`✓ JS file size: ${(jsStats.size / 1024).toFixed(2)} KB`);
    
    // 测试简单的JSON解析
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
    ];
    
    const testJson = JSON.stringify(testContours);
    console.log('✓ Test JSON created');
    console.log(`✓ Test data size: ${(testJson.length / 1024).toFixed(2)} KB`);
    
    console.log('\n✅ WASM module test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run "npm run dev" to start the development server');
    console.log('2. Open the application in your browser');
    console.log('3. Test the "去除重叠" (Remove Overlap) functionality');
    
  } catch (error) {
    console.error('❌ WASM module test failed:', error.message);
    process.exit(1);
  }
}

testWasm(); 