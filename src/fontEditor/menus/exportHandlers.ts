import {
  setExportFontTauriDialogVisible,
  setExportFontDialogVisible,
  setExportVarFontTauriDialogVisible,
  setExportVarFontDialogVisible,
  setExportColorFontTauriDialogVisible,
  setExportColorFontDialogVisible,
} from '../stores/dialogs'
import {
  selectedFile, editCharacterFile,
  orderedListWithItemsForCurrentCharacterFile,
  ICharacterFile,
  orderedListWithItemsForCharacterFile,
  addComponentForCurrentCharacterFile,
} from '../stores/files'
import { base, canvas, fontRenderStyle, loaded, loadingMsg, total, useFixedCurves } from '../stores/global'
import { saveAs } from 'file-saver'
import * as R from 'ramda'
import { ElMessageBox } from 'element-plus'
import { componentsToSvg } from '../../features/svg'
import { create, toArrayBuffer } from '../../fontManager'
import type {
  ILine,
  ICubicBezierCurve,
  IQuadraticBezierCurve,
} from '../../fontManager'
import {
  componentsToContours,
  componentsToContours2,
  formatPoints,
  contoursToComponents,
} from '../../features/font'
import { emitter } from '../Event/bus'
import {
  Status,
  editStatus,
} from '../stores/font'
import { render } from '../canvas/canvas'
import { addComponentForCurrentGlyph, comp_glyphs, constantGlyphMap, constants, constantsMap, editGlyph, executeScript, glyphs, radical_glyphs, stroke_glyphs } from '../stores/glyph'
import { loading } from '../stores/global'
import paper from 'paper'
import { ENV } from '../stores/system'
import { i18n } from '../../i18n'
import { base64ToArrayBuffer, mapToObject, nativeSaveBinary, nativeSaveText, plainGlyph } from './fileHandlers'
import JSZip from 'jszip'
import { createOptimizedPath, isAlreadyOptimized, mergePathsWithPrecision } from './remove_overlap'
import { removeOverlapWithWasm } from '@/utils/overlap-remover'
import { PathType } from '../../fontManager'

interface CreateFontOptions {
  remove_overlap?: boolean;
  is_color_font?: boolean;
}

const exportGlyphs_tauri = async () => {
  loaded.value = 0
  let temp_glyphs = null
  let temp_glyphs_name = ''
  let _glyphs = []
  if (editStatus.value === Status.GlyphList) {
    temp_glyphs = glyphs.value
    temp_glyphs_name = 'glyphs.json'
  } else if (editStatus.value === Status.StrokeGlyphList) {
    temp_glyphs = stroke_glyphs.value
    temp_glyphs_name = 'stroke_glyphs.json'
  } else if (editStatus.value === Status.RadicalGlyphList) {
    temp_glyphs = radical_glyphs.value
    temp_glyphs_name = 'radical_glyphs.json'
  } else if (editStatus.value === Status.CompGlyphList) {
    temp_glyphs = comp_glyphs.value
    temp_glyphs_name = 'comp_glyphs.json'
  } else {
    temp_glyphs = glyphs.value
    temp_glyphs_name = 'glyphs.json'
  }
  total.value = temp_glyphs.length
  loading.value = true
  setTimeout(async () => {
    requestAnimationFrame(() => addGlyph(0))
    const addGlyph = async (i) => {
      _glyphs.push(plainGlyph(temp_glyphs[i]))
      loaded.value += 1
      if (loaded.value >= total.value) {
        loading.value = false
        const data = JSON.stringify({
          glyphs: _glyphs,
          constants: constants.value,
          constantGlyphMap: mapToObject(constantGlyphMap),
          version: 1.0,
        })
        await nativeSaveText(data, temp_glyphs_name, ['json'])
      } else {
        if (i % 100 === 0) {
          requestAnimationFrame(() => addGlyph(i + 1))
        } else {
          addGlyph(i + 1)
        }
      }
    }
  }, 50)
}

const exportJPEG_tauri = async () => {
  // 导出JPEG
  const _canvas = canvas.value as HTMLCanvasElement
  const data = _canvas.toDataURL('image/jpeg')
  const buffer = base64ToArrayBuffer(data)
  let fileName = 'untitled.jpg'
  if (editStatus.value === Status.Edit) {
    fileName = `${editCharacterFile.value.character.text}.jpg`
  } else {
    fileName = `${editGlyph.value.name}.jpg`
  }
  nativeSaveBinary(buffer, fileName, ['jpg', 'jpeg'])
}

const exportPNG_tauri = async () => {
  // 导出PNG
  const _canvas = canvas.value as HTMLCanvasElement
  render(_canvas, false)
  const data = _canvas.toDataURL('image/png')
  const buffer = base64ToArrayBuffer(data)
  let fileName = 'untitled.png'
  if (editStatus.value === Status.Edit) {
    fileName = `${editCharacterFile.value.character.text}.png`
  } else {
    fileName = `${editGlyph.value.name}.png`
  }
  nativeSaveBinary(buffer, fileName, ['png'])
  render(_canvas, true)
}

const exportSVG_tauri = async () => {
  // 导出SVG
  if (editStatus.value !== Status.Edit && editStatus.value !== Status.Glyph ) return
  const components = editStatus.value === Status.Edit ? orderedListWithItemsForCurrentCharacterFile.value : editGlyph.value._o.components
  const data = componentsToSvg(components, selectedFile.value.width, selectedFile.value.height)
  let fileName = 'untitled.svg'
  if (editStatus.value === Status.Edit) {
    fileName = `${editCharacterFile.value.character.text}.svg`
  } else {
    fileName = `${editGlyph.value.name}.svg`
  }
  nativeSaveText(data, fileName, ['svg'])
}

const exportFont_tauri = async (options: CreateFontOptions) => {
  const font = await createFont(options)
  loadingMsg.value = '已经处理完所有字符，正在生成字库文件，请稍候...'
  const buffer = toArrayBuffer(font) as ArrayBuffer
  const filename = `${selectedFile.value.name}.otf`
  nativeSaveBinary(buffer, filename, ['otf'])
  loading.value = false
  loaded.value = 0;
	total.value = 0;
  loadingMsg.value = ''
}

const showExportFontDialog_tauri = () => {
  setExportFontTauriDialogVisible(true)
}

const showExportFontDialog = () => {
  if (ENV.value === 'tauri') {
    showExportFontDialog_tauri()
  } else {
    setExportFontDialogVisible(true)
  }
}

const showExportColorFontDialog_tauri = () => {
  setExportColorFontTauriDialogVisible(true)
}

const showExportColorFontDialog = () => {
  if (ENV.value === 'tauri') {
    showExportColorFontDialog_tauri()
  } else {
    setExportColorFontDialogVisible(true)
  }
}

const showExportVarFontDialog_tauri = () => {
  setExportVarFontTauriDialogVisible(true)
}

const showExportVarFontDialog = () => {
  if (ENV.value === 'tauri') {
    showExportVarFontDialog_tauri()
  } else {
    setExportVarFontDialogVisible(true)
  }
}


const exportGlyphs = () => {
  if (editStatus.value === Status.CharacterList) {
    const { locale } = i18n.global
    if (locale === 'zh') {
      ElMessageBox.alert(
        '字符列表不能导出，只有在笔画、部首、字形、组件列表可以导出相应类型的字形。',
        '提示', {
        confirmButtonText: '确定',
      })
    } else if (locale === 'en') {
      ElMessageBox.alert(
        'The character list cannot be exported. Only Stroke, Radical, Glyph, and Component lists support exporting their corresponding glyph types.',
        'Note', {
        confirmButtonText: 'Confirm',
      })
    }
    return
  }
  if (ENV.value === 'tauri') {
    exportGlyphs_tauri()
  } else {
    loaded.value = 0
    let temp_glyphs = null
    let temp_glyphs_name = ''
    let _glyphs = []
    if (editStatus.value === Status.GlyphList) {
      temp_glyphs = glyphs.value
      temp_glyphs_name = 'glyphs.json'
    } else if (editStatus.value === Status.StrokeGlyphList) {
      temp_glyphs = stroke_glyphs.value
      temp_glyphs_name = 'stroke_glyphs.json'
    } else if (editStatus.value === Status.RadicalGlyphList) {
      temp_glyphs = radical_glyphs.value
      temp_glyphs_name = 'radical_glyphs.json'
    } else if (editStatus.value === Status.CompGlyphList) {
      temp_glyphs = comp_glyphs.value
      temp_glyphs_name = 'comp_glyphs.json'
    } else {
      temp_glyphs = glyphs.value
      temp_glyphs_name = 'glyphs.json'
    }
    total.value = temp_glyphs.length
    loading.value = true
    setTimeout(() => {
      requestAnimationFrame(() => addGlyph(0))
      const addGlyph = (i) => {
        _glyphs.push(plainGlyph(temp_glyphs[i]))
        loaded.value += 1
        if (loaded.value >= total.value) {
          loading.value = false
          const data = JSON.stringify({
            glyphs: _glyphs,
            constants: constants.value,
            constantGlyphMap: mapToObject(constantGlyphMap),
            version: 1.0,
          })
          const blob = new Blob([data], {type: "text/plain;charset=utf-8"})
          saveAs(blob, temp_glyphs_name)
        } else {
          if (i % 100 === 0) {
            requestAnimationFrame(() => addGlyph(i + 1))
          } else {
            addGlyph(i + 1)
          }
        }
      }
    }, 50)
  }
}

const exportJPEG = () => {
  if (ENV.value === 'tauri') {
    exportJPEG_tauri()
  } else {
    // 导出JPEG
    const _canvas = canvas.value as HTMLCanvasElement
    // render(_canvas, false)
    const data = _canvas.toDataURL('image/jpeg')
    const link = document.createElement('a')
    let fileName = 'untitled'
    if (editStatus.value === Status.Edit) {
      fileName = `${editCharacterFile.value.character.text}`
    } else {
      fileName = `${editGlyph.value.name}`
    }
    link.download = fileName//selectedFile.value.name
    link.href = data
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    // render(_canvas, true)
  }
}

const exportPNG = () => {
  if (ENV.value === 'tauri') {
    exportPNG_tauri()
  } else {
    // 导出PNG
    const _canvas = canvas.value as HTMLCanvasElement
    render(_canvas, false)
    const data = _canvas.toDataURL('image/png')
    const link = document.createElement('a')
    let fileName = 'untitled'
    if (editStatus.value === Status.Edit) {
      fileName = `${editCharacterFile.value.character.text}`
    } else {
      fileName = `${editGlyph.value.name}`
    }
    link.download = fileName//selectedFile.value.name
    link.href = data
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    render(_canvas, true)
  }
}

const exportSVG = () => {
  if (ENV.value === 'tauri') {
    exportSVG_tauri()
  } else {
    // 导出SVG
    // const components = editCharacterFile.value.components
    if (editStatus.value !== Status.Edit && editStatus.value !== Status.Glyph ) return
    if (editStatus.value === Status.Glyph && !editGlyph.value._o) {
      executeScript(editGlyph.value)
    }
    const components = editStatus.value === Status.Edit ? orderedListWithItemsForCurrentCharacterFile.value : editGlyph.value._o.components
    const svgStr = componentsToSvg(components, selectedFile.value.width, selectedFile.value.height, fontRenderStyle.value)
    const blob = new Blob([svgStr], {type: "image/svg+xml"})
    let fileName = 'untitled.svg'
    if (editStatus.value === Status.Edit) {
      fileName = `${editCharacterFile.value.character.text}.svg`
    } else {
      fileName = `${editGlyph.value.name}.svg`
    }
    saveAs(blob, fileName)
  }
}

const generateLayers = (character: ICharacterFile) => {
  const layers = []
  const components = orderedListWithItemsForCharacterFile(character)
  
  for (let i = 0; i < components.length; i++) {
    const component = components[i]
    // componentsToContours 需要一个组件数组，所以传递单个组件作为数组
    // offset.x + component.x 的逻辑，offset 设置为 0 是正确的
    const contours = componentsToContours([component], {
      unitsPerEm: selectedFile.value.fontSettings.unitsPerEm,
      descender: selectedFile.value.fontSettings.descender,
      advanceWidth: selectedFile.value.fontSettings.unitsPerEm,
    }, {x: 0, y: 0}, false, false, false)
    
    // fillColor 可能在 component.fillColor 或 component.value.fillColor 中
    const componentFillColor = (component as any).fillColor || (component as any).value?.fillColor
    const fillColor = componentFillColor || 'rgba(0, 0, 0, 1)'
    
    layers.push({
      fillColor: fillColor,
      contours: contours,
      contourNum: contours.length,
    })
  }
  return layers
}

const createColorFont = async (options?: CreateFontOptions) => {
  const _width = selectedFile.value.width
  const _height = selectedFile.value.height
  
  // 检查字符列表中是否有name为.notdef的字形
  let notdefCharacter = null
  for (let i = 0; i < selectedFile.value.characterList.length; i++) {
    const char = selectedFile.value.characterList[i]
    if (char.character.text === '.notdef') {
      notdefCharacter = char
      break
    }
  }
  
  // 如果有.notdef字符，使用它；否则创建一个空的.notdef字符
  const fontCharacters = []
  if (notdefCharacter) {
    // 使用现有的.notdef字符
    let contours = [[]]
    if (options && options.remove_overlap && notdefCharacter.overlap_removed_contours?.length) {
      contours = notdefCharacter.overlap_removed_contours
    } else {
      contours = componentsToContours(
        orderedListWithItemsForCharacterFile(notdefCharacter),
        {
          unitsPerEm: selectedFile.value.fontSettings.unitsPerEm,
          descender: selectedFile.value.fontSettings.descender,
          advanceWidth: selectedFile.value.fontSettings.unitsPerEm,
        }, {x: 0, y: 0}, false, false, false
      )
    }
    const layers = generateLayers(notdefCharacter)
    fontCharacters.push({
      unicode: 0,
      name: '.notdef',
      contours,
      contourNum: contours.length,
      advanceWidth: notdefCharacter.info?.metrics?.advanceWidth || Math.max(_width, _height),
      leftSideBearing: notdefCharacter.info?.metrics?.lsb || 0,
      layers: layers,
    })
  } else {
    // 创建一个空的.notdef字符
    fontCharacters.push({
      unicode: 0,
      name: '.notdef',
      contours: [[]] as Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>,
      contourNum: 0,
      advanceWidth: Math.max(_width, _height),
      leftSideBearing: 0,
      layers: [],
    })
  }

  // {
  // 	unicode: 0xa0,
  // 	name: 'no-break-space',
  // 	contours: [[]] as Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>,
  // 	contourNum: 0,
  // 	advanceWidth: Math.max(_width, _height),
  // }

  let containSpace = false
  const { unitsPerEm, ascender, descender } = selectedFile.value.fontSettings
  for (let i = 0; i < selectedFile.value.characterList.length; i++) {
    loaded.value++
    if (loaded.value >= total.value) {
      loading.value = false
      loaded.value = 0
      total.value = 0
    }
    const char: ICharacterFile = selectedFile.value.characterList[i]
    
    // 跳过.notdef字符，因为已经处理过了
    if (char.character.text === '.notdef') {
      continue
    }
    
    let contours = [[]]
    if (options && options.remove_overlap && char.overlap_removed_contours?.length) {
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
    const layers = generateLayers(char)
    const { text, unicode } = char.character

    fontCharacters.push({
      name: text,
      unicode: parseInt(unicode, 16),
      advanceWidth: char.info?.metrics?.advanceWidth || unitsPerEm,
      leftSideBearing: char.info?.metrics?.lsb || undefined,
      contours,
      contourNum: contours.length,
      layers: layers,
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
      layers: [],
    })
  }
  
  fontCharacters.sort((a: any, b: any) => {
    return a.unicode - b.unicode
  })

  const font = await create(fontCharacters, {
    familyName: selectedFile.value.name,
    styleName: 'Regular',
    unitsPerEm,
    ascender,
    descender,
    tables: selectedFile.value.fontSettings.tables || null,
    isColorFont: true,
  })
  return font
}

const createFont = async (options?: CreateFontOptions) => {
  const _width = selectedFile.value.width
  const _height = selectedFile.value.height
  
  // 检查字符列表中是否有name为.notdef的字形
  let notdefCharacter = null
  for (let i = 0; i < selectedFile.value.characterList.length; i++) {
    const char = selectedFile.value.characterList[i]
    if (char.character.text === '.notdef') {
      notdefCharacter = char
      break
    }
  }
  
  // 如果有.notdef字符，使用它；否则创建一个空的.notdef字符
  const fontCharacters = []
  if (notdefCharacter) {
    // 使用现有的.notdef字符
    let contours = [[]]
    if (options && options.remove_overlap && notdefCharacter.overlap_removed_contours?.length) {
      contours = notdefCharacter.overlap_removed_contours
    } else {
      contours = componentsToContours(
        orderedListWithItemsForCharacterFile(notdefCharacter),
        {
          unitsPerEm: selectedFile.value.fontSettings.unitsPerEm,
          descender: selectedFile.value.fontSettings.descender,
          advanceWidth: selectedFile.value.fontSettings.unitsPerEm,
        }, {x: 0, y: 0}, false, false, false
      )
    }
    fontCharacters.push({
      unicode: 0,
      name: '.notdef',
      contours,
      contourNum: contours.length,
      advanceWidth: notdefCharacter.info?.metrics?.advanceWidth || Math.max(_width, _height),
      leftSideBearing: notdefCharacter.info?.metrics?.lsb || 0,
    })
  } else {
    // 创建一个空的.notdef字符
    fontCharacters.push({
      unicode: 0,
      name: '.notdef',
      contours: [[]] as Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>,
      contourNum: 0,
      advanceWidth: Math.max(_width, _height),
      leftSideBearing: 0,
    })
  }

  // {
  // 	unicode: 0xa0,
  // 	name: 'no-break-space',
  // 	contours: [[]] as Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>,
  // 	contourNum: 0,
  // 	advanceWidth: Math.max(_width, _height),
  // }

  let containSpace = false
  const { unitsPerEm, ascender, descender } = selectedFile.value.fontSettings
  for (let i = 0; i < selectedFile.value.characterList.length; i++) {
    loaded.value++
    if (loaded.value >= total.value) {
      loading.value = false
      loaded.value = 0
      total.value = 0
    }
    const char: ICharacterFile = selectedFile.value.characterList[i]
    
    // 跳过.notdef字符，因为已经处理过了
    if (char.character.text === '.notdef') {
      continue
    }
    
    let contours = [[]]
    if (options && options.remove_overlap && char.overlap_removed_contours?.length) {
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
      advanceWidth: char.info?.metrics?.advanceWidth || unitsPerEm,
      leftSideBearing: char.info?.metrics?.lsb || undefined,
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

  // //-----just for test
  // const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  // for (let i = 0; i < chars.length; i++) {
  // 	const char = chars[i]
  // 	fontCharacters.push({
  // 		name: char,
  // 		unicode: char.charCodeAt(0),
  // 		advanceWidth: unitsPerEm,
  // 		contours: testContours,
  // 		contourNum: testContours.length,
  // 	})
  // }
  // //-----

  fontCharacters.sort((a: any, b: any) => {
    return a.unicode - b.unicode
  })

  const font = await create(fontCharacters, {
    familyName: selectedFile.value.name,
    styleName: 'Regular',
    unitsPerEm,
    ascender,
    descender,
    tables: selectedFile.value.fontSettings.tables || null,
  })
  return font
}

const createVarFont = async (options?: CreateFontOptions) => {
  const _width = selectedFile.value.width
  const _height = selectedFile.value.height
  const origin_constants = R.clone(constants.value)

  useFixedCurves.value = true
  
  // 检查字符列表中是否有name为.notdef的字形
  let notdefCharacter = null
  for (let i = 0; i < selectedFile.value.characterList.length; i++) {
    const char = selectedFile.value.characterList[i]
    if (char.character.text === '.notdef') {
      notdefCharacter = char
      break
    }
  }
  
  // 如果有.notdef字符，使用它；否则创建一个空的.notdef字符
  const fontCharacters = []
  if (notdefCharacter) {
    // 使用现有的.notdef字符
    let contours = [[]]
    if (options && options.remove_overlap && notdefCharacter.overlap_removed_contours?.length) {
      contours = notdefCharacter.overlap_removed_contours
    } else {
      contours = componentsToContours(
        orderedListWithItemsForCharacterFile(notdefCharacter),
        {
          unitsPerEm: selectedFile.value.fontSettings.unitsPerEm,
          descender: selectedFile.value.fontSettings.descender,
          advanceWidth: selectedFile.value.fontSettings.unitsPerEm,
        }, {x: 0, y: 0}, false, false, true
      )
    }
    fontCharacters.push({
      unicode: 0,
      name: '.notdef',
      contours,
      contourNum: contours.length,
      advanceWidth: notdefCharacter.info?.metrics?.advanceWidth || Math.max(_width, _height),
      leftSideBearing: notdefCharacter.info?.metrics?.lsb || 0,
    })
  } else {
    // 创建一个空的.notdef字符
    fontCharacters.push({
      unicode: 0,
      name: '.notdef',
      contours: [[]] as Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>,
      contourNum: 0,
      advanceWidth: Math.max(_width, _height),
      leftSideBearing: 0,
    })
  }

  // {
  // 	unicode: 0xa0,
  // 	name: 'no-break-space',
  // 	contours: [[]] as Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>,
  // 	contourNum: 0,
  // 	advanceWidth: Math.max(_width, _height),
  // }

  let containSpace = false
  const { unitsPerEm, ascender, descender } = selectedFile.value.fontSettings
  for (let i = 0; i < selectedFile.value.characterList.length; i++) {
    loaded.value++
    if (loaded.value >= total.value) {
      loading.value = false
      loaded.value = 0
      total.value = 0
    }
    const char: ICharacterFile = selectedFile.value.characterList[i]
    
    // 跳过.notdef字符，因为已经处理过了
    if (char.character.text === '.notdef') {
      continue
    }
    
    let contours = [[]]
    if (options && options.remove_overlap && char.overlap_removed_contours?.length) {
      contours = char.overlap_removed_contours
    } else {
      contours = componentsToContours(
        orderedListWithItemsForCharacterFile(char),
        {
          unitsPerEm,
          descender,
          advanceWidth: unitsPerEm,
        }, {x: 0, y: 0}, false, false, true
      )
    }
    const { text, unicode } = char.character

    fontCharacters.push({
      name: text,
      unicode: parseInt(unicode, 16),
      advanceWidth: char.info?.metrics?.advanceWidth || unitsPerEm,
      leftSideBearing: char.info?.metrics?.lsb || undefined,
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

  // ⚠️ 关键：在生成变体之前，确保所有轴相关的 constants 都设置为 defaultValue
  // 这样默认字形才能与变体字形的 tuple=[0.0] 位置对应
  if (selectedFile.value.variants?.axes) {
    for (const axis of selectedFile.value.variants.axes) {
      const constant = constants.value.find((c) => c.uuid === axis.uuid)
      if (constant) {
        console.log(`📌 Resetting ${axis.name} to defaultValue: ${constant.value} → ${axis.defaultValue}`)
        constant.value = axis.defaultValue
      }
    }
    constantsMap.update(constants.value)
    
    // 重新生成默认字形（使用 defaultValue）
    console.log('🔄 Regenerating default glyphs with defaultValue...')
    const defaultFontChars = await getVarFontContours({containSpace, forceUpdate: true})
    
    // 更新 fontCharacters（跳过 .notdef 和 space）
    for (let i = 0; i < defaultFontChars.length; i++) {
      const defaultChar = defaultFontChars[i]
      const fontCharIndex = fontCharacters.findIndex((fc: any) => fc.unicode === defaultChar.unicode)
      if (fontCharIndex !== -1 && fontCharacters[fontCharIndex].unicode !== 0 && fontCharacters[fontCharIndex].unicode !== 0x20) {
        fontCharacters[fontCharIndex].contours = defaultChar.contours
      }
    }
    console.log('✅ Default glyphs regenerated with defaultValue\n')
  }

  // 创建所有变体
  const combinations: any = generateAllAxisCombinations(selectedFile.value.variants?.axes?.length || 0)
  
  console.log('\n🔄 Generating variation combinations...')
  console.log(`Total combinations: ${combinations.length}`)
  
  for (let i = 0; i < combinations.length; i++) {
    const combination = combinations[i]
    const tuple = combination.tuple
    
    // 设置当前组合的轴值
    // tuple 坐标是归一化的设计空间坐标：0.0 对应 defaultValue
    for (let j = 0; j < tuple.length; j++) {
      const axis = selectedFile.value.variants?.axes[j]
      const normalized = tuple[j]
      
      // 根据归一化坐标计算实际值
      let value: number
      if (normalized >= 0) {
        // 正方向：从 defaultValue 到 maxValue
        value = axis.defaultValue + (axis.maxValue - axis.defaultValue) * normalized
      } else {
        // 负方向：从 defaultValue 到 minValue
        value = axis.defaultValue + (axis.defaultValue - axis.minValue) * normalized
      }
      
      const constant = constants.value.find((constant) => constant.uuid === axis.uuid)
      if (constant) {
        console.log(`  🔧 Setting ${axis.name} (${axis.axisTag}): ${constant.value} → ${value}`)
        constant.value = value
      } else {
        console.error(`  ❌ Constant not found for axis.uuid: ${axis.uuid}`)
      }
    }
    
    // ⚠️ 关键：在生成轮廓之前，必须先更新 constantsMap！
    constantsMap.update(constants.value)
    
    // 调试：确认 constant 值已更新
    const testConstant = constants.value.find((c) => c.uuid === selectedFile.value.variants?.axes[0].uuid)
    console.log(`  📍 Before generating contours: constant value = ${testConstant?.value}`)
    
    // 生成当前组合的轮廓
    // ⚠️ 对于可变字体，必须实时计算轮廓，不能使用缓存！
    // 因为每个组合的 constant 值不同，缓存的 overlap_removed_contours 不适用
    const rawContours = await getVarFontContours({containSpace, forceUpdate: true})
    
    // 调试：检查生成的第一个字形的第一个点
    if (rawContours.length > 2 && rawContours[2].contours.length > 0) {
      const firstPath = rawContours[2].contours[0][0]
      console.log(`  📍 Generated contour first point: (${firstPath.start.x.toFixed(2)}, ${firstPath.start.y.toFixed(2)})`)
    }
    

    // ⚠️ 关键：将轮廓转换为二次贝塞尔格式（与默认字形保持一致）
    // 导入转换函数
    const { convertContoursToQuadratic } = await import('../../fontManager/utils/cubicToQuadratic')
    
    // 调试：检查 cubic 曲线数量
    const checkCubicCount = (contours: any) => {
      let cubic = 0, quad = 0, line = 0
      for (const contour of contours || []) {
        for (const path of contour) {
          if (path.type === PathType.CUBIC_BEZIER) cubic++
          else if (path.type === PathType.QUADRATIC_BEZIER) quad++
          else if (path.type === PathType.LINE) line++
        }
      }
      return { cubic, quad, line }
    }
    
    // rawContours结构: [{unicode, contours}, ...]
    // 需要保留整个对象，只转换contours字段
    combination.overlapRemovedContours = rawContours.map((char: any, charIndex: number) => {
      const before = checkCubicCount(char.contours)
      const converted = convertContoursToQuadratic(char.contours, 0.5)
      const after = checkCubicCount(converted)
      
      // 打印 glyph 7, 11, 12 的信息
      if ((charIndex === 7 || charIndex === 11 || charIndex === 12)) {
        console.log(`    Combination ${i}, Variant char ${charIndex}: cubic=${before.cubic}, quad=${before.quad}, line=${before.line} → quad=${after.quad}, line=${after.line}`)
      }
      
      return {
        ...char,
        contours: converted
      }
    })
    
    if (i === 0 || i === combinations.length - 1) {
      console.log(`  ✅ Combination ${i}: tuple [${tuple.join(', ')}] - ${rawContours.length} glyphs converted`)
    } else if (i === 1) {
      console.log(`  ...`)
    }
  }
  
  console.log('✅ All combinations converted to quadratic Bezier\n')
  
  // 调试：检查 combinations 数据
  console.log('🔍 Checking combinations before passing to createFont:')
  console.log(`  combinations.length: ${combinations.length}`)
  if (combinations.length > 0) {
    console.log(`  combinations[0].tuple: [${combinations[0].tuple.join(', ')}]`)
    console.log(`  combinations[0].overlapRemovedContours exists: ${!!combinations[0].overlapRemovedContours}`)
    if (combinations[0].overlapRemovedContours) {
      console.log(`  combinations[0].overlapRemovedContours.length: ${combinations[0].overlapRemovedContours.length}`)
    }
  }

  // 恢复原始 constants
  constants.value = origin_constants
  constantsMap.update(constants.value)

  console.log('origin constants', constants.value)

  // 更新轮廓数据
  for (let i = 0; i < selectedFile.value.characterList.length; i++) {
    const char = selectedFile.value.characterList[i]
    const contours = componentsToContours(orderedListWithItemsForCharacterFile(char), {
      unitsPerEm: selectedFile.value.fontSettings.unitsPerEm,
      descender: selectedFile.value.fontSettings.descender,
      advanceWidth: selectedFile.value.fontSettings.unitsPerEm,
    }, { x: 0, y: 0 }, false, false, true)
  }

  const font = await create(fontCharacters, {
    familyName: selectedFile.value.name,
    styleName: 'Regular',
    unitsPerEm,
    ascender,
    descender,
    variants: {
      axes: selectedFile.value.variants?.axes,
      instances: selectedFile.value.variants?.instances,
      combinations: combinations,
    },
    tables: selectedFile.value.fontSettings.tables || null,
  })
  useFixedCurves.value = false
  return font
}

const getOverlapRemovedContours = async (options?: any) => {
  await computeOverlapRemovedContours({ forceUpdate: true })
  const{ containSpace } = options
  const fontCharacters = []
  if (!containSpace) {
    fontCharacters.push({
      unicode: parseInt('0x20', 16),
      contours: [[]],
    })
  }
  for (let i = 0; i < selectedFile.value.characterList.length; i++) {
    const char = selectedFile.value.characterList[i]
    fontCharacters.push({
      unicode: parseInt(char.character.unicode, 16),
      contours: char.overlap_removed_contours,
    })
  }
  fontCharacters.sort((a: any, b: any) => {
    return a.unicode - b.unicode
  })
  return fontCharacters
}

const getVarFontContours = async (options?: any) => {
  const{ containSpace } = options
  const fontCharacters = []
  if (!containSpace) {
    fontCharacters.push({
      unicode: parseInt('0x20', 16),
      contours: [[]],
    })
  }
  for (let i = 0; i < selectedFile.value.characterList.length; i++) {
    const char = selectedFile.value.characterList[i]
    let contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(orderedListWithItemsForCharacterFile(char), {
      unitsPerEm: selectedFile.value.fontSettings.unitsPerEm,
      descender: selectedFile.value.fontSettings.descender,
      advanceWidth: selectedFile.value.fontSettings.unitsPerEm,
    }, { x: 0, y: 0 }, false, false, options.forceUpdate)
    fontCharacters.push({
      unicode: parseInt(char.character.unicode, 16),
      contours: contours,
    })
  }
  fontCharacters.sort((a: any, b: any) => {
    return a.unicode - b.unicode
  })
  return fontCharacters
}

/**
 * 生成所有轴组合的peakTuple
 * @param axisCount 轴的数量
 * @returns 所有组合的peakTuple数组（不包括全0的默认状态）
 */
const generateAllAxisCombinations = (axisCount: number): any[] => {
  if (axisCount === 0) return []
  
  const combinations: any = []
  
  // 对于单轴字体，生成两个极端点（最小值和最大值）
  // tuple 坐标是归一化的设计空间坐标，0.0 对应 defaultValue
  if (axisCount === 1) {
    // 最小值：tuple=[-1.0]（轴在最小位置）
    combinations.push({ tuple: [-1.0], overlapRemovedContours: null })
    
    // 最大值：tuple=[1.0]（轴在最大位置）
    combinations.push({ tuple: [1.0], overlapRemovedContours: null })
    
    console.log('📊 Single axis: generating 2 extreme points (min=-1.0, max=1.0)')
    return combinations
  }
  
  // 对于多轴字体，使用三进制组合生成所有角点（包括负方向）
  const totalCombinations = Math.pow(3, axisCount)
  
  // 从1开始（跳过全0的默认状态）
  for (let i = 1; i < totalCombinations; i++) {
    const tuple: number[] = []
    let tempI = i
    
    // 将数字i的三进制表示转换为tuple（-1.0, 0.0, 1.0）
    for (let j = 0; j < axisCount; j++) {
      const digit = tempI % 3
      tempI = Math.floor(tempI / 3)
      
      // 0 → -1.0, 1 → 0.0, 2 → 1.0
      tuple.push(digit === 0 ? -1.0 : (digit === 1 ? 0.0 : 1.0))
    }
    
    // 跳过全0的tuple（默认状态）
    if (tuple.every(v => v === 0.0)) {
      continue
    }
    
    combinations.push({ tuple, overlapRemovedContours: null })
  }
  
  console.log(`📊 Multi-axis (${axisCount}): generating ${combinations.length} corner points`)
  return combinations
}

const exportFont = async (options: CreateFontOptions) => {
  const font = await createFont(options)
  loadingMsg.value = '已经处理完所有字符，正在生成压缩包，请稍候...'
  
  // 直接使用ArrayBuffer创建Blob，不要通过DataView
  const arrayBuffer = toArrayBuffer(font) as ArrayBuffer
  console.log(`[exportFont] ArrayBuffer size: ${arrayBuffer.byteLength} bytes`)
  
  const blob = new Blob([arrayBuffer], {type: 'font/opentype'})
  console.log(`[exportFont] Blob size: ${blob.size} bytes`)
  
  var zip = new JSZip()
  zip.file(`${selectedFile.value.name}.otf`, blob)
  zip.generateAsync({type:"blob"}).then(function(content: any) {
    saveAs(content, `${selectedFile.value.name}.zip`)
    console.log(`[exportFont] ZIP saved successfully`)
    loading.value = false
    loaded.value = 0;
		total.value = 0;
    loadingMsg.value = ''
  })
}

const exportColorFont = async (options: CreateFontOptions) => {
  const font = await createColorFont(options)
  loadingMsg.value = '已经处理完所有字符，正在生成压缩包，请稍候...'
  
  // 直接使用ArrayBuffer创建Blob，不要通过DataView
  const arrayBuffer = toArrayBuffer(font) as ArrayBuffer
  console.log(`[exportColorFont] ArrayBuffer size: ${arrayBuffer.byteLength} bytes`)
  
  const blob = new Blob([arrayBuffer], {type: 'font/opentype'})
  console.log(`[exportColorFont] Blob size: ${blob.size} bytes`)
  
  var zip = new JSZip()
  zip.file(`${selectedFile.value.name}.otf`, blob)
  zip.generateAsync({type:"blob"}).then(function(content: any) {
    saveAs(content, `${selectedFile.value.name}.zip`)
    console.log(`[exportColorFont] ZIP saved successfully`)
    loading.value = false
    loaded.value = 0;
		total.value = 0;
    loadingMsg.value = ''
  })
}

const exportColorFont_tauri = async (options: CreateFontOptions) => {
  const font = await createColorFont(options)
  loadingMsg.value = '已经处理完所有字符，正在生成字库文件，请稍候...'
  const buffer = toArrayBuffer(font) as ArrayBuffer
  const filename = `${selectedFile.value.name}.otf`
  nativeSaveBinary(buffer, filename, ['otf'])
  loading.value = false
  loaded.value = 0;
	total.value = 0;
  loadingMsg.value = ''
}

const exportVarFont = async (options: CreateFontOptions) => {
  const font = await createVarFont(options)
  loadingMsg.value = '已经处理完所有字符，正在生成压缩包，请稍候...'
  
  // 直接使用ArrayBuffer创建Blob，不要通过DataView
  const arrayBuffer = toArrayBuffer(font) as ArrayBuffer
  console.log(`[exportVarFont] ArrayBuffer size: ${arrayBuffer.byteLength} bytes`)
  
  const blob = new Blob([arrayBuffer], {type: 'font/opentype'})
  console.log(`[exportVarFont] Blob size: ${blob.size} bytes`)
  
  var zip = new JSZip()
  zip.file(`${selectedFile.value.name}.otf`, blob)
  zip.generateAsync({type:"blob"}).then(function(content: any) {
    saveAs(content, `${selectedFile.value.name}.zip`)
    console.log(`[exportVarFont] ZIP saved successfully`)
    loading.value = false
    loaded.value = 0;
		total.value = 0;
    loadingMsg.value = ''
  })
}

const exportVarFont_tauri = async (options: CreateFontOptions) => {
  const font = await createVarFont(options)
  loadingMsg.value = '已经处理完所有字符，正在生成字库文件，请稍候...'
  const buffer = toArrayBuffer(font) as ArrayBuffer
  const filename = `${selectedFile.value.name}.otf`
  nativeSaveBinary(buffer, filename, ['otf'])
  loading.value = false
  loaded.value = 0;
	total.value = 0;
  loadingMsg.value = ''
}


const computeOverlapRemovedContours = async (options?: any) => {
  const {
    unitsPerEm,
    descender,
  } = selectedFile.value.fontSettings

  let forceUpdate = false
  if (options) {
    forceUpdate = options.forceUpdate || false
  }

  let m = 0

  const compute = async (): Promise<void> => {

    // 检查是否完成所有字符处理
    if (m >= selectedFile.value.characterList.length) {
      return
    }

    let char = selectedFile.value.characterList[m]
    // 读取字符轮廓信息（已经将形状都转换成字体轮廓）
    let contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(orderedListWithItemsForCharacterFile(char), {
      unitsPerEm,
      descender,
      advanceWidth: unitsPerEm,
    }, { x: 0, y: 0 }, false, false, forceUpdate)

    // 检查是否已经优化过
    if (isAlreadyOptimized(contours)) {
      // 即使跳过处理，也要保存原始轮廓到overlap_removed_contours
      char.overlap_removed_contours = contours
      m++
      loaded.value++
      if (loaded.value >= total.value) {
        loading.value = false
        loaded.value = 0
        total.value = 0
        return
      }
      // 继续处理下一个字符
      await new Promise(resolve => setTimeout(resolve, 0))
      return compute()
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
    
    if (!unitedPath) {
      // 即使没有unitedPath，也要继续处理下一个字符
      m++
      loaded.value++
      if (loaded.value >= total.value) {
        loading.value = false
        loaded.value = 0
        total.value = 0
        return
      }
      // 继续处理下一个字符
      await new Promise(resolve => setTimeout(resolve, 0))
      return compute()
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

    char.overlap_removed_contours = overlap_removed_contours
    
    m++

    loaded.value++
    if (loaded.value >= total.value) {
      loading.value = false
      loaded.value = 0
      total.value = 0
      return
    }

    // 检查是否还有更多字符需要处理
    if (m < selectedFile.value.characterList.length) {
      if (m % 100 === 0) {
        // 每100个字符后，给UI更多时间更新
        await new Promise(resolve => setTimeout(resolve, 0))
      }
      // 继续处理下一个字符
      return compute()
    }
  }
  await compute()
}

const computeOverlapRemovedContours_wasm = async () => {
  const {
    unitsPerEm,
    descender,
  } = selectedFile.value.fontSettings

  let m = 0

  const compute = async (): Promise<void> => {

    // 检查是否完成所有字符处理
    if (m >= selectedFile.value.characterList.length) {
      return
    }

    let char = selectedFile.value.characterList[m]
    // 读取字符轮廓信息（已经将形状都转换成字体轮廓）
    let contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours2(orderedListWithItemsForCharacterFile(char),
      { x: 0, y: 0 }, false, 1
    )
    // let contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(orderedListWithItemsForCharacterFile(char), {
    //   unitsPerEm,
    //   descender,
    //   advanceWidth: unitsPerEm,
    // }, { x: 0, y: 0 }, false, false, false)

    // 检查是否已经优化过
    if (isAlreadyOptimized(contours)) {
      // 即使跳过处理，也要保存原始轮廓到overlap_removed_contours
      char.overlap_removed_contours = contours
      m++
      loaded.value++
      if (loaded.value >= total.value) {
        loading.value = false
        loaded.value = 0
        total.value = 0
        return
      }
      // 继续处理下一个字符
      await new Promise(resolve => setTimeout(resolve, 0))
      return compute()
    }

    try {
      // 使用WASM去除重叠
      const overlap_removed_contours = await removeOverlapWithWasm(contours)
      const options = {
        unitsPerEm,
        descender,
        advanceWidth: unitsPerEm,
      }
      for (let i = 0; i < overlap_removed_contours.length; i++) {
        const contour = overlap_removed_contours[i]
        for (let j = 0; j < contour.length; j++) {
          const path = contour[j]
          if (path.type === PathType.LINE) {
            const points =  formatPoints([path.start, path.end], options, 1)
            path.start.x = points[0].x
            path.start.y = points[0].y
            path.end.x = points[1].x
            path.end.y = points[1].y
          } else if (path.type === PathType.QUADRATIC_BEZIER) {
            const points =  formatPoints([path.start, path.end, path.control], options, 1)
            path.start.x = points[0].x
            path.start.y = points[0].y
            path.end.x = points[1].x
            path.end.y = points[1].y
            path.control.x = points[2].x
            path.control.y = points[2].y
          } else if (path.type === PathType.CUBIC_BEZIER) {
            const points =  formatPoints([path.start, path.end, path.control1, path.control2], options, 1)
            path.start.x = points[0].x
            path.start.y = points[0].y
            path.end.x = points[1].x
            path.end.y = points[1].y
            path.control1.x = points[2].x
            path.control1.y = points[2].y
            path.control2.x = points[3].x
            path.control2.y = points[3].y
          }
        }
      }
      char.overlap_removed_contours = overlap_removed_contours
    } catch (error) {
      console.error('Error removing overlap with WASM:', error)
    }
    
    m++

    loaded.value++
    if (loaded.value >= total.value) {
      loading.value = false
      loaded.value = 0
      total.value = 0
      return
    }

    // 检查是否还有更多字符需要处理
    if (m < selectedFile.value.characterList.length) {
      if (m % 100 === 0) {
        // 每100个字符后，给UI更多时间更新
        await new Promise(resolve => setTimeout(resolve, 0))
      }
      // 继续处理下一个字符
      return compute()
    }
  }

  await compute()
}

const removeOverlap_wasm = async () => {
  let char = editCharacterFile.value
  if (editStatus.value === Status.Glyph) {
    char = editGlyph.value
  }
  // 读取字符轮廓信息（已经将形状都转换成字体轮廓）
  const {
    unitsPerEm,
    descender,
  } = selectedFile.value.fontSettings
  let contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours2(orderedListWithItemsForCharacterFile(char),
    { x: 0, y: 0 }, false, 1
  )
  if (editStatus.value == Status.Glyph) {
    contours = componentsToContours2(char._o.components,
      { x: 0, y: 0 }, true, 1
    )
  }

  // 检查是否已经优化过
  if (isAlreadyOptimized(contours)) {
    return
  }

  try {
    // 使用WASM去除重叠
    const overlap_removed_contours = await removeOverlapWithWasm(contours)
    
    // 将去除重叠后的轮廓转换为组件
    let components = []
    for (let i = 0; i < overlap_removed_contours.length; i++) {
      const contour = overlap_removed_contours[i]
      if (contour.length === 0) continue
      
      let points = []
      points.push({
        uuid: genUUID(),
        type: 'anchor',
        x: contour[0].start.x,
        y: contour[0].start.y,
        origin: null,
        isShow: true,
      })
      
      for (let j = 0; j < contour.length; j++) {
        const segment = contour[j]
        if ('control1' in segment && 'control2' in segment) {
          // 三次贝塞尔曲线
          const control1 = {
            uuid: genUUID(),
            type: 'control',
            x: segment.control1.x,
            y: segment.control1.y,
            origin: points[points.length - 1].uuid,
            isShow: true,
          }
          const uuid = genUUID()
          const control2 = {
            uuid: genUUID(),
            type: 'control',
            x: segment.control2.x,
            y: segment.control2.y,
            origin: uuid,
            isShow: true,
          }
          const end = {
            uuid: uuid,
            type: 'anchor',
            x: segment.end.x,
            y: segment.end.y,
            origin: null,
            isShow: true,
          }
          points.push(control1, control2, end)
        } else if ('control' in segment) {
          // 二次贝塞尔曲线
          const control = {
            uuid: genUUID(),
            type: 'control',
            x: segment.control.x,
            y: segment.control.y,
            origin: points[points.length - 1].uuid,
            isShow: true,
          }
          const uuid = genUUID()
          const end = {
            uuid: uuid,
            type: 'anchor',
            x: segment.end.x,
            y: segment.end.y,
            origin: null,
            isShow: true,
          }
          points.push(control, end)
        } else {
          // 直线
          const uuid = genUUID()
          const end = {
            uuid: uuid,
            type: 'anchor',
            x: segment.end.x,
            y: segment.end.y,
            origin: null,
            isShow: true,
          }
          points.push(end)
        }
      }
      components.push(genPenComponent(points, true))
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
  } catch (error) {
    console.error('Error removing overlap with WASM:', error)
  }
}

export {
  computeOverlapRemovedContours,
  computeOverlapRemovedContours_wasm,
  exportFont_tauri,
  exportFont,
  exportColorFont,
  exportColorFont_tauri,
  exportVarFont,
  exportVarFont_tauri,
  generateLayers,
  createFont,
  createColorFont,
  createVarFont,
  generateAllAxisCombinations,
  getVarFontContours,
  getOverlapRemovedContours,
  exportJPEG,
  exportJPEG_tauri,
  exportPNG,
  exportPNG_tauri,
  exportSVG,
  exportSVG_tauri,
  exportGlyphs,
  exportGlyphs_tauri,
  showExportFontDialog_tauri,
  showExportFontDialog,
  showExportColorFontDialog_tauri,
  showExportColorFontDialog,
  showExportVarFontDialog_tauri,
  showExportVarFontDialog,
}

export type {
  CreateFontOptions,
}