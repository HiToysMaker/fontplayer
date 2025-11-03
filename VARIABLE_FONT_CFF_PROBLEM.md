# 可变字体CFF格式问题

## 🐛 问题根源

你的ttx错误：
```
KeyError: 'glyf'
```

**原因**：你的字体使用CFF表（PostScript轮廓），但gvar表需要glyf表（TrueType轮廓）！

## 📊 OpenType轮廓格式对比

### TrueType格式
- **轮廓表**: `glyf` (二次贝塞尔曲线)
- **位置表**: `loca`
- **可变表**: `gvar` ✅
- **优点**: 支持gvar可变字体
- **缺点**: 曲线质量略低于CFF

### CFF格式
- **轮廓表**: `CFF ` (三次贝塞尔曲线，PostScript)
- **可变表**: `CFF2` ❌ (需要实现)
- **优点**: 曲线质量高，文件更小
- **缺点**: 可变字体需要CFF2（复杂，尚未实现）

**你当前**: CFF格式 + gvar表 = **不兼容** ❌

## ✅ 解决方案

### 方案A：暂时禁用可变字体功能（快速）

```typescript
// 在 createVarFont 中，暂时不传 variants
const font = await create(fontCharacters, {
  familyName: selectedFile.value.name,
  styleName: 'Regular',
  unitsPerEm,
  ascender,
  descender,
  // variants: {  // ← 暂时注释掉
  //   axes: selectedFile.value.variants?.axes,
  //   instances: selectedFile.value.variants?.instances,
  //   combinations: combinations,
  // },
  tables: selectedFile.value.fontSettings.tables || null,
})
```

这样会生成普通的CFF字体（没有可变功能，但可以安装）。

### 方案B：使用TrueType格式（推荐）

修改字体生成流程，对于可变字体使用glyf/loca表：

#### 步骤1：修改font.ts

在`createFont`函数中，当检测到variants时，使用glyf而不是CFF：

```typescript
// 在 font.ts 的表创建部分
const tables: any = {
  'head': headTable,
  'hhea': hheaTable,
  'maxp': maxpTable,
  'OS/2': os2Table,
  'name': nameTable,
  'cmap': cmapTable,
  'post': postTable,
  'hmtx': hmtxTable,
}

// 根据是否为可变字体选择不同的轮廓格式
if (options.variants) {
  // 可变字体：使用TrueType格式 (glyf + loca + gvar)
  const glyfTable = createGlyfTable(characters)  // 需要实现
  const locaTable = createLocaTable(characters)  // 需要实现
  tables['glyf'] = glyfTable
  tables['loca'] = locaTable
  tables['fvar'] = createFvarTable(options.variants)
  tables['gvar'] = createGvarTable(options.variants, characters)
} else {
  // 普通字体：使用CFF格式（文件更小）
  tables['CFF '] = cffTable
}
```

#### 步骤2：实现CFF到TrueType的转换

这是关键部分。你需要：

1. **二次贝塞尔近似三次贝塞尔**
   - CFF使用三次贝塞尔曲线
   - TrueType使用二次贝塞尔曲线
   - 需要将三次转换为二次（有损转换）

2. **创建glyf表数据**
   ```typescript
   // 伪代码
   function createGlyfFromContours(contours) {
     return contours.map(contour => {
       return contour.map(segment => {
         if (segment.type === 'cubic') {
           // 将三次贝塞尔转换为多个二次贝塞尔
           return convertCubicToQuadratic(segment)
         } else if (segment.type === 'quadratic') {
           return segment
         } else {
           return segment // line
         }
       })
     })
   }
   ```

3. **使用现有的glyf.create方法**

### 方案C：实现CFF2（复杂，长期方案）

CFF2是专门为可变字体设计的CFF格式升级版本。优点：
- 保持CFF的高质量曲线
- 原生支持变体
- 文件更小

缺点：
- 实现非常复杂
- 需要深入理解CFF2规范

## 🎯 推荐行动方案

### 立即（临时解决）：

1. **测试普通字体**（不带variants）
   ```typescript
   // 暂时注释掉 variants 参数
   const font = await create(fontCharacters, {
     familyName: selectedFile.value.name,
     styleName: 'Regular',
     unitsPerEm,
     ascender,
     descender,
     // variants: ... // 暂时注释
   })
   ```

2. **验证字体正常工作**
   - 可以安装
   - 可以在PS中使用
   - 轮廓正确

### 接下来（实现可变字体）：

#### 选项1：简单但有损（推荐新手）
使用第三方库（如fontkit）将CFF转为TrueType：
```bash
npm install fontkit
```

然后在生成时自动转换。

#### 选项2：手动实现（推荐学习）
1. 研究二次贝塞尔近似三次贝塞尔的算法
2. 实现`convertCubicToQuadratic`函数
3. 修改字体生成流程使用glyf表

#### 选项3：长期方案
实现CFF2格式支持（需要几周时间）。

## 📚 参考资料

### 二次贝塞尔近似三次贝塞尔
- https://fontforge.org/docs/techref/bezier.html
- Paper: "Approximation of cubic Bezier curves by quadratic ones"

### OpenType规范
- TrueType Outlines: https://learn.microsoft.com/en-us/typography/opentype/spec/glyf
- CFF Format: https://learn.microsoft.com/en-us/typography/opentype/spec/cff
- CFF2 Format: https://learn.microsoft.com/en-us/typography/opentype/spec/cff2
- gvar Table: https://learn.microsoft.com/en-us/typography/opentype/spec/gvar

## 🧪 测试步骤

1. **暂时禁用variants**，生成普通字体
2. **验证普通字体正常工作**
3. **实现CFF→TrueType转换**
4. **启用variants**，生成可变字体
5. **测试可变字体**

## 当前状态

✅ fvar表：已实现，格式正确
✅ gvar表：已实现，但需要glyf表
❌ CFF → TrueType转换：**尚未实现**
❌ CFF2：**尚未实现**

**下一步**：实现CFF到TrueType的转换，或暂时使用普通字体模式。

