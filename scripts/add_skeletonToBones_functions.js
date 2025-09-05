const fs = require('fs');
const path = require('path');

// 定义所有笔画及其骨架结构
const strokeStructures = {
  '横': { type: 'line', joints: ['start', 'end'] },
  '竖': { type: 'line', joints: ['start', 'end'] },
  '撇': { type: 'curve', joints: ['start', 'bend', 'end'] },
  '捺': { type: 'curve', joints: ['start', 'bend', 'end'] },
  '点': { type: 'curve', joints: ['start', 'bend', 'end'] },
  '挑': { type: 'curve', joints: ['start', 'bend', 'end'] },
  '横钩': { type: 'composite', joints: ['heng_start', 'heng_end', 'gou_start', 'gou_end'] },
  '平捺': { type: 'curve', joints: ['start', 'bend', 'end'] },
  '挑捺': { type: 'composite', joints: ['tiao_start', 'tiao_bend', 'tiao_end', 'na_start', 'na_bend', 'na_end'] },
  '撇点': { type: 'composite', joints: ['pie_start', 'pie_bend', 'pie_end', 'dian_start', 'dian_bend', 'dian_end'] },
  '撇挑': { type: 'composite', joints: ['pie_start', 'pie_bend', 'pie_end', 'tiao_start', 'tiao_bend', 'tiao_end'] },
  '横撇弯钩': { type: 'composite', joints: ['heng_start', 'heng_end', 'pie_start', 'pie_bend', 'pie_end', 'wan_start', 'wan_bend', 'wan_end', 'gou_start', 'gou_end'] },
  '斜钩': { type: 'composite', joints: ['xie_start', 'xie_bend', 'xie_end', 'gou_start', 'gou_end'] },
  '竖折': { type: 'composite', joints: ['shu_start', 'shu_end', 'zhe_start', 'zhe_end'] },
  '竖弯钩': { type: 'composite', joints: ['shu_start', 'shu_end', 'wan_start', 'wan_bend', 'wan_end', 'gou_start', 'gou_end'] },
  '竖弯': { type: 'composite', joints: ['shu_start', 'shu_end', 'wan_start', 'wan_bend', 'wan_end'] },
  '竖挑': { type: 'composite', joints: ['shu_start', 'shu_end', 'tiao_start', 'tiao_bend', 'tiao_end'] },
  '竖撇': { type: 'composite', joints: ['shu_start', 'shu_end', 'pie_start', 'pie_bend', 'pie_end'] },
  '横折挑': { type: 'composite', joints: ['heng_start', 'heng_end', 'zhe_start', 'zhe_end', 'tiao_start', 'tiao_bend', 'tiao_end'] },
  '横折2': { type: 'composite', joints: ['heng_start', 'heng_end', 'zhe_start', 'zhe_end', 'zhe2_start', 'zhe2_end'] },
  '横折弯': { type: 'composite', joints: ['heng_start', 'heng_end', 'zhe_start', 'zhe_end', 'wan_start', 'wan_bend', 'wan_end'] },
  '二横折': { type: 'composite', joints: ['heng_start', 'heng_end', 'zhe_start', 'zhe_end', 'zhe2_start', 'zhe2_end'] },
  '横折': { type: 'composite', joints: ['heng_start', 'heng_end', 'zhe_start', 'zhe_end'] },
  '横折折弯钩': { type: 'composite', joints: ['heng_start', 'heng_end', 'zhe_start', 'zhe_end', 'zhe2_start', 'zhe2_end', 'wan_start', 'wan_bend', 'wan_end', 'gou_start', 'gou_end'] },
  '横折弯钩': { type: 'composite', joints: ['heng_start', 'heng_end', 'zhe_start', 'zhe_end', 'wan_start', 'wan_bend', 'wan_end', 'gou_start', 'gou_end'] },
  '横弯钩': { type: 'composite', joints: ['heng_start', 'heng_end', 'wan_start', 'wan_bend', 'wan_end', 'gou_start', 'gou_end'] },
  '横折钩': { type: 'composite', joints: ['heng_start', 'heng_end', 'zhe_start', 'zhe_end', 'gou_start', 'gou_end'] },
  '横撇': { type: 'composite', joints: ['heng_start', 'heng_end', 'pie_start', 'pie_bend', 'pie_end'] },
  '横折折撇': { type: 'composite', joints: ['heng_start', 'heng_end', 'zhe_start', 'zhe_end', 'zhe2_start', 'zhe2_end', 'pie_start', 'pie_bend', 'pie_end'] },
  '竖折折钩': { type: 'composite', joints: ['shu_start', 'shu_end', 'zhe_start', 'zhe_end', 'zhe2_start', 'zhe2_end', 'gou_start', 'gou_end'] },
  '竖钩': { type: 'composite', joints: ['shu_start', 'shu_end', 'gou_start', 'gou_end'] },
  '弯钩': { type: 'composite', joints: ['wan_start', 'wan_bend', 'wan_end', 'gou_start', 'gou_end'] }
};

// 生成skeletonToBones函数
function generateSkeletonToBonesFunction(strokeName, structure) {
  const strokeNameVar = strokeName.replace(/[^\w]/g, '_');
  
  if (structure.type === 'line') {
    return `// ${strokeName}的骨架转骨骼函数
export const skeletonToBones_${strokeNameVar} = (skeleton: any): any[] => {
  const bones: any[] = [];
  const { start, end } = skeleton;
  
  // 直线段
  const totalLength = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
  const segments = Math.max(3, Math.ceil(totalLength / 20));
  
  for (let i = 0; i < segments; i++) {
    const t1 = i / segments;
    const t2 = (i + 1) / segments;
    
    const p1 = {
      x: start.x + (end.x - start.x) * t1,
      y: start.y + (end.y - start.y) * t1
    };
    const p2 = {
      x: start.x + (end.x - start.x) * t2,
      y: start.y + (end.y - start.y) * t2
    };
    
    const bone = {
      id: \`segment_\${i}\`,
      start: p1,
      end: p2,
      length: Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2),
      uAxis: normalize({ x: p2.x - p1.x, y: p2.y - p1.y }),
      vAxis: normalize({ x: -(p2.y - p1.y), y: p2.x - p1.x }),
      children: [],
      bindMatrix: createIdentityMatrix(),
      currentMatrix: createIdentityMatrix()
    };
    
    if (i > 0) {
      bone.parent = \`segment_\${i - 1}\`;
      bones[i - 1].children.push(bone.id);
    }
    
    bones.push(bone);
  }
  
  return bones;
};`;
  } else if (structure.type === 'curve') {
    return `// ${strokeName}的骨架转骨骼函数
export const skeletonToBones_${strokeNameVar} = (skeleton: any): any[] => {
  const bones: any[] = [];
  const { start, bend, end } = skeleton;
  
  // 贝塞尔曲线段
  const segments = 8;
  for (let i = 0; i < segments; i++) {
    const t1 = i / segments;
    const t2 = (i + 1) / segments;
    
    const p1 = quadraticBezierPoint(start, bend, end, t1);
    const p2 = quadraticBezierPoint(start, bend, end, t2);
    
    const bone = {
      id: \`segment_\${i}\`,
      start: p1,
      end: p2,
      length: Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2),
      uAxis: normalize({ x: p2.x - p1.x, y: p2.y - p1.y }),
      vAxis: normalize({ x: -(p2.y - p1.y), y: p2.x - p1.x }),
      children: [],
      bindMatrix: createIdentityMatrix(),
      currentMatrix: createIdentityMatrix()
    };
    
    if (i > 0) {
      bone.parent = \`segment_\${i - 1}\`;
      bones[i - 1].children.push(bone.id);
    }
    
    bones.push(bone);
  }
  
  return bones;
};`;
  } else if (structure.type === 'composite') {
    // 为复合笔画生成更复杂的处理逻辑
    return `// ${strokeName}的骨架转骨骼函数
export const skeletonToBones_${strokeNameVar} = (skeleton: any): any[] => {
  const bones: any[] = [];
  // TODO: 实现复合笔画的骨架转骨骼逻辑
  // 当前返回空数组，需要根据具体笔画结构实现
  console.warn('skeletonToBones_${strokeNameVar} not implemented yet');
  return bones;
};`;
  }
}

// 辅助函数
const helperFunctions = `
// 辅助函数
const normalize = (vector: { x: number; y: number }) => {
  const length = Math.sqrt(vector.x ** 2 + vector.y ** 2);
  return length > 0 ? { x: vector.x / length, y: vector.y / length } : { x: 0, y: 0 };
};

const createIdentityMatrix = () => [1, 0, 0, 1, 0, 0];

const quadraticBezierPoint = (p0: any, p1: any, p2: any, t: number) => {
  const x = (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t ** 2 * p2.x;
  const y = (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t ** 2 * p2.y;
  return { x, y };
};
`;

// 为每个笔画文件添加skeletonToBones函数
const templatesDir = path.join(__dirname, '../src/fontEditor/templates');

Object.keys(strokeStructures).forEach(strokeName => {
  const filePath = path.join(templatesDir, `${strokeName}.ts`);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 检查是否已经有skeletonToBones函数
    if (!content.includes('skeletonToBones_')) {
      // 在import语句后添加skeletonToBones函数
      const importEndIndex = content.indexOf('import { updateSkeletonTransformation } from "./strokeFnMap";');
      if (importEndIndex !== -1) {
        const insertIndex = importEndIndex + content.substring(importEndIndex).indexOf(';') + 1;
        const skeletonToBonesFunction = generateSkeletonToBonesFunction(strokeName, strokeStructures[strokeName]);
        
        content = content.slice(0, insertIndex) + '\n' + skeletonToBonesFunction + '\n' + helperFunctions + '\n' + content.slice(insertIndex);
        
        fs.writeFileSync(filePath, content);
        console.log(`Added skeletonToBones function to ${strokeName}.ts`);
      }
    } else {
      console.log(`skeletonToBones function already exists in ${strokeName}.ts`);
    }
  } else {
    console.log(`File ${strokeName}.ts not found`);
  }
});

console.log('All skeletonToBones functions added successfully!');
