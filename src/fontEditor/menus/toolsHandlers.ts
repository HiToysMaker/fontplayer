import {
  setTipsDialogVisible,
} from '../stores/dialogs'
import {
  addComponentForCurrentCharacterFile,
  selectedFile, editCharacterFile,
  orderedListWithItemsForCharacterFile,
  ICharacterFile,
  executeCharacterScript,
} from '../stores/files'
import { tips, setGlyphDraggerTool, glyphDraggerTool } from '../stores/global'
import * as R from 'ramda'
import { genUUID, toUnicode } from '../../utils/string'
import type {
  ILine,
  ICubicBezierCurve,
  IQuadraticBezierCurve,
} from '../../fontManager'
import {
  componentsToContours2,
} from '../../features/font'
import { emitter } from '../Event/bus'
import {
  Status,
  editStatus,
} from '../stores/font'
import { IGlyphComponent, addComponentForCurrentGlyph, editGlyph, executeScript, getGlyphByName } from '../stores/glyph'
import { formatCharacterGlyphComponents, formatGlyphGlyphComponents } from '../utils/formatGlyphComponents'
import paper from 'paper'
import { genPenComponent } from '../tools/pen'
import { createOptimizedPath, isAlreadyOptimized, mergePathsWithPrecision } from './remove_overlap'
import { editGlyphOnDragging } from '../stores/glyphDragger_glyph'
import { editCharacterFileOnDragging } from '../stores/glyphDragger'

const generateCharFile = (data) => {
  const characterComponent = {
    uuid: genUUID(),
    text: data.name,
    unicode: toUnicode(data.name),
    components: [],
  }
  const uuid = genUUID()
  const characterFile = {
    uuid,
    type: 'text',
    character: characterComponent,
    components: [],
    groups: [],
    orderedList: [],
    selectedComponentsUUIDs: [],
    view: {
      zoom: 100,
      translateX: 0,
      translateY: 0,
    },
    info: {
      gridSettings: {
        dx: 0,
        dy: 0,
        centerSquareSize: selectedFile.value.width / 3,
        size: selectedFile.value.width,
        default: true,
      },
      useSkeletonGrid: false,
      layout: '',
      layoutTree: [],
    },
    script: `function script_${uuid.replaceAll('-', '_')} (character, constants, FP) {\n\t//Todo something\n}`,
  }

  const left_comp: IGlyphComponent = generateComponent(data.left)
  const right_comp: IGlyphComponent = generateComponent(data.right)

  characterFile.components.push(left_comp)
  characterFile.components.push(right_comp)
  // @ts-ignore
  characterFile.orderedList.push({
    type: 'component',
    uuid: left_comp.uuid,
  })
  // @ts-ignore
  characterFile.orderedList.push({
    type: 'component',
    uuid: right_comp.uuid,
  })
  return characterFile
}

const generateComponent = (data) => {
  const glyph = getGlyphByName(data.glyph_name)
  const _glyph = R.clone(glyph)
  _glyph.layout.params.width = data.w
  _glyph.layout.params.height = data.h
  const component: IGlyphComponent = {
    uuid: genUUID(),
    type: 'glyph',
    name: glyph.name + Date.now().toString().slice(9),
    lock: false,
    visible: true,
    value: _glyph,
    ox: data.x - (1000 - data.w) / 2,
    oy: data.y - (1000 - data.h) / 2,
    usedInCharacter: true,
  }
  executeScript(component.value)
  return component
}

// 优化后的removeOverlap函数
const runFormatAllCharacters = () => {
  if (!selectedFile.value) {
    return
  }

  const characters = selectedFile.value.characterList || []
  let formattedCount = 0
  let currentCharacterFormatted = false

  characters.forEach((character: ICharacterFile) => {
    if (!character) return
    const changed = formatCharacterGlyphComponents(character)
    if (changed) {
      formattedCount += 1
      emitter.emit('renderPreviewCanvasByUUID', character.uuid)
      // 检查是否是当前编辑的字符
      if (editCharacterFile.value && character.uuid === editCharacterFile.value.uuid) {
        currentCharacterFormatted = true
      }
    }
  })

  if (formattedCount > 0) {
    if (editCharacterFile.value) {
      const currentIndex = characters.findIndex((item) => item.uuid === editCharacterFile.value.uuid)
      if (currentIndex !== -1) {
        // 如果当前编辑的字符被格式化了，清理拖拽状态
        if (currentCharacterFormatted) {
          // 清理拖拽状态，因为字形组件已被转换为普通组件
          // Clear dragging state since glyph components have been converted to normal components
          editCharacterFileOnDragging.value = null
          setGlyphDraggerTool('')
        }
        editCharacterFile.value = R.clone(characters[currentIndex])
        executeCharacterScript(editCharacterFile.value)
      }
      emitter.emit('renderCharacter', true)
    }
    tips.value = `已格式化 ${formattedCount} 个字符的字形组件`
  } else {
    tips.value = '没有需要格式化的字形组件'
  }
}

const formatAllCharacters = () => {
  tips.value = '一键格式化全部字符会将字符列表中所有字符包含的字形组件格式化为普通组件，该操作不可恢复，确定进行格式化？'
  setTipsDialogVisible(true, () => {
    runFormatAllCharacters()
  })
}

const runFormatCurrentCharacter = () => {
  if (editStatus.value === Status.Edit) {
    const character = editCharacterFile.value
    if (!character) {
      return
    }
    const changed = formatCharacterGlyphComponents(character)
    if (changed) {
      // 清理拖拽状态，因为字形组件已被转换为普通组件
      // Clear dragging state since glyph components have been converted to normal components
      editCharacterFileOnDragging.value = null
      setGlyphDraggerTool('')
      const file = selectedFile.value
      if (file) {
        const index = file.characterList.findIndex((item) => item.uuid === character.uuid)
        if (index !== -1) {
          file.characterList[index] = R.clone(character)
          emitter.emit('renderPreviewCanvasByUUID', character.uuid)
        }
      }
      emitter.emit('renderCharacter', true)
      tips.value = `已格式化字符 ${character.character?.text ?? character.uuid} 的字形组件`
    } else {
      tips.value = '当前字符没有可格式化的字形组件'
    }
  } else if (editStatus.value === Status.Glyph) {
    const glyph = editGlyph.value
    if (!glyph) {
      return
    }
    const changed = formatGlyphGlyphComponents(glyph)
    if (changed) {
      // 清理拖拽状态，因为字形组件已被转换为普通组件
      // Clear dragging state since glyph components have been converted to normal components
      editGlyphOnDragging.value = null
      setGlyphDraggerTool('')
      emitter.emit('renderGlyph', true)
      emitter.emit('renderGlyphPreviewCanvasByUUID', glyph.uuid)
      tips.value = `已格式化字形 ${glyph.name} 的字形组件`
    } else {
      tips.value = '当前字形没有可格式化的字形组件'
    }
  }
}

const formatCurrentCharacter = () => {
  tips.value = '一键格式化当前字符会将当前编辑中的字符所包含的全部字形组件格式化为普通组件，该操作不可恢复，确定进行格式化？'
  setTipsDialogVisible(true, () => {
    runFormatCurrentCharacter()
  })
}

const removeOverlap = async () => {
  let char = editCharacterFile.value
  if (editStatus.value === Status.Glyph) {
    char = editGlyph.value
  }
  
  const {
    unitsPerEm,
    descender,
  } = selectedFile.value.fontSettings
  
  let contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours2(orderedListWithItemsForCharacterFile(char),
    { x: 0, y: 0 }, false, 1
  )

  
  // let contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(orderedListWithItemsForCharacterFile(char),
  //   { unitsPerEm, descender, advanceWidth: unitsPerEm }, { x: 0, y: 0 }, false, false, false
  // )
  
  if (editStatus.value == Status.Glyph) {
    contours = componentsToContours2(char._o.components,
      { x: 0, y: 0 }, true, 1
    )
  }

  // 检查是否已经优化过
  if (isAlreadyOptimized(contours)) {
    return
  }

  // 使用优化后的路径创建函数
  let paths = []
  for (let i = 0; i < contours.length; i++) {
    const contour = contours[i]
    if (contour.length === 0) continue
    
    const path = createOptimizedPath(contour)
    
    if (!path.closed) {
      path.closePath()
    }
    
    paths.push(path)
  }

  // 智能去除重叠：对于已经有镂空结构的字符，使用exclude方法避免破坏镂空
  let unitedPath = null

  // 检查是否有镂空结构
  let hasHoles = false
  let hasOuterContours = false

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i]
    if (!path.area) continue
    
    const area = path.area
    if (Math.abs(area) > 1e-6) {
      if (area > 0) {
        hasOuterContours = true
      } else {
        hasHoles = true
      }
    }
  }

  // 如果有镂空结构，使用exclude方法避免破坏镂空
  if (hasHoles && hasOuterContours) {
    // 分离外轮廓和内轮廓（镂空）
    const outerPaths: paper.Path[] = []
    const innerPaths: paper.Path[] = []
    
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i]
      if (!path.area) continue
      
      if (path.area > 0) {
        outerPaths.push(path)
      } else {
        innerPaths.push(path)
      }
    }
    
    // 确保有外轮廓
    if (outerPaths.length === 0) {
      unitedPath = mergePathsWithPrecision(paths)
    } else {
      // 先合并外轮廓
      unitedPath = outerPaths[0].clone()
      for (let i = 1; i < outerPaths.length; i++) {
        const result = unitedPath.unite(outerPaths[i]) as paper.Path
        if (result && result.area && Math.abs(result.area) > 1e-6) {
          unitedPath = result
        }
      }
      
      // 然后用内轮廓（镂空）排除
      for (let i = 0; i < innerPaths.length; i++) {
        const result = unitedPath.exclude(innerPaths[i]) as paper.Path
        if (result && result.area && Math.abs(result.area) > 1e-6) {
          unitedPath = result
        } else {
        }
      }
      
      // 验证最终结果
      if (!unitedPath || !unitedPath.area || Math.abs(unitedPath.area) < 1e-6) {
        unitedPath = mergePathsWithPrecision(paths)
      }
    }
  } else {
    // 没有镂空结构，使用普通的unite方法
    unitedPath = mergePathsWithPrecision(paths)
  }

  let components = []
  if (unitedPath) {
    const extractComponentsFromPath = (path: paper.Path): any[] => {
      const components = []
      
      // 处理子路径
      if (path.children && path.children.length > 0) {
        for (let i = 0; i < path.children.length; i++) {
          const child = path.children[i]
          if (child instanceof paper.Path) {
            const childComponents = extractComponentsFromPath(child)
            components.push(...childComponents)
          }
        }
        return components
      }
      
      // 处理单个路径
      if (path.curves && path.curves.length > 0) {
        let points = []
        
        // 获取第一个曲线段的起点
        let startX = path.curves[0].points[0].x
        let startY = path.curves[0].points[0].y
        
        // 添加起始点
        points.push({
          uuid: genUUID(),
          type: 'anchor',
          x: startX,
          y: startY,
          origin: null,
          isShow: true,
        })
        
        // 处理所有曲线段
        let lastCurveEndX = null
        let lastCurveEndY = null
        for (let j = 0; j < path.curves.length; j++) {
          const curve = path.curves[j]
          
          if (curve.points.length >= 4) {
            // 获取当前曲线段的起点和终点
            let curveStartX = curve.points[0].x
            let curveStartY = curve.points[0].y
            let endX = curve.points[3].x
            let endY = curve.points[3].y
            
            // 保存原始终点坐标（用于闭合时的切线调整）
            lastCurveEndX = endX
            lastCurveEndY = endY
            
            // 确保路径段正确连接：当前段的起点应该等于前一段的终点
            if (j > 0 && points.length > 0) {
              const prevEndPoint = points[points.length - 1]
              // 如果前一段的终点与当前段的起点不重合，使用前一段的终点作为当前段的起点
              const dx = Math.abs(prevEndPoint.x - curveStartX)
              const dy = Math.abs(prevEndPoint.y - curveStartY)
              if (dx > 0.001 || dy > 0.001) {
                curveStartX = prevEndPoint.x
                curveStartY = prevEndPoint.y
              }
            }
            
            const control1 = {
              uuid: genUUID(),
              type: 'control',
              x: curve.points[1].x,
              y: curve.points[1].y,
              origin: points[points.length - 1].uuid,
              isShow: true,
            }
            const uuid = genUUID()
            const control2 = {
              uuid: genUUID(),
              type: 'control',
              x: curve.points[2].x,
              y: curve.points[2].y,
              origin: uuid,
              isShow: true,
            }
            const end = {
              uuid: uuid,
              type: 'anchor',
              x: endX,
              y: endY,
              origin: null,
              isShow: true,
            }
            points.push(control1, control2, end)
          }
        }
        
        // 如果路径是闭合的，确保最后一个点的坐标精确等于第一个点的坐标
        if (points.length > 0 && path.closed) {
          const firstPoint = points[0]
          const lastPoint = points[points.length - 1]
          // 强制最后一个点的坐标等于第一个点的坐标（不考虑容差，确保精确闭合）
          if (lastPoint.x !== firstPoint.x || lastPoint.y !== firstPoint.y) {
            // 修正最后一个点的坐标，使其精确等于第一个点的坐标
            lastPoint.x = firstPoint.x
            lastPoint.y = firstPoint.y
            
            // 如果最后一个点有对应的控制点（倒数第二个点），调整它以保持切线方向
            // 在pen组件中，点的顺序是：anchor, control1, control2, anchor, ...
            // 所以最后一个anchor的前一个点应该是control2
            if (points.length >= 4 && lastCurveEndX !== null && lastCurveEndY !== null) {
              const lastControl2 = points[points.length - 2] // 最后一个anchor的前一个点（control2）
              if (lastControl2 && lastControl2.type === 'control') {
                // 计算原始control2到最后一个anchor的方向向量
                const origControl2ToEndX = lastCurveEndX - lastControl2.x
                const origControl2ToEndY = lastCurveEndY - lastControl2.y
                
                // 调整control2，使新的control2到新的end的方向保持不变
                lastControl2.x = firstPoint.x - origControl2ToEndX
                lastControl2.y = firstPoint.y - origControl2ToEndY
              }
            }
          }
        }
        
        // 只有当有足够的点时才创建组件
        if (points.length >= 3) {
          components.push(genPenComponent(points, true))
        }
      }
      
      return components
    }
    
    components = extractComponentsFromPath(unitedPath)
  }

  if (editStatus.value === Status.Edit) {
    editCharacterFile.value.script = `function script_${editCharacterFile.value.uuid.replaceAll('-', '_')} (character, constants, FP) {\n\t//Todo something\n}`,
    editCharacterFile.value.glyph_script = null
    editCharacterFile.value.system_script = null
    editCharacterFile.value.orderedList = []
    editCharacterFile.value.components = []
    // 清理拖拽状态，因为字形组件已被转换为钢笔组件
    // Clear dragging state since glyph components have been converted to pen components
    editCharacterFileOnDragging.value = null
    setGlyphDraggerTool('')
    for (let i = 0; i < components.length; i++) {
      addComponentForCurrentCharacterFile(components[i])
    }
    emitter.emit('renderCharacter')
  } else if (editStatus.value === Status.Glyph) {
    editGlyph.value.script = `function script_${editGlyph.value.uuid.replaceAll('-', '_')} (glyph, constants, FP) {\n\t//Todo something\n}`,
    editGlyph.value.glyph_script = null
    editGlyph.value.system_script = null
    // 清理拖拽状态，因为字形组件已被转换为钢笔组件
    // Clear dragging state since glyph components have been converted to pen components
    editGlyphOnDragging.value = null
    setGlyphDraggerTool('')
    for (let i = 0; i < components.length; i++) {
      addComponentForCurrentGlyph(components[i])
    }
    emitter.emit('renderGlyph')
  }
}

export {
  removeOverlap,
  formatAllCharacters,
  formatCurrentCharacter,
  generateCharFile,
  generateComponent,
  runFormatAllCharacters,
  runFormatCurrentCharacter,
}