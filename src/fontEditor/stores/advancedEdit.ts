import { computed, nextTick, ref } from 'vue'
import { orderedListWithItemsForCharacterFile, selectedFile, visibleCount } from './files'
import * as R from 'ramda'
import { renderPreview2 } from '../canvas/canvas'
import { componentsToContours } from '../../features/font'
import { CustomGlyph } from '../programming/CustomGlyph'
import { executeScript as executeScript_glyph, getGlyphByUUID, ParameterType, scripts_map, constants as globalConstants, constantsMap as globalConstantsMap, stroke_glyphs } from './glyph'
import { ConstantsMap } from '../programming/ConstantsMap'
import { emitter } from '../Event/bus'
import { loading, loaded, total } from './global'
import { genUUID } from '../../utils/string'
import paper from 'paper'
import type {
  ILine,
  ICubicBezierCurve,
  IQuadraticBezierCurve,
} from '../../fontManager'
import { PathType } from '../../fontManager'
import { genPenComponent } from '../tools/pen'
import { getBezierBoundingBox, testIntersect } from '../../utils/bezier'
import { kai_strokes, li_strokes } from '../templates/strokes_1'
export const activePanel = ref('globalVariables')

const constants = ref([])

//@ts-ignore
const constantsMap = new ConstantsMap(constants.value)


export const PanelType = {
  GlobalVariables: 'globalVariables',
  ConditionFilter: 'conditionFilter',
  Script: 'script',
  StrokeReplace: 'strokeReplace',
  StyleSwitch: 'styleSwitch',
}

export const setActivePanel = (panelType: typeof PanelType[keyof typeof PanelType]) => {
  activePanel.value = panelType
}

const sampleCharacters = ref('白日依山尽黄河入海流欲穷千里目更上一层楼')
const isEditingSample = ref(false)

const sampleCharactersList = ref([])
const originSampleCharactersList = ref([])
const updateSampleCharactersList = () => {
  sampleCharactersList.value = []
  for (let i = 0; i < selectedFile.value.characterList.length; i++) {
    const character = selectedFile.value.characterList[i]
    if(sampleCharacters.value.indexOf(character.character.text) !== -1) {
      const characterFile = R.clone(character)
      for (let i = 0; i < characterFile.components.length; i++) {
        const comp = characterFile.components[i]
        if (comp.type === 'glyph') {
          // 组件类型是glyph
          const glyph = comp.value
          const params = glyph.parameters.parameters
          for (let j = 0; j < params.length; j++) {
            const param = params[j]
            if (param.type === ParameterType.Constant) {
              param.type = ParameterType.AdvancedEditConstant
            }

            // 临时脚本
            // if (param.name === '起笔风格' && param.value !== 0) {
            //   param.type = ParameterType.AdvancedEditConstant
            //   param.value = constants.value[0].uuid
            // } else if (param.name === '起笔数值') {
            //   param.type = ParameterType.AdvancedEditConstant
            //   param.value = constants.value[1].uuid
            // } else if (param.name === '转角风格') {
            //   param.type = ParameterType.AdvancedEditConstant
            //   param.value = constants.value[2].uuid
            // } else if (param.name === '转角数值') {
            //   param.type = ParameterType.AdvancedEditConstant
            //   param.value = constants.value[3].uuid
            // } else if (param.name === '字重变化') {
            //   param.type = ParameterType.AdvancedEditConstant
            //   param.value = constants.value[4].uuid
            // } else if (param.name === '弯曲程度') {
            //   param.type = ParameterType.AdvancedEditConstant
            //   param.value = constants.value[5].uuid
            // } else if (param.name === '字重') {
            //   param.type = ParameterType.AdvancedEditConstant
            //   param.value = constants.value[6].uuid
            // }

          }
        }
      }
      sampleCharactersList.value.push(characterFile)
    }
  }
  originSampleCharactersList.value = R.clone(sampleCharactersList.value)
}

const updateCharactersAndPreview = () => {
  for (let i = 0; i < sampleCharactersList.value.length; i++) {
    const character = sampleCharactersList.value[i]
    // 获取字符预览canvas
    const canvas: HTMLCanvasElement = document.getElementById(`advanced-edit-preview-canvas-${character.uuid}`) as HTMLCanvasElement
    if (!canvas) return
    const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(orderedListWithItemsForCharacterFile(character), {
      unitsPerEm: selectedFile.value.fontSettings.unitsPerEm,
      descender: selectedFile.value.fontSettings.descender,
      advanceWidth: selectedFile.value.fontSettings.advanceWidth,
      advancedEdit: true,
    }, { x: 0, y: 0 }, false, true, true)
    // 渲染字符
    renderPreview2(canvas, contours)
  }
}

const updateCharactersList = () => {
  total.value = selectedFile.value.characterList.length + Math.min(visibleCount.value, selectedFile.value.characterList.length)
  loaded.value = 0
  loading.value = true
  globalConstants.value = R.clone(constants.value)
  globalConstantsMap.update(globalConstants.value)

  let i = 0

  const update = () => {
    loaded.value++
    const character = selectedFile.value.characterList[i]
    const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(orderedListWithItemsForCharacterFile(character), {
      unitsPerEm: selectedFile.value.fontSettings.unitsPerEm,
      descender: selectedFile.value.fontSettings.descender,
      advanceWidth: selectedFile.value.fontSettings.advanceWidth,
    }, { x: 0, y: 0 }, false, true, true)

    // i递增
    i++
    // 如果没有渲染完毕，调用requestAnimationFrame对下一个字符渲染进行回调
    if (i < selectedFile.value.characterList.length) {
      if (i % 100 === 0) {
        requestAnimationFrame(update)
      } else {
        update()
      }
    } else {
      emitter.emit('renderPreviewCanvas')
      return
    }
    return
  }

  // 调用requestAnimationFrame更新第一个字符
  requestAnimationFrame(update)

  // loading.value = false
  // loaded.value = 0
  // total.value = 0
}

const editChar = (uuid) => {
}

// 生成字符渲染模板
// generate character template
const generateCharacterTemplate = (characterFile) => {
	const root = document.getElementById('playground-character-template').querySelector('.char-preview').cloneNode(true);
	(root as HTMLElement).className = `character-preview character-${characterFile.uuid}`;
	(root as HTMLElement).querySelector('.playground-preview-canvas').id = `advanced-edit-preview-canvas-${characterFile.uuid}`;
	(root as HTMLElement).addEventListener('click', () => editChar(characterFile.uuid))
	return root
}

const updatePreviewList = () => {
  const wrapper = document.getElementById('advanced-edit-characters-list')
  wrapper.innerHTML = ''
  sampleCharactersList.value.map((characterFile) => {
    wrapper.appendChild(generateCharacterTemplate(characterFile))
    // 获取字符预览canvas
    const canvas: HTMLCanvasElement = document.getElementById(`advanced-edit-preview-canvas-${characterFile.uuid}`) as HTMLCanvasElement
    if (!canvas) return
    // 将字符数据处理成预览模式
    const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(orderedListWithItemsForCharacterFile(characterFile), {
      unitsPerEm: selectedFile.value.fontSettings.unitsPerEm,
      descender: selectedFile.value.fontSettings.descender,
      advanceWidth: selectedFile.value.fontSettings.advanceWidth,
      advancedEdit: true,
    }, { x: 0, y: 0 }, false, true, true)
    // 渲染字符
    renderPreview2(canvas, contours)
  })
}

const getScript = (glyph) => {
	if (glyph.script) return glyph.script
	else if (glyph.script_reference) {
		if (scripts_map[glyph.script_reference]) return scripts_map[glyph.script_reference]
		else {
			const origin_glyph = getGlyphByUUID(glyph.script_reference)
			if (origin_glyph.script) return origin_glyph.script
		}
	}
	return null
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

// 笔画替换相关变量与方法
const selectedStrokeUUID = ref(null)
const selectedStroke = computed(() => {
  return strokeList.value.find(stroke => stroke.uuid === selectedStrokeUUID.value)
})
const strokeMap = new Map()
const strokeList = ref([])
const onStrokeReplacement = ref(false)

// 从当前字符列表中获取所有笔画类型
const getStrokeList = () => {
  for (let i = 0; i < selectedFile.value.characterList.length; i++) {
    const components = selectedFile.value.characterList[i].components
    for (let j = 0; j < components.length; j++) {
      const component = components[j]
      if (component.type === 'glyph') {
        const uuid = component.value.uuid
        if (!strokeMap.has(uuid)) {
          const glyph = getGlyphByUUID(uuid)
          if (glyph) {
            strokeMap.set(uuid, glyph)
            strokeList.value.push({
              uuid,
              name: component.value.name,
              style: component.value.style,
              replaced: false,
              replacement: null,
              currentUUID: uuid
            })
          }
        }
      }
    }
  }
}

const renderStrokePreview = (uuid?: string) => {
  if (!uuid) {
    for (let i = 0; i < strokeList.value.length; i++) {
      const stroke = strokeList.value[i]
      const canvasList: NodeListOf<HTMLCanvasElement> = document.querySelectorAll(`.stroke-preview-${stroke.uuid}`) as NodeListOf<HTMLCanvasElement>
      if (!canvasList) return
      for (let j = 0; j < canvasList.length; j++) {
        const canvas = canvasList[j]
        if (!canvas) return
        const glyph = strokeMap.get(stroke.uuid)
        if (!glyph._o) {
          executeScript_glyph(glyph)
        }
        const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(glyph._o.components, {
          unitsPerEm: 1000,
          descender: -200,
          advanceWidth: 1000,
        }, { x: 0, y: 0 }, true, true)
        renderPreview2(canvas, contours)
      }
    }
  } else {
    const canvasList: NodeListOf<HTMLCanvasElement> = document.querySelectorAll(`.stroke-preview-${uuid}`) as NodeListOf<HTMLCanvasElement>
    if (!canvasList) return
    for (let j = 0; j < canvasList.length; j++) {
      const canvas = canvasList[j]
      if (!canvas) return
      const glyph = strokeMap.get(uuid)
      if (!glyph._o) {
        executeScript_glyph(glyph)
      }
      const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(glyph._o.components, {
        unitsPerEm: 1000,
        descender: -200,
        advanceWidth: 1000,
      }, { x: 0, y: 0 }, true, true)
      renderPreview2(canvas, contours)
    }
  }
}

const setReplacementStroke = async (uuid: string) => {
  if (selectedStroke.value.replaced) {
    selectedStroke.value.currentUUID = selectedStroke.value.replacement.uuid
  }
  selectedStroke.value.replaced = true
  const targetGlyph = getGlyphByUUID(uuid)
  strokeMap.set(uuid, targetGlyph)
  selectedStroke.value.replacement = {
    uuid,
    name: targetGlyph.name,
    style: targetGlyph.style,
  }
  updateCharactersAndPreview_strokeReplace()
  await nextTick()
  renderStrokePreview(uuid)
}

const replaceStrokeForCharacter = (characterFile, stroke) => {
  const orginStrokeUUID = stroke.uuid
  const targetStrokeUUID = stroke.replacement.uuid
  const targetStrokeGlyph = strokeMap.get(targetStrokeUUID)
  for (let i = 0; i < characterFile.components.length; i++) {
    const component = characterFile.components[i]
    if (component.type === 'glyph' && component.value.uuid === orginStrokeUUID) {
      const glyph = R.clone(targetStrokeGlyph)
      for (let j = 0; j < glyph.parameters.parameters.length; j++) {
        const parameter = glyph.parameters.parameters[j]
        const originParameter = component.value.parameters.parameters.find(_parameter => _parameter.name === parameter.name)
        if (originParameter.type !== ParameterType.Constant && originParameter.type !== ParameterType.AdvancedEditConstant) {
          parameter.value = originParameter.value
        } else if (originParameter.type === ParameterType.AdvancedEditConstant) {
          parameter.type = ParameterType.AdvancedEditConstant
          parameter.value = originParameter.value
        } else if (originParameter.type === ParameterType.Constant) {
          parameter.type = ParameterType.Constant
          parameter.value = originParameter.value
        }
      }
      component.value = glyph
      executeScript_glyph(glyph)
    }
  }
}

const replaceStrokesForCharacter = (characterFile) => {
  for (let i = 0; i < strokeList.value.length; i++) {
    const stroke = strokeList.value[i]
    if (stroke.replaced) {
      replaceStrokeForCharacter(characterFile, stroke)
    }
  }
}

const updatePreviewList_strokeReplace = () => {
  const wrapper = document.getElementById('advanced-edit-characters-list')
  wrapper.innerHTML = ''
  sampleCharactersList.value = []
  originSampleCharactersList.value.map((characterFile) => {
    wrapper.appendChild(generateCharacterTemplate(characterFile))
    // 获取字符预览canvas
    const canvas: HTMLCanvasElement = document.getElementById(`advanced-edit-preview-canvas-${characterFile.uuid}`) as HTMLCanvasElement
    if (!canvas) return

    const _characterFile = R.clone(characterFile)

    replaceStrokesForCharacter(_characterFile)

    sampleCharactersList.value.push(_characterFile)

    // 将字符数据处理成预览模式
    const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(orderedListWithItemsForCharacterFile(_characterFile), {
      unitsPerEm: selectedFile.value.fontSettings.unitsPerEm,
      descender: selectedFile.value.fontSettings.descender,
      advanceWidth: selectedFile.value.fontSettings.advanceWidth,
      advancedEdit: false,
    }, { x: 0, y: 0 }, false, true, true)
    // 渲染字符
    renderPreview2(canvas, contours)
  })
}

const updateCharactersAndPreview_strokeReplace = () => {
  sampleCharactersList.value = []
  for (let i = 0; i < originSampleCharactersList.value.length; i++) {
    const character = R.clone(originSampleCharactersList.value[i])
    // 获取字符预览canvas
    const canvas: HTMLCanvasElement = document.getElementById(`advanced-edit-preview-canvas-${character.uuid}`) as HTMLCanvasElement
    if (!canvas) return

    replaceStrokesForCharacter(character)

    sampleCharactersList.value.push(character)

    const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(orderedListWithItemsForCharacterFile(character), {
      unitsPerEm: selectedFile.value.fontSettings.unitsPerEm,
      descender: selectedFile.value.fontSettings.descender,
      advanceWidth: selectedFile.value.fontSettings.advanceWidth,
      advancedEdit: false,
    }, { x: 0, y: 0 }, false, true, true)
    // 渲染字符
    renderPreview2(canvas, contours)
  }
}

const updateCharactersList_strokeReplace = () => {
  total.value = selectedFile.value.characterList.length + Math.min(visibleCount.value, selectedFile.value.characterList.length)
  loaded.value = 0
  loading.value = true
  globalConstants.value = R.clone(constants.value)
  globalConstantsMap.update(globalConstants.value)

  let i = 0

  const update = () => {
    loaded.value++
    const character = selectedFile.value.characterList[i]

    replaceStrokesForCharacter(character)

    const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(orderedListWithItemsForCharacterFile(character), {
      unitsPerEm: selectedFile.value.fontSettings.unitsPerEm,
      descender: selectedFile.value.fontSettings.descender,
      advanceWidth: selectedFile.value.fontSettings.advanceWidth,
    }, { x: 0, y: 0 }, false, true, true)

    // i递增
    i++
    // 如果没有渲染完毕，调用requestAnimationFrame对下一个字符渲染进行回调
    if (i < selectedFile.value.characterList.length) {
      if (i % 100 === 0) {
        requestAnimationFrame(update)
      } else {
        update()
      }
    } else {
      emitter.emit('renderPreviewCanvas')
      return
    }
    return
  }

  // 调用requestAnimationFrame更新第一个字符
  requestAnimationFrame(update)

  // loading.value = false
  // loaded.value = 0
  // total.value = 0
}

// 切换风格相关变量与方法
const selectedStyleUUID = ref('default')
const selectedStyle = computed(() => {
  return styles.value.find(style => style.uuid === selectedStyleUUID.value)
})
const styles = ref([])

const getStrokeListByStyle = (style) => {
  const strokeList = []
  for (let i = 0; i < stroke_glyphs.value.length; i++) {
    if (stroke_glyphs.value[i].style === style.strokeStyle) {
      strokeList.push(stroke_glyphs.value[i])
    }
  }
  return strokeList
}

const switchStyle_init = (style) => {
  // 替换全局变量
  for (let i = 0; i < style.constants.length; i++) {
    for (let j = 0; j < constants.value.length; j++) {
      const constant = constants.value[j]
      if (constant.name === style.constants[i].name) {
        constant.value = style.constants[i].value
      }
    }
  }
}

const switchStyle = (characterFile, style) => {
  if (!style) return
  // 替换全局变量
  for (let i = 0; i < style.constants.length; i++) {
    for (let j = 0; j < constants.value.length; j++) {
      const constant = constants.value[j]
      if (constant.name === style.constants[i].name) {
        constant.value = style.constants[i].value
      }
    }
  }
  // 替换笔画
  const strokeList = getStrokeListByStyle(style)
  for (let i = 0; i < strokeList.length; i++) {
    const strokeGlyph = strokeList[i]
    const strokeName = strokeGlyph.name
    for (let i = 0; i < characterFile.components.length; i++) {
      const component = characterFile.components[i]
      if (component.type === 'glyph' && component.value.name === strokeName) {
        const glyph = R.clone(strokeGlyph)
        for (let j = 0; j < glyph.parameters.parameters.length; j++) {
          const parameter = glyph.parameters.parameters[j]
          const originParameter = component.value.parameters.parameters.find(_parameter => _parameter.name === parameter.name)
          if (originParameter && originParameter.type !== ParameterType.AdvancedEditConstant) {
            // 替换参数
            let parameterReplaced = false
            for (let i = 0; i < style.parameters.length; i++) {
              //const parameter = component.value.parameters.parameters[j]
              if (parameter.name === style.parameters[i].name) {
                parameter.value = style.parameters[i].value
                parameterReplaced = true
              }
            }
            if (!parameterReplaced) {
              parameter.value = originParameter.value
            }
          } else if (originParameter && originParameter.type === ParameterType.AdvancedEditConstant) {
            parameter.type = ParameterType.AdvancedEditConstant
            parameter.value = originParameter.value
          }
        }
        component.value = glyph
        executeScript_glyph(glyph)
      }
    }
  }
}

const switchStyle2 = (characterFile, style) => {
  // 替换笔画
  const strokeList = getStrokeListByStyle(style)
  for (let i = 0; i < strokeList.length; i++) {
    const strokeGlyph = strokeList[i]
    const strokeName = strokeGlyph.name
    for (let i = 0; i < characterFile.components.length; i++) {
      const component = characterFile.components[i]
      if (component.type === 'glyph' && component.value.name === strokeName) {
        const glyph = R.clone(strokeGlyph)
        for (let j = 0; j < glyph.parameters.parameters.length; j++) {
          const parameter = glyph.parameters.parameters[j]
          const originParameter = component.value.parameters.parameters.find(_parameter => _parameter.name === parameter.name)
          if (originParameter && originParameter.type !== ParameterType.Constant) {
            // 替换参数
            let parameterReplaced = false
            for (let i = 0; i < style.parameters.length; i++) {
              if (parameter.name === style.parameters[i].name) {
                parameter.value = style.parameters[i].value
                parameterReplaced = true
              }
            }
            if (!parameterReplaced) {
              parameter.value = originParameter.value
            }
          } else if (originParameter && originParameter.type === ParameterType.Constant) {
            parameter.type = ParameterType.Constant
            parameter.value = originParameter.value
          }
        }
        component.value = glyph
        executeScript_glyph(glyph)
      }
    }
  }
}

const updatePreviewList_styleSwitch = () => {
  sampleCharactersList.value = []
  const style = styles.value.find(style => style.uuid === selectedStyleUUID.value)
  const wrapper = document.getElementById('advanced-edit-characters-list')
  wrapper.innerHTML = ''
  originSampleCharactersList.value.map((characterFile) => {
    wrapper.appendChild(generateCharacterTemplate(characterFile))
    // 获取字符预览canvas
    const canvas: HTMLCanvasElement = document.getElementById(`advanced-edit-preview-canvas-${characterFile.uuid}`) as HTMLCanvasElement
    if (!canvas) return

    const _characterFile = R.clone(characterFile)

    switchStyle(_characterFile, style)
    
    sampleCharactersList.value.push(_characterFile)

    // 将字符数据处理成预览模式
    const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(orderedListWithItemsForCharacterFile(characterFile), {
      unitsPerEm: selectedFile.value.fontSettings.unitsPerEm,
      descender: selectedFile.value.fontSettings.descender,
      advanceWidth: selectedFile.value.fontSettings.advanceWidth,
      advancedEdit: false,
    }, { x: 0, y: 0 }, false, true, true)
    // 渲染字符
    renderPreview2(canvas, contours)
  })
}

const updateCharactersAndPreview_styleSwitch = () => {
  sampleCharactersList.value = []
  const style = styles.value.find(style => style.uuid === selectedStyleUUID.value)

  if (style.name === '字玩标准宋体') {
    process_characters_song()
  } else if (style.name === '字玩标准仿宋') {
    process_characters_fangsong()
  } else if (style.name === '字玩标准楷体') {
    process_characters_kai()
  } else if (style.name === '字玩标准隶书') {
    process_characters_li()
  }

  for (let i = 0; i < originSampleCharactersList.value.length; i++) {
    const character = R.clone(originSampleCharactersList.value[i])
    // 获取字符预览canvas
    const canvas: HTMLCanvasElement = document.getElementById(`advanced-edit-preview-canvas-${character.uuid}`) as HTMLCanvasElement
    if (!canvas) return

    if (style.name === '字玩标准仿宋') {
      process_character_fangsong(character)
    } else if (style.name === '字玩标准楷体') {
      process_character_kai(character)
    } else if (style.name === '字玩标准隶书') {
      process_character_li(character)
    }

    switchStyle(character, style)

    if (style.name === '字玩标准宋体') {
      process_character_song(character)
    }
  
    sampleCharactersList.value.push(character)

    let components = orderedListWithItemsForCharacterFile(character)
    if (character.final_components) {
      components = character.final_components
    }

    const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(components, {
      unitsPerEm: selectedFile.value.fontSettings.unitsPerEm,
      descender: selectedFile.value.fontSettings.descender,
      advanceWidth: selectedFile.value.fontSettings.advanceWidth,
      advancedEdit: false,
    }, { x: 0, y: 0 }, false, true, true)

    // 渲染字符
    renderPreview2(canvas, contours)
  }
}

const updateCharactersList_styleSwitch = () => {
  const style = styles.value.find(style => style.uuid === selectedStyleUUID.value)

  // 初始化全局变量
  switchStyle_init(style)

  if (style.name === '字玩标准宋体') {
    process_characters_song()
  } else if (style.name === '字玩标准仿宋') {
    process_characters_fangsong()
  } else if (style.name === '字玩标准楷体') {
    process_characters_kai()
  } else if (style.name === '字玩标准隶书') {
    process_characters_li()
  }
  
  total.value = selectedFile.value.characterList.length + Math.min(visibleCount.value, selectedFile.value.characterList.length)
  loaded.value = 0
  loading.value = true
  globalConstants.value = R.clone(constants.value)
  globalConstantsMap.update(globalConstants.value)

  let i = 0

  const update = () => {
    loaded.value++
    const character = selectedFile.value.characterList[i]

    if (style.name === '字玩标准仿宋') {
      process_character_fangsong(character)
    } else if (style.name === '字玩标准楷体') {
      process_character_kai(character)
    } else if (style.name === '字玩标准隶书') {
      process_character_li(character)
    }

    switchStyle2(character, style)

    if (style.name === '字玩标准宋体') {
      process_character_song(character)
    }

    let components = orderedListWithItemsForCharacterFile(character)
    if (character.final_components) {
      components = character.final_components
    }

    const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(orderedListWithItemsForCharacterFile(character), {
      unitsPerEm: selectedFile.value.fontSettings.unitsPerEm,
      descender: selectedFile.value.fontSettings.descender,
      advanceWidth: selectedFile.value.fontSettings.advanceWidth,
    }, { x: 0, y: 0 }, false, true, true)

    // i递增
    i++
    // 如果没有渲染完毕，调用requestAnimationFrame对下一个字符渲染进行回调
    if (i < selectedFile.value.characterList.length) {
      if (i % 100 === 0) {
        requestAnimationFrame(update)
      } else {
        update()
      }
    } else {
      emitter.emit('renderPreviewCanvas')
      return
    }
    return
  }

  // 调用requestAnimationFrame更新第一个字符
  requestAnimationFrame(update)

  // loading.value = false
  // loaded.value = 0
  // total.value = 0
}

const getParam = (param) => {
  if (param.type === ParameterType.Constant) {
    return globalConstants.value.find(constant => constant.uuid === param.value).value
  } else if (param.type === ParameterType.AdvancedEditConstant) {
    return constants.value.find(constant => constant.uuid === param.value).value
  } else {
    return param.value
  }
}

const addParam = (glyph, name, value, type) => {
  const _param = glyph.parameters.parameters.find(param => param.name === name)
  if (_param) {
    _param.value = value
    return
  }
  const param: any = {
    uuid: genUUID(),
    name,
    value,
    type,
  }
  glyph.parameters.parameters.push(param)
  return param
}

const test_process_characters = (characters) => {
  for (let i = 0; i < characters.length; i++) {
    const characterFile = characters[i]
    test_process_character(characterFile)
  }
}

const getPaperCurvesPoints = (curves) => {
  if (!curves.length) return []
  const points = []
  points.push({
    uuid: genUUID(),
    type: 'anchor',
    x: curves[0].points[0].x,
    y: curves[0].points[0].y,
    origin: null,
    isShow: true,
  })
  for (let i = 0; i < curves.length; i++) {
    const curve = curves[i]
    const uuid2 = genUUID()
    const uuid3 = genUUID()
    const uuid4 = genUUID()
    points.push({
      uuid: uuid2,
      type: 'control',
      x: curve.points[1].x,
      y: curve.points[1].y,
      origin: points[points.length - 1].uuid,
      isShow: true,
    })
    points.push({
      uuid: uuid3,
      type: 'control',
      x: curve.points[2].x,
      y: curve.points[2].y,
      origin: uuid4,
      isShow: true,
    })
    points.push({
      uuid: uuid4,
      type: 'anchor',
      x: curve.points[3].x,
      y: curve.points[3].y,
      origin: null,
      isShow: true,
    })
  }
  return points
}

const process_characters_song = () => {
  constants.value.find(constant => constant.name === '起笔风格').value = 1
  constants.value.find(constant => constant.name === '起笔数值').value = 2
  constants.value.find(constant => constant.name === '转角风格').value = 1
  constants.value.find(constant => constant.name === '转角数值').value = 2
  globalConstants.value.find(constant => constant.name === '起笔风格').value = 1
  globalConstants.value.find(constant => constant.name === '起笔数值').value = 2
  globalConstants.value.find(constant => constant.name === '转角风格').value = 1
  globalConstants.value.find(constant => constant.name === '转角数值').value = 2
}

const process_character_song = (characterFile) => {
  for (let j = 0; j < characterFile.components.length; j++) {
    const component = characterFile.components[j]
    if (component.type === 'glyph') {
      const glyph = component.value
      glyph.parameters.parameters.forEach(parameter => {
        if (parameter.name === '起笔风格') {
          const value = getParam(parameter)
          if (value === 0) {
            // 无起笔样式，则添加无收笔衬线参数
            const __param = addParam(glyph, '收笔风格', 0, ParameterType.Enum)
          }
        }
      })
    }
  }
}


const process_characters_fangsong = () => {
  constants.value.find(constant => constant.name === '起笔风格').value = 1
  constants.value.find(constant => constant.name === '起笔数值').value = 2
  constants.value.find(constant => constant.name === '转角风格').value = 1
  constants.value.find(constant => constant.name === '转角数值').value = 2
  globalConstants.value.find(constant => constant.name === '起笔风格').value = 1
  globalConstants.value.find(constant => constant.name === '起笔数值').value = 2
  globalConstants.value.find(constant => constant.name === '转角风格').value = 1
  globalConstants.value.find(constant => constant.name === '转角数值').value = 2
}

const process_character_fangsong = (characterFile) => {
  for (let j = 0; j < characterFile.components.length; j++) {
    const component = characterFile.components[j]
    if (component.type === 'glyph') {
      const glyph = component.value
      glyph.parameters.parameters.forEach(parameter => {
        if (parameter.name === '起笔风格') {
          const value = getParam(parameter)
          if (value === 0) {
            // 无起笔样式，则添加无收笔衬线参数
            addParam(glyph, '收笔风格', 0, ParameterType.Enum)
          }
        }
      })
      const stroke = kai_strokes.find(stroke => stroke.name === glyph.name)
      if (stroke) {
        stroke.params.map((param) => {
          const _param = glyph.parameters.parameters.find(parameter => parameter.name === param.name)
          if (param.originParam) {
            const __param = glyph.parameters.parameters.find(parameter => parameter.name === param.originParam)
            __param.name = param.name
            __param.min = param.min
            __param.max = param.max
          } else if (!_param) {
            const __param = addParam(glyph, param.name, param.default, ParameterType.Number)
            __param.min = param.min
            __param.max = param.max
          }
        })
      }
    }
  }
}

const process_characters_kai = () => {
  constants.value.find(constant => constant.name === '起笔风格').value = 1
  constants.value.find(constant => constant.name === '起笔数值').value = 2
  constants.value.find(constant => constant.name === '转角风格').value = 1
  constants.value.find(constant => constant.name === '转角数值').value = 2
  globalConstants.value.find(constant => constant.name === '起笔风格').value = 1
  globalConstants.value.find(constant => constant.name === '起笔数值').value = 2
  globalConstants.value.find(constant => constant.name === '转角风格').value = 1
  globalConstants.value.find(constant => constant.name === '转角数值').value = 2
}

const process_character_kai = (characterFile) => {
  for (let j = 0; j < characterFile.components.length; j++) {
    const component = characterFile.components[j]
    if (component.type === 'glyph') {
      const glyph = component.value
      glyph.parameters.parameters.forEach(parameter => {
        if (parameter.name === '起笔风格') {
          const value = getParam(parameter)
          if (value === 0) {
            // 无起笔样式，则添加无收笔衬线参数
            addParam(glyph, '收笔风格', 0, ParameterType.Enum)
          }
        }
      })
      const stroke = kai_strokes.find(stroke => stroke.name === glyph.name)
      if (stroke) {
        stroke.params.map((param) => {
          const _param = glyph.parameters.parameters.find(parameter => parameter.name === param.name)
          if (param.originParam) {
            const __param = glyph.parameters.parameters.find(parameter => parameter.name === param.originParam)
            __param.name = param.name
            __param.min = param.min
            __param.max = param.max
          } else if (!_param) {
            const __param = addParam(glyph, param.name, param.default, ParameterType.Number)
            __param.min = param.min
            __param.max = param.max
          }
        })
      }
    }
  }
}

const process_characters_li = () => {
  constants.value.find(constant => constant.name === '起笔风格').value = 1
  constants.value.find(constant => constant.name === '起笔数值').value = 2
  constants.value.find(constant => constant.name === '转角风格').value = 1
  constants.value.find(constant => constant.name === '转角数值').value = 2
  globalConstants.value.find(constant => constant.name === '起笔风格').value = 1
  globalConstants.value.find(constant => constant.name === '起笔数值').value = 2
  globalConstants.value.find(constant => constant.name === '转角风格').value = 1
  globalConstants.value.find(constant => constant.name === '转角数值').value = 2
}

const process_character_li = (characterFile) => {
  for (let j = 0; j < characterFile.components.length; j++) {
    const component = characterFile.components[j]
    if (component.type === 'glyph') {
      const glyph = component.value
      glyph.parameters.parameters.forEach(parameter => {
        if (parameter.name === '起笔风格') {
          const value = getParam(parameter)
          if (value === 0) {
            // 无起笔样式，则添加无收笔衬线参数
            addParam(glyph, '收笔风格', 0, ParameterType.Enum)
          }
        }
      })
      const stroke = li_strokes.find(stroke => stroke.name === glyph.name)
      if (stroke) {
        stroke.params.map((param) => {
          const _param = glyph.parameters.parameters.find(parameter => parameter.name === param.name)
          if (param.originParam) {
            const __param = glyph.parameters.parameters.find(parameter => parameter.name === param.originParam)
            __param.name = param.name
            __param.min = param.min
            __param.max = param.max
          } else if (!_param) {
            const __param = addParam(glyph, param.name, param.default, ParameterType.Number)
            __param.min = param.min
            __param.max = param.max
          }
        })
      }
    }
  }
}

const test_process_character = (characterFile) => {
  constants.value.find(constant => constant.name === '起笔风格').value = 1
  constants.value.find(constant => constant.name === '起笔数值').value = 2
  constants.value.find(constant => constant.name === '转角风格').value = 1
  constants.value.find(constant => constant.name === '转角数值').value = 2
  globalConstants.value.find(constant => constant.name === '起笔风格').value = 1
  globalConstants.value.find(constant => constant.name === '起笔数值').value = 2
  globalConstants.value.find(constant => constant.name === '转角风格').value = 1
  globalConstants.value.find(constant => constant.name === '转角数值').value = 2
  for (let j = 0; j < characterFile.components.length; j++) {
    const component = characterFile.components[j]
    if (component.type === 'glyph') {
      const glyph = component.value
      glyph.parameters.parameters.forEach(parameter => {
        if (parameter.name === '起笔风格') {
          const value = getParam(parameter)
          if (value === 0) {
            // 无起笔样式，则添加无收笔衬线参数
            addParam(glyph, '收笔风格', 0, ParameterType.Enum)
          }
        }
      })
    }
  }

  const pathsList = []

  for (let i = 0; i < characterFile.components.length; i++) {
    const component = characterFile.components[i]
    if (component.type === 'glyph') {
      executeScript_glyph(component.value)
      if (!component.value._o.components[0] || !component.value._o.components[0].points) {
        continue
      }
      const points = component.value._o.components[0].points.map((point) => {
        const { ox, oy } = component
        return {
          x: ox + point.x,
          y: oy + point.y,
        }
      })
      pathsList[i] = {
        points,
        paths: [createOptimizedPath(points)],
      }
    }
  }

  for (let i = 0; i < characterFile.components.length; i++) {
    const component = characterFile.components[i]
    if (component.type !== 'glyph') {
      continue
    }
    const _points1 = pathsList[i].points
    let globalMark = false
    let localMark = false
    let result_points = []
    for (let j = 0; j < characterFile.components.length; j++) {
      const _component = characterFile.components[j]
      if (component.type !== 'glyph' || _component.uuid === component.uuid) {
        continue
      }
      const _points2 = pathsList[j].points
      if (testIntersect(_points1, _points2)) {
        // 两组件相交，减去第二个组件
        const path1 = createOptimizedPath(_points1)
        const path2 = pathsList[j].paths.reduce((acc, path) => acc.unite(path), new paper.Path())
        const result = path1.subtract(path2)
        if (result.children && result.children.length >= 2) {
          // 遍历children，如果boundBox大于一定值，则添加到final_components中
          for (let j = 0; j < result.children.length; j++) {
            const child = result.children[j] as paper.Path
            const points = getPaperCurvesPoints(child.curves)
            const boundingBox = getBezierBoundingBox(points)
            const threshold = 80
            if (
              boundingBox.maxX - boundingBox.minX < threshold &&
              boundingBox.maxY - boundingBox.minY < threshold
            ) {
              localMark = true
            } else {
              result_points.push(points)
            }
          }
          if (localMark) {
            localMark = false
            globalMark = true
            pathsList[i].paths = result_points.map((points) => createOptimizedPath(points))
            for (let j = 0; j < result_points.length; j++) {
              if (!characterFile.final_components) {
                characterFile.final_components = []
              }
              characterFile.final_components.push(genPenComponent(result_points[j].reverse(), true))
            }
            result_points = []
          }
          break
        }
      }
    }
    if (!globalMark) {
      if (!characterFile.final_components) {
        characterFile.final_components = []
      }
      characterFile.final_components.push(genPenComponent(_points1, true))
    }
  }

  // 绘制pie subtract na测试轮廓
  // console.log('test_process_character', characterFile.character.text)
  // if (characterFile.character.text === '入') {
  //   const pie_points = characterFile.components[0].value._o.components[0].points.map((point) => {
  //     const { ox, oy} = characterFile.components[0]
  //     return {
  //       x: ox + point.x,
  //       y: oy + point.y,
  //     }
  //   })
  //   const na_points = characterFile.components[1].value._o.components[0].points.map((point) => {
  //     const { ox, oy} = characterFile.components[1]
  //     return {
  //       x: ox + point.x,
  //       y: oy + point.y,
  //     }
  //   })
  //   console.log('pie_points', pie_points)
  //   console.log('na_points', na_points)
  //   // 使用paper.js将pie减去na
  //   const pie_path = createOptimizedPath(pie_points)
  //   const na_path = createOptimizedPath(na_points)
  //   const result = pie_path.subtract(na_path)
  //   const canvas: HTMLCanvasElement = document.getElementById('advanced-edit-canvas') as HTMLCanvasElement
  //   const ctx = canvas.getContext('2d')
    
  //   if (!ctx) return
    
  //   // 清空canvas
  //   ctx.clearRect(0, 0, canvas.width, canvas.height)
    
  //   // 设置canvas背景色和坐标系统
  //   ctx.fillStyle = '#f0f0f0'
  //   ctx.fillRect(0, 0, canvas.width, canvas.height)
    
  //   // 绘制两个path的轮廓
  //   if (result.children && result.children.length >= 2) {
  //     // 绘制第一个path (红色)
  //     ctx.strokeStyle = 'red'
  //     ctx.lineWidth = 2
  //     ctx.beginPath()
      
  //     const firstPath = result.children[0] as paper.Path
  //     console.log('第一个path segments数量:', firstPath.segments.length)
  //     console.log('第一个path bounds:', firstPath.bounds)
      
  //     if (firstPath.curves && firstPath.curves.length > 0) {
  //       for (let i = 0; i < firstPath.curves.length; i++) {
  //         const curve = firstPath.curves[i]
  //         if (i === 0) {
  //           ctx.moveTo(curve.points[0].x, curve.points[0].y)
  //         }
  //         ctx.bezierCurveTo(curve.points[1].x, curve.points[1].y, curve.points[2].x, curve.points[2].y, curve.points[3].x, curve.points[3].y)
  //       }
  //     }
  //     ctx.closePath()
  //     ctx.stroke()
      
  //     // 绘制第二个path (绿色)
  //     ctx.strokeStyle = 'green'
  //     ctx.lineWidth = 2
  //     ctx.beginPath()
      
  //     const secondPath = result.children[1] as paper.Path
  //     console.log('第二个path segments数量:', secondPath.segments.length)
  //     console.log('第二个path bounds:', secondPath.bounds)
      
  //     if (secondPath.curves && secondPath.curves.length > 0) {
  //       for (let i = 0; i < secondPath.curves.length; i++) {
  //         const curve = secondPath.curves[i]
  //         if (i === 0) {
  //           ctx.moveTo(curve.points[0].x, curve.points[0].y)
  //         }
  //         ctx.bezierCurveTo(curve.points[1].x, curve.points[1].y, curve.points[2].x, curve.points[2].y, curve.points[3].x, curve.points[3].y)
  //       }
  //     }
  //     ctx.closePath()
  //     ctx.stroke()
      
  //     console.log('第一个path (红色):', firstPath)
  //     console.log('第二个path (绿色):', secondPath)
  //   }


    // ctx.strokeStyle = 'blue'
    // ctx.lineWidth = 2
    // ctx.beginPath()
    // for (let i = 0; i < pie_path.curves.length; i++) {
    //   const curve = pie_path.curves[i]
    //   if (i === 0) {
    //     ctx.moveTo(curve.points[0].x, curve.points[0].y)
    //   }
    //   ctx.bezierCurveTo(curve.points[1].x, curve.points[1].y, curve.points[2].x, curve.points[2].y, curve.points[3].x, curve.points[3].y)
    // }
    // ctx.closePath()
    // ctx.stroke()
    // ctx.strokeStyle = 'blue'
    // ctx.lineWidth = 2
    // ctx.beginPath()
    // for (let i = 0; i < na_path.curves.length; i++) {
    //   const curve = na_path.curves[i]
    //   if (i === 0) {
    //     ctx.moveTo(curve.points[0].x, curve.points[0].y)
    //   }
    //   ctx.bezierCurveTo(curve.points[1].x, curve.points[1].y, curve.points[2].x, curve.points[2].y, curve.points[3].x, curve.points[3].y)
    // }
    // ctx.closePath()
    // ctx.stroke()


    // console.log('subtract result', result, pie_path, na_path)
    // debugger
  // }
}

// 优化后的路径创建函数
const createOptimizedPath = (points: Array<IPoint>): paper.Path => {
  const path = new paper.Path()
  
  if (points.length === 0) return path
  
  // 移动到起始点
  const startPoint = new paper.Point(points[0].x, points[0].y)
  path.moveTo(startPoint)

  for (let j = 0; j < points.length - 1; j += 3) {
    const control1 = new paper.Point(points[j + 1].x, points[j + 1].y)
    const control2 = new paper.Point(points[j + 2].x, points[j + 2].y)
    const endPoint = new paper.Point(points[j + 3].x, points[j + 3].y)
    path.cubicCurveTo(control1, control2, endPoint)
  }

  path.closePath()
  return path
}

export {
  sampleCharacters,
  isEditingSample,
  sampleCharactersList,
  updatePreviewList,
  updateSampleCharactersList,
  updateCharactersAndPreview,
  executeScript,
  constants,
  constantsMap,
  updateCharactersList,
  strokeList,
  onStrokeReplacement,
  getStrokeList,
  renderStrokePreview,
  selectedStrokeUUID,
  selectedStroke,
  strokeMap,
  setReplacementStroke,
  replaceStrokeForCharacter,
  replaceStrokesForCharacter,
  updatePreviewList_strokeReplace,
  updateCharactersAndPreview_strokeReplace,
  updateCharactersList_strokeReplace,
  selectedStyleUUID,
  selectedStyle,
  styles,
  updatePreviewList_styleSwitch,
  updateCharactersAndPreview_styleSwitch,
  updateCharactersList_styleSwitch,
  originSampleCharactersList,
}