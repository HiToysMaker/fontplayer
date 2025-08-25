#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building WASM module...');

try {
  // 检查wasm-pack是否安装
  try {
    execSync('wasm-pack --version', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ wasm-pack not found. Please install it first:');
    console.error('   cargo install wasm-pack');
    process.exit(1);
  }

  // 构建WASM模块
  console.log('📦 Building overlap_wasm module...');
  execSync('wasm-pack build --target web', {
    cwd: path.join(__dirname, '../crates/font-overlap-remover'),
    stdio: 'inherit'
  });

  // 复制文件到public目录
  console.log('📋 Copying files to public directory...');
  const sourceDir = path.join(__dirname, '../crates/font-overlap-remover/pkg');
  const targetDir = path.join(__dirname, '../public');

  // 确保目标目录存在
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 复制WASM文件
  const wasmFile = path.join(sourceDir, 'overlap_wasm_bg.wasm');
  const jsFile = path.join(sourceDir, 'overlap_wasm.js');
  
  if (fs.existsSync(wasmFile)) {
    fs.copyFileSync(wasmFile, path.join(targetDir, 'overlap_wasm_bg.wasm'));
    console.log('✅ Copied overlap_wasm_bg.wasm');
  } else {
    console.error('❌ overlap_wasm_bg.wasm not found');
  }

  if (fs.existsSync(jsFile)) {
    fs.copyFileSync(jsFile, path.join(targetDir, 'overlap_wasm.js'));
    console.log('✅ Copied overlap_wasm.js');
  } else {
    console.error('❌ overlap_wasm.js not found');
  }

  // 检查文件大小
  const wasmStats = fs.statSync(path.join(targetDir, 'overlap_wasm_bg.wasm'));
  const jsStats = fs.statSync(path.join(targetDir, 'overlap_wasm.js'));
  
  console.log(`📊 WASM file size: ${(wasmStats.size / 1024).toFixed(2)} KB`);
  console.log(`📊 JS file size: ${(jsStats.size / 1024).toFixed(2)} KB`);

  console.log('🎉 WASM module built successfully!');
  console.log('');
  console.log('📝 Next steps:');
  console.log('   1. Start your development server: npm run dev');
  console.log('   2. Test the overlap removal function');
  console.log('   3. Check the browser console for debug information');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 