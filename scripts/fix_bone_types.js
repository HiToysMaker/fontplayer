const fs = require('fs');
const path = require('path');

// 修复所有笔画模板文件中的bone类型问题
const templatesDir = path.join(__dirname, '../src/fontEditor/templates');

// 获取所有.ts文件
const files = fs.readdirSync(templatesDir).filter(file => file.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(templatesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 查找并替换bone对象声明
  const bonePattern = /const bone = \{/g;
  const replacement = 'const bone: any = {';
  
  if (bonePattern.test(content)) {
    content = content.replace(bonePattern, replacement);
    fs.writeFileSync(filePath, content);
    console.log(`Fixed bone types in ${file}`);
  }
});

console.log('All bone type issues fixed!');
