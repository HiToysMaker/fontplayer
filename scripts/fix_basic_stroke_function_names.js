const fs = require('fs');
const path = require('path');

// 基础笔画及其正确的函数名
const basicStrokes = {
  '横': 'skeletonToBones_heng',
  '竖': 'skeletonToBones_shu', 
  '撇': 'skeletonToBones_pie',
  '捺': 'skeletonToBones_na',
  '点': 'skeletonToBones_dian',
  '挑': 'skeletonToBones_tiao'
};

// 修复基础笔画的函数名
const templatesDir = path.join(__dirname, '../src/fontEditor/templates');

Object.keys(basicStrokes).forEach(strokeName => {
  const filePath = path.join(templatesDir, `${strokeName}.ts`);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const correctFunctionName = basicStrokes[strokeName];
    
    // 替换错误的函数名
    content = content.replace(/export const skeletonToBones__ =/g, `export const ${correctFunctionName} =`);
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed function name in ${strokeName}.ts: ${correctFunctionName}`);
  } else {
    console.log(`File ${strokeName}.ts not found`);
  }
});

console.log('All basic stroke function names fixed!');
