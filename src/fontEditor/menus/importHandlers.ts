import {
  tipsDialogVisible,
} from '../stores/dialogs'
import { tips } from '../stores/global'
import {
  files,
  addFile,
  characterList,
  generateCharacterTemplate,
  addCharacterTemplate,
  batchAddCharacterTemplates,
  orderedListWithItemsForCharacterFile,
  selectedFile,
  visibleCount,
  setSelectedFileUUID,
  clearCharacterRenderList,
  addComponentForCurrentCharacterFile,
  editCharacterFile,
  type IComponent,
  IComponentValue,
} from '../stores/files'
import {
  loading,
  loaded,
  total,
} from '../stores/global'
import {
  addGlyph,
  addGlyphTemplate,
  clearGlyphRenderList,
  comp_glyphs,
  constantGlyphMap,
  constants,
  constantsMap,
  glyphs,
  radical_glyphs,
  stroke_glyphs,
  getGlyphByUUID,
} from '../stores/glyph'
import {
  Status,
  setEditStatus,
  editStatus,
  prevEditStatus,
  setEditCharacterPic,
  setBitMap,
  clearContoursComponent,
  addContoursComponent,
  contoursComponents,
  clearCurvesComponent,
  addCurvesComponent,
  curvesComponents,
  bitmap,
  rThreshold,
  gThreshold,
  bThreshold,
  maxError,
} from '../stores/font'
import { saveState, OpType, StoreType } from '../stores/edit'
import { nativeImportFile, nativeImportTextFile, addLoaded, instanceGlyph, instanceCharacter } from './fileHandlers'
import { parse } from '../../fontManager'
import { componentsToContours, contoursToComponents } from '../../features/font'
import { parseStrToSvg, parseSvgToComponents } from '../../features/svg'
import { reversePixels, toBlackWhiteBitMap } from '../../features/image'
import { fitCurve } from '../../features/fitCurve'
import { getBound } from '../../utils/math'
import { genUUID, resetLightIdCounter, genLightId } from '../../utils/string'
import { ElMessageBox } from 'element-plus'
import { nextTick } from 'vue'
import { i18n } from '../../i18n'
import router from '../../router'
import { ENV } from '../stores/system'
import { worker } from '../../main'
import { WorkerEventType } from '../worker'
import type { ICharacterFile, IFile } from '../stores/files'
import type { ICustomGlyph } from '../stores/glyph'
import type { IPenComponent } from '../stores/files'
import type { IPoint as IPenPoint } from '../stores/pen'
import { emitter } from '../Event/bus'
import * as R from 'ramda'

const importFont_tauri = async () => {
  if (files.value && files.value.length) {
    tips.value = '目前字玩仅支持同时编辑一个工程，请关闭当前工程再导入字体。注意，关闭工程前请保存工程以避免数据丢失。'
    tipsDialogVisible.value = true
  } else {
    const options = await nativeImportFile(['otf', 'ttf'])
    await _importFont_tauri(options)
  }
}

const _importFont_tauri = (options) => {
  const { uint8Array, name } = options
  if (!uint8Array) return
  const arrayBuffer = uint8Array.buffer
  const font = parse(arrayBuffer)
  const file: IFile = {
    uuid: genUUID(),
    width: font.settings.unitsPerEm as number,
    height: font.settings.unitsPerEm as number,
    name: name,
    saved: false,
    characterList: [],
    iconsCount: 0,
    fontSettings: {
      unitsPerEm: font.settings.unitsPerEm as number,
      ascender: font.settings.ascender as number,
      descender: font.settings.descender as number,
    }
  }
  addFile(file)
  setSelectedFileUUID(file.uuid)
  setEditStatus(Status.CharacterList)
  loaded.value = 0
  total.value = 0
  loading.value = true
  worker.onmessage = (e) => {
    const list = e.data
    selectedFile.value.characterList = list
    clearCharacterRenderList()
    characterList.value.map((characterFile) => {
      addCharacterTemplate(generateCharacterTemplate(characterFile))
    })
    loading.value = false
    emitter.emit('renderPreviewCanvas', true)
  }
  worker.postMessage([WorkerEventType.ParseFont, font, selectedFile.value.width])
}

const importFont = () => {
  const input = document.createElement('input')
  input.setAttribute('type', 'file')
  input.setAttribute('style', 'display: none')
  input.setAttribute('accept', '.otf, .ttf')
  input.addEventListener('blur', async () => {
    loading.value = false
  })
  input.addEventListener('change', async (e: Event) => {
    await nextTick()
    const el = e.currentTarget as HTMLInputElement
    const filesList = el.files as FileList
    const _file = filesList[0]
    const fullFileName = _file.name
    const fileName = fullFileName.substring(0, fullFileName.lastIndexOf('.'))
    const buffer = _file.arrayBuffer()
    const font = parse(await buffer)

    loaded.value = 0
    total.value = font.characters.length * 2 + Math.min(visibleCount.value, font.characters.length)
    loading.value = true
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        resolve()
      })
    })

    const file: IFile = {
      uuid: genUUID(),
      width: font.settings.unitsPerEm as number,
      height: font.settings.unitsPerEm as number,
      name: fileName,
      saved: false,
      characterList: [],
      iconsCount: 0,
      fontSettings: {
        unitsPerEm: font.settings.unitsPerEm as number,
        ascender: font.settings.ascender as number,
        descender: font.settings.descender as number,
      }
    }
    addFile(file)
    setSelectedFileUUID(file.uuid)
    setEditStatus(Status.CharacterList)
    if (router.currentRoute.value.name === 'welcome') {
      router.push('/editor')
    }

    const list = await parseFont(font)

    selectedFile.value.characterList = list
    clearCharacterRenderList()

    const batchSize = 500
    const templates: Node[] = []

    for (let i = 0; i < list.length; i++) {
      templates.push(generateCharacterTemplate(list[i]))
      addLoaded()

      if (templates.length >= batchSize || i === list.length - 1) {
        batchAddCharacterTemplates(templates)
        templates.length = 0

        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            resolve()
          })
        })
      }
    }
    emitter.emit('renderPreviewCanvas', true)
    document.body.removeChild(input)
  })
  document.body.appendChild(input)
  input.click()
}

const parseFont = async (font) => {
  resetLightIdCounter()

  const unitsPerEm = font.settings.unitsPerEm
  const descender = font.settings.descender
  const width = selectedFile.value.width
  const list = []

  for (let j = 0; j < font.characters.length; j++) {
    addLoaded()
    const character = font.characters[j]
    if (!character.unicode && !character.name) continue
    const characterComponent = {
      uuid: genLightId(),
      text: character.unicode ? String.fromCharCode(character.unicode) : character.name,
      unicode: character.unicode ? character.unicode.toString(16).padStart(4, '0') : '',
    }
    const uuid = genLightId()
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
          centerSquareSize: width / 3,
          size: width,
          default: true,
        },
        useSkeletonGrid: false,
        layout: '',
        layoutTree: [],
      },
      script: `function script_${uuid.replaceAll('-', '_')} (character, constants, FP) {\n\t//Todo something\n}`,
    }
    const components = contoursToComponents(character.contours, {
      unitsPerEm,
      descender,
      advanceWidth: character.advanceWidth,
    })
    components.forEach((component) => {
      characterFile.components.push(component)
      characterFile.orderedList.push({
        type: 'component',
        uuid: component.uuid,
      })
    })
    list.push(characterFile)
    if (j % 100 === 0) {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          resolve()
        })
      })
    }
  }
  return list
}

const importGlyphs_tauri = async () => {
  let repeatMark = false
  const { data: rawdata } = await nativeImportTextFile(['json'])
  if (!rawdata) return
  const data = JSON.parse(rawdata)
  const plainGlyphs = data.glyphs

  loading.value = true
  loaded.value = 0
  total.value = plainGlyphs.length

  if (data.constants) {
    for (let n = 0; n < data.constants.length; n++) {
      if (!constantsMap.getByUUID(data.constants[n].uuid)) {
        constants.value.push(data.constants[n])
      }
    }
  }
  if (data.constantGlyphMap) {
    const keys = Object.keys(data.constantGlyphMap)
    for (let n = 0; n < keys.length; n++) {
      constantGlyphMap.set(keys[n], data.constantGlyphMap[keys[n]])
    }
  }

  const _glyphs: any[] = []
  const processGlyphs = async (glyphs: any[]) => {
    const batchSize = 100
    for (let i = 0; i < glyphs.length; i += batchSize) {
      const batch = glyphs.slice(i, i + batchSize)
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          batch.forEach((plainGlyph) => {
            const glyph = instanceGlyph(plainGlyph, {
              updateContoursAndPreview: true,
              unitsPerEm: 1000,
              descender: -200,
              advanceWidth: 1000,
            })
            _glyphs.push(glyph)
            loaded.value++
          })
          resolve()
        })
      })
    }
  }

  await processGlyphs(plainGlyphs)

  _glyphs.forEach((glyph) => {
    if (getGlyphByUUID(glyph.uuid)) {
      repeatMark = true
    } else {
      addGlyph(glyph, editStatus.value)
      addGlyphTemplate(glyph, editStatus.value)
    }
  })
  if (editStatus.value === Status.GlyphList) {
    emitter.emit('renderGlyphPreviewCanvas')
  } else if (editStatus.value === Status.StrokeGlyphList) {
    emitter.emit('renderStrokeGlyphPreviewCanvas')
  } else if (editStatus.value === Status.RadicalGlyphList) {
    emitter.emit('renderRadicalGlyphPreviewCanvas')
  } else if (editStatus.value === Status.CompGlyphList) {
    emitter.emit('renderCompGlyphPreviewCanvas')
  }
  if (repeatMark) {
    const { locale } = i18n.global
    if (locale === 'zh') {
      ElMessageBox.alert(
        '导入字形时发现有与当前字形相同uuid的重复字形，自动忽略重复字形。',
        'Note',
        {
          confirmButtonText: '确定',
        },
      )
    } else if (locale === 'en') {
      ElMessageBox.alert(
        'Duplicate glyphs with the same UUID as existing ones were detected during import and have been automatically ignored.',
        'Note',
        {
          confirmButtonText: 'Confirm',
        },
      )
    }
  }

  loading.value = false
  loaded.value = 0
  total.value = 0
}

const importGlyphs = () => {
  let repeatMark = false
  const input = document.createElement('input')
  input.setAttribute('type', 'file')
  input.setAttribute('style', 'display: none')
  input.setAttribute('accept', '.json')
  input.addEventListener('change', async (e: Event) => {
    const el = e.currentTarget as HTMLInputElement
    const readfiles = el.files as FileList
    for (let i = 0; i < readfiles.length; i++) {
      const reader = new FileReader()
      reader.readAsText(readfiles[i])
      reader.onload = async () => {
        const data = JSON.parse(reader.result as string)
        const plainGlyphs = data.glyphs

        loading.value = true
        loaded.value = 0
        total.value = plainGlyphs.length

        if (data.constants) {
          for (let n = 0; n < data.constants.length; n++) {
            if (!constantsMap.getByUUID(data.constants[n].uuid)) {
              constants.value.push(data.constants[n])
            }
          }
        }
        if (data.constantGlyphMap) {
          const keys = Object.keys(data.constantGlyphMap)
          for (let n = 0; n < keys.length; n++) {
            constantGlyphMap.set(keys[n], data.constantGlyphMap[keys[n]])
          }
        }

        const _glyphs: any[] = []
        const processGlyphs = async (glyphs: any[]) => {
          const batchSize = 100
          for (let i = 0; i < glyphs.length; i += batchSize) {
            const batch = glyphs.slice(i, i + batchSize)
            await new Promise<void>((resolve) => {
              requestAnimationFrame(() => {
                batch.forEach((plainGlyph) => {
                  const glyph = instanceGlyph(plainGlyph, {
                    updateContoursAndPreview: true,
                    unitsPerEm: 1000,
                    descender: -200,
                    advanceWidth: 1000,
                  })
                  _glyphs.push(glyph)
                  loaded.value++
                })
                resolve()
              })
            })
          }
        }

        await processGlyphs(plainGlyphs)

        _glyphs.forEach((glyph) => {
          if (getGlyphByUUID(glyph.uuid)) {
            repeatMark = true
          } else {
            addGlyph(glyph, editStatus.value)
            addGlyphTemplate(glyph, editStatus.value)
          }
        })
        if (editStatus.value === Status.GlyphList) {
          emitter.emit('renderGlyphPreviewCanvas')
        } else if (editStatus.value === Status.StrokeGlyphList) {
          emitter.emit('renderStrokeGlyphPreviewCanvas')
        } else if (editStatus.value === Status.RadicalGlyphList) {
          emitter.emit('renderRadicalGlyphPreviewCanvas')
        } else if (editStatus.value === Status.CompGlyphList) {
          emitter.emit('renderCompGlyphPreviewCanvas')
        }
        if (repeatMark) {
          const { locale } = i18n.global
          if (locale === 'zh') {
            ElMessageBox.alert(
              '导入字形时发现有与当前字形相同uuid的重复字形，自动忽略重复字形。',
              '提示',
              {
                confirmButtonText: '确定',
              },
            )
          } else if (locale === 'en') {
            ElMessageBox.alert(
              'Duplicate glyphs with the same UUID as existing entries were detected during import and have been automatically ignored.',
              'Note',
              {
                confirmButtonText: 'Confirm',
              },
            )
          }
        }

        loading.value = false
        loaded.value = 0
        total.value = 0
      }
    }
    document.body.removeChild(input)
  })
  document.body.appendChild(input)
  input.click()
}

const importSVG_tauri = async () => {
  const { data: rawdata } = await nativeImportTextFile(['svg'])
  if (!rawdata) return
  const svgEl: HTMLElement = parseStrToSvg(rawdata).childNodes[0] as HTMLElement
  const components = parseSvgToComponents(svgEl as HTMLElement)
  components.forEach((component: IComponent) => {
    addComponentForCurrentCharacterFile(component)
  })
}

const importSVG = () => {
  if (ENV.value === 'tauri') {
    importSVG_tauri()
    return
  }
  const input = document.createElement('input')
  input.setAttribute('type', 'file')
  input.setAttribute('style', 'display: none')
  input.setAttribute('accept', '.svg')
  input.addEventListener('change', async (e: Event) => {
    const el = e.currentTarget as HTMLInputElement
    const readfiles = el.files as FileList
    for (let i = 0; i < readfiles.length; i++) {
      const reader = new FileReader()
      reader.readAsText(readfiles[i])
      reader.onload = () => {
        const svgEl: HTMLElement = parseStrToSvg(reader.result as string).childNodes[0] as HTMLElement
        const components = parseSvgToComponents(svgEl as HTMLElement)
        components.forEach((component: IComponent) => {
          addComponentForCurrentCharacterFile(component)
        })
      }
    }
    document.body.removeChild(input)
  })
  document.body.appendChild(input)
  input.click()
}

const importPic = () => {
  if (ENV.value === 'tauri') {
    importPic_tauri()
    return
  }
  getFromPic()
}

const importPic_tauri = async () => {
  const options = await nativeImportFile(['jpg', 'png', 'jpeg'])
  const { name, uint8Array } = options
  if (!uint8Array) return
  saveState('识别图片', [
    StoreType.Status,
    editStatus.value === Status.Glyph ? StoreType.EditGlyph : StoreType.EditCharacter,
  ], OpType.Undo, {
    undoTip: '撤销识别图片操作会将您上次在识别图片过程中的全部操作撤销，确认撤销？',
    redoTip: '重做识别图片操作会将您上次在识别图片过程中的全部操作重做，确认重做？',
  })
  let binary = ''
  uint8Array.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  const base64str = btoa(binary)
  const type = name.split('.')[1] === 'png' ? 'image/png' : 'image/jpeg'
  const dataUrl = `data:${type};base64,${base64str}`
  total.value = 0
  loaded.value = 0
  loading.value = true
  const img = document.createElement('img')
  img.onload = () => {
    setTimeout(() => {
      prevEditStatus.value = editStatus.value
      thumbnail(dataUrl, img, 1000)
      setEditStatus(Status.Pic)
      loading.value = false
    }, 100)
  }
  img.src = dataUrl
}

const getFromFontPic = () => {
  const fontCanvas = editCharacterFile.value.fontPic
  const data = fontCanvas.toDataURL()
  const img = document.createElement('img')
  img.onload = () => {
    prevEditStatus.value = editStatus.value
    thumbnail(data, img, img.width)
    setEditStatus(Status.Pic)
  }
  img.src = data
}

const getFromPic = () => {
  if (editStatus.value === Status.Edit && editCharacterFile.value.fontPic) {
    getFromFontPic()
    return
  }
  const input = document.createElement('input')
  input.setAttribute('type', 'file')
  input.setAttribute('style', 'display: none')
  input.setAttribute('accept', 'image/*')
  input.addEventListener('change', async (e: Event) => {
    const el = e.currentTarget as HTMLInputElement
    const filesList = el.files as FileList
    for (let i = 0; i < filesList.length; i++) {
      total.value = 0
      loaded.value = 0
      loading.value = true
      const data = window.URL.createObjectURL(filesList[i])
      const img = document.createElement('img')
      img.onload = () => {
        saveState('识别图片', [
          StoreType.Status,
          editStatus.value === Status.Glyph ? StoreType.EditGlyph : StoreType.EditCharacter,
        ], OpType.Undo, {
          undoTip: '撤销识别图片操作会将您上次在识别图片过程中的全部操作撤销，确认撤销？',
          redoTip: '重做识别图片操作会将您上次在识别图片过程中的全部操作重做，确认重做？',
        })
        prevEditStatus.value = editStatus.value
        thumbnail(data, img, 1000)
        setEditStatus(Status.Pic)
        loading.value = false
      }
      img.src = data
    }
    document.body.removeChild(input)
  })
  document.body.appendChild(input)
  input.click()
}

const thumbnail = (data: string, img: HTMLImageElement, d: number) => {
  const thumbnailCanvas = document.createElement('canvas')
  if (img.width > d || img.height > d) {
    thumbnailCanvas.width = d
    thumbnailCanvas.height = (d * img.height) / img.width
  } else {
    thumbnailCanvas.width = img.width
    thumbnailCanvas.height = img.height
  }
  const ctx: CanvasRenderingContext2D = thumbnailCanvas.getContext('2d') as CanvasRenderingContext2D
  ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height)
  const thumbnailPixels = ctx.getImageData(0, 0, thumbnailCanvas.width, thumbnailCanvas.height).data
  setEditCharacterPic({
    data,
    img,
    thumbnailCanvas,
    thumbnailPixels,
    processPixels: thumbnailPixels,
    width: thumbnailCanvas.width,
    height: thumbnailCanvas.height,
  })

  const pixels = toBlackWhiteBitMap(
    thumbnailPixels,
    {
      r: rThreshold.value,
      g: gThreshold.value,
      b: bThreshold.value,
    },
    {
      x: 0,
      y: 0,
      size: -1,
      width: thumbnailCanvas.width,
      height: thumbnailCanvas.height,
    },
  )
  setBitMap({
    data: pixels,
    width: thumbnailCanvas.width,
    height: thumbnailCanvas.height,
  })

  clearContoursComponent()
  const { canvas: reversedCanvas } = reversePixels(pixels, bitmap.value.width, bitmap.value.height)
  const reversedCtx: CanvasRenderingContext2D = reversedCanvas.getContext('2d', {
    willReadFrequently: true,
  }) as CanvasRenderingContext2D
  const width = reversedCanvas.width
  const height = reversedCanvas.height
  const imgData = reversedCtx.getImageData(0, 0, width, height)
  // @ts-ignore
  let src = cv.matFromImageData(imgData)
  // @ts-ignore
  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0)
  // @ts-ignore
  cv.threshold(src, src, 120, 200, cv.THRESH_BINARY)
  // @ts-ignore
  let contours = new cv.MatVector()
  // @ts-ignore
  let hierarchy = new cv.Mat()
  // @ts-ignore
  cv.findContours(src, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_NONE)

  const allPoints = []
  // @ts-ignore
  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i)
    for (let row = 0; row < contour.rows; row++) {
      allPoints.push({
        x: contour.data32S[row * 2],
        y: contour.data32S[row * 2 + 1],
      })
    }
  }
  const { x: allX, y: allY, w: allW, h: allH } = getBound(allPoints)
  let adjustW
  let adjustH
  const size = selectedFile.value?.fontSettings?.unitsPerEm || 1000
  if (allW > allH) {
    adjustW = size
    adjustH = (allH / allW) * adjustW
  } else {
    adjustH = size
    adjustW = (allW / allH) * adjustH
  }
  const scaleW = adjustW / allW
  const scaleH = adjustH / allH

  // @ts-ignore
  for (let i = 0; i < contours.size(); i++) {
    const points = []
    const contour = contours.get(i)
    for (let row = 0; row < contour.rows; row++) {
      points.push({
        uuid: genUUID(),
        x: contour.data32S[row * 2],
        y: contour.data32S[row * 2 + 1],
      })
    }
    points.push({
      uuid: genUUID(),
      x: contour.data32S[0],
      y: contour.data32S[1],
    })
    const { x, y, w, h } = getBound(points)
    const _points = points.map((_point: { x: number; y: number }) => {
      return {
        uuid: genUUID(),
        ..._point,
      }
    })
    const { x: _x, y: _y, w: _w, h: _h } = getBound(
      _points.reduce((arr: Array<{ x: number; y: number }>, point: IPoint) => {
        arr.push({
          x: point.x,
          y: point.y,
        })
        return arr
      }, []),
    )
    const contoursComponent: IComponent = {
      uuid: genUUID(),
      type: 'polygon',
      name: 'polygon',
      lock: false,
      visible: true,
      value: {
        points: _points,
        fillColor: hierarchy.data32S[i * 4 + 3] === -1 ? '#000' : '#fff',
        strokeColor: '#000',
        closePath: true,
      } as unknown as IComponentValue,
      x: _x,
      y: _y,
      w: _w,
      h: _h,
      rotation: 0,
      flipX: false,
      flipY: false,
      usedInCharacter: false,
    }
    // @ts-ignore
    addContoursComponent(contoursComponent)
  }

  clearCurvesComponent()
  contoursComponents.value.map((contourComponent: IComponent) => {
    if (contourComponent.type === 'polygon') {
      const points = (contourComponent.value as unknown as IPenComponent).points
      const beziers: Array<any> = fitCurve(points, maxError.value)
      let penPoints: Array<IPenPoint> = []
      if (!beziers.length) return
      penPoints.push({
        uuid: genUUID(),
        x: beziers[0][0].x,
        y: beziers[0][0].y,
        type: 'anchor',
        origin: null,
        isShow: true,
      })
      beziers.map((bezier: Array<{ x: number; y: number }>) => {
        const uuid2 = genUUID()
        const uuid3 = genUUID()
        const uuid4 = genUUID()
        penPoints.push({
          uuid: uuid2,
          x: bezier[1].x,
          y: bezier[1].y,
          type: 'control',
          origin: penPoints[penPoints.length - 1].uuid,
          isShow: false,
        })
        penPoints.push({
          uuid: uuid3,
          x: bezier[2].x,
          y: bezier[2].y,
          type: 'control',
          origin: uuid4,
          isShow: false,
        })
        penPoints.push({
          uuid: uuid4,
          x: bezier[3].x,
          y: bezier[3].y,
          type: 'anchor',
          origin: null,
          isShow: true,
        })
      })
      const { x: penX, y: penY, w: penW, h: penH } = getBound(penPoints)
      const curveComponent = R.clone(contourComponent)
      curveComponent.uuid = genUUID()
      ;(curveComponent.value as unknown as IPenComponent).points = penPoints
      ;(curveComponent.value as unknown as IPenComponent).editMode = false
      curveComponent.type = 'pen'
      curveComponent.name = 'pic-contour'
      curveComponent.x = penX
      curveComponent.y = penY
      curveComponent.w = penW
      curveComponent.h = penH
      curveComponent.rotation = 0
      curveComponent.usedInCharacter = true
      // @ts-ignore
      addCurvesComponent(curveComponent)
    }
  })
}

export {
  importFont_tauri,
  importFont,
  importGlyphs_tauri,
  importGlyphs,
  importSVG_tauri,
  importSVG,
  importPic,
  importPic_tauri,
  getFromFontPic,
  getFromPic,
  thumbnail,
}

