const fs = require('fs');
const path = require('path');

// 所有笔画列表
const allStrokes = [
  '横', '竖', '撇', '捺', '点', '挑', '横钩', '平捺', '挑捺', '撇点', '撇挑', 
  '横撇弯钩', '斜钩', '竖折', '竖弯钩', '竖弯', '竖挑', '竖撇', '横折挑', 
  '横折2', '横折弯', '二横折', '横折', '横折折弯钩', '横折弯钩', '横弯钩', 
  '横折钩', '横撇', '横折折撇', '竖折折钩', '竖钩', '弯钩'
];

// 生成导入语句
const generateImports = () => {
  let imports = `import { applySkeletonTransformation } from "../../features/glyphSkeletonBind"
import { CustomGlyph } from "../programming/CustomGlyph"
import { bindSkeletonGlyph_heng, instanceBasicGlyph_heng, updateSkeletonListener_before_bind_heng, updateSkeletonListener_after_bind_heng } from "./横"
import { bindSkeletonGlyph_shu, instanceBasicGlyph_shu, updateSkeletonListener_before_bind_shu, updateSkeletonListener_after_bind_shu } from "./竖"
import { bindSkeletonGlyph_pie, instanceBasicGlyph_pie, updateSkeletonListener_before_bind_pie, updateSkeletonListener_after_bind_pie } from "./撇"
import { bindSkeletonGlyph_na, instanceBasicGlyph_na, updateSkeletonListener_before_bind_na, updateSkeletonListener_after_bind_na } from "./捺"
import { bindSkeletonGlyph_dian, instanceBasicGlyph_dian, updateSkeletonListener_before_bind_dian, updateSkeletonListener_after_bind_dian } from "./点"
import { bindSkeletonGlyph_tiao, instanceBasicGlyph_tiao, updateSkeletonListener_before_bind_tiao, updateSkeletonListener_after_bind_tiao } from "./挑"
import { bindSkeletonGlyph_heng_gou, instanceBasicGlyph_heng_gou, updateSkeletonListener_before_bind_heng_gou, updateSkeletonListener_after_bind_heng_gou } from "./横钩"`;

  // 添加其他笔画的导入
  const otherStrokes = allStrokes.slice(7); // 跳过已经导入的笔画
  otherStrokes.forEach(stroke => {
    const strokeName = stroke.replace(/[^\w]/g, '_');
    imports += `\nimport { bindSkeletonGlyph_${strokeName}, instanceBasicGlyph_${strokeName}, updateSkeletonListener_before_bind_${strokeName}, updateSkeletonListener_after_bind_${strokeName} } from "./${stroke}"`;
  });

  return imports;
};

// 生成strokeFnMap对象
const generateStrokeFnMap = () => {
  let mapContent = `const strokeFnMap = {`;

  allStrokes.forEach(stroke => {
    const strokeName = stroke.replace(/[^\w]/g, '_');
    mapContent += `
  '${stroke}': {
    instanceBasicGlyph: instanceBasicGlyph_${strokeName},
    bindSkeletonGlyph: bindSkeletonGlyph_${strokeName},
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_${strokeName},
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_${strokeName},
    updateSkeletonTransformation: updateSkeletonTransformation,
  },`;
  });

  mapContent += `
}`;

  return mapContent;
};

// 生成完整的文件内容
const generateFileContent = () => {
  return `${generateImports()}

const updateSkeletonTransformation = (glyph: CustomGlyph) => {
  const skeleton = glyph.getSkeleton()
  applySkeletonTransformation(glyph, skeleton)
}

${generateStrokeFnMap()}

export { strokeFnMap, updateSkeletonTransformation }`;
};

// 写入文件
const filePath = path.join(__dirname, '../src/fontEditor/templates/strokeFnMap.ts');
const content = generateFileContent();

fs.writeFileSync(filePath, content);
console.log('strokeFnMap.ts updated successfully with all 32 strokes!');
