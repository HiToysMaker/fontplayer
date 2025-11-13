import {
  setCreateFileDialogVisible,
  setSaveFileTipDialogVisible,
  setSaveDialogVisible,
  setExportDialogVisible,
  tipsDialogVisible,
} from '../stores/dialogs'
import {
  files,
  addFile,
  characterList,
  generateCharacterTemplate,
  addCharacterTemplate,
  orderedListWithItemsForCharacterFile,
  orderedListWithItemsForCurrentCharacterFile,
  selectedFile,
  visibleCount,
  setSelectedFileUUID,
  clearCharacterRenderList,
} from '../stores/files'
import {
  loading,
  loaded,
  tips,
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
  ParameterType,
  radical_glyphs,
  stroke_glyphs,
} from '../stores/glyph'
import { setEditStatus, Status } from '../stores/font'
import { ParametersMap } from '../programming/ParametersMap'
import { Joint } from '../programming/Joint'
import { CustomGlyph } from '../programming/CustomGlyph'
import { Character } from '../programming/Character'
import { componentsToContours } from '../../features/font'
import { emitter } from '../Event/bus'
import * as R from 'ramda'
import localForage from 'localforage'
import { ElNotification } from 'element-plus'
import { h, nextTick } from 'vue'
import {
  save as tauriSave,
  open as tauriOpen,
} from '@tauri-apps/plugin-dialog'
import {
  writeTextFile,
  writeFile,
  readFile,
  readTextFile,
} from '@tauri-apps/plugin-fs'
import router from '../../router'
import { ENV } from '../stores/system'
import type { ICharacterFile, IFile, IPenComponent } from '../stores/files'
import type { ICustomGlyph } from '../stores/glyph'
import { i18n } from '../../i18n'
import { kai_strokes } from '../templates/strokes_1'
import { genUUID } from '../../utils/string'
import { importTemplate2 } from './templatesHandlers'

const plainCompnent = (comp: any) => {
  if (comp._o) {
    delete comp._o
  }
  return comp
}

const plainGlyph = (glyph: ICustomGlyph, options: { clearScript: boolean } = { clearScript: false }) => {
  const { clearScript } = options
  const data: ICustomGlyph = {
    uuid: glyph.uuid,
    type: glyph.type,
    name: glyph.name,
    components: glyph.components.map((component) => {
      const _component = Object.assign({}, component)

      if ((_component.value as unknown as IPenComponent).contour) {
        (_component.value as unknown as IPenComponent).contour = null
      }
      if ((_component.value as unknown as IPenComponent).preview) {
        (_component.value as unknown as IPenComponent).preview = null
      }

      if (component.type === 'glyph') {
        // @ts-ignore
        _component.value = plainGlyph(component.value, { clearScript: true })
      } else {
        _component.value = plainCompnent(component.value)
      }
      return _component
    }),
    groups: R.clone(glyph.groups),
    orderedList: R.clone(glyph.orderedList),
    selectedComponentsUUIDs: R.clone(glyph.selectedComponentsUUIDs),
    view: R.clone(glyph.view),
    //@ts-ignore
    parameters: glyph.parameters.parameters,
    //@ts-ignore
    joints: glyph.joints.map((joint) => {
      return {
        name: joint.name,
        uuid: joint.uuid,
        x: joint.x,
        y: joint.y,
      }
    }),
    //@ts-ignore
    reflines: glyph.reflines ? R.clone(glyph.reflines) : [],
    script: clearScript ? null : glyph.script,
    skeleton: glyph.skeleton ? R.clone(glyph.skeleton) : null,
    style: glyph.style,
  }

  if (clearScript) {
    data.script_reference = glyph.uuid
  }

  if (glyph.layout) {
    //@ts-ignore
    data.layout = R.clone(glyph.layout)
  }
  if (glyph.glyph_script) {
    //@ts-ignore
    data.glyph_script = R.clone(glyph.glyph_script)
  }
  if (glyph.system_script) {
    //@ts-ignore
    data.system_script = R.clone(glyph.system_script)
  }

  if (glyph._o) {
    data.objData = glyph._o.getData()

    data.objData._components.map((_component) => {
      if (_component.contour) {
        _component.contour = null
      }
      if (_component.preview) {
        _component.preview = null
      }
    })
  }

  return data
}

const plainCharacter = (character: ICharacterFile) => {
  addLoaded()
  const data = {
    uuid: character.uuid,
    type: character.type,
    character: R.clone(character.character),
    components: character.components.map((component) => {
      const _component = Object.assign({}, component)

      if ((_component.value as unknown as IPenComponent).contour) {
        (_component.value as unknown as IPenComponent).contour = null
      }
      if ((_component.value as unknown as IPenComponent).preview) {
        (_component.value as unknown as IPenComponent).preview = null
      }

      if (component.type === 'glyph') {
        //@ts-ignore
        _component.value = plainGlyph(component.value, { clearScript: true })
      } else {
        _component.value = plainCompnent(component.value)
      }
      return _component
    }),
    groups: R.clone(character.groups),
    orderedList: R.clone(character.orderedList),
    selectedComponentsUUIDs: R.clone(character.selectedComponentsUUIDs),
    script: character.script || `function script_${character.uuid.replaceAll('-', '_')} (character, constants, FP) {\n\t//Todo something\n}`,
    view: R.clone(character.view),
  }
  if (character.glyph_script) {
    //@ts-ignore
    data.glyph_script = R.clone(character.glyph_script)
  }
  if (character.info) {
    //@ts-ignore
    data.info = R.clone(character.info)
  }

  return data
}

const plainFile = async (file: IFile) => {
  const characterList: any[] = []

  const processCharacters = async (characters: any[]) => {
    const batchSize = 100
    for (let i = 0; i < characters.length; i += batchSize) {
      const batch = characters.slice(i, i + batchSize)
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          batch.forEach((character) => {
            characterList.push(plainCharacter(character))
          })
          resolve()
        })
      })
    }
  }

  await processCharacters(file.characterList)

  return {
    uuid: file.uuid,
    characterList,
    name: file.name,
    width: file.width,
    height: file.height,
    saved: file.saved,
    iconsCount: file.iconsCount,
    fontSettings: R.clone(file.fontSettings),
  }
}

const mapToObject = (map) => {
  let obj = {}
  map.forEach((value, key) => {
    obj[key] = value
  })
  return obj
}

const updateParameters = (parameters, name) => {
  const stroke = kai_strokes.find((stroke) => stroke.name === name)
  if (stroke) {
    for (const param of stroke.params) {
      if (param.originParam) {
        const index = parameters.findIndex((p) => p.name === param.originParam)
        const originParam = parameters.splice(index, 1)[0]
        parameters.splice(index, 0, {
          uuid: originParam.uuid,
          name: param.name,
          value: originParam.value,
          type: ParameterType.Number,
          min: param.min,
          max: param.max,
        })
      } else {
        const parameter = parameters.find((p) => p.name === param.name)
        if (!parameter) {
          parameters.push({
            uuid: genUUID(),
            name: param.name,
            value: param.default,
            type: ParameterType.Number,
            min: param.default,
            max: param.default,
          })
        }
      }
    }
  }
}

const instanceGlyph = (plainGlyph, options) => {
  // updateParameters(plainGlyph.parameters, plainGlyph.name)
  plainGlyph.parameters = new ParametersMap(plainGlyph.parameters)
  plainGlyph.joints = plainGlyph.joints.map((joint) => {
    return new Joint(joint.name, { x: joint.x, y: joint.y })
  })
  plainGlyph.components = plainGlyph.components.length
    ? plainGlyph.components.map((component) => {
        if (component.type === 'glyph') {
          //@ts-ignore
          component.value = instanceGlyph(component.value, false)
          component.value.parent_reference = {
            uuid: plainGlyph.uuid,
            type: plainGlyph.type,
          }
        }
        return component
      })
    : []

  const glyphInstance = new CustomGlyph(plainGlyph)
  if (plainGlyph.objData) {
    glyphInstance.setData(plainGlyph.objData)
  }

  if (options && options?.updateContoursAndPreview) {
    componentsToContours(
      orderedListWithItemsForCharacterFile(plainGlyph),
      {
        unitsPerEm: options.unitsPerEm,
        descender: options.descender,
        advanceWidth: options.advanceWidth,
      },
      { x: 0, y: 0 },
      false,
      false,
      true,
    )
  }

  return plainGlyph
}

const instanceCharacter = (plainCharacter, options?) => {
  if (!plainCharacter.script) {
    plainCharacter.script = `function script_${plainCharacter.uuid.replaceAll('-', '_')} (character, constants, FP) {\n\t//Todo something\n}`
  }
  plainCharacter.components = plainCharacter.components.length
    ? plainCharacter.components.map((component) => {
        if (component.type === 'glyph') {
          //@ts-ignore
          component.value = instanceGlyph(component.value, {
            unitsPerEm: 1000,
            descender: -200,
            advanceWidth: 1000,
            updateContoursAndPreview: options?.updateContoursAndPreview,
          })
          component.value.parent_reference = {
            uuid: plainCharacter.uuid,
            type: plainCharacter.type,
          }
        }
        return component
      })
    : []
  //@ts-ignore
  new Character(plainCharacter)

  if (options && options?.updateContoursAndPreview) {
    componentsToContours(orderedListWithItemsForCharacterFile(plainCharacter),
      {
        unitsPerEm: options.unitsPerEm,
        descender: options.descender,
        advanceWidth: options.advanceWidth,
      },
      { x: 0, y: 0 },
      false,
      false,
      false,
    )
  }

  return plainCharacter
}

const getProjectData = async () => {
  const file = await plainFile(selectedFile.value)
  const _glyphs = glyphs.value.map((glyph: ICustomGlyph) => {
    return plainGlyph(glyph)
  })
  const _stroke_glyphs = stroke_glyphs.value.map((glyph: ICustomGlyph) => {
    return plainGlyph(glyph)
  })
  const _radical_glyphs = radical_glyphs.value.map((glyph: ICustomGlyph) => {
    return plainGlyph(glyph)
  })
  const _comp_glyphs = comp_glyphs.value.map((glyph: ICustomGlyph) => {
    return plainGlyph(glyph)
  })
  return JSON.stringify({
    file,
    constants: constants.value,
    constantGlyphMap: mapToObject(constantGlyphMap),
    version: 1.0,
    glyphs: _glyphs,
    stroke_glyphs: _stroke_glyphs,
    radical_glyphs: _radical_glyphs,
    comp_glyphs: _comp_glyphs,
  })
}

const saveFile_tauri = async () => {
  setSaveDialogVisible(true)
}

const saveAs_tauri = async () => {
  setSaveDialogVisible(true)
}

const base64ToArrayBuffer = (base64: string) => {
  const base64WithoutHeader = base64.replace(/^data:.+;base64,/, '')
  const binaryString = atob(base64WithoutHeader)
  const arrayBuffer = new ArrayBuffer(binaryString.length)
  const view = new Uint8Array(arrayBuffer)

  for (let i = 0; i < binaryString.length; i++) {
    view[i] = binaryString.charCodeAt(i)
  }

  return arrayBuffer
}

const nativeSaveText = async (data, filename, formats) => {
  const path = await tauriSave({
    defaultPath: filename,
    filters: [
      {
        name: 'Filter',
        extensions: formats,
      },
    ],
  })
  if (path) {
    await writeTextFile(path, data)
  }
}

const nativeSaveBinary = async (data, filename, formats) => {
  const path = await tauriSave({
    defaultPath: filename,
    filters: [
      {
        name: 'Filter',
        extensions: formats,
      },
    ],
  })
  if (path) {
    await writeFile(path, data)
  }
}

const addLoaded = () => {
  if (loading.value) {
    loaded.value += 1
    if (loaded.value >= total.value) {
      loading.value = false
    }
  }
}

const nativeImportFile = async (formats) => {
  const path = await tauriOpen({
    filters: [
      {
        name: 'Filter',
        extensions: formats,
      },
    ],
  })
  let uint8Array = null
  let name = 'untitled'
  if (path) {
    uint8Array = await readFile(path)
    name = path.split('/').pop().split('.')[0]
  }
  return {
    uint8Array,
    name,
  }
}

const nativeImportTextFile = async (formats) => {
  const path = await tauriOpen({
    filters: [
      {
        name: 'Filter',
        extensions: formats,
      },
    ],
  })
  let data = null
  let name = 'untitled'
  if (path) {
    data = await readTextFile(path)
    name = path.split('/').pop().split('.')[0]
  }
  return {
    data,
    name,
  }
}

const createFile = () => {
  if (files.value && files.value.length) {
    tips.value = '目前字玩仅支持同时编辑一个工程，请关闭当前工程再新建。注意，关闭工程前请保存工程以避免数据丢失。'
    tipsDialogVisible.value = true
  } else {
    setCreateFileDialogVisible(true)
  }
}

const openFile_tauri = async () => {
  if (files.value && files.value.length) {
    tips.value = '目前字玩仅支持同时编辑一个工程，请关闭当前工程再打开新工程。注意，关闭工程前请保存工程以避免数据丢失。'
    tipsDialogVisible.value = true
  } else {
    const { data: rawdata } = await nativeImportTextFile(['json'])
    if (!rawdata) return
    const data = JSON.parse(rawdata)
    await __openFile(data)
  }
}

const __openFile = async (data) => {
  total.value =
    data.file.characterList.length * 1 +
    Math.min(visibleCount.value, data.file.characterList.length) +
    (data.glyphs.length + data.stroke_glyphs.length + data.radical_glyphs.length + data.comp_glyphs.length) * 3
  loaded.value = 0
  loading.value = true

  const processGlyphs = async (plainGlyphs, status) => {
    return new Promise<void>((resolve) => {
      const _glyphs = plainGlyphs.map((plainGlyph) =>
        instanceGlyph(plainGlyph, {
          updateContoursAndPreview: true,
          unitsPerEm: 1000,
          descender: -200,
          advanceWidth: 1000,
        }),
      )

      let index = 0
      const processNext = () => {
        if (index >= _glyphs.length) {
          resolve()
          return
        }

        const glyph = _glyphs[index]
        addGlyph(glyph, status)
        addGlyphTemplate(glyph, status)
        addLoaded()
        index++

        if (index % 100 === 0) {
          requestAnimationFrame(processNext)
        } else {
          processNext()
        }
      }

      processNext()
    })
  }

  const processCharacters = async (file) => {
    return new Promise<void>((resolve) => {
      let index = 0
      const processNext = () => {
        if (index >= file.characterList.length) {
          resolve()
          return
        }

        const character = file.characterList[index]
        addLoaded()
        const characterFile = instanceCharacter(character, {
          updateContoursAndPreview: true,
          unitsPerEm: file.fontSettings.unitsPerEm,
          descender: file.fontSettings.descender,
          advanceWidth: file.fontSettings.advanceWidth,
        })

        file.characterList[index] = characterFile
        index++

        if (index % 100 === 0) {
          requestAnimationFrame(processNext)
        } else {
          processNext()
        }
      }

      processNext()
    })
  }

  await processGlyphs(data.glyphs, Status.GlyphList)
  await processGlyphs(data.stroke_glyphs, Status.StrokeGlyphList)
  await processGlyphs(data.radical_glyphs, Status.RadicalGlyphList)
  await processGlyphs(data.comp_glyphs, Status.CompGlyphList)

  const file = data.file

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

  await processCharacters(file)

  let success = true
  for (let j = 0; j < files.value.length; j++) {
    if (files.value[j].uuid === file.uuid) {
      success = false
      ElNotification({
        title: '打开失败',
        message: h('i', `不能同时打开同一份工程${file.name}`),
        type: 'error',
      })
    }
  }
  if (success) {
    emitter.emit('renderGlyphPreviewCanvas')
    emitter.emit('renderStrokeGlyphPreviewCanvas')
    emitter.emit('renderRadicalGlyphPreviewCanvas')
    emitter.emit('renderCompGlyphPreviewCanvas')

    addFile(file)
    setSelectedFileUUID(file.uuid)
    setEditStatus(Status.CharacterList)
    if (router.currentRoute.value.name === 'welcome') {
      router.push('/editor')
    } else {
      clearCharacterRenderList()

      characterList.value.map((characterFile) => {
        addCharacterTemplate(generateCharacterTemplate(characterFile))
      })
      emitter.emit('renderPreviewCanvas')
    }
  }
}

const openFile = async () => {
  if (ENV.value === 'tauri') {
    if (router.currentRoute.value.name === 'welcome') {
      router.push('/editor')
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    await openFile_tauri()
    return
  }
  if (files.value && files.value.length) {
    tips.value = '目前字玩仅支持同时编辑一个工程，请关闭当前工程再打开新工程。注意，关闭工程前请保存工程以避免数据丢失。'
    tipsDialogVisible.value = true
  } else {
    if (router.currentRoute.value.name === 'welcome') {
      router.push('/editor')
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    await _openFile()
  }
}

const _openFile = async () => {
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
        await __openFile(data)
      }
    }
    document.body.removeChild(input)
  })
  document.body.appendChild(input)
  input.click()
}

const saveFile_web = () => {
  setSaveFileTipDialogVisible(true)
}

const saveFile = async () => {
  loading.value = true
  loaded.value = 0
  total.value =
    selectedFile.value.characterList.length +
    glyphs.value.length +
    stroke_glyphs.value.length +
    radical_glyphs.value.length +
    comp_glyphs.value.length

  const constants_data = JSON.stringify(constants.value)
  await localForage.setItem('constants', constants_data)

  const constantGlyphMap_data = JSON.stringify(mapToObject(constantGlyphMap))
  await localForage.setItem('constantGlyphMap', constantGlyphMap_data)

  const file = await plainFile(selectedFile.value)
  const file_data = JSON.stringify(file)
  await localForage.setItem('file', file_data)

  const _glyphs = glyphs.value.map((glyph: ICustomGlyph) => {
    loaded.value += 1
    return plainGlyph(glyph)
  })
  const glyphs_data = JSON.stringify(_glyphs)
  await localForage.setItem('glyphs', glyphs_data)

  const _stroke_glyphs = stroke_glyphs.value.map((glyph: ICustomGlyph) => {
    loaded.value += 1
    return plainGlyph(glyph)
  })
  const stroke_glyphs_data = JSON.stringify(_stroke_glyphs)
  await localForage.setItem('stroke_glyphs', stroke_glyphs_data)

  const _radical_glyphs = radical_glyphs.value.map((glyph: ICustomGlyph) => {
    loaded.value += 1
    return plainGlyph(glyph)
  })
  const radical_glyphs_data = JSON.stringify(_radical_glyphs)
  await localForage.setItem('radical_glyphs', radical_glyphs_data)

  const _comp_glyphs = comp_glyphs.value.map((glyph: ICustomGlyph) => {
    loaded.value += 1
    return plainGlyph(glyph)
  })
  const comp_glyphs_data = JSON.stringify(_comp_glyphs)
  await localForage.setItem('comp_glyphs', comp_glyphs_data)

  await localForage.setItem('version', 1.0)

  loading.value = false

  ElNotification({
    title: '保存成功',
    message: h('i', { style: 'color: teal' }, `已保存工程${file.name}至浏览器缓存中`),
  })
}

const clearCache = async () => {
  localForage.clear()
  ElNotification({
    title: '清空成功',
    message: h('i', { style: 'color: teal' }, `已清空浏览器缓存`),
  })
}

const syncData = async () => {
  if (files.value && files.value.length) {
    tips.value = '同步缓存会覆盖当前工程，请关闭当前工程再导入。注意，关闭工程前请保存工程以避免数据丢失。'
    tipsDialogVisible.value = true
  } else {
    await _syncData()
  }
}

const _syncData = async () => {
  clearGlyphRenderList(Status.GlyphList)
  clearGlyphRenderList(Status.StrokeGlyphList)
  clearGlyphRenderList(Status.RadicalGlyphList)
  clearGlyphRenderList(Status.CompGlyphList)

  const constants_data = JSON.parse(await localForage.getItem('constants'))
  if (constants_data) {
    for (let n = 0; n < constants_data.length; n++) {
      if (!constantsMap.getByUUID(constants_data[n].uuid)) {
        constants.value.push(constants_data[n])
      }
    }
  }
  const constantGlyphMap_data = JSON.parse(await localForage.getItem('constantGlyphMap'))
  if (constantGlyphMap_data) {
    const keys = Object.keys(constantGlyphMap_data)
    for (let n = 0; n < keys.length; n++) {
      constantGlyphMap.set(keys[n], constantGlyphMap_data[keys[n]])
    }
  }

  const glyphs_data = await localForage.getItem('glyphs')
  let plainGlyphs: Array<ICustomGlyph> = []
  if (glyphs_data) {
    plainGlyphs = JSON.parse(glyphs_data as string)
  }

  const stroke_glyphs_data = await localForage.getItem('stroke_glyphs')
  let plainGlyphs_stroke: Array<ICustomGlyph> = []
  if (stroke_glyphs_data) {
    plainGlyphs_stroke = JSON.parse(stroke_glyphs_data as string)
  }

  const radical_glyphs_data = await localForage.getItem('radical_glyphs')
  let plainGlyphs_radical: Array<ICustomGlyph> = []
  if (radical_glyphs_data) {
    plainGlyphs_radical = JSON.parse(radical_glyphs_data as string)
  }

  const comp_glyphs_data = await localForage.getItem('comp_glyphs')
  let plainGlyphs_comp: Array<ICustomGlyph> = []
  if (comp_glyphs_data) {
    plainGlyphs_comp = JSON.parse(comp_glyphs_data as string)
  }

  const file_data = await localForage.getItem('file')
  let file: any = null
  if (file_data) {
    file = JSON.parse(file_data as string)
  }

  loaded.value = 0
  total.value =
    (file ? file.characterList.length * 1 + Math.min(visibleCount.value, file.characterList.length) : 0) +
    (plainGlyphs.length + plainGlyphs_stroke.length + plainGlyphs_radical.length + plainGlyphs_comp.length) * 3
  if (total.value === 0) {
    const { locale } = i18n.global
    if (locale === 'zh') {
      ElNotification({
        title: '提示',
        message: h('i', '暂时没有缓存'),
      })
    } else if (locale === 'en') {
      ElNotification({
        title: 'Note',
        message: h('i', 'No cached data available'),
      })
    }
    return
  }

  loading.value = true

  const processGlyphs = async (plainGlyphs, status) => {
    return new Promise<void>((resolve) => {
      if (plainGlyphs.length === 0) {
        resolve()
        return
      }

      const _glyphs = plainGlyphs.map((plainGlyph) =>
        instanceGlyph(plainGlyph, {
          updateContoursAndPreview: true,
          unitsPerEm: 1000,
          descender: -200,
          advanceWidth: 1000,
        }),
      )

      let index = 0
      const processNext = () => {
        if (index >= _glyphs.length) {
          resolve()
          return
        }

        const glyph = _glyphs[index]
        addGlyph(glyph, status)
        addGlyphTemplate(glyph, status)
        addLoaded()
        index++

        if (index % 100 === 0) {
          requestAnimationFrame(processNext)
        } else {
          processNext()
        }
      }

      processNext()
    })
  }

  const processCharacters = async (file) => {
    return new Promise<void>((resolve) => {
      if (!file || !file.characterList || file.characterList.length === 0) {
        resolve()
        return
      }

      let index = 0
      const processNext = () => {
        if (index >= file.characterList.length) {
          resolve()
          return
        }

        const character = file.characterList[index]
        addLoaded()
        const characterFile = instanceCharacter(character, {
          updateContoursAndPreview: true,
          unitsPerEm: file.fontSettings.unitsPerEm,
          descender: file.fontSettings.descender,
          advanceWidth: file.fontSettings.advanceWidth,
        })

        file.characterList[index] = characterFile
        index++

        if (index % 100 === 0) {
          requestAnimationFrame(processNext)
        } else {
          processNext()
        }
      }

      processNext()
    })
  }

  if (glyphs_data) {
    glyphs.value = []
    await processGlyphs(plainGlyphs, Status.GlyphList)
  }

  if (stroke_glyphs_data) {
    stroke_glyphs.value = []
    await processGlyphs(plainGlyphs_stroke, Status.StrokeGlyphList)
  }

  if (radical_glyphs_data) {
    radical_glyphs.value = []
    await processGlyphs(plainGlyphs_radical, Status.RadicalGlyphList)
  }

  if (comp_glyphs_data) {
    comp_glyphs.value = []
    await processGlyphs(plainGlyphs_comp, Status.CompGlyphList)
  }

  if (file_data) {
    await processCharacters(file)

    let success = true
    for (let j = 0; j < files.value.length; j++) {
      if (files.value[j].uuid === file.uuid) {
        success = false
        ElNotification({
          title: '打开失败',
          message: h('i', `不能同时打开同一份工程${file.name}`),
          type: 'error',
        })
      }
    }
    if (success) {
      emitter.emit('renderGlyphPreviewCanvas')
      emitter.emit('renderStrokeGlyphPreviewCanvas')
      emitter.emit('renderRadicalGlyphPreviewCanvas')
      emitter.emit('renderCompGlyphPreviewCanvas')

      addFile(file)
      setEditStatus(Status.CharacterList)
      if (router.currentRoute.value.name === 'welcome') {
        router.push('/editor')
      } else {
        clearCharacterRenderList()
        characterList.value.map((characterFile) => {
          addCharacterTemplate(generateCharacterTemplate(characterFile))
        })
        emitter.emit('renderPreviewCanvas')
      }
    }
  }
}

const exportJSON = () => {
  if (ENV.value === 'tauri') {
    saveAs_tauri()
  } else {
    setExportDialogVisible(true)
  }
}

export {
  plainGlyph,
  plainCharacter,
  plainFile,
  mapToObject,
  instanceGlyph,
  instanceCharacter,
  getProjectData,
  saveFile_tauri,
  saveAs_tauri,
  base64ToArrayBuffer,
  nativeSaveText,
  nativeSaveBinary,
  addLoaded,
  nativeImportFile,
  nativeImportTextFile,
  createFile,
  openFile,
  openFile_tauri,
  saveFile_web,
  saveFile,
  clearCache,
  syncData,
  _syncData,
  __openFile,
  _openFile,
  exportJSON,
  updateParameters,
}


