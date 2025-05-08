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
import { strokes as hei_strokes } from '../templates/strokes_1'
import { ParametersMap } from "../programming/ParametersMap"
import { IParameter } from "./glyph"
import paper from 'paper'

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
  const base = ''
  // const base = '/fontplayer_demo/'
  characters.value = []
  window.FP = FP
  const wrapper = document.getElementById('playground-characters-list')
  wrapper.innerHTML = ''
  const res = await fetch(base + `templates/playground.json`)
  const data = JSON.parse(await res.text())

  for (let i = 0; i < hei_strokes.length; i++) {
    const stroke = hei_strokes[i]
    const { name, params, uuid } = stroke
    let stroke_script_res = await fetch(base + `templates/templates2/${name}.js`)
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

const exportFont = () => {
  if (loading.value) return
  loading.value = true
  computeOverlapRemovedContours()
  const font = createFont()
  //@ts-ignore
  if (!!window.__TAURI_INTERNALS__) {
    const buffer = toArrayBuffer(font) as ArrayBuffer
    const filename = `登鹳雀楼.otf`
    nativeSaveBinary(buffer, filename, ['otf'])
    loading.value = false
  } else {
    const dataView = new DataView(toArrayBuffer(font) as ArrayBuffer)
    const blob = new Blob([dataView], {type: 'font/opentype'})
    var zip = new JSZip()
    zip.file(`登鹳雀楼.otf`, blob)
    zip.generateAsync({type:"blob"}).then(function(content: any) {
      saveAs(content, `登鹳雀楼.zip`)
      loading.value = false
    })
  }
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
  
    // 将轮廓转换成Path
    let paths = []
    for (let i = 0; i < contours.length; i++) {
      const contour = contours[i]
      let path = new paper.Path()
      path.moveTo(new paper.Point(contour[0].start.x, contour[0].start.y))
      for (let j = 0; j < contour.length; j++) {
        const _path = contour[j]
        if (_path.type === PathType.LINE) {
          path.lineTo(new paper.Point((_path as unknown as ILine).end.x, (_path as unknown as ILine).end.y))
        } else if (_path.type === PathType.CUBIC_BEZIER) {
          path.cubicCurveTo(
            new paper.Point(
              (_path as unknown as ICubicBezierCurve).control1.x,
              (_path as unknown as ICubicBezierCurve).control1.y,
            ),
            new paper.Point(
              (_path as unknown as ICubicBezierCurve).control2.x,
              (_path as unknown as ICubicBezierCurve).control2.y,
            ),
            new paper.Point(
              (_path as unknown as ICubicBezierCurve).end.x,
              (_path as unknown as ICubicBezierCurve).end.y,
            )
          )
        }
      }
      paths.push(path)
    }

    // 合并路径，去除重叠
    let unitedPath = null
    if (paths.length < 2) {
      unitedPath = paths[1]
    } else {
      unitedPath = paths[0].unite(paths[1])
      for (let i = 2; i < paths.length; i++) {
        unitedPath = unitedPath.unite(paths[i])
      }
    }

    if (!unitedPath) return

    // 根据合并路径生成轮廓数据
    let overlap_removed_contours = []
    if (unitedPath.children && unitedPath.children.length) {
      for (let i = 0; i < unitedPath.children.length; i++) {
        const paths = unitedPath.children[i]
        if (!paths.curves.length) continue
        const contour = []
        for (let j = 0; j < paths.curves.length; j++) {
          const curve = paths.curves[j]
          const path = {
            type: PathType.CUBIC_BEZIER,
            start: { x: curve.points[0].x, y: curve.points[0].y },
            control1: { x: curve.points[1].x, y: curve.points[1].y },
            control2: { x: curve.points[2].x, y: curve.points[2].y },
            end: { x: curve.points[3].x, y: curve.points[3].y },
          }
          contour.push(path)
        }
        overlap_removed_contours.push(contour)
      }
    } else if (unitedPath.curves) {
      const paths = unitedPath
      if (!paths.curves.length) return
      const contour = []
      for (let j = 0; j < paths.curves.length; j++) {
        const curve = paths.curves[j]
        const path = {
          type: PathType.CUBIC_BEZIER,
          start: { x: curve.points[0].x, y: curve.points[0].y },
          control1: { x: curve.points[1].x, y: curve.points[1].y },
          control2: { x: curve.points[2].x, y: curve.points[2].y },
          end: { x: curve.points[3].x, y: curve.points[3].y },
        }
        contour.push(path)
      }
      overlap_removed_contours.push(contour)
    }

    char.overlap_removed_contours = overlap_removed_contours
  }
}

const createFont = () => {
  const _width = 1000
  const _height = 1000
  const fontCharacters = [{
    unicode: 0,
    name: '.notdef',
    contours: [[]] as Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>,
    contourNum: 0,
    advanceWidth: Math.max(_width, _height),
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
      contours: [[]],
      contourNum: 0,
    })
  }

  fontCharacters.sort((a: any, b: any) => {
    return a.unicode - b.unicode
  })
  const font = create(fontCharacters, {
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