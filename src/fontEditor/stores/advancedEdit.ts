import { ref } from 'vue'
import { orderedListWithItemsForCharacterFile, selectedFile } from './files'
import * as R from 'ramda'
import { renderPreview2 } from '../canvas/canvas'
import { componentsToContours } from '../../features/font'
import { CustomGlyph } from '../programming/CustomGlyph'
import { getGlyphByUUID, ParameterType, scripts_map, constants as globalConstants, constantsMap as globalConstantsMap } from './glyph'
import { ConstantsMap } from '../programming/ConstantsMap'
import { emitter } from '../Event/bus'
import { loading, loaded, total } from './global'

export const activePanel = ref('globalVariables')

const constants = ref([])

//@ts-ignore
const constantsMap = new ConstantsMap(constants.value)


export const PanelType = {
  GlobalVariables: 'globalVariables',
  ConditionFilter: 'conditionFilter',
  Script: 'script',
}

export const setActivePanel = (panelType: typeof PanelType[keyof typeof PanelType]) => {
  activePanel.value = panelType
}

const sampleCharacters = ref('白日依山尽黄河入海流欲穷千里目更上一层楼')
const isEditingSample = ref(false)

const sampleCharactersList = ref([])
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
  total.value = selectedFile.value.characterList.length * 2
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
  updateCharactersList
}