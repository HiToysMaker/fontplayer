import { computed, Ref, ref } from "vue"
import { CustomGlyph } from "../programming/CustomGlyph"
import { ConstantsMap } from "../programming/ConstantsMap"
import { instanceCharacter, instanceGlyph, nativeSaveBinary } from "../menus/handlers"
import { ICharacterFile, orderedListWithItemsForCharacterFile, selectedItemByUUID } from "./files"
import { componentsToContours } from "../../features/font"
import { renderPreview2 } from "../canvas/canvas"
import { emitter } from "../Event/bus"
import saveAs from "file-saver"
import JSZip from "jszip"
import { toArrayBuffer } from "../../fontManager"
import { create, PathType } from '../../fontManager'
import { genUUID } from '../../utils/string'
import { FP } from '../programming/FPUtils'
import { hei_strokes } from '../templates/strokes_1'
import { ParametersMap } from "../programming/ParametersMap"
import { IParameter } from "./glyph"
import paper from 'paper'
import { base, total, loading as loadingGlobal, loaded } from "./global"

// 参数类型
// parameter type
export enum ParameterType {
	Number,
	Constant,
	RingController,
	Enum,
  PlaygroundConstant,
}

const characters = ref([])
const glyphs = ref([])
const constants = ref([
  {
    uuid: genUUID(),
    name: '起笔风格',
    type: ParameterType.Enum,
    value: 2,
    options: [
      {
        value: 0,
        label: '无起笔样式',
      },
      {
        value: 1,
        label: '凸笔起笔',
      },
      {
        value: 2,
        label: '凸笔圆角起笔',
      }
    ]
  },
  {
    uuid: genUUID(),
    name: '起笔数值',
    type: ParameterType.Number,
    value: 1,
    min: 0,
    max: 2,
  },
  {
    uuid: genUUID(),
    name: '转角风格',
    type: ParameterType.Enum,
    value: 1,
    options: [
      {
        value: 0,
        label: '默认转角样式',
      },
      {
        value: 1,
        label: '转角圆滑凸起',
      }
    ]
  },
  {
    uuid: genUUID(),
    name: '转角数值',
    type: ParameterType.Number,
    value: 1,
    min: 1,
    max: 2,
  },
  {
    uuid: genUUID(),
    name: '字重变化',
    type: ParameterType.Number,
    value: 0,
    min: 0,
    max: 2,
  },
  {
    uuid: genUUID(),
    name: '弯曲程度',
    type: ParameterType.Number,
    value: 1,
    min: 0,
    max: 2,
  },
  {
    uuid: genUUID(),
    name: '字重',
    type: ParameterType.Number,
    value: 50,
    min: 40,
    max: 100,
  },
])
const editCharacterFile = ref(null)
const loading = ref(false)

const gridSettings = ref({
	dx: 0,
	dy: 0,
	centerSquareSize: 1000 / 3,
	size: 1000,
	default: true,
})

let scripts_map = {}

//@ts-ignore
const constantsMap = new ConstantsMap(constants.value)

// 当前字符文件的排序组件（包含组件本身）列表
// ordered component list (with component itself) for current character file
const orderedListWithItemsForCurrentCharacterFile = computed(() => {
	return editCharacterFile.value.orderedList.map((item: {
		type: string,
		uuid: string,
	}) => {
		if (item.type === 'group') {
			return selectedItemByUUID(editCharacterFile.value.groups, item.uuid)
		}
		return selectedItemByUUID(editCharacterFile.value.components, item.uuid)
	})
})

// 生成字符渲染模板
// generate character template
const generateCharacterTemplate = (characterFile) => {
	const root = document.getElementById('playground-character-template').querySelector('.char-preview').cloneNode(true);
	(root as HTMLElement).className = `character-preview character-${characterFile.uuid}`;
	(root as HTMLElement).querySelector('.playground-preview-canvas').id = `playground-preview-canvas-${characterFile.uuid}`;
	(root as HTMLElement).addEventListener('click', () => editChar(characterFile.uuid))
	return root
}

const initPlayground = async () => {
  total.value = 0
  loadingGlobal.value = true
  characters.value = []
  window.FP = FP
  const wrapper = document.getElementById('playground-characters-list')
  wrapper.innerHTML = ''
  const res = base ? await fetch(base + `/templates/playground.json`) : await fetch(`templates/playground.json`)
  const data = JSON.parse(await res.text())

  for (let i = 0; i < hei_strokes.length; i++) {
    const stroke = hei_strokes[i]
    const { name, params, uuid } = stroke
    let stroke_script_res = base ? await fetch(base + `/templates/templates2/${name}.js`) : await fetch(`templates/templates2/${name}.js`)
    let stroke_script = await stroke_script_res.text()

    const parameters: Array<IParameter> = []
    for (let j = 0; j < params.length; j++) {
      const param = params[j]
      parameters.push({
        uuid: genUUID(),
        name: param.name,
        type: ParameterType.Number,
        value: param.default,
        min: param.min || 0,
        max: param.max || 1000,
      })
    }
    // 添加Enum参数骨架参考位置
    // 骨架参考位置用于当字重变化时，固定参考位置
    // 如果不设置骨架参考位置，当字重变化时，很可能横竖交叠处会露出棱角，变得不规则
    parameters.push({
      uuid: genUUID(),
      name: '参考位置',
      type: ParameterType.Enum,
      value: 0,
      options: [
        {
          value: 0,
          label: '默认',
        },
        {
          value: 1,
          label: '右侧（上侧）',
        },
        {
          value: 2,
          label: '左侧（下侧）',
        }
      ]
    })
    // 添加Enum参数起笔风格类型
    parameters.push({
      uuid: genUUID(),
      name: '起笔风格',
      type: ParameterType.Enum,
      value: 2,
      options: [
        {
          value: 0,
          label: '无起笔样式',
        },
        {
          value: 1,
          label: '凸笔起笔',
        },
        {
          value: 2,
          label: '凸笔圆角起笔',
        }
      ]
    })
    // 添加起笔数值
    parameters.push({
      uuid: genUUID(),
      name: '起笔数值',
      type: ParameterType.Number,
      value: 1,
      min: 0,
      max: 2,
    })
    // 添加Enum参数转角风格类型
    parameters.push({
      uuid: genUUID(),
      name: '转角风格',
      type: ParameterType.Enum,
      value: 1,
      options: [
        {
          value: 0,
          label: '默认转角样式',
        },
        {
          value: 1,
          label: '转角圆滑凸起',
        }
      ]
    })
    // 添加转角数值
    parameters.push({
      uuid: genUUID(),
      name: '转角数值',
      type: ParameterType.Number,
      value: 1,
      min: 1,
      max: 2,
    })
    // 添加字重变化
    parameters.push({
      uuid: genUUID(),
      name: '字重变化',
      type: ParameterType.Number,
      value: 0,
      min: 0,
      max: 2,
    })
    // 添加弯曲程度
    parameters.push({
      uuid: genUUID(),
      name: '弯曲程度',
      type: ParameterType.Number,
      value: 1,
      min: 0,
      max: 2,
    })
  
    //const uuid = genUUID()
    const glyph = {
      uuid,
      type: 'system',
      name,
      components: [],
      groups: [],
      orderedList: [],
      selectedComponentsUUIDs: [],
      view: {
        zoom: 100,
        translateX: 0,
        translateY: 0,
      },
      parameters: new ParametersMap(parameters),
      joints: [],
      script: `function script_${uuid.replaceAll('-', '_')} (glyph, constants, FP) {\n\t${stroke_script}\n}`,
    }
    glyphs.value.push(glyph)
  }

  const file = data.file
  file.characterList = file.characterList.map((character) => {
    const characterFile = instanceCharacter(character)
    wrapper.appendChild(generateCharacterTemplate(characterFile))
    characters.value.push(characterFile)
    // 初始化字符中调用的字形组件参数
    for (let i = 0; i < characterFile.components.length; i++) {
      const comp = characterFile.components[i]
      if (comp.type === 'glyph') {
        // 组件类型是glyph
        const glyph = comp.value
        const params = glyph.parameters.parameters
        for (let j = 0; j < params.length; j++) {
          const param = params[j]
          if (param.name === '起笔风格' && param.value !== 0) {
            param.type = ParameterType.PlaygroundConstant
            param.value = constants.value[0].uuid
          } else if (param.name === '起笔数值') {
            param.type = ParameterType.PlaygroundConstant
            param.value = constants.value[1].uuid
          } else if (param.name === '转角风格') {
            param.type = ParameterType.PlaygroundConstant
            param.value = constants.value[2].uuid
          } else if (param.name === '转角数值') {
            param.type = ParameterType.PlaygroundConstant
            param.value = constants.value[3].uuid
          } else if (param.name === '字重变化') {
            param.type = ParameterType.PlaygroundConstant
            param.value = constants.value[4].uuid
          } else if (param.name === '弯曲程度') {
            param.type = ParameterType.PlaygroundConstant
            param.value = constants.value[5].uuid
          } else if (param.name === '字重') {
            param.type = ParameterType.PlaygroundConstant
            param.value = constants.value[6].uuid
          }
        }
      }
    }
    // 获取字符预览canvas
    const canvas: HTMLCanvasElement = document.getElementById(`playground-preview-canvas-${character.uuid}`) as HTMLCanvasElement
    if (!canvas) return
    // 将字符数据处理成预览模式
    const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(orderedListWithItemsForCharacterFile(characterFile), {
      unitsPerEm: 1000,
      descender: -200,
      advanceWidth: 1000,
    }, { x: 0, y: 0 }, false, true)
    // 渲染字符
    renderPreview2(canvas, contours)
  })

  editChar(characters.value[0].uuid)
  loadingGlobal.value = false
}

const renderPreview = () => {
  characters.value.map((character) => {
    character.info.gridSettings = {
      dx: gridSettings.value.dx,
      dy: gridSettings.value.dy,
      size: gridSettings.value.size,
      centerSquareSize: gridSettings.value.centerSquareSize,
      default: false,
    }
    // 获取字符预览canvas
    const canvas: HTMLCanvasElement = document.getElementById(`playground-preview-canvas-${character.uuid}`) as HTMLCanvasElement
    if (!canvas) return
    // 将字符数据处理成预览模式
    const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(orderedListWithItemsForCharacterFile(character), {
      unitsPerEm: 1000,
      descender: -200,
      advanceWidth: 1000,
      grid: gridSettings.value,
			useSkeletonGrid: true,
      playground: true,
    }, { x: 0, y: 0 }, false, true, true)
    // 渲染字符
    renderPreview2(canvas, contours)
  })
}

const updateCharactersAndPreview = () => {
  for (let i = 0; i < characters.value.length; i++) {
    const character = characters.value[i]
    // 获取字符预览canvas
    const canvas: HTMLCanvasElement = document.getElementById(`playground-preview-canvas-${character.uuid}`) as HTMLCanvasElement
    if (!canvas) return
    const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(orderedListWithItemsForCharacterFile(character), {
      unitsPerEm: 1000,
      descender: -200,
      advanceWidth: 1000,
      grid: character.info.gridSettings,
      useSkeletonGrid: true,//character.info?.useSkeletonGrid || false,
      playground: true,
    }, { x: 0, y: 0 }, false, true, true)
    // 渲染字符
    renderPreview2(canvas, contours)
  }
}

const editChar = (uuid) => {
  for (let i = 0; i < characters.value.length; i++) {
    if (characters.value[i].uuid === uuid) {
      editCharacterFile.value = characters.value[i]
      editCharacterFile.value.components.map((component) => {
        if (component.type === 'glyph') {
          const glyph = component.value
          executeScript(glyph)
        }
      })
      emitter.emit('refreshPlaygroundGridController')
    }
  }
}

const getScript = (glyph) => {
	if (glyph.script) return glyph.script
	else if (glyph.script_reference) {
		if (scripts_map[glyph.script_reference]) return scripts_map[glyph.script_reference]
		else {
      for (let i = 0; i < glyphs.value.length; i++) {
        const origin_glyph = glyphs.value[i]
        if (glyph.script_reference === origin_glyph.uuid) {
          if (origin_glyph.script) return origin_glyph.script
        }
      }
		}
	}
	return null
}

const exportFont = async () => {
  if (loading.value) return
  loading.value = true
  await computeOverlapRemovedContours()
  const font = await createFont()
  //@ts-ignore
  if (!!window.__TAURI_INTERNALS__) {
    const buffer = toArrayBuffer(font) as ArrayBuffer
    const filename = `登鹳雀楼.otf`
    nativeSaveBinary(buffer, filename, ['otf'])
    loading.value = false
  } else {
    // 直接使用ArrayBuffer创建Blob，不要通过DataView
    const arrayBuffer = toArrayBuffer(font) as ArrayBuffer
    console.log(`[playground exportFont] ArrayBuffer size: ${arrayBuffer.byteLength} bytes`)
    
    const blob = new Blob([arrayBuffer], {type: 'font/opentype'})
    console.log(`[playground exportFont] Blob size: ${blob.size} bytes`)
    
    var zip = new JSZip()
    zip.file(`登鹳雀楼.otf`, blob)
    zip.generateAsync({type:"blob"}).then(function(content: any) {
      saveAs(content, `登鹳雀楼.zip`)
      console.log(`[playground exportFont] ZIP saved successfully`)
      loading.value = false
    })
  }
}

// 添加精度控制常量
const OVERLAP_REMOVAL_CONFIG = {
  // 路径精度设置
  PATH_PRECISION: 1e-6,
  // 容差值
  TOLERANCE: 1e-8,
  // 最大细分次数
  MAX_SUBDIVISIONS: 10,
  // 曲线细分阈值
  CURVE_SUBDIVISION_THRESHOLD: 0.1,
  // 合并容差
  MERGE_TOLERANCE: 1e-6
}

// 优化后的路径创建函数
const createOptimizedPath = (contour: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>): paper.Path => {
  const path = new paper.Path()
  
  if (contour.length === 0) return path
  
  // 移动到起始点
  const startPoint = new paper.Point(contour[0].start.x, contour[0].start.y)
  path.moveTo(startPoint)
  
  for (let j = 0; j < contour.length; j++) {
    const segment = contour[j]
    
    if (segment.type === PathType.LINE) {
      const lineSegment = segment as unknown as ILine
      const endPoint = new paper.Point(lineSegment.end.x, lineSegment.end.y)
      path.lineTo(endPoint)
    } else if (segment.type === PathType.CUBIC_BEZIER) {
      const cubicSegment = segment as unknown as ICubicBezierCurve
      const control1 = new paper.Point(cubicSegment.control1.x, cubicSegment.control1.y)
      const control2 = new paper.Point(cubicSegment.control2.x, cubicSegment.control2.y)
      const endPoint = new paper.Point(cubicSegment.end.x, cubicSegment.end.y)
      path.cubicCurveTo(control1, control2, endPoint)
    } else if (segment.type === PathType.QUADRATIC_BEZIER) {
      const quadSegment = segment as unknown as IQuadraticBezierCurve
      const control = new paper.Point(quadSegment.control.x, quadSegment.control.y)
      const endPoint = new paper.Point(quadSegment.end.x, quadSegment.end.y)
      
      // 将二次贝塞尔转换为三次贝塞尔
      const cubicControl1 = startPoint.multiply(1/3).add(control.multiply(2/3))
      const cubicControl2 = endPoint.multiply(1/3).add(control.multiply(2/3))
      path.cubicCurveTo(cubicControl1, cubicControl2, endPoint)
    }
    
    // 更新起始点
    startPoint.x = segment.end.x
    startPoint.y = segment.end.y
  }
  
  return path
}

// 优化路径合并函数
const mergePathsWithPrecision = (paths: paper.Path[]): paper.Path | null => {
  if (paths.length === 0) return null
  if (paths.length === 1) return paths[0]
  
  // 设置paper.js的全局精度
  paper.settings.precision = OVERLAP_REMOVAL_CONFIG.PATH_PRECISION
  
  let unitedPath = paths[0].clone()
  
  for (let i = 1; i < paths.length; i++) {
    const currentPath = paths[i]
    const result = unitedPath.unite(currentPath) as paper.Path
    if (result && result.area && Math.abs(result.area) > OVERLAP_REMOVAL_CONFIG.MERGE_TOLERANCE) {
      unitedPath = result
    }
  }
  
  return unitedPath
}

// 检测字符是否已经不需要去除重叠
const isAlreadyOptimized = (contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>): boolean => {
  if (contours.length <= 1) {
    return true // 单个轮廓不需要去除重叠
  }
  
  // 检查轮廓之间是否有重叠
  let hasOverlap = false
  for (let i = 0; i < contours.length; i++) {
    for (let j = i + 1; j < contours.length; j++) {
      const contour1 = contours[i]
      const contour2 = contours[j]
      
      // 计算两个轮廓的包围盒
      let minX1 = Infinity, minY1 = Infinity, maxX1 = -Infinity, maxY1 = -Infinity
      let minX2 = Infinity, minY2 = Infinity, maxX2 = -Infinity, maxY2 = -Infinity
      
      for (let k = 0; k < contour1.length; k++) {
        const segment = contour1[k]
        minX1 = Math.min(minX1, segment.start.x, segment.end.x)
        minY1 = Math.min(minY1, segment.start.y, segment.end.y)
        maxX1 = Math.max(maxX1, segment.start.x, segment.end.x)
        maxY1 = Math.max(maxY1, segment.start.y, segment.end.y)
      }
      
      for (let k = 0; k < contour2.length; k++) {
        const segment = contour2[k]
        minX2 = Math.min(minX2, segment.start.x, segment.end.x)
        minY2 = Math.min(minY2, segment.start.y, segment.end.y)
        maxX2 = Math.max(maxX2, segment.start.x, segment.end.x)
        maxY2 = Math.max(maxY2, segment.start.y, segment.end.y)
      }
      
      // 检查包围盒是否重叠
      if (maxX1 >= minX2 && maxX2 >= minX1 && maxY1 >= minY2 && maxY2 >= minY1) {
        hasOverlap = true
        break
      }
    }
    if (hasOverlap) break
  }
  
  // 如果有重叠，说明需要去除重叠，不应该跳过
  // 只有在没有重叠的情况下才认为已经优化过
  return !hasOverlap
}

const computeOverlapRemovedContours = () => {
  const unitsPerEm = 1000
  const ascender = 800
  const descender = -200
  for (let m = 0; m < characters.value.length; m++) {
    let char = characters.value[m]
    // 读取字符轮廓信息（已经将形状都转换成字体轮廓）
    let contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(orderedListWithItemsForCharacterFile(char), {
      unitsPerEm,
      descender,
      advanceWidth: unitsPerEm,
    }, { x: 0, y: 0 }, false, false, false)

    // 检查是否已经优化过
    if (isAlreadyOptimized(contours)) {
      // 即使跳过处理，也要保存原始轮廓到overlap_removed_contours
      char.overlap_removed_contours = contours
      continue
    }
  
    // 将轮廓转换成Path
    let paths = []
    for (let i = 0; i < contours.length; i++) {
      const contour = contours[i]
      if (contour.length === 0) continue
      
      const path = createOptimizedPath(contour)
      
      // 确保路径闭合
      if (!path.closed) {
        path.closePath()
      }
      
      paths.push(path)
    }

    // 合并路径，去除重叠
    let unitedPath = mergePathsWithPrecision(paths)

    if (!unitedPath || !unitedPath.curves || unitedPath.curves.length === 0) {
      // 合并失败或没有有效曲线，使用原始轮廓
      char.overlap_removed_contours = contours
      continue
    }

    // 根据合并路径生成轮廓数据
    let overlap_removed_contours = []
    
    const extractContoursFromPath = (path: paper.Path) => {
      const contours = []
      
      // 处理子路径
      if (path.children && path.children.length > 0) {
        for (let i = 0; i < path.children.length; i++) {
          const child = path.children[i]
          if (child instanceof paper.Path) {
            const childContours = extractContoursFromPath(child)
            contours.push(...childContours)
          }
        }
        return contours
      }
      
      // 处理单个路径
      if (path.curves && path.curves.length > 0) {
        const contour = []
        for (let j = 0; j < path.curves.length; j++) {
          const curve = path.curves[j]
          if (curve.points.length >= 4) {
            const pathSegment = {
              type: PathType.CUBIC_BEZIER,
              start: { x: curve.points[0].x, y: curve.points[0].y },
              control1: { x: curve.points[1].x, y: curve.points[1].y },
              control2: { x: curve.points[2].x, y: curve.points[2].y },
              end: { x: curve.points[3].x, y: curve.points[3].y },
            }
            contour.push(pathSegment)
          }
        }
        if (contour.length > 0) {
          contours.push(contour)
        }
      }
      
      return contours
    }
    
    overlap_removed_contours = extractContoursFromPath(unitedPath)

    // 如果没有提取到有效轮廓，使用原始轮廓
    if (overlap_removed_contours.length === 0) {
      char.overlap_removed_contours = contours
    } else {
      char.overlap_removed_contours = overlap_removed_contours
    }
  }
}

const createFont = async () => {
  const _width = 1000
  const _height = 1000
  const fontCharacters = [{
    unicode: 0,
    name: '.notdef',
    contours: [[]] as Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>,
    contourNum: 0,
    advanceWidth: Math.max(_width, _height),
    leftSideBearing: 0,
  }]

  let containSpace = false
  const unitsPerEm = 1000
  const ascender = 800
  const descender = -200
  for (let i = 0; i < characters.value.length; i++) {
    const char: ICharacterFile = characters.value[i]
    let contours = [[]]
    if (char.overlap_removed_contours) {
      contours = char.overlap_removed_contours
    } else {
      contours = componentsToContours(
        orderedListWithItemsForCharacterFile(char),
        {
          unitsPerEm,
          descender,
          advanceWidth: unitsPerEm,
        }, {x: 0, y: 0}, false, false, false
      )
    }
    const { text, unicode } = char.character
    fontCharacters.push({
      name: text,
      unicode: parseInt(unicode, 16),
      advanceWidth: unitsPerEm,
      leftSideBearing: 0,
      contours,
      contourNum: contours.length,
    })
    if (text === ' ') {
      containSpace = true
    }
  }

  if (!containSpace) {
    fontCharacters.push({
      name: ' ',
      unicode: parseInt('0x20', 16),
      advanceWidth: unitsPerEm,
      leftSideBearing: 0,
      contours: [[]],
      contourNum: 0,
    })
  }

  fontCharacters.sort((a: any, b: any) => {
    return a.unicode - b.unicode
  })

  // // 创建完整的tables配置
  // const tables = {
  //   head: {
  //     majorVersion: 0x0001,
  //     minorVersion: 0x0000,
  //     fontRevision: 0x00010000,
  //     flags: [
  //       true, true, false, false, false, false, false, false,
  //       false, false, false, false, false, false, false, false,
  //     ],
  //     created: {
  //       timestamp: Math.floor(Date.now() / 1000) + 2082844800,
  //       value: Date.now(),
  //     },
  //     modified: {
  //       timestamp: Math.floor(Date.now() / 1000) + 2082844800,
  //       value: Date.now()
  //     },
  //     macStyle: [
  //       false, false, false, false, false, false, false, false,
  //       false, false, false, false, false, false, false, false,
  //     ],
  //     lowestRecPPEM: 7,
  //     fontDirectionHint: 2,
  //   },
  //   hhea: {
  //     majorVersion: 0x0001,
  //     minorVersion: 0x0000,
  //     lineGap: 0,
  //     caretSlopeRise: 1,
  //     caretSlopeRun: 0,
  //     caretOffset: 0,
  //   },
  //   os2: {
  //     version: 0x0005,
  //     usWeightClass: 400,
  //     usWidthClass: 5,
  //     fsType: 0,
  //     ySubscriptXSize: 650,
  //     ySubscriptYSize: 699,
  //     ySubscriptXOffset: 0,
  //     ySubscriptYOffset: 140,
  //     ySuperscriptXSize: 650,
  //     ySuperscriptYSize: 699,
  //     ySuperscriptXOffset: 0,
  //     ySuperscriptYOffset: 479,
  //     yStrikeoutSize: 49,
  //     yStrikeoutPosition: 258,
  //     sFamilyClass: 0,
  //     panose: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  //     achVendID: 'UKWN',
  //     fsSelection: [
  //       false, false, false, false, false, false, true, false, false, false,
  //     ],
  //     usMaxContext: 0,
  //     usLowerOpticalPointSize: 8,
  //     usUpperOpticalPointSize: 72,
  //   },
  //   name: [],
  //   post: {
  //     version: 0x00030000,
  //     italicAngle: 0,
  //     underlinePosition: 0,
  //     underlineThickness: 0,
  //     isFixedPitch: 1,
  //     minMemType42: 0,
  //     maxMemType42: 0,
  //     minMemType1: 0,
  //     maxMemType1: 0,
  //   },
  // }

  const font = await create(fontCharacters, {
    familyName: '登鹳雀楼',
    styleName: 'Regular',
    unitsPerEm,
    ascender,
    descender,
    tables: null,
  })
  return font
}

// 执行字形脚本
// execute glyph script
const executeScript = (targetGlyph) => {
	try {
		// 字形实例缓存了数据，表示字形正在拖拽编辑中，则返回不执行脚本运行操作
		if (targetGlyph._o && targetGlyph._o.tempData) return

		const glyphInstance = new CustomGlyph(targetGlyph)
		const _glyph = glyphInstance._glyph
		for (let i = 0; i < targetGlyph.components.length; i++) {
			if (targetGlyph.components[i].type === 'glyph') {
				executeScript(targetGlyph.components[i].value)
			}
		}
		window.glyph = glyphInstance
    // @ts-ignore
		constantsMap.update(constants.value)
		window.constantsMap = constantsMap
		try {
			const script = getScript(targetGlyph)
			const fn = new Function(`${script}\nscript_${targetGlyph.uuid.replaceAll('-', '_')} (glyph, constantsMap, FP)`)
			fn()
		} catch (e) {
			console.error(e)
		}

		window.glyph = null
		window.constantsMap = null
	} catch (e) {
		console.warn(e)
	}
}

export {
  editCharacterFile,
  characters,
  glyphs,
  constants,
  orderedListWithItemsForCurrentCharacterFile,
  renderPreview,
  gridSettings,
  executeScript,
  updateCharactersAndPreview,
  initPlayground,
  constantsMap,
  exportFont,
}