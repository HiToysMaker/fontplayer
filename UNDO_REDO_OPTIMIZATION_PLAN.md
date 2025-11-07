# 撤销/重做功能优化改进方案

> 创建时间：2025-11-06  
> 最后更新：2025-11-06（深度排查完成）  
> 当前实现：`src/fontEditor/stores/edit.ts`

---

## 🚨 关键发现摘要

### 已发现 Bug 总数：11 个

**极高优先级（必须立即修复）：4 个** ⚠️
- 🔴🔴 **Bug 4**: Polygon 状态保存代码不完整（语法错误）
- 🔴🔴 **Bug 5**: EditCharacter 状态恢复后未同步 `editCharacterFile.value`
- 🔴🔴 **Bug 6**: EditGlyph 状态恢复后未同步 `editGlyph.value`
- 🔴🔴 **Bug 8**: updateState 与新架构不兼容（架构变更导致）⭐ **新发现**

**高优先级（尽快修复）：4 个**
- 🔴 **Bug 1**: Ellipse 状态恢复时 X/Y 轴交换
- 🔴 **Bug 2**: Grid 状态恢复时访问路径错误
- 🔴 **Bug 3**: GlyphComponent 缺少状态恢复逻辑
- 🔴 **Bug 9**: 拖拽期间 undo/redo 导致状态混乱 ⭐ **新发现**

**中优先级（建议修复）：2 个**
- 🟡 **Bug 10**: saveState 可能保存临时变量而非最终状态 ⭐ **新发现**
- 🟡 **Bug 11**: 退出编辑界面时 undo 栈清空的设计问题 ⭐ **新发现**

**可选优化：1 个**
- 🟢 **Bug 7**: undo/redo 执行顺序可读性差（建议加注释）

### 架构变更影响分析 ⭐ **重要**

你提到的架构变更（clone 机制 + 临时变量）确实对 undo/redo 产生了严重影响：

1. **Bug 8 是核心问题**：`updateState` 与新架构不兼容
   - 修复了 Bug 5/6，实际上就是在适配新架构
   - Bug 8 是对这个问题的系统性总结
   
2. **Bug 9 是拖拽临时变量的副作用**：
   - 拖拽期间使用 `editCharacterFileOnDragging` 作为临时变量
   - 在拖拽过程中执行 undo/redo 会导致状态冲突
   
3. **Bug 10 是时序问题**：
   - 拖拽结束时需要先同步临时变量，再调用 saveState
   - 当前代码缺少 saveState 调用

### 缺失功能统计

**缺少 `saveState` 调用的关键操作：8 个**
- Select 工具：移动、缩放、旋转组件
- GlyphDragger 工具：拖拽组件、拖拽关键点（字符和字形编辑各 1 个）
- LayoutResizer 工具：调整布局（字符和字形编辑各 1 个）
- SkeletonDragger 工具：拖拽骨架

### 影响评估

**致命问题（功能完全无法使用）：**
- **Polygon 无法撤销**：Bug 4 - 语法错误导致状态保存失败
- **所有撤销界面不更新**：Bug 5/6/8 - 架构不兼容导致界面不刷新
- **拖拽时撤销混乱**：Bug 9 - 临时变量与撤销冲突

**严重问题（功能异常）：**
- **Ellipse 位置错误**：Bug 1 - X/Y 轴交换
- **Grid 设置崩溃**：Bug 2 - 访问路径错误
- **字形组件设置无法撤销**：Bug 3 - 缺少恢复逻辑

**功能缺失：**
- 所有 Select、GlyphDragger、LayoutResizer 操作无法撤销

---

## 目录

- [关键发现摘要](#关键发现摘要)
- [快速修复指引](#快速修复指引)
- [现有实现分析](#现有实现分析)
- [发现的问题](#发现的问题)
- [优化改进方案](#优化改进方案)
- [实施建议](#实施建议)
- [测试策略](#测试策略)
- [开发规范](#开发规范)
- [常见问题 FAQ](#常见问题-faq)
- [附录](#附录)

---

## 📋 快速修复指引

当你准备修复这些 bug 时，请按以下顺序进行：

### Step 1: 修复极高优先级 Bug（必须先修复，否则功能无法使用）

打开文件：`src/fontEditor/stores/edit.ts`

#### 1.1 修复 Bug 4（第 105 行）
```typescript
// 找到第 104-109 行
case StoreType.Polygon: {
  states.editingPolygon =   // ← 这一行不完整
  states.pointsPolygon = R.clone(pointsPolygon.value)
  // ...
}

// 修改为：
case StoreType.Polygon: {
  states.editingPolygon = R.clone(editingPolygon.value)  // ← 补全这一行
  states.pointsPolygon = R.clone(pointsPolygon.value)
  // ...
}
```

#### 1.2 修复 Bug 5（第 217-223 行）
```typescript
// 找到第 217-224 行
case StoreType.EditCharacter: {
  for (let i = 0; i < selectedFile.value.characterList.length; i++) {
    if (editCharacterFileUUID.value === selectedFile.value.characterList[i].uuid) {
      selectedFile.value.characterList[i] = record.states.editCharacterFile
      // ← 在这里添加下面这行
    }
  }
  break
}

// 修改为：
case StoreType.EditCharacter: {
  for (let i = 0; i < selectedFile.value.characterList.length; i++) {
    if (editCharacterFileUUID.value === selectedFile.value.characterList[i].uuid) {
      selectedFile.value.characterList[i] = record.states.editCharacterFile
      editCharacterFile.value = R.clone(record.states.editCharacterFile)  // ← 添加这一行
      break  // ← 添加这一行（优化性能）
    }
  }
  break
}
```

#### 1.3 修复 Bug 6（第 225-246 行）

**这个修复较复杂，需要完全替换整个 case 语句**

```typescript
// 找到第 225-247 行的整个 case StoreType.EditGlyph 块
// 完全替换为以下代码：

case StoreType.EditGlyph: {
  let updated = false
  
  // 检查 glyphs
  for (let i = 0; i < glyphs.value.length; i++) {
    if (glyphs.value[i].uuid === editGlyphUUID.value) {
      glyphs.value[i] = record.states.editGlyph
      editGlyph.value = R.clone(record.states.editGlyph)
      updated = true
      break
    }
  }
  
  // 检查 radical_glyphs
  if (!updated) {
    for (let i = 0; i < radical_glyphs.value.length; i++) {
      if (radical_glyphs.value[i].uuid === editGlyphUUID.value) {
        radical_glyphs.value[i] = record.states.editGlyph
        editGlyph.value = R.clone(record.states.editGlyph)
        updated = true
        break
      }
    }
  }
  
  // 检查 stroke_glyphs
  if (!updated) {
    for (let i = 0; i < stroke_glyphs.value.length; i++) {
      if (stroke_glyphs.value[i].uuid === editGlyphUUID.value) {
        stroke_glyphs.value[i] = record.states.editGlyph
        editGlyph.value = R.clone(record.states.editGlyph)
        updated = true
        break
      }
    }
  }
  
  // 检查 comp_glyphs
  if (!updated) {
    for (let i = 0; i < comp_glyphs.value.length; i++) {
      if (comp_glyphs.value[i].uuid === editGlyphUUID.value) {
        comp_glyphs.value[i] = record.states.editGlyph
        editGlyph.value = R.clone(record.states.editGlyph)
        break
      }
    }
  }
  
  break
}
```

---

### Step 2: 修复高优先级 Bug

继续在 `src/fontEditor/stores/edit.ts` 文件中修改：

#### 2.1 修复 Bug 1（第 282-283 行）
```typescript
// 找到第 280-287 行
case StoreType.Ellipse: {
  editingEllipse.value = record.states.editingEllipse
  ellipseX.value = record.states.ellipseY  // ← 错误：X 和 Y 反了
  ellipseY.value = record.states.ellipseX  // ← 错误：X 和 Y 反了
  // ...
}

// 修改为：
case StoreType.Ellipse: {
  editingEllipse.value = record.states.editingEllipse
  ellipseX.value = record.states.ellipseX  // ← 修复
  ellipseY.value = record.states.ellipseY  // ← 修复
  // ...
}
```

#### 2.2 修复 Bug 2（第 289-290 行）
```typescript
// 找到第 288-292 行
case StoreType.Grid: {
  gridSettings.value = record.gridSettings      // ← 错误：缺少 .states
  gridChanged.value = record.gridChanged        // ← 错误：缺少 .states
  break
}

// 修改为：
case StoreType.Grid: {
  gridSettings.value = record.states.gridSettings  // ← 修复
  gridChanged.value = record.states.gridChanged    // ← 修复
  break
}
```

#### 2.3 修复 Bug 3（在 updateState 函数的 switch 中添加）

在 `updateState()` 函数中，找到 `case StoreType.Grid` 的后面，添加新的 case：

```typescript
case StoreType.Grid: {
  gridSettings.value = record.states.gridSettings
  gridChanged.value = record.states.gridChanged
  break
}
// ← 在这里添加下面的代码
case StoreType.GlyphCompnent: {
  draggable.value = record.states.draggable
  dragOption.value = record.states.dragOption
  checkRefLines.value = record.states.checkRefLines
  checkJoints.value = record.states.checkJoints
  break
}
```

---

### Step 3: 测试验证

修复完成后，进行以下测试：

1. **测试 Polygon**：创建多边形 → 撤销 → 重做
2. **测试 EditCharacter**：编辑字符组件 → 撤销 → 重做 → 检查界面是否更新
3. **测试 EditGlyph**：编辑字形组件 → 撤销 → 重做 → 检查界面是否更新
4. **测试 Ellipse**：创建椭圆 → 移动到 (100, 200) → 撤销 → 检查是否回到原位置
5. **测试 Grid**：调整网格设置 → 撤销 → 重做

---

### Step 4: 补充缺失的 saveState 调用（可选，但建议完成）

详细实现请参考文档中的[方案二](#方案二补充关键操作的-savestate-调用优先级高)部分。

---

## 现有实现分析

### 当前架构

当前的 undo/redo 系统采用状态快照机制：

- **状态管理**：使用 `undoStack` 和 `redoStack` 两个栈来存储历史状态
- **状态类型**：通过 `StoreType` 枚举定义了多种状态类型（EditCharacter、EditGlyph、Tools、Pen、Polygon等）
- **操作类型**：通过 `OpType` 枚举区分 Undo 和 Redo 操作
- **核心方法**：
  - `saveState()`: 保存当前状态到栈中
  - `undo()`: 从栈中恢复上一个状态
  - `redo()`: 重做被撤销的操作
  - `updateState()`: 根据记录更新各个 store 的状态

### 生命周期管理

- **初始化**：在进入 `EditPanel.vue` 和 `GlyphEditPanel.vue` 时自动开始记录
- **清理**：在退出编辑界面时调用 `clearState()` 清空历史记录
- **快捷键**：支持 Cmd/Ctrl + Z 撤销，Cmd/Ctrl + Shift + Z 重做

---

## 发现的问题

### 1. 代码 Bug（紧急）

#### Bug 1: Ellipse 状态恢复时 X/Y 轴交换 🔴

**位置**：`src/fontEditor/stores/edit.ts` 第 280-286 行

**严重程度**：高 - 会导致椭圆组件撤销/重做时位置错误

```typescript
case StoreType.Ellipse: {
  editingEllipse.value = record.states.editingEllipse
  ellipseX.value = record.states.ellipseY  // ❌ BUG: 应该是 ellipseX
  ellipseY.value = record.states.ellipseX  // ❌ BUG: 应该是 ellipseY
  radiusX.value = record.states.radiusX
  radiusY.value = record.states.radiusY
  break
}
```

**修复**：
```typescript
case StoreType.Ellipse: {
  editingEllipse.value = record.states.editingEllipse
  ellipseX.value = record.states.ellipseX  // ✅ 修复
  ellipseY.value = record.states.ellipseY  // ✅ 修复
  radiusX.value = record.states.radiusX
  radiusY.value = record.states.radiusY
  break
}
```

---

#### Bug 2: Grid 状态恢复时访问路径错误 🔴

**位置**：`src/fontEditor/stores/edit.ts` 第 288-292 行

**严重程度**：高 - 会导致 Grid 设置撤销/重做时程序崩溃

```typescript
case StoreType.Grid: {
  gridSettings.value = record.gridSettings      // ❌ BUG: 缺少 .states
  gridChanged.value = record.gridChanged        // ❌ BUG: 缺少 .states
  break
}
```

**修复**：
```typescript
case StoreType.Grid: {
  gridSettings.value = record.states.gridSettings  // ✅ 修复
  gridChanged.value = record.states.gridChanged    // ✅ 修复
  break
}
```

---

#### Bug 3: GlyphComponent 缺少状态恢复逻辑 🔴

**位置**：`src/fontEditor/stores/edit.ts` `updateState()` 函数

**严重程度**：高 - 导致字形组件相关设置（draggable、checkJoints 等）无法撤销/重做

**问题**：`StoreType.GlyphCompnent` 在 `saveState()` 中保存了状态，但在 `updateState()` 中完全没有恢复逻辑

**修复**：在 `updateState()` 的 switch 语句中添加

```typescript
case StoreType.GlyphCompnent: {
  draggable.value = record.states.draggable
  dragOption.value = record.states.dragOption
  checkRefLines.value = record.states.checkRefLines
  checkJoints.value = record.states.checkJoints
  break
}
```

---

#### Bug 4: Polygon 状态保存时代码不完整 🔴🔴

**位置**：`src/fontEditor/stores/edit.ts` 第 104-109 行

**严重程度**：极高 - 这是语法错误，会导致 Polygon 状态保存失败

```typescript
case StoreType.Polygon: {
  states.editingPolygon =   // ❌ BUG: 这一行不完整！没有赋值
  states.pointsPolygon = R.clone(pointsPolygon.value)
  states.mousedownPolygon = mousedownPolygon.value
  states.mousemovePolygon = mousemovePolygon.value
  break
}
```

**修复**：
```typescript
case StoreType.Polygon: {
  states.editingPolygon = R.clone(editingPolygon.value)  // ✅ 修复：补全这一行
  states.pointsPolygon = R.clone(pointsPolygon.value)
  states.mousedownPolygon = mousedownPolygon.value
  states.mousemovePolygon = mousemovePolygon.value
  break
}
```

---

#### Bug 5: EditCharacter 状态恢复后未同步 editCharacterFile 🔴🔴🔴

**位置**：`src/fontEditor/stores/edit.ts` 第 217-224 行

**严重程度**：极高 - 导致撤销/重做后界面完全不更新

**根本原因**：由于你改动了 `editCharacterFile` 的实现机制，这个 bug 变得更加严重：

**新的实现机制**（你的改动）：
1. **进入编辑界面**：`editCharacterFile.value = R.clone(characterList[i])` - 创建独立副本
2. **编辑过程**：所有修改都在 `editCharacterFile` 上进行
3. **退出编辑界面**：`characterList[i] = R.clone(editCharacterFile.value)` - 写回列表

**为什么 Bug 5 更严重了**：

在这种机制下，`updateState` 只更新 `characterList[i]` 是**完全无效**的，因为：
- 用户正在编辑的是 `editCharacterFile`（独立副本）
- 界面渲染的是 `editCharacterFile` 的内容
- `characterList[i]` 要到退出编辑界面时才会被读取
- 所以撤销/重做后，用户看到的界面完全不会变化！

```typescript
// 当前错误的实现：
case StoreType.EditCharacter: {
  for (let i = 0; i < selectedFile.value.characterList.length; i++) {
    if (editCharacterFileUUID.value === selectedFile.value.characterList[i].uuid) {
      selectedFile.value.characterList[i] = record.states.editCharacterFile
      // ❌ 致命 BUG: 只更新了 characterList[i]，但用户看到的是 editCharacterFile！
      // ❌ editCharacterFile.value 没有被更新，所以界面不会响应！
    }
  }
  break
}
```

**修复**：
```typescript
case StoreType.EditCharacter: {
  for (let i = 0; i < selectedFile.value.characterList.length; i++) {
    if (editCharacterFileUUID.value === selectedFile.value.characterList[i].uuid) {
      selectedFile.value.characterList[i] = record.states.editCharacterFile
      editCharacterFile.value = R.clone(record.states.editCharacterFile)  // ✅ 关键修复：同步更新编辑中的副本
      break  // ✅ 优化：找到后可以退出循环
    }
  }
  break
}
```

---

#### Bug 6: EditGlyph 状态恢复后未同步 editGlyph 🔴🔴🔴

**位置**：`src/fontEditor/stores/edit.ts` 第 225-247 行

**严重程度**：极高 - 导致撤销/重做后界面完全不更新

**根本原因**：与 Bug 5 相同，`editGlyph` 也是独立副本机制，这个 bug 同样严重

**问题**：`updateState` 更新了各个字形数组中的数据，但没有同步更新 `editGlyph.value`，导致界面完全不响应

```typescript
case StoreType.EditGlyph: {
  for (let i = 0; i < glyphs.value.length; i++) {
    if (glyphs.value[i].uuid === editGlyphUUID.value) {
      glyphs.value[i] = record.states.editGlyph
      // ❌ BUG: 缺少同步！
    }
  }
  // ... 类似的循环检查 radical_glyphs、stroke_glyphs、comp_glyphs
  break
}
```

**修复**：
```typescript
case StoreType.EditGlyph: {
  let updated = false
  for (let i = 0; i < glyphs.value.length; i++) {
    if (glyphs.value[i].uuid === editGlyphUUID.value) {
      glyphs.value[i] = record.states.editGlyph
      editGlyph.value = R.clone(record.states.editGlyph)  // ✅ 修复：同步更新
      updated = true
      break
    }
  }
  if (!updated) {
    for (let i = 0; i < radical_glyphs.value.length; i++) {
      if (radical_glyphs.value[i].uuid === editGlyphUUID.value) {
        radical_glyphs.value[i] = record.states.editGlyph
        editGlyph.value = R.clone(record.states.editGlyph)  // ✅ 修复：同步更新
        updated = true
        break
      }
    }
  }
  if (!updated) {
    for (let i = 0; i < stroke_glyphs.value.length; i++) {
      if (stroke_glyphs.value[i].uuid === editGlyphUUID.value) {
        stroke_glyphs.value[i] = record.states.editGlyph
        editGlyph.value = R.clone(record.states.editGlyph)  // ✅ 修复：同步更新
        updated = true
        break
      }
    }
  }
  if (!updated) {
    for (let i = 0; i < comp_glyphs.value.length; i++) {
      if (comp_glyphs.value[i].uuid === editGlyphUUID.value) {
        comp_glyphs.value[i] = record.states.editGlyph
        editGlyph.value = R.clone(record.states.editGlyph)  // ✅ 修复：同步更新
        break
      }
    }
  }
  break
}
```

---

#### Bug 7: undo/redo 执行顺序错误 🟡

**位置**：`src/fontEditor/stores/edit.ts` `undo()` 和 `redo()` 函数

**严重程度**：中 - 可能导致状态不一致

**问题**：在 `undo()` 中，先从栈中弹出，再保存到 redo 栈，最后才 `updateState`。如果 `updateState` 过程中保存的状态是**恢复后的状态**，那么 redo 栈中保存的就不是正确的状态。

```typescript
// undo() 中的逻辑：
undoStack.pop()                                                    // 1. 先弹出
saveState(record.opName, record.opStores, OpType.Redo, record.options)  // 2. 再保存（此时保存的是什么状态？）
updateState(record)                                                // 3. 最后恢复
```

**分析**：
- `saveState` 会读取当前状态（如 `editCharacterFile.value`）
- 此时 `editCharacterFile.value` 还没有被 `updateState` 修改
- 所以保存到 redo 栈的是**撤销前的状态**，这是正确的

**结论**：仔细分析后发现这个顺序是正确的，**不是 bug**。但为了代码可读性，建议添加注释说明。

**建议修改**：
```typescript
const undo = () => {
  if (!undoStack.length) return
  const record = undoStack[undoStack.length - 1]
  if (record.options.undoTip) {
    // ... 确认框逻辑 ...
  } else {
    undoStack.pop()
    // 保存当前状态到 redo 栈（撤销前的状态）
    saveState(record.opName, record.opStores, OpType.Redo, record.options)
    // 恢复到历史状态
    updateState(record)
  }
}
```

---

### Bug 总结清单

| Bug ID | 位置 | 严重程度 | 简述 | 影响范围 |
|--------|------|----------|------|---------|
| Bug 1 | `edit.ts:282-283` | 🔴 高 | Ellipse X/Y 轴交换 | 椭圆组件撤销/重做位置错误 |
| Bug 2 | `edit.ts:289-290` | 🔴 高 | Grid 访问路径错误 | Grid 撤销/重做崩溃 |
| Bug 3 | `edit.ts:updateState` | 🔴 高 | GlyphComponent 缺少恢复逻辑 | 字形组件设置无法撤销 |
| Bug 4 | `edit.ts:105` | 🔴🔴 极高 | Polygon 代码不完整 | Polygon 状态保存失败 |
| Bug 5 | `edit.ts:217-223` | 🔴🔴 极高 | EditCharacter 未同步 | 撤销/重做后界面不更新 |
| Bug 6 | `edit.ts:225-246` | 🔴🔴 极高 | EditGlyph 未同步 | 撤销/重做后界面不更新 |
| Bug 7 | `edit.ts:undo/redo` | 🟡 建议优化 | 执行顺序可读性差 | 无实际影响，建议加注释 |
| **Bug 8** | `glyphDragger.ts` | 🔴🔴🔴 **致命** | **临时变量模式导致的时机错误** | **所有拖拽操作无法撤销** |

**修复优先级**：
1. **最高优先级**（致命）：**Bug 8** - 架构层面的问题，导致所有拖拽操作无法撤销
2. **立即修复**（极高）：Bug 4, 5, 6 - 这些会导致功能完全无法正常工作
3. **尽快修复**（高）：Bug 1, 2, 3 - 会导致特定功能异常
4. **建议优化**（中）：Bug 7 - 不影响功能，但影响代码可读性

**⚠️ 重要说明**：Bug 8 是由你提到的"第二次重构"（使用临时变量模式）引入的架构问题，必须最优先修复！

---

### Bug 8: 临时变量模式导致的 saveState 时机错误 🔴🔴🔴

**位置**：
- `src/fontEditor/tools/glyphDragger.ts` `onMouseDown` 和 `onMouseUp`
- `src/fontEditor/tools/glyphDragger_glyph.ts` `onMouseDown` 和 `onMouseUp`

**严重程度**：极高 - 这是架构层面的问题

**问题描述**：

你提到的"进入编辑界面时 clone，退出时写入"以及"拖拽时使用临时变量"的改进，引入了一个**致命的时机问题**：

#### 当前拖拽流程：

```typescript
// onMouseDown (第 245 行)
editCharacterFileOnDragging.value = R.clone(editCharacterFile.value)  // 1. 创建临时副本

// onMouseMove (拖拽过程)
editCharacterFileOnDragging.value.components[i].ox = _ox + dx  // 2. 修改临时副本

// onMouseUp (第 446-448 行)
editCharacterFile.value.glyph_script = R.clone(editCharacterFileOnDragging.value.glyph_script)
editCharacterFile.value.components = R.clone(editCharacterFileOnDragging.value.components)
editCharacterFileOnDragging.value = null  // 3. 写回并清空
// ❌ 完全没有调用 saveState！
```

#### 问题分析：

1. **完全缺少 saveState**：当前代码在拖拽操作的整个流程中**完全没有调用 saveState**，导致拖拽操作无法撤销/重做。

2. **如果在 onMouseUp 后添加 saveState，会保存错误的状态**：
   ```typescript
   // ❌ 错误的做法
   onMouseUp() {
     editCharacterFile.value.components = R.clone(editCharacterFileOnDragging.value.components)
     saveState('拖拽字形组件', [StoreType.EditCharacter], OpType.Undo)
     // 此时保存的是修改后的状态，无法撤销！
   }
   ```

3. **正确的做法应该是在 onMouseDown 时保存**：
   ```typescript
   // ✅ 正确的做法
   onMouseDown() {
     // 在创建临时副本之前，保存当前状态
     if (draggable.value) {
       saveState('拖拽字形组件', [StoreType.EditCharacter, StoreType.GlyphCompnent], OpType.Undo)
     }
     editCharacterFileOnDragging.value = R.clone(editCharacterFile.value)
     // ...
   }
   ```

#### 为什么这是极高优先级？

- **影响范围**：所有字形组件的拖拽操作（包括拖拽组件位置、拖拽关键点、拖拽骨架）
- **用户体验**：用户无法撤销任何拖拽操作，这是编辑器的核心功能
- **数据丢失风险**：误操作后无法恢复

#### 同样的问题存在于：

1. `glyphDragger.ts` - 字符编辑中的字形拖拽
2. `glyphDragger_glyph.ts` - 字形编辑中的字形拖拽
3. 可能还有其他使用类似"临时变量"模式的工具

#### 根本原因分析：

这是由于两次重构导致的：
1. **第一次重构**：实现了初步的 undo/redo 功能
2. **第二次重构**：改进了编辑流程，使用"进入时 clone，退出时写入"和临时变量模式
3. **问题**：第二次重构没有考虑到第一次重构的 saveState 调用时机，导致两个系统不兼容

---

### 修复方案：

#### 方案 A：在 onMouseDown 时保存状态（推荐）

**优点**：
- 符合 undo/redo 的语义（撤销应该回到操作前的状态）
- 实现简单，只需在一个地方添加代码

**缺点**：
- 即使用户只是点击没有拖拽，也会保存状态（可优化）

**实现**：

```typescript
const onMouseDown = (e: MouseEvent) => {
  if (!draggable.value) return
  
  // ✅ 在创建临时副本前保存当前状态
  saveState('拖拽字形组件', [
    StoreType.EditCharacter,  // 或 StoreType.EditGlyph
    StoreType.GlyphCompnent
  ], OpType.Undo)
  
  editCharacterFileOnDragging.value = R.clone(editCharacterFile.value)
  // ... 其余代码
}

const onMouseUp = (e: MouseEvent) => {
  // ... 现有代码，不需要修改
  editCharacterFile.value.glyph_script = R.clone(editCharacterFileOnDragging.value.glyph_script)
  editCharacterFile.value.components = R.clone(editCharacterFileOnDragging.value.components)
  editCharacterFileOnDragging.value = null
}
```

#### 方案 B：只在实际发生拖拽时保存（优化版）

**优点**：
- 只在真正发生拖拽时保存，避免无意义的历史记录
- 用户体验更好

**缺点**：
- 实现稍复杂，需要在 onMouseUp 时判断

**实现**：

```typescript
const onMouseDown = (e: MouseEvent) => {
  if (!draggable.value) return
  // 不在这里保存状态
  editCharacterFileOnDragging.value = R.clone(editCharacterFile.value)
  // ... 其余代码
}

const onMouseUp = (e: MouseEvent) => {
  // ... 现有代码
  
  if (mousemove && mousedown) {  // 只有真正发生了拖拽
    // ⚠️ 这里有个技巧：需要保存"拖拽前"的状态，而不是"拖拽后"的状态
    // 我们可以在 onMouseDown 时临时保存一份原始状态
    // 或者使用 editCharacterFileOnDragging.value 保存的就是原始状态
    
    // 但是！这样做有问题：
    // 1. editCharacterFileOnDragging 在 onMouseDown 时就已经是 clone 后的了
    // 2. 我们需要在拖拽前保存一份"真正的"原始状态
    
    // 所以这个方案需要修改架构：
    const originalState = savedOriginalState  // 需要在 onMouseDown 时额外保存
    saveState('拖拽字形组件', [...], OpType.Undo, {
      editCharacterFile: originalState
    })
  }
  
  editCharacterFile.value.glyph_script = R.clone(editCharacterFileOnDragging.value.glyph_script)
  editCharacterFile.value.components = R.clone(editCharacterFileOnDragging.value.components)
  editCharacterFileOnDragging.value = null
}
```

**方案 B 的完整实现**：

```typescript
let savedOriginalState = null  // 在函数外部声明

const onMouseDown = (e: MouseEvent) => {
  if (!draggable.value) return
  
  // 保存真正的原始状态
  savedOriginalState = R.clone(editCharacterFile.value)
  
  editCharacterFileOnDragging.value = R.clone(editCharacterFile.value)
  // ... 其余代码
}

const onMouseUp = (e: MouseEvent) => {
  // ... 现有代码
  
  if (mousemove && mousedown && savedOriginalState) {
    // 使用保存的原始状态
    saveState('拖拽字形组件', [
      StoreType.EditCharacter,
      StoreType.GlyphCompnent
    ], OpType.Undo, {
      editCharacterFile: savedOriginalState
    })
  }
  
  savedOriginalState = null  // 清空
  editCharacterFile.value.glyph_script = R.clone(editCharacterFileOnDragging.value.glyph_script)
  editCharacterFile.value.components = R.clone(editCharacterFileOnDragging.value.components)
  editCharacterFileOnDragging.value = null
}
```

#### 推荐：使用方案 A

虽然方案 B 更优雅，但方案 A 更简单可靠。可以先用方案 A 快速修复，后续有需要再优化为方案 B。

---

### 2. 架构变更导致的新问题 🔴🔴🔴

#### 问题背景

你在初步实现 undo/redo 后，对编辑逻辑进行了重构：

1. **进入编辑界面**：通过 `setEditCharacterFileByUUID()` clone 当前字符到 `editCharacterFile.value`
2. **退出编辑界面**：通过 `updateCharacterListFromEditFile()` 将 `editCharacterFile.value` 写回 list
3. **拖拽字形组件**：使用 `editCharacterFileOnDragging` 作为临时变量

这种架构变更虽然优化了编辑性能，但对 undo/redo 系统产生了严重影响。

---

#### Bug 8: updateState 与新架构不兼容 🔴🔴🔴

**位置**：`src/fontEditor/stores/edit.ts` `updateState()` 函数

**严重程度**：极高 - 导致整个 undo/redo 系统与新架构不兼容

**问题分析**：

当前的 `updateState` 实现假设 `editCharacterFile` 是 `selectedFile.value.characterList[i]` 的引用：

```typescript
case StoreType.EditCharacter: {
  for (let i = 0; i < selectedFile.value.characterList.length; i++) {
    if (editCharacterFileUUID.value === selectedFile.value.characterList[i].uuid) {
      selectedFile.value.characterList[i] = record.states.editCharacterFile
      // 问题：只更新了 list，没有更新 editCharacterFile.value
    }
  }
  break
}
```

但现在的架构中：
- `editCharacterFile.value` 是通过 `R.clone(character)` 创建的**独立副本**
- 更新 `characterList[i]` 不会影响 `editCharacterFile.value`
- 导致 undo/redo 后，**list 数据已更新，但编辑界面显示的还是旧数据**

**影响范围**：
- 在编辑界面中的所有 undo/redo 操作都会失效
- 撤销/重做后界面不更新，用户看不到任何变化
- 退出编辑界面时，会将错误的 `editCharacterFile` 写回 list，覆盖正确的数据

**修复方案**：

在 `updateState` 中同步更新 `editCharacterFile.value`：

```typescript
case StoreType.EditCharacter: {
  for (let i = 0; i < selectedFile.value.characterList.length; i++) {
    if (editCharacterFileUUID.value === selectedFile.value.characterList[i].uuid) {
      selectedFile.value.characterList[i] = record.states.editCharacterFile
      editCharacterFile.value = R.clone(record.states.editCharacterFile)  // ✅ 关键：同步更新
      break
    }
  }
  break
}
```

**同样的问题也存在于 EditGlyph**（Bug 6 已经涵盖了这个修复）。

---

#### Bug 9: 拖拽期间 undo/redo 会导致状态混乱 🔴

**位置**：`src/fontEditor/tools/glyphDragger.ts` 和 `glyphDragger_glyph.ts`

**严重程度**：高 - 在拖拽期间执行撤销会导致数据不一致

**问题分析**：

拖拽字形组件时的流程：
1. `onMouseDown`: `editCharacterFileOnDragging = R.clone(editCharacterFile.value)`
2. `onMouseMove`: 修改 `editCharacterFileOnDragging` 中的组件位置
3. `onMouseUp`: `editCharacterFile.value = editCharacterFileOnDragging`

如果在拖拽过程中（mouseDown 后、mouseUp 前）用户按下 Cmd+Z：
- `undo()` 会恢复 `editCharacterFile.value` 到之前的状态
- 但 `editCharacterFileOnDragging` 还保留着拖拽的修改
- `onMouseUp` 时会将 `editCharacterFileOnDragging` 覆盖到 `editCharacterFile`
- **结果：撤销操作被拖拽操作覆盖，撤销失效**

**影响场景**：
- 用户在拖拽字形组件时，突然想撤销上一个操作
- 按下 Cmd+Z 后，上一个操作确实撤销了
- 但鼠标松开后，撤销的结果被当前拖拽覆盖

**修复方案**：

方案 A：禁止拖拽期间 undo/redo

```typescript
// 在 onMouseDown 中
const onMouseDown = (e: MouseEvent) => {
  // ...
  editing.value = true  // 设置拖拽状态
}

// 在 onMouseUp 中
const onMouseUp = (e: MouseEvent) => {
  // ...
  editing.value = false  // 清除拖拽状态
}

// 在 edit.ts 的 undo/redo 中检查
const undo = () => {
  if (editing.value) {
    ElMessage.warning('拖拽操作进行中，无法撤销')
    return
  }
  // ... 正常撤销逻辑
}
```

方案 B：拖拽期间 undo/redo 时取消拖拽（推荐）

```typescript
// 在 edit.ts 中
const undo = () => {
  // 如果正在拖拽，取消拖拽操作
  if (editCharacterFileOnDragging.value) {
    editCharacterFileOnDragging.value = null
    emitter.emit('cancelDragging')  // 通知取消拖拽
  }
  // ... 正常撤销逻辑
}
```

然后在 `glyphDragger.ts` 中监听取消事件：

```typescript
emitter.on('cancelDragging', () => {
  mousedown = false
  mousemove = false
  editCharacterFileOnDragging.value = null
  // 清理拖拽状态
})
```

---

#### Bug 10: saveState 保存的可能是临时变量而非最终状态 🟡

**位置**：所有调用 `saveState` 的地方

**严重程度**：中 - 可能导致保存的状态不正确

**问题分析**：

由于现在使用了 `editCharacterFileOnDragging` 作为拖拽时的临时变量，在拖拽结束时：

```typescript
onMouseUp: {
  // 先将临时变量的修改同步到正式变量
  editCharacterFile.value.glyph_script = R.clone(editCharacterFileOnDragging.value.glyph_script)
  editCharacterFile.value.components = R.clone(editCharacterFileOnDragging.value.components)
  
  // 然后才应该调用 saveState
  saveState('拖拽字形组件', [StoreType.EditCharacter], OpType.Undo)
}
```

但如果 `saveState` 调用时机不对（在同步之前），可能会保存错误的状态。

**当前代码检查**：

在 `glyphDragger.ts:446-448` 中：
```typescript
editCharacterFile.value.glyph_script = R.clone(editCharacterFileOnDragging.value.glyph_script)
editCharacterFile.value.components = R.clone(editCharacterFileOnDragging.value.components)
editCharacterFileOnDragging.value = null
// ❌ 这里没有调用 saveState！
```

**修复**：在同步后添加 `saveState` 调用（这属于 Bug "缺少 saveState 调用"的一部分）。

---

#### Bug 11: 退出编辑界面时 undo 栈没有清空 🟡

**位置**：`EditPanel.vue` 和 `GlyphEditPanel.vue` 的 `onUnmounted`

**严重程度**：中 - 可能导致跨编辑会话的撤销混乱

**问题分析**：

当前逻辑：
```typescript
onUnmounted(() => {
  clearState()  // 清空 undo/redo 栈
  updateCharacterListFromEditFile()  // 将 editCharacterFile 写回 list
})
```

顺序是对的，但存在一个时序问题：

1. 用户在编辑界面 A 进行了操作 X，保存到 undo 栈
2. 用户退出编辑界面（触发 `updateCharacterListFromEditFile`，写回 list）
3. 清空 undo 栈（此时 list 已经包含了操作 X 的结果）
4. 用户再次进入编辑界面 A（从 list clone 到 editCharacterFile）
5. 用户进行操作 Y，保存到 undo 栈
6. 用户按 Cmd+Z 撤销，只能撤销操作 Y，无法撤销操作 X

这是**符合预期的行为**，因为每次进入编辑界面都是新的编辑会话。

但如果用户期望：
- 进入编辑界面后，能看到之前的 undo 历史
- 能够撤销上次编辑会话的操作

那就需要**持久化 undo 栈**。

**建议**：
- 当前行为：每次进入编辑界面都清空历史，符合大多数编辑器的行为
- 如需改进：可以为每个字符/字形维护独立的 undo 栈，并持久化到本地

**修复**：无需修复，这是设计问题，不是 bug。但建议在文档中说明这个行为。

---

### 3. 缺少 saveState 调用的关键操作

通过代码检索，发现以下重要操作**没有**调用 `saveState`：

#### 已调用 saveState 的操作 ✅

- ✅ Pen 工具：创建锚点
- ✅ Rectangle 工具：创建矩形
- ✅ Ellipse 工具：创建椭圆
- ✅ Polygon 工具：创建多边形
- ✅ 参数面板：编辑各类组件参数
- ✅ 工具切换
- ✅ 布局编辑：应用/重置布局
- ✅ 图片识别

#### 缺少 saveState 的操作 ❌

| 操作类型 | 位置 | 调用时机 | 需要的 StoreType |
|---------|------|---------|-----------------|
| **Select 移动组件** | `tools/select/select.ts` | `onMouseUp` 且 `mousemove=true` | `EditCharacter` 或 `EditGlyph` |
| **Select 缩放组件** | `tools/select/select.ts` | `onMouseUp` 且进行了缩放 | `EditCharacter` 或 `EditGlyph` |
| **Select 旋转组件** | `tools/select/select.ts` | `onMouseUp` 且进行了旋转 | `EditCharacter` 或 `EditGlyph` |
| **GlyphDragger 拖拽组件** | `tools/glyphDragger.ts` | `onMouseUp` 且 `mousemove=true` | `EditCharacter` + `GlyphCompnent` |
| **GlyphDragger 拖拽关键点** | `tools/glyphDragger.ts` | `onMouseUp` 且拖拽了关键点 | `EditCharacter` + `GlyphCompnent` |
| **GlyphDragger_glyph 拖拽** | `tools/glyphDragger_glyph.ts` | `onMouseUp` 且 `mousemove=true` | `EditGlyph` + `GlyphCompnent` |
| **SkeletonDragger 拖拽骨架** | `tools/skeletonDragger.ts` | `onMouseUp` 且进行了拖拽 | `EditGlyph` |
| **LayoutResizer 调整布局** | `tools/glyphLayoutResizer.ts` | `onMouseUp` 且调整了布局 | `EditCharacter` 或 `EditGlyph` |

---

### 3. 架构问题

#### 3.1 性能问题

- **深拷贝开销大**：每次 `saveState` 都使用 `R.clone` 深拷贝整个对象
- **无操作合并**：连续调整参数会产生大量历史记录（如拖动滑块）
- **无历史限制**：历史记录无上限，可能导致内存占用过大

#### 3.2 可维护性问题

- **调用分散**：`saveState` 调用分散在各个文件中，难以统一管理
- **缺乏文档**：没有使用指南，开发者不清楚何时应该调用 `saveState`
- **缺乏追踪**：没有调试工具，难以排查 undo/redo 相关问题

---

## 优化改进方案

### 方案一：修复现有 Bug（优先级：🔴 紧急）

**目标**：修复上述 3 个代码 bug，确保基本功能正确

**实施步骤**：

1. 修复 `ellipseX/ellipseY` 赋值错误
2. 修复 `gridSettings/gridChanged` 访问路径错误
3. 补充 `StoreType.GlyphCompnent` 的 `updateState` 逻辑

**代码位置**：`src/fontEditor/stores/edit.ts`

**预计工作量**：0.5 小时

---

### 方案二：补充关键操作的 saveState 调用（优先级：🔴 高）

**目标**：为所有缺少 saveState 的关键操作添加状态保存

#### 2.1 Select 工具补充

**文件**：`src/fontEditor/tools/select/select.ts`

**实施要点**：

```typescript
const onMouseUp = (e: MouseEvent) => {
  // ... 现有逻辑 ...
  
  if (mousemove && mousedown) {
    // 判断进行了何种操作
    const operationType = selectControl.value ? 
      (selectControl.value.includes('scale') ? '缩放组件' : 
       selectControl.value.includes('rotate') ? '旋转组件' : '移动组件') 
      : '移动组件'
    
    // 根据当前编辑状态选择 StoreType
    const storeType = editStatus.value === Status.Character ? 
      StoreType.EditCharacter : StoreType.EditGlyph
    
    saveState(operationType, [storeType], OpType.Undo)
  }
  
  // ... 清理逻辑 ...
}
```

#### 2.2 GlyphDragger 工具补充

**文件**：`src/fontEditor/tools/glyphDragger.ts` 和 `glyphDragger_glyph.ts`

**实施要点**：

```typescript
const onMouseUp = (e: MouseEvent) => {
  // ... 现有逻辑 ...
  
  if (mousemove && mousedown) {
    addScript(editGlyph, coords)
    
    // 添加状态保存
    const operationName = draggingJoint.value ? '拖拽字形关键点' : '拖拽字形组件'
    const storeTypes = [
      editStatus.value === Status.Character ? StoreType.EditCharacter : StoreType.EditGlyph,
      StoreType.GlyphCompnent
    ]
    
    saveState(operationName, storeTypes, OpType.Undo)
  }
  
  // ... 清理逻辑 ...
}
```

#### 2.3 LayoutResizer 工具补充

**文件**：`src/fontEditor/tools/glyphLayoutResizer.ts` 和 `glyphLayoutResizer_glyph.ts`

**实施要点**：

```typescript
const onMouseUp = (e: MouseEvent) => {
  // ... 现有逻辑 ...
  
  if (mousemove && mousedown) {
    const storeType = editStatus.value === Status.Character ? 
      StoreType.EditCharacter : StoreType.EditGlyph
    
    saveState('调整组件布局', [storeType], OpType.Undo)
  }
  
  // ... 清理逻辑 ...
}
```

**预计工作量**：3-4 小时

---

### 方案三：实现操作合并机制（优先级：🟡 中）

**目标**：避免连续的相同操作产生过多历史记录

#### 3.1 增加操作分类

**文件**：`src/fontEditor/stores/edit.ts`

```typescript
enum OpCategory {
  Create,      // 创建操作（如新建组件）- 不可合并
  Modify,      // 修改操作（如调整参数）- 可合并
  Delete,      // 删除操作 - 不可合并
  Transform,   // 变换操作（移动/缩放/旋转）- 可合并
  Script,      // 脚本编辑 - 可合并
}
```

#### 3.2 扩展 OpOption 接口

```typescript
interface OpOption {
  newRecord?: boolean;
  undoTip?: string;
  redoTip?: string;
  category?: OpCategory;        // 新增：操作分类
  mergeTimeWindow?: number;     // 新增：可合并的时间窗口（毫秒）
  [key: string]: any;
}
```

#### 3.3 实现智能合并逻辑

```typescript
const saveState = (
  opName: String, 
  opStores: StoreType[], 
  opType: OpType, 
  options: OpOption = {
    newRecord: true,
    undoTip: '',
    redoTip: '',
    category: OpCategory.Modify,
    mergeTimeWindow: 1000,
  }
) => {
  let stack = []
  if (opType === OpType.Redo) {
    stack = redoStack
  } else if (opType === OpType.Undo) {
    redoStack.length = 0
    stack = undoStack
  }
  
  // 检查是否可以与上一条记录合并
  const canMerge = () => {
    if (!stack.length) return false
    if (options.category === OpCategory.Create || options.category === OpCategory.Delete) {
      return false  // 创建和删除操作不可合并
    }
    
    const lastRecord = stack[stack.length - 1]
    if (lastRecord.opName !== opName) return false
    if (lastRecord.options.category !== options.category) return false
    
    const timeWindow = options.mergeTimeWindow || 1000
    const timeDiff = Date.now() - (lastRecord.timestamp || 0)
    
    return timeDiff < timeWindow
  }
  
  let states: any = {}
  // ... 状态收集逻辑保持不变 ...
  
  if (canMerge()) {
    // 更新最后一条记录（合并操作）
    const record = stack[stack.length - 1]
    record.states = states  // 更新为最新状态
    record.timestamp = Date.now()
    record.options = options
  } else {
    // 添加新记录
    stack.push({
      opName,
      opStores,
      states,
      options,
      timestamp: Date.now()
    })
  }
}
```

#### 3.4 使用示例

```typescript
// 参数面板的实时调整 - 1秒内的连续调整会被合并
saveState('编辑字形参数', [StoreType.EditGlyph], OpType.Undo, {
  category: OpCategory.Modify,
  mergeTimeWindow: 1000
})

// 创建新组件 - 不会被合并
saveState('创建钢笔组件', [StoreType.EditCharacter], OpType.Undo, {
  category: OpCategory.Create
})
```

**预计工作量**：2-3 小时

---

### 方案四：优化性能（优先级：🟡 中）

#### 4.1 使用结构化克隆代替 Ramda.clone

**问题**：`R.clone` 性能不如原生方法

**解决方案**：

```typescript
// 使用原生 structuredClone（Chrome 98+, Safari 15.4+）
states.editCharacterFile = structuredClone(editCharacterFile.value)

// 如果需要兼容旧版浏览器，可以添加 polyfill
if (typeof structuredClone === 'undefined') {
  window.structuredClone = (obj) => JSON.parse(JSON.stringify(obj))
}
```

**注意**：`structuredClone` 不能克隆函数、Symbol 等特殊对象，但对于普通数据结构足够用。

#### 4.2 限制历史记录数量

```typescript
const MAX_UNDO_STACK_SIZE = 50  // 最多保留 50 条历史记录

const saveState = (...) => {
  // ...
  
  // 添加记录前检查栈大小
  if (stack.length >= MAX_UNDO_STACK_SIZE) {
    stack.shift()  // 移除最旧的记录
  }
  
  stack.push(record)
}
```

#### 4.3 只保存变更的字段（进阶优化）

**适用场景**：当对象很大但只修改了少量字段时

**实现思路**：

```typescript
// 保存变更前后的 diff，而不是完整状态
interface StateDiff {
  path: string[]      // 变更路径，如 ['components', 0, 'ox']
  before: any         // 变更前的值
  after: any          // 变更后的值
}

// 状态保存
const diffs: StateDiff[] = [
  { path: ['components', 0, 'ox'], before: 100, after: 150 },
  { path: ['components', 0, 'oy'], before: 200, after: 250 }
]
```

**注意**：这种方式实现复杂，建议在性能成为瓶颈时再考虑。

**预计工作量**：1-2 小时（不含 diff-based 优化）

---

### 方案五：增强调试和追踪（优先级：🟢 低）

**目标**：提供开发环境的调试工具

#### 5.1 操作日志

```typescript
const saveState = (...) => {
  // ...
  
  if (import.meta.env.DEV) {
    console.log(`[Undo/Redo] ${opType === OpType.Undo ? 'Save' : 'Redo'}: ${opName}`, {
      stores: opStores.map(s => StoreType[s]),
      stackSize: stack.length,
      canMerge: canMerge(),
      timestamp: new Date().toLocaleTimeString()
    })
  }
}
```

#### 5.2 全局调试接口

```typescript
if (import.meta.env.DEV) {
  // 暴露内部状态到全局
  window.__undoStack = undoStack
  window.__redoStack = redoStack
  
  // 显示历史记录列表
  window.__showHistory = () => {
    console.group('Undo/Redo History')
    console.log('Undo Stack:', undoStack.map((r, i) => ({
      index: i,
      operation: r.opName,
      time: new Date(r.timestamp).toLocaleTimeString(),
      stores: r.opStores.map(s => StoreType[s])
    })))
    console.log('Redo Stack:', redoStack.map((r, i) => ({
      index: i,
      operation: r.opName,
      time: new Date(r.timestamp).toLocaleTimeString()
    })))
    console.groupEnd()
  }
  
  // 清空历史记录
  window.__clearHistory = () => {
    clearState()
    console.log('[Undo/Redo] History cleared')
  }
}
```

#### 5.3 可视化历史记录（进阶）

创建一个开发工具面板，显示：
- 当前历史记录数量
- 最近的操作列表
- 每个操作的详细信息
- 一键清空/导出历史记录

**预计工作量**：1-2 小时（不含可视化面板）

---

### 方案六：统一操作入口（优先级：🟢 低，长期重构）

**目标**：创建统一的操作管理器，规范化所有操作

#### 6.1 定义操作接口

```typescript
// stores/operations.ts

interface Operation {
  name: string
  category: OpCategory
  execute(): void
  undo?(): void
  redo?(): void
}

class MoveComponentOperation implements Operation {
  name = '移动组件'
  category = OpCategory.Transform
  
  constructor(
    private component: Component,
    private deltaX: number,
    private deltaY: number
  ) {}
  
  execute() {
    this.component.ox += this.deltaX
    this.component.oy += this.deltaY
  }
  
  undo() {
    this.component.ox -= this.deltaX
    this.component.oy -= this.deltaY
  }
  
  redo() {
    this.execute()
  }
}
```

#### 6.2 操作管理器

```typescript
class OperationManager {
  private undoStack: Operation[] = []
  private redoStack: Operation[] = []
  
  execute(operation: Operation) {
    // 执行操作
    operation.execute()
    
    // 保存到历史
    this.undoStack.push(operation)
    this.redoStack.length = 0
    
    // 触发状态保存
    this.saveState(operation)
  }
  
  undo() {
    if (!this.undoStack.length) return
    const operation = this.undoStack.pop()!
    operation.undo?.()
    this.redoStack.push(operation)
  }
  
  redo() {
    if (!this.redoStack.length) return
    const operation = this.redoStack.pop()!
    operation.redo?.()
    this.undoStack.push(operation)
  }
  
  private saveState(operation: Operation) {
    // 集中处理状态保存逻辑
  }
}

export const operationManager = new OperationManager()
```

#### 6.3 使用示例

```typescript
// 替代现有的直接修改 + saveState
// 旧方式：
component.ox = newX
component.oy = newY
saveState('移动组件', [StoreType.EditCharacter], OpType.Undo)

// 新方式：
operationManager.execute(
  new MoveComponentOperation(component, deltaX, deltaY)
)
```

**优点**：
- 操作逻辑集中管理
- 每个操作都有明确的 undo/redo 实现
- 类型安全，减少错误
- 易于测试

**缺点**：
- 需要重构大量现有代码
- 学习成本较高

**预计工作量**：10+ 小时（大型重构）

---

## 实施建议

### 第一阶段：修复关键问题（必须做）⭐⭐⭐

**时间**：1-2 天

**修复 Bug**：
1. ✅ 修复 Bug 4: Polygon 代码不完整（极高优先级）
2. ✅ 修复 Bug 5: EditCharacter 未同步 editCharacterFile（极高优先级）
3. ✅ 修复 Bug 6: EditGlyph 未同步 editGlyph（极高优先级）
4. ✅ 修复 Bug 1: Ellipse X/Y 轴交换（高优先级）
5. ✅ 修复 Bug 2: Grid 访问路径错误（高优先级）
6. ✅ 修复 Bug 3: GlyphComponent 缺少恢复逻辑（高优先级）
7. ⭕ Bug 7: 添加注释提升代码可读性（可选）

**补充 saveState 调用**：
8. ✅ 补充 Select 工具的 saveState 调用
9. ✅ 补充 GlyphDragger 工具的 saveState 调用
10. ✅ 补充 LayoutResizer 工具的 saveState 调用

**测试验证**：
11. ✅ 进行基本功能测试，确保不再有明显遗漏

**验收标准**：
- 所有 6 个高优先级 bug 修复完成
- Undo/redo 功能在所有场景下正常工作
- 界面能正确响应撤销/重做操作
- 主要工具（Select、GlyphDragger）的操作都能正确撤销/重做
- 手动测试常见操作流程无异常

---

### 第二阶段：提升用户体验（推荐做）⭐⭐

**时间**：2-3 天

1. 实现操作合并机制（方案三）
2. 添加历史记录数量限制（方案四.2）
3. 使用 structuredClone 优化性能（方案四.1）
4. 添加开发环境日志（方案五.1）

**验收标准**：
- 连续调整参数不会产生大量历史记录
- 内存占用稳定，不会无限增长
- 开发时能看到清晰的操作日志

---

### 第三阶段：长期优化（可选）⭐

**时间**：1-2 周

1. 重构为统一的操作管理器（方案六）
2. 实现可视化历史记录面板（方案五.3）
3. 实现 diff-based 状态保存（方案四.3）
4. 编写单元测试，覆盖各种边界情况

**验收标准**：
- 代码架构清晰，易于维护
- 有完善的测试覆盖
- 有可视化调试工具

---

## 补充说明

### 测试策略

#### 手动测试清单

**基本功能**：
- [ ] 创建组件 → 撤销 → 重做
- [ ] 移动组件 → 撤销 → 重做
- [ ] 缩放组件 → 撤销 → 重做
- [ ] 旋转组件 → 撤销 → 重做
- [ ] 编辑参数 → 撤销 → 重做
- [ ] 拖拽字形组件 → 撤销 → 重做
- [ ] 拖拽字形关键点 → 撤销 → 重做
- [ ] 调整布局 → 撤销 → 重做

**边界情况**：
- [ ] 空栈时按撤销/重做
- [ ] 进行操作后切换编辑对象
- [ ] 连续多次撤销后重做
- [ ] 撤销后进行新操作（redo 栈应清空）

**性能测试**：
- [ ] 连续进行 100 次操作，观察内存占用
- [ ] 快速拖拽组件，观察是否卡顿

#### 单元测试示例

```typescript
// tests/stores/edit.spec.ts

describe('Undo/Redo System', () => {
  it('should save and restore state correctly', () => {
    // 保存初始状态
    const initialValue = { x: 0, y: 0 }
    
    // 修改状态
    const newValue = { x: 100, y: 200 }
    saveState('test', [StoreType.EditCharacter], OpType.Undo, {
      editCharacterFile: newValue
    })
    
    // 撤销
    undo()
    
    // 验证状态恢复
    expect(editCharacterFile.value).toEqual(initialValue)
  })
  
  it('should merge consecutive operations', () => {
    // 连续保存同类操作
    for (let i = 0; i < 10; i++) {
      saveState('edit param', [StoreType.EditGlyph], OpType.Undo, {
        category: OpCategory.Modify,
        mergeTimeWindow: 1000
      })
      await sleep(50)  // 50ms 间隔
    }
    
    // 验证只保存了一条记录
    expect(undoStack.length).toBe(1)
  })
})
```

---

### 开发规范

#### 何时调用 saveState？

**原则**：在用户完成一次**完整操作**后调用，而不是在操作过程中

✅ **正确时机**：
- 鼠标松开时（`onMouseUp`）
- 输入框失焦时（`onBlur`）
- 点击"应用"按钮时
- 工具切换时

❌ **错误时机**：
- 鼠标移动时（`onMouseMove`）
- 输入框每次输入时（`onInput`）
- 实时预览时

#### 如何选择 StoreType？

```typescript
// 1. 根据编辑状态选择
const storeType = editStatus.value === Status.Character ? 
  StoreType.EditCharacter : StoreType.EditGlyph

// 2. 根据修改内容选择
if (修改了字符/字形数据) {
  storeTypes.push(StoreType.EditCharacter 或 EditGlyph)
}
if (修改了工具) {
  storeTypes.push(StoreType.Tools)
}
if (修改了钢笔点) {
  storeTypes.push(StoreType.Pen)
}
// 依此类推...

// 3. 可以同时保存多个 StoreType
saveState('拖拽字形组件', [
  StoreType.EditCharacter,  // 字符数据变化
  StoreType.GlyphCompnent   // 字形组件配置变化
], OpType.Undo)
```

#### 如何设置 OpCategory？

```typescript
// 创建操作：新建组件、添加元素
category: OpCategory.Create

// 修改操作：调整参数、编辑脚本
category: OpCategory.Modify

// 删除操作：删除组件、清空内容
category: OpCategory.Delete

// 变换操作：移动、缩放、旋转
category: OpCategory.Transform
```

---

### 常见问题 FAQ

#### Q1: 为什么撤销后状态没有恢复？

**A**: 检查以下几点：
1. 是否在 `saveState` 中正确保存了状态？
2. 是否在 `updateState` 中正确恢复了状态？
3. StoreType 是否选择正确？
4. 状态对象是否被深拷贝（而不是引用）？

#### Q2: 为什么操作合并不生效？

**A**: 检查：
1. `category` 是否设置为可合并类型（Modify、Transform、Script）？
2. 两次操作的 `opName` 是否相同？
3. 时间间隔是否在 `mergeTimeWindow` 内？

#### Q3: 如何调试 undo/redo 问题？

**A**: 使用开发工具：
```javascript
// 在浏览器控制台执行
window.__showHistory()  // 查看历史记录
window.__undoStack      // 查看 undo 栈
window.__redoStack      // 查看 redo 栈
```

#### Q4: 性能问题如何排查？

**A**: 
1. 检查历史记录数量：`undoStack.length`
2. 使用 Chrome DevTools Memory Profiler 分析内存
3. 检查是否有大对象被反复克隆
4. 考虑增加操作合并或减少保存频率

---

## 附录

### 相关文件清单

**核心文件**：
- `src/fontEditor/stores/edit.ts` - undo/redo 核心实现
- `src/fontEditor/components/FontEditorPanels/EditPanel.vue` - 字符编辑界面
- `src/fontEditor/components/FontEditorPanels/GlyphEditPanel.vue` - 字形编辑界面

**工具文件**（需要补充 saveState）：
- `src/fontEditor/tools/select/select.ts`
- `src/fontEditor/tools/glyphDragger.ts`
- `src/fontEditor/tools/glyphDragger_glyph.ts`
- `src/fontEditor/tools/glyphLayoutResizer.ts`
- `src/fontEditor/tools/glyphLayoutResizer_glyph.ts`
- `src/fontEditor/tools/skeletonDragger.ts`

**其他相关文件**：
- `src/fontEditor/stores/files.ts` - 字符文件状态管理
- `src/fontEditor/stores/glyph.ts` - 字形状态管理
- `src/fontEditor/stores/font.ts` - 字体状态管理

### 参考资源

- [Command Pattern](https://refactoring.guru/design-patterns/command) - 操作管理器的设计模式参考
- [structuredClone API](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone) - 深拷贝性能优化
- [Lodash throttle](https://lodash.com/docs/#throttle) - 操作合并的时间控制

---

**文档版本**：v1.0  
**最后更新**：2025-11-06  
**作者**：AI Assistant  
**审阅者**：待定

