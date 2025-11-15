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
import { tips } from '../stores/global'
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

  characters.forEach((character: ICharacterFile) => {
    if (!character) return
    const changed = formatCharacterGlyphComponents(character)
    if (changed) {
      formattedCount += 1
      emitter.emit('renderPreviewCanvasByUUID', character.uuid)
    }
  })

  if (formattedCount > 0) {
    if (editCharacterFile.value) {
      const currentIndex = characters.findIndex((item) => item.uuid === editCharacterFile.value.uuid)
      if (currentIndex !== -1) {
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
        
        // 添加起始点
        points.push({
          uuid: genUUID(),
          type: 'anchor',
          x: path.curves[0].points[0].x,
          y: path.curves[0].points[0].y,
          origin: null,
          isShow: true,
        })
        
        // 处理所有曲线段
        for (let j = 0; j < path.curves.length; j++) {
          const curve = path.curves[j]
          
          if (curve.points.length >= 4) {
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
              x: curve.points[3].x,
              y: curve.points[3].y,
              origin: null,
              isShow: true,
            }
            points.push(control1, control2, end)
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
    for (let i = 0; i < components.length; i++) {
      addComponentForCurrentCharacterFile(components[i])
    }
    emitter.emit('renderCharacter')
  } else if (editStatus.value === Status.Glyph) {
    editGlyph.value.script = `function script_${editGlyph.value.uuid.replaceAll('-', '_')} (glyph, constants, FP) {\n\t//Todo something\n}`,
    editGlyph.value.glyph_script = null
    editGlyph.value.system_script = null
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