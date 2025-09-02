const fs = require('fs');
const path = require('path');

// 定义所有笔画及其正确的函数名
const strokeFunctionNames = {
  '横': 'skeletonToBones_heng',
  '竖': 'skeletonToBones_shu', 
  '撇': 'skeletonToBones_pie',
  '捺': 'skeletonToBones_na',
  '点': 'skeletonToBones_dian',
  '挑': 'skeletonToBones_tiao',
  '横钩': 'skeletonToBones_heng_gou',
  '平捺': 'skeletonToBones_ping_na',
  '挑捺': 'skeletonToBones_tiao_na',
  '撇点': 'skeletonToBones_pie_dian',
  '撇挑': 'skeletonToBones_pie_tiao',
  '横撇弯钩': 'skeletonToBones_heng_pie_wan_gou',
  '斜钩': 'skeletonToBones_xie_gou',
  '竖折': 'skeletonToBones_shu_zhe',
  '竖弯钩': 'skeletonToBones_shu_wan_gou',
  '竖弯': 'skeletonToBones_shu_wan',
  '竖挑': 'skeletonToBones_shu_tiao',
  '竖撇': 'skeletonToBones_shu_pie',
  '横折挑': 'skeletonToBones_heng_zhe_tiao',
  '横折2': 'skeletonToBones_heng_zhe2',
  '横折弯': 'skeletonToBones_heng_zhe_wan',
  '二横折': 'skeletonToBones_er_heng_zhe',
  '横折': 'skeletonToBones_heng_zhe',
  '横折折弯钩': 'skeletonToBones_heng_zhe_zhe_wan_gou',
  '横折弯钩': 'skeletonToBones_heng_zhe_wan_gou',
  '横弯钩': 'skeletonToBones_heng_wan_gou',
  '横折钩': 'skeletonToBones_heng_zhe_gou',
  '横撇': 'skeletonToBones_heng_pie',
  '横折折撇': 'skeletonToBones_heng_zhe_zhe_pie',
  '竖折折钩': 'skeletonToBones_shu_zhe_zhe_gou',
  '竖钩': 'skeletonToBones_shu_gou',
  '弯钩': 'skeletonToBones_wan_gou'
};

// 修复所有笔画模板文件中的函数名
const templatesDir = path.join(__dirname, '../src/fontEditor/templates');

Object.keys(strokeFunctionNames).forEach(strokeName => {
  const filePath = path.join(templatesDir, `${strokeName}.ts`);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const correctFunctionName = strokeFunctionNames[strokeName];
    
    // 查找并替换错误的函数名
    const patterns = [
      /export const skeletonToBones___ =/g,
      /export const skeletonToBones____ =/g,
      /export const skeletonToBones_____ =/g,
      /export const skeletonToBones______ =/g,
      /export const skeletonToBones___2 =/g,
      /const skeletonToBones___ =/g,
      /const skeletonToBones____ =/g,
      /const skeletonToBones_____ =/g,
      /const skeletonToBones______ =/g,
      /const skeletonToBones___2 =/g
    ];
    
    let hasChanges = false;
    patterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, `export const ${correctFunctionName} =`);
        hasChanges = true;
      }
    });
    
    // 替换函数调用中的名称
    const callPatterns = [
      /skeletonToBones___\(/g,
      /skeletonToBones____\(/g,
      /skeletonToBones_____\(/g,
      /skeletonToBones______\(/g,
      /skeletonToBones___2\(/g
    ];
    
    callPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, `${correctFunctionName}(`);
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed function name in ${strokeName}.ts: ${correctFunctionName}`);
    } else {
      console.log(`No changes needed in ${strokeName}.ts`);
    }
  } else {
    console.log(`File ${strokeName}.ts not found`);
  }
});

console.log('All skeletonToBones function names fixed!');
