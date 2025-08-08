const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 构建WASM模块
function buildWasm() {
  console.log('Building WASM module...');
  
  const wasmDir = path.join(__dirname, '../crates/font-overlap-remover');
  
  try {
    // 检查是否安装了wasm-pack
    execSync('wasm-pack --version', { stdio: 'pipe' });
  } catch (error) {
    console.error('wasm-pack not found. Please install it first:');
    console.error('cargo install wasm-pack');
    process.exit(1);
  }
  
  try {
    // 构建WASM模块
    execSync('wasm-pack build --target web --out-dir pkg', {
      cwd: wasmDir,
      stdio: 'inherit'
    });
    
    console.log('WASM module built successfully!');
    
    // 复制WASM文件到public目录
    const publicDir = path.join(__dirname, '../public');
    const wasmFile = path.join(wasmDir, 'pkg/overlap_wasm_bg.wasm');
    const jsFile = path.join(wasmDir, 'pkg/overlap_wasm.js');
    
    if (fs.existsSync(wasmFile)) {
      fs.copyFileSync(wasmFile, path.join(publicDir, 'overlap_wasm_bg.wasm'));
      console.log('WASM file copied to public directory');
    }
    
    if (fs.existsSync(jsFile)) {
      fs.copyFileSync(jsFile, path.join(publicDir, 'overlap_wasm.js'));
      console.log('WASM JS file copied to public directory');
    }
    
  } catch (error) {
    console.error('Failed to build WASM module:', error.message);
    process.exit(1);
  }
}

buildWasm(); 