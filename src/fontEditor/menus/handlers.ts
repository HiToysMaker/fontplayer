import {
	setCreateFileDialogVisible,
	setAddTextDialogVisible,
	setAddIconDialogVisible,
	setFontSettingsDialogVisible,
	setPreferenceSettingsDialogVisible,
	setLanguageSettingsDialogVisible,
	setImportTemplatesDialogVisible,
	tipsDialogVisible,
	setSaveFileTipDialogVisible,
	setSaveDialogVisible,
	setSaveAsDialogVisible,
	setExportDialogVisible,
} from '../stores/dialogs'
import {
	files,
	addFile,
	setClipBoard,
	clipBoard,
	setSelectionForCurrentCharacterFile,
	removeComponentForCurrentCharacterFile,
	addComponentForCurrentCharacterFile,
	selectedFile, selectedComponent, editCharacterFile, selectedComponents,
	type IComponent,
	ICharacterFile,
	IFile,
	setSelectedFileUUID,
	updateFontSettings,
	clearCharacterRenderList,
	characterList,
	generateCharacterTemplate,
	addCharacterTemplate,
	orderedListWithItemsForCharacterFile,
	orderedListWithItemsForCurrentCharacterFile,
	addCharacterForCurrentFile,
} from '../stores/files'
import { canvas, fontRenderStyle, loaded, tips, total } from '../stores/global'
import { saveAs } from 'file-saver'
import * as R from 'ramda'
import { genUUID, toUnicode } from '@/utils/string'
import localForage from 'localforage'
import { ElNotification } from 'element-plus'
import { h } from 'vue'
import { parseStrToSvg, parseSvgToComponents, componentsToSvg } from '@/features/svg'
import JSZip from 'jszip'
import { parse, create, toArrayBuffer } from '@/fontManager'
import type {
	ILine,
	ICubicBezierCurve,
	IQuadraticBezierCurve,
} from '@/fontManager'
import {
	componentsToContours,
} from '@/features/font'
import { emitter } from '../Event/bus'

import {
	IComponentValue,
	contoursComponents,
	setEditStatus,
	setEditCharacterPic,
	setBitMap,
	addContoursComponent,
	addCurvesComponent,
	bitmap,
	rThreshold, gThreshold, bThreshold, maxError,
	type IPenComponent,
	Status,
	editStatus,
	clearContoursComponent,
	clearCurvesComponent,
} from '../stores/font'
import { reversePixels, toBlackWhiteBitMap } from '../../features/image'
import { getBound, transformPoints } from '../../utils/math'
import { fitCurve } from '../../features/fitCurve'
import type { IPoint as IPenPoint, IPoint } from '../stores/pen'
import { render } from '../canvas/canvas'
import { ICustomGlyph, IGlyphComponent, addGlyph, addGlyphTemplate, clearGlyphRenderList, comp_glyphs, constantGlyphMap, constants, constantsMap, executeScript, getGlyphByName, glyphs, orderedListWithItemsForCurrentGlyph, radical_glyphs, stroke_glyphs } from '../stores/glyph'
import { ParametersMap } from '../programming/ParametersMap'
import { Joint, linkComponentsForJoints } from '../programming/Joint'
import router from '../../router'
import { nextTick } from 'vue'
import { loading } from '../stores/global'
import { worker } from '../../main'
import { WorkerEventType } from '../worker'
import { CustomGlyph } from '../programming/CustomGlyph'

const plainGlyph = (glyph: ICustomGlyph) => {
	const data: ICustomGlyph = {
		uuid: glyph.uuid,
		type: glyph.type,
		name: glyph.name,
		components: glyph.components.map((component) => {
			const _component = Object.assign({}, component)
			if (component.type === 'glyph') {
				//@ts-ignore
				_component.value = plainGlyph(component.value)
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
		script: glyph.script,
	}
	// if (glyph.parent) {
	// 	//@ts-ignore
	// 	data.parent = plainGlyph((glyph as ICustomGlyph).parent)
	// }
	if (glyph.layout) {
		//@ts-ignore
		// data.layout = plainGlyphLayout(glyph.layout)
		data.layout = R.clone(glyph.layout)
	}
	if (glyph.glyph_script) {
		//@ts-ignore
		// data.glyph_script = mapToObject(glyph.glyph_script)

		//Object.keys(glyph.glyph_script).map((key) => {
		//	let removeMark = true
		//	for (let i = 0; i < glyph.components.length; i++) {
		//		if (glyph.components[i].uuid === key) {
		//			removeMark = false
		//		}
		//	}
		//	if (removeMark) {
		//		delete glyph.glyph_script[key]
		//	}
		//})
		data.glyph_script = R.clone(glyph.glyph_script)
	}
	if (glyph.system_script) {
		//@ts-ignore
		// data.system_script = mapToObject(glyph.system_script)
		data.system_script = R.clone(glyph.system_script)
	}

	//for (let i = 0; i < stroke_glyphs.value.length; i++) {
	//	const stroke = stroke_glyphs.value[i]
	//	if (glyph.uuid === stroke.uuid) {
	//		data.script = stroke.script
	//	}
	//}

	if (glyph._o) {
		data.objData = glyph._o.getData()
	}

	////---------
	//for (let i = 0; i < stroke_glyphs.value.length; i++) {
	//	const stroke = stroke_glyphs.value[i]
	//	if (glyph.uuid === stroke.uuid) {
	//		data.script = stroke.script
	//		// @ts-ignore
	//		for (let j = 0; j < data.parameters.length; j++) {
	//			const param = data.parameters[j]
	//			const param2 = stroke.parameters.parameters[j]
	//			if (param.uuid === param2.uuid) {
	//				param.name = param2.name
	//			}
	//		}
	//	}
	//}
	////---------
	
	return data
}

const mapToObject = (map) => {
  let obj = {}
  map.forEach((value, key) => {
    obj[key] = value
  })
  return obj
}

//const objectToMap = (obj) => {
//  let map = new Map()
//	const keys = Object.keys(obj)
//	for (let i = 0; i < keys.length; i++) {
//		const key = keys[i]
//		map.set(key, obj[key])
//	}
//  return map
//}


//const instanceGlyphLayout = (layout) => {
//	const data = {
//		type: layout.type,
//		params: R.clone(layout.params),
//	}
//	if (layout.ratioedMap) {
//		//@ts-ignore
//		data.ratioedMap = objectToMap(layout.ratioedMap)
//	}
//	return data
//}

//const plainGlyphLayout = (layout) => {
//	const data = {
//		type: layout.type,
//		params: R.clone(layout.params),
//	}
//	if (layout.ratioedMap) {
//		//@ts-ignore
//		data.ratioedMap = mapToObject(layout.ratioedMap)
//	}
//	return data
//}

const plainFile = (file: IFile) => {
	return {
		uuid: file.uuid,
		characterList: file.characterList.map((character) => plainCharacter(character)),
		name: file.name,
		width: file.width,
		height: file.height,
		saved: file.saved,
		iconsCount: file.iconsCount,
		fontSettings: R.clone(file.fontSettings),
	}
}

const plainCharacter = (character: ICharacterFile) => {
	const data = {
		uuid: character.uuid,
		type: character.type,
		character: R.clone(character.character),
		components: character.components.map((component) => {
			const _component = Object.assign({}, component)
			if (component.type === 'glyph') {
				//@ts-ignore
				_component.value = plainGlyph(component.value)
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
		// data.glyph_script = mapToObject(character.glyph_script)
		data.glyph_script = R.clone(character.glyph_script)
	}
	if (character.info) {
		//@ts-ignore
		data.info = R.clone(character.info)
	}

	return data
}

const instanceGlyph = (plainGlyph) => {
	// console.time('part1')
	plainGlyph.parameters = new ParametersMap(plainGlyph.parameters)
	// console.timeEnd('part1')
	
	// console.time('part2')
	plainGlyph.joints = plainGlyph.joints.map((joint) => {
		return new Joint(joint.name, { x: joint.x, y: joint.y })
	})
	// console.timeEnd('part2')

	// console.time('part3')
	// if (plainGlyph.system_script) {
	// 	plainGlyph.system_script = new Map(Object.entries(plainGlyph.system_script))
	// }
	// console.timeEnd('part3')

	// console.time('part4')
	// if (plainGlyph.glyph_script) {
	// 	plainGlyph.glyph_script = new Map(Object.entries(plainGlyph.glyph_script))
	// }
	// console.timeEnd('part4')

	// console.time('part5')
	// if (plainGlyph.layout) {
	// 	plainGlyph.layout = instanceGlyphLayout(plainGlyph.layout)
	// }
	// console.timeEnd('part5')

	// console.time('part6')
	plainGlyph.components = plainGlyph.components.length ? plainGlyph.components.map((component) => {
		if (component.type === 'glyph') {
			//@ts-ignore
			component.value = instanceGlyph(component.value)
			component.value.parent = plainGlyph
			// component.value._o.getJoints().map((joint) => {
			// 	joint.component = component
			// })
		}
		return component
	}) : []
	// console.timeEnd('part6')

	//-------
	////console.log('execute', plainGlyph.script)
	////debugger
	//executeScript(plainGlyph)
	//-------
	
	const glyphInstance = new CustomGlyph(plainGlyph)
	if (plainGlyph.objData) {
		glyphInstance.setData(plainGlyph.objData)
	}
	return plainGlyph
}

const instanceCharacter = (plainCharacter) => {
	if (!plainCharacter.script) {
		plainCharacter.script = `function script_${plainCharacter.uuid.replaceAll('-', '_')} (character, constants, FP) {\n\t//Todo something\n}`
	}
	// if (plainCharacter.glyph_script) {
	// 	plainCharacter.glyph_script = new Map(Object.entries(plainCharacter.glyph_script))
	// }
	plainCharacter.components = plainCharacter.components.length ? plainCharacter.components.map((component) => {
		if (component.type === 'glyph') {
			//@ts-ignore
			component.value = instanceGlyph(component.value)
			component.value.parent = plainCharacter
			component.value._o.getJoints().map((joint) => {
				joint.component = component
			})
		}
		return component
	}) : []
	//@ts-ignore
	const glyphInstance = new CustomGlyph(plainCharacter)
	// executeCharacterScript(plainCharacter)
	return plainCharacter
}

const getProjectData = () => {
	const file = plainFile(selectedFile.value)
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

const saveFile_electron = async () => {
	//const data = getProjectData()
	////@ts-ignore
	//const filePath = await window.electronAPI._saveFile(data, `${selectedFile.value.name}.json`)
	setSaveDialogVisible(true)
}

const saveAs_electron = async () => {
	//const data = getProjectData()
	////@ts-ignore
	//const filePath = await window.electronAPI._saveFile(data, `${file.name}.json`)
	setSaveDialogVisible(true)
}

const exportGlyphs_electron = async () => {
	if (editStatus.value === Status.GlyphList) {
		const _glyphs = glyphs.value.map((glyph: ICustomGlyph) => {
			return plainGlyph(glyph)
		})
		const data = JSON.stringify(_glyphs)
		//@ts-ignore
		const filePath = await window.electronAPI._saveFile(data, `glyphs.json`)
	} else if (editStatus.value === Status.StrokeGlyphList) {
		const _glyphs = stroke_glyphs.value.map((glyph: ICustomGlyph) => {
			return plainGlyph(glyph)
		})
		const data = JSON.stringify(_glyphs)
		//@ts-ignore
		const filePath = await window.electronAPI._saveFile(data, `stroke_glyphs.json`)
	} else if (editStatus.value === Status.RadicalGlyphList) {
		const _glyphs = radical_glyphs.value.map((glyph: ICustomGlyph) => {
			return plainGlyph(glyph)
		})
		const data = JSON.stringify(_glyphs)
		//@ts-ignore
		const filePath = await window.electronAPI._saveFile(data, `radical_glyphs.json`)
	} else if (editStatus.value === Status.CompGlyphList) {
		const _glyphs = comp_glyphs.value.map((glyph: ICustomGlyph) => {
			return plainGlyph(glyph)
		})
		const data = JSON.stringify(_glyphs)
		//@ts-ignore
		const filePath = await window.electronAPI._saveFile(data, `comp_glyphs.json`)
	} else {
		const _glyphs = glyphs.value.map((glyph: ICustomGlyph) => {
			return plainGlyph(glyph)
		})
		const data = JSON.stringify(_glyphs)
		//@ts-ignore
		const filePath = await window.electronAPI._saveFile(data, `glyphs.json`)
	}
}

const exportJPEG_electron = async () => {
	// 导出JPEG
	const _canvas = canvas.value as HTMLCanvasElement
	const data = _canvas.toDataURL('image/jpeg')
	//const buffer = decodeBase64Image(data).data
	const fileName = `${editCharacterFile.value.character.text}.jpg`
	//@ts-ignore
	const filePath = await window.electronAPI._saveFile2(data, fileName)
}

const exportPNG_electron = async () => {
	// 导出PNG
	const _canvas = canvas.value as HTMLCanvasElement
	render(_canvas, false)
	const data = _canvas.toDataURL('image/png')
	//const buffer = decodeBase64Image(data).data
	const fileName = `${editCharacterFile.value.character.text}.png`
	//@ts-ignore
	const filePath = await window.electronAPI._saveFile2(data, fileName)
	render(_canvas, true)
}

const exportSVG_electron = async () => {
	// 导出SVG
	// const components = editCharacterFile.value.components
	if (editStatus.value !== Status.Edit && editStatus.value !== Status.Glyph ) return
	const components = editStatus.value === Status.Edit ? orderedListWithItemsForCurrentCharacterFile.value : orderedListWithItemsForCurrentGlyph.value
	const data = componentsToSvg(components, selectedFile.value.width, selectedFile.value.height)
	const fileName = `${editCharacterFile.value.character.text}.svg`
	//@ts-ignore
	const filePath = await window.electronAPI._saveFile(data, fileName)
}

const exportFont_electron = async () => {
	const font = createFont()
	const buffer = new Uint8Array(toArrayBuffer(font) as ArrayBuffer)
	//@ts-ignore
	const filePath = await window.electronAPI._saveFile(buffer, `${selectedFile.value.name}.otf`)
}

const createFile = () => {
	// 新建
	if (files.value && files.value.length) {
		tips.value = '目前字玩仅支持同时编辑一个工程，请关闭当前工程再新建。注意，关闭工程前请保存工程以避免数据丢失。'
		tipsDialogVisible.value = true
	} else {
		setCreateFileDialogVisible(true)
	}
}

const openFile_electron = async (rawdata) => {
	if (files.value && files.value.length) {
		tips.value = '目前字玩仅支持同时编辑一个工程，请关闭当前工程再打开新工程。注意，关闭工程前请保存工程以避免数据丢失。'
		tipsDialogVisible.value = true
	} else {
		await _openFile_electron(rawdata)
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

const _openFile_electron = async (rawdata) => {
	const data = JSON.parse(rawdata)
	__openFile(data)
}

const __openFile = (data) => {
	total.value = data.file.characterList.length * 2 + (data.glyphs.length + data.stroke_glyphs.length + data.radical_glyphs.length + data.comp_glyphs.length) * 3
	loaded.value = 0
	loading.value = true
	{
		const plainGlyphs = data.glyphs
		const _glyphs = plainGlyphs.map((plainGlyph) => instanceGlyph(plainGlyph))
		_glyphs.map((glyph) => {
			addGlyph(glyph, Status.GlyphList)
			addGlyphTemplate(glyph, Status.GlyphList)
			addLoaded()
		})
	}
	{
		const plainGlyphs = data.stroke_glyphs
		const _glyphs = plainGlyphs.map((plainGlyph) => instanceGlyph(plainGlyph))
		_glyphs.map((glyph) => {
			addGlyph(glyph, Status.StrokeGlyphList)
			addGlyphTemplate(glyph, Status.StrokeGlyphList)
			addLoaded()
		})
	}
	{
		const plainGlyphs = data.radical_glyphs
		const _glyphs = plainGlyphs.map((plainGlyph) => instanceGlyph(plainGlyph))
		_glyphs.map((glyph) => {
			addGlyph(glyph, Status.RadicalGlyphList)
			addGlyphTemplate(glyph, Status.RadicalGlyphList)
			addLoaded()
		})
	}
	{
		const plainGlyphs = data.comp_glyphs
		const _glyphs = plainGlyphs.map((plainGlyph) => instanceGlyph(plainGlyph))
		_glyphs.map((glyph) => {
			addGlyph(glyph, Status.CompGlyphList)
			addGlyphTemplate(glyph, Status.CompGlyphList)
			addLoaded()
		})
	}

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
	file.characterList = file.characterList.map((character) => {
		addLoaded()
		return instanceCharacter(character)
	})
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
	if (files.value && files.value.length) {
		tips.value = '目前字玩仅支持同时编辑一个工程，请关闭当前工程再打开新工程。注意，关闭工程前请保存工程以避免数据丢失。'
		tipsDialogVisible.value = true
	} else {
		if (router.currentRoute.value.name === 'welcome') {
			router.push('/editor')
		}
		await _openFile()
	}
}

const _openFile = async () => {
	// 打开
	const input = document.createElement('input')
	input.setAttribute('type', 'file')
	input.setAttribute('style', 'display: none')
	input.addEventListener('change', async (e: Event) => {
		const el = e.currentTarget as HTMLInputElement
		const readfiles = el.files as FileList
		for (let i = 0; i < readfiles.length; i++) {
			const reader = new FileReader()
			reader.readAsText(readfiles[i])
			reader.onload = () => {
				const data = JSON.parse(reader.result as string)
				__openFile(data)
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
	// 保存
	// const file = plainFile(selectedFile.value)
	// const data = JSON.stringify(file)
	// await localForage.setItem(file.uuid, data)
	// const list: Array<string> = await localForage.getItem('fileList') as Array<string>
	// if (!list) {
	// 	await localForage.setItem('fileList', [file.uuid])
	// } else {
	// 	await localForage.setItem('fileList', [...list, file.uuid])
	// }

	loading.value = true
	loaded.value = 0
	total.value = selectedFile.value.characterList.length + glyphs.value.length + stroke_glyphs.value.length + radical_glyphs.value.length + comp_glyphs.value.length

	const constants_data = JSON.stringify(constants.value)
	await localForage.setItem('constants', constants_data)

	const constantGlyphMap_data = JSON.stringify(mapToObject(constantGlyphMap))
	await localForage.setItem('constantGlyphMap', constantGlyphMap_data)

	const file = plainFile(selectedFile.value)
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
	// 清空缓存
	// const list: Array<string> = await localForage.getItem('fileList') as Array<string>
	// list.map(async (uuid: string) => {
	// 	await localForage.removeItem(uuid)
	// })
	// await localForage.removeItem('fileList')
	localForage.clear()
	ElNotification({
		title: '清空成功',
		message: h('i', { style: 'color: teal' }, `已清空浏览器缓存`),
	})
}

const importFont_electron = async (buffer) => {
	if (files.value && files.value.length) {
		tips.value = '目前字玩仅支持同时编辑一个工程，请关闭当前工程再导入字体。注意，关闭工程前请保存工程以避免数据丢失。'
		tipsDialogVisible.value = true
	} else {
		await _importFont_electron(buffer)
	}
}

const _importFont_electron = (options) => {
	const { buffer, fileName } = options
	const arrayBuffer = buffer.slice(0, buffer.length).buffer;
	// const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
	const font = parse(arrayBuffer)
	//updateFontSettings({
	//	unitsPerEm: font.settings.unitsPerEm as number,
	//	ascender: font.settings.ascender as number,
	//	descender: font.settings.descender as number,
	//})
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
	// const loading = document.createElement('div')
	// loading.className = 'loading'
	// loading.innerText = 'loading...'
	// document.body.appendChild(loading)
	const input = document.createElement('input')
	input.setAttribute('type', 'file')
	input.setAttribute('style', 'display: none')
	input.addEventListener('blur', async () => {
		loading.value = false
	})
	input.addEventListener('change', async (e: Event) => {
		await nextTick()
		const el = e.currentTarget as HTMLInputElement
		const files = el.files as FileList
		const _file = files[0]
		const fullFileName = _file.name; // 获取文件完整名称
		const fileName = fullFileName.substring(0, fullFileName.lastIndexOf('.')); // 去掉后缀
		const buffer = _file.arrayBuffer()
		const font = parse(await buffer)
		//updateFontSettings({
		//	unitsPerEm: font.settings.unitsPerEm as number,
		//	ascender: font.settings.ascender as number,
		//	descender: font.settings.descender as number,
		//})
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
		//worker.postMessage([0, 1])
		// for (let j = 0; j < font.characters.length; j++) {
		// 	const character: ICharacter = font.characters[j]
		// 	//if (!character.unicode || character.name === '.notdef') continue
		// 	if (!character.unicode && !character.name) continue
		// 	const characterComponent = {
		// 		uuid: genUUID(),
		// 		text: character.unicode ? String.fromCharCode(character.unicode) : character.name,
		// 		unicode: character.unicode ? character.unicode.toString(16) : '',
		// 	}
		// 	const characterFile = {
		// 		uuid: genUUID(),
		// 		type: 'text',
		// 		character: characterComponent,
		// 		components: [],
		// 		groups: [],
		// 		orderedList: [],
		// 		selectedComponentsUUIDs: [],
		// 		view: {
		// 			zoom: 100,
		// 			translateX: 0,
		// 			translateY: 0,
		// 		}
		// 	}
		// 	const components = contoursToComponents(character.contours, {
		// 		unitsPerEm,
		// 		descender,
		// 		advanceWidth: character.advanceWidth as number,
		// 	})
		// 	addCharacterForCurrentFile(characterFile)
		// 	addComponentsForCharacterFile(characterFile.uuid, components)
		// }
		//loading.value = false
		//emitter.emit('renderPreviewCanvas', true)
		document.body.removeChild(input)
	})
	document.body.appendChild(input)
	input.click()
	//loading.value = true
}

const importTemplates = () => {
	setImportTemplatesDialogVisible(true)
}

const importGlyphs_electron = (rawdata) => {
	// clearGlyphRenderList(editStatus.value)
	const data = JSON.parse(rawdata)
	const plainGlyphs = data.glyphs
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
	const _glyphs = plainGlyphs.map((plainGlyph) => instanceGlyph(plainGlyph))
	_glyphs.map((glyph) => {
		addGlyph(glyph, editStatus.value)
		addGlyphTemplate(glyph, editStatus.value)
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
}

const importGlyphs = () => {
	const input = document.createElement('input')
	input.setAttribute('type', 'file')
	input.setAttribute('style', 'display: none')
	input.addEventListener('change', async (e: Event) => {
		const el = e.currentTarget as HTMLInputElement
		const readfiles = el.files as FileList
		for (let i = 0; i < readfiles.length; i++) {
			const reader = new FileReader()
			reader.readAsText(readfiles[i])
			reader.onload = () => {
				// clearGlyphRenderList(editStatus.value)
				const data = JSON.parse(reader.result as string)
				const plainGlyphs = data.glyphs
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
				const _glyphs = plainGlyphs.map((plainGlyph) => instanceGlyph(plainGlyph))
				_glyphs.map((glyph) => {
					addGlyph(glyph, editStatus.value)
					addGlyphTemplate(glyph, editStatus.value)
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
			}
		}
		document.body.removeChild(input)
	})
	document.body.appendChild(input)
	input.click()
}

const importSVG_electron = (rawdata) => {
	const svgEl: HTMLElement = parseStrToSvg(rawdata).childNodes[0] as HTMLElement
	const components = parseSvgToComponents(svgEl as HTMLElement)
	components.forEach((component: IComponent) => {
		addComponentForCurrentCharacterFile(component)
	})
}

const importSVG = () => {
	// 导入SVG
	const input = document.createElement('input')
	input.setAttribute('type', 'file')
	input.setAttribute('style', 'display: none')
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

const exportJSON = () => {
	// 导出工程JSON
	//const content = getProjectData()
	//const blob = new Blob([content], {type: "text/plain;charset=utf-8"})
	//saveAs(blob, `${selectedFile.value.name}.json`)
	setExportDialogVisible(true)
}

const exportGlyphs = () => {
	loaded.value = 0
	//total.value = glyphs.value.length + stroke_glyphs.value.length + radical_glyphs.value.length + comp_glyphs.value.length
	let _glyphs = []
	if (editStatus.value === Status.GlyphList) {
		total.value = glyphs.value.length
		const _glyphs = glyphs.value.map((glyph: ICustomGlyph) => {
			loaded.value += 1
			return plainGlyph(glyph)
		})
		const data = JSON.stringify({
			glyphs: _glyphs,
			constants: constants.value,
			constantGlyphMap: mapToObject(constantGlyphMap),
			version: 1.0,
		})
		const blob = new Blob([data], {type: "text/plain;charset=utf-8"})
		saveAs(blob, `glyphs.json`)
	} else if (editStatus.value === Status.StrokeGlyphList) {
		total.value = stroke_glyphs.value.length
		const _glyphs = stroke_glyphs.value.map((glyph: ICustomGlyph) => {
			loaded.value += 1
			return plainGlyph(glyph)
		})
		const data = JSON.stringify({
			glyphs: _glyphs,
			constants: constants.value,
			constantGlyphMap: mapToObject(constantGlyphMap),
			version: 1.0,
		})
		const blob = new Blob([data], {type: "text/plain;charset=utf-8"})
		saveAs(blob, `stroke_glyphs.json`)
	} else if (editStatus.value === Status.RadicalGlyphList) {
		total.value = radical_glyphs.value.length
		const _glyphs = radical_glyphs.value.map((glyph: ICustomGlyph) => {
			loaded.value += 1
			return plainGlyph(glyph)
		})
		const data = JSON.stringify({
			glyphs: _glyphs,
			constants: constants.value,
			constantGlyphMap: mapToObject(constantGlyphMap),
			version: 1.0,
		})
		const blob = new Blob([data], {type: "text/plain;charset=utf-8"})
		saveAs(blob, `radical_glyphs.json`)
	} else if (editStatus.value === Status.CompGlyphList) {
		total.value = comp_glyphs.value.length
		loading.value = true
		setTimeout(() => {
			//_glyphs = comp_glyphs.value.map((glyph: ICustomGlyph) => {
			//	loaded.value += 1
			//	return plainGlyph(glyph)
			//})
			requestAnimationFrame(() => addGlyph(0))
			const addGlyph = (i) => {
				_glyphs.push(plainGlyph(comp_glyphs.value[i]))
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
					saveAs(blob, `comp_glyphs.json`)
				} else {
					requestAnimationFrame(() => addGlyph(i + 1))
				}
			}
		}, 50)
	} else {
		total.value = glyphs.value.length
		const _glyphs = glyphs.value.map((glyph: ICustomGlyph) => {
			loaded.value += 1
			return plainGlyph(glyph)
		})
		const data = JSON.stringify({
			glyphs: _glyphs,
			constants: constants.value,
			constantGlyphMap: mapToObject(constantGlyphMap),
			version: 1.0,
		})
		const blob = new Blob([data], {type: "text/plain;charset=utf-8"})
		saveAs(blob, `glyphs.json`)
	}
	// const _glyphs = glyphs.value.map((glyph: ICustomGlyph) => {
	// 	return plainGlyph(glyph)
	// })
	// const data = JSON.stringify(_glyphs)
	// const blob = new Blob([data], {type: "text/plain;charset=utf-8"})
	// saveAs(blob, `glyphs.json`)
	//loading.value = false
}

const exportJPEG = () => {
	// 导出JPEG
	const _canvas = canvas.value as HTMLCanvasElement
	// render(_canvas, false)
	const data = _canvas.toDataURL('image/jpeg')
	const link = document.createElement('a')
	link.download = selectedFile.value.name
	link.href = data
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
	// render(_canvas, true)
}

const exportPNG = () => {
	// 导出PNG
	const _canvas = canvas.value as HTMLCanvasElement
	render(_canvas, false)
	const data = _canvas.toDataURL('image/png')
	const link = document.createElement('a')
	link.download = selectedFile.value.name
	link.href = data
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
	render(_canvas, true)
}

const exportSVG = () => {
	// 导出SVG
	// const components = editCharacterFile.value.components
	if (editStatus.value !== Status.Edit && editStatus.value !== Status.Glyph ) return
	const components = editStatus.value === Status.Edit ? orderedListWithItemsForCurrentCharacterFile.value : orderedListWithItemsForCurrentGlyph.value
	const svgStr = componentsToSvg(components, selectedFile.value.width, selectedFile.value.height, fontRenderStyle.value)
	const blob = new Blob([svgStr], {type: "image/svg+xml"})
	saveAs(blob, `${editCharacterFile.value.character.text}.svg`)
}

const createFont = () => {
	const _width = selectedFile.value.width
	const _height = selectedFile.value.height
	const fontCharacters = [{
		unicode: 0,
		name: '.notdef',
		contours: [[]] as Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>,
		contourNum: 0,
		advanceWidth: Math.max(_width, _height),
	}]

	//const map = new Map()
	//for (let i = 0; i < radical_glyphs.value.length; i++) {
	//	const glyph = radical_glyphs.value[i]
	//	const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(glyph._o.components, {
	//		unitsPerEm: 1000,
	//		descender: -200,
	//		advanceWidth: 1000,
	//	}, {x: 0, y: 0}, true, false, false)
	//	const name = glyph.name.split('-')[0].charAt(0)
	//	if (map.get(name)) continue
	//	map.set(name, true)
	//	const unicode = toUnicode(name)
	//	fontCharacters.push({
	//		name: name,
	//		unicode: parseInt(unicode, 16),
	//		advanceWidth: Math.max(_width, _height),
	//		contours,
	//		contourNum: contours.length,
	//	})
	//}
	const { unitsPerEm, ascender, descender } = selectedFile.value.fontSettings
	for (let i = 0; i < selectedFile.value.characterList.length; i++) {
		const char: ICharacterFile = selectedFile.value.characterList[i]
		const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(
			orderedListWithItemsForCharacterFile(char),
			{
				unitsPerEm,
				descender,
				advanceWidth: unitsPerEm,
			}, {x: 0, y: 0}, false, false, false
		)
		const { text, unicode } = char.character
		fontCharacters.push({
			name: text,
			unicode: parseInt(unicode, 16),
			advanceWidth: unitsPerEm,
			contours,
			contourNum: contours.length,
		})
	}

	const font = create(fontCharacters, {
		familyName: selectedFile.value.name,
		styleName: 'Medium',
		unitsPerEm,
		ascender,
		descender,
	})
	return font
}

const exportFont = () => {
	const font = createFont()
	const dataView = new DataView(toArrayBuffer(font) as ArrayBuffer)
	const blob = new Blob([dataView], {type: 'font/opentype'})
	var zip = new JSZip()
	zip.file(`${selectedFile.value.name}.otf`, blob)
	zip.generateAsync({type:"blob"}).then(function(content: any) {
		saveAs(content, `${selectedFile.value.name}.zip`)
	})
}

const addCharacter = () => {
	setAddTextDialogVisible(true)
}

const addIcon = () => {
	setAddIconDialogVisible(true)
}

const undo = () => {
	// 撤销
	//filesStore.undo()
}

const redo = () => {
	// 重做
	//filesStore.redo()
}

const copy = () => {
	// 复制
	if (!selectedComponent.value) return
	setClipBoard(R.clone(selectedComponents.value))
}

const paste = () => {
	// 粘贴
	const components = clipBoard.value
	components.map((component) => {
		component.uuid = genUUID()
		addComponentForCurrentCharacterFile(component)
	})
	setClipBoard([])
}

const cut = () => {
	// 剪切
	if (!selectedComponent.value) return
	setClipBoard(R.clone(selectedComponents.value))
	selectedComponents.value.map((component: IComponent) => {
		removeComponentForCurrentCharacterFile(component.uuid)
	})
	setSelectionForCurrentCharacterFile('')
}

const del = () => {
	// 删除
	selectedComponents.value.map((component: IComponent) => {
		removeComponentForCurrentCharacterFile(component.uuid)
	})
	setSelectionForCurrentCharacterFile('')
}

//const decodeBase64Image = (dataString: string) => {
//	const matches: any = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
//	const response: any = {}

//	if (matches.length !== 3) {
//		return new Error('Invalid input string')
//	}

//	response.type = matches[1]
//	response.data = Buffer.from(matches[2], 'base64')

//	return response
//}

const fontSettings = () => {
	setFontSettingsDialogVisible(true)
}

const preferenceSettings = () => {
	setPreferenceSettingsDialogVisible(true)
}

const languageSettings = () => {
	setLanguageSettingsDialogVisible(true)
}

const importPic = () => {
	getFromPic()
}

const importPic_electron = (dataUrl) => {
	total.value = 0
	loaded.value = 0
	loading.value = true
	const img = document.createElement('img')
	img.onload = () => {
		setTimeout(() => {
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
		thumbnail(data, img, img.width)
		setEditStatus(Status.Pic)
	}
	img.src = data
}

const getFromPic = () => {
	if (editCharacterFile.value.fontPic) {
		getFromFontPic()
		return
	}
	const input = document.createElement('input')
	input.setAttribute('type', 'file')
	input.setAttribute('style', 'display: none')
	input.addEventListener('change', async (e: Event) => {
		const el = e.currentTarget as HTMLInputElement
		const files = el.files as FileList
		for (let i = 0; i < files.length; i++) {
			total.value = 0
			loaded.value = 0
			loading.value = true
			const data = window.URL.createObjectURL(files[i])
			const img = document.createElement('img')
			img.onload = () => {
				/**
				 * thumbnail
				 */
				// thumbnail(data, img, 100)
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
		thumbnailCanvas.height = d * img.height / img.width
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
	/**
	 * bitmap
	 */
	const pixels = toBlackWhiteBitMap(thumbnailPixels, {
		r: rThreshold.value,
		g: gThreshold.value,
		b: bThreshold.value,
	}, {
		x: 0,
		y: 0,
		size: -1,
		width: (thumbnailCanvas as HTMLCanvasElement).width,
		height: (thumbnailCanvas as HTMLCanvasElement).height,
	})
	setBitMap({
		data: pixels,
		width: thumbnailCanvas.width,
		height: thumbnailCanvas.height,
	})
	/**
	 * contours
	 */
	clearContoursComponent()
	const { canvas: reversedCanvas } = reversePixels(
		pixels,
		bitmap.value.width,
		bitmap.value.height,
	)
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
	let adjustW, adjustH
	const size = selectedFile.value?.fontSettings?.unitsPerEm || 1000
	if (allW > allH) {
		adjustW = size
		adjustH = allH / allW * adjustW
	} else {
		adjustH = size
		adjustW = allW / allH * adjustH
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
		//const _points = transformPoints(points, {
		//	x: (x - allX) * scaleW, y: (y - allY) * scaleH, w: w * scaleW, h: h * scaleH, rotation: 0, flipX: false, flipY: false,
		//}).map((_point: {x: number, y: number}) => {
		//	return {
		//		uuid: genUUID(),
		//		..._point,
		//	}
		//})
		const _points = points.map((_point: {x: number, y: number}) => {
			return {
				uuid: genUUID(),
				..._point,
			}
		})
		const { x: _x, y: _y, w: _w, h: _h } = getBound(_points.reduce((arr: Array<{x: number, y: number }>, point: IPoint) => {
			arr.push({
				x: point.x,
				y: point.y,
			})
			return arr
		}, []))
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
		//@ts-ignore
		addContoursComponent(contoursComponent)
	}
	/**
	 * curves
	 */
	clearCurvesComponent()
	contoursComponents.value.map((contourComponent: IComponent) => {
		if (contourComponent.type === 'polygon') {
			const points = (contourComponent.value as unknown as IPenComponent).points
			const beziers: Array<any> = fitCurve(points, maxError.value)
			let penPoints: Array<IPenPoint> = []
			beziers.map((bezier: Array<{ x: number, y: number }>, index) => {
				const uuid1 = genUUID()
				const uuid2 = genUUID()
				const uuid3 = genUUID()
				const uuid4 = genUUID()
				penPoints.push({
					uuid: uuid1,
					x: bezier[0].x,
					y: bezier[0].y,
					type: 'anchor',
					origin: null,
					isShow: true,
				})
				penPoints.push({
					uuid: uuid2,
					x: bezier[1].x,
					y: bezier[1].y,
					type: 'control',
					origin: uuid1,
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
				if (index >= beziers.length - 1) {
					penPoints.push({
						uuid: uuid4,
						x: bezier[3].x,
						y: bezier[3].y,
						type: 'anchor',
						origin: null,
						isShow: true,
					})
				}
			})
			const { x: penX, y: penY, w: penW, h: penH } = getBound(penPoints)
			const curveComponent = R.clone(contourComponent)
			curveComponent.uuid = genUUID();
			(curveComponent.value as unknown as IPenComponent).points = penPoints;
			(curveComponent.value as unknown as IPenComponent).editMode = false;
			curveComponent.type = 'pen'
			curveComponent.name = 'pic-contour'
			curveComponent.x = penX
			curveComponent.y = penY
			curveComponent.w = penW
			curveComponent.h = penH
			curveComponent.rotation = 0
			curveComponent.usedInCharacter = true
			//@ts-ignore
			addCurvesComponent(curveComponent)
		}
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
	loading.value = true
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

	//total.value = file.characterList.length + plainGlyphs.length + plainGlyphs_stroke.length + plainGlyphs_radical.length + plainGlyphs_comp.length
	//loaded.value = 0
	//loading.value = true

	if (glyphs_data) {
		glyphs.value = []
		const _glyphs = plainGlyphs.map((plainGlyph) => {
			return instanceGlyph(plainGlyph)
		})
		_glyphs.map((glyph) => {
			addGlyph(glyph, Status.GlyphList)
		})
	}

	if (stroke_glyphs_data) {
		stroke_glyphs.value = []
		const _glyphs = plainGlyphs_stroke.map((plainGlyph) => {
			return instanceGlyph(plainGlyph)
		})
		_glyphs.map((glyph) => {
			addGlyph(glyph, Status.StrokeGlyphList)
		})
	}

	if (radical_glyphs_data) {
		radical_glyphs.value = []
		const _glyphs = plainGlyphs_radical.map((plainGlyph) => {
			return instanceGlyph(plainGlyph)
		})
		_glyphs.map((glyph) => {
			addGlyph(glyph, Status.RadicalGlyphList)
		})
	}

	if (comp_glyphs_data) {
		comp_glyphs.value = []
		const _glyphs = plainGlyphs_comp.map((plainGlyph) => {
			return instanceGlyph(plainGlyph)
		})
		_glyphs.map((glyph) => {
			addGlyph(glyph, Status.CompGlyphList)
		})
	}

	if (file_data) {
		file.characterList.map((character) => {
			return instanceCharacter(character)
		})
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
			addFile(file)
			setSelectedFileUUID(file.uuid)
			setEditStatus(Status.CharacterList)
			if (router.currentRoute.value.name === 'welcome') {
				total.value = file.characterList.length + (glyphs.value.length + stroke_glyphs.value.length + radical_glyphs.value.length + comp_glyphs.value.length) * 2
				loaded.value = 0
				loading.value = true
				router.push('/editor')
				//setTimeout(() => {
				//	total.value = (file.characterList.length + glyphs.value.length + stroke_glyphs.value.length + radical_glyphs.value.length + comp_glyphs.value.length) * 2
				//	loaded.value = 0
				//	loading.value = true
				//	if (router.currentRoute.value.name === 'welcome') {
				//		router.push('/editor')
				//	}
				//}, 100)
			} else {
				clearCharacterRenderList()
				characterList.value.map((characterFile) => {
					addCharacterTemplate(generateCharacterTemplate(characterFile))
				})
			}
		}
	}
}

const importTemplate1 = async () => {
	if (files.value && files.value.length) {
		tips.value = '导入模板会覆盖当前工程，请关闭当前工程再导入。注意，关闭工程前请保存工程以避免数据丢失。'
		tipsDialogVisible.value = true
	} else {
		if (router.currentRoute.value.name === 'welcome') {
			router.push('/editor')
		}
		const file: IFile = {
			uuid: genUUID(),
			width: 1000,
			height: 1000,
			name: '朴韵简隶',
			saved: false,
			characterList: [],
			iconsCount: 0,
			fontSettings: {
				unitsPerEm: 1000,
				ascender: 800,
				descender: -200,
			}
		}
		addFile(file)
		setSelectedFileUUID(file.uuid)
		setEditStatus(Status.CharacterList)
		total.value = 0
		loading.value = true
		let charRes = await fetch('/templates/template1.json')
		let charData = await charRes.text()
		console.time('timer1')
		let res = await fetch('/glyphs/stroke_glyphs_data_v7_v4.json')
		let data = await res.text()
		if (data) {
			const obj = JSON.parse(data)
			for (let n = 0; n < obj.constants.length; n++) {
				if (!constantsMap.getByUUID(obj.constants[n].uuid)) {
					constants.value.push(obj.constants[n])
				}
			}
			let plainGlyphs = obj.glyphs
			let _glyphs = plainGlyphs.map((plainGlyph) => instanceGlyph(plainGlyph))
			_glyphs.map((glyph) => {
				addGlyph(glyph, Status.StrokeGlyphList)
			})
		}
	
		res = await fetch('/glyphs/radical_glyphs_test_1.json')
		data = await res.text()
		if (data) {
			const obj = JSON.parse(data)
			for (let n = 0; n < obj.constants.length; n++) {
				if (!constantsMap.getByUUID(obj.constants[n].uuid)) {
					constants.value.push(obj.constants[n])
				}
			}
			let plainGlyphs = obj.glyphs
			let _glyphs = plainGlyphs.map((plainGlyph) => instanceGlyph(plainGlyph))
			_glyphs.map((glyph) => {
				addGlyph(glyph, Status.RadicalGlyphList)
			})
		}
	
		res = await fetch('/glyphs/comp_glyphs_data_v7_v4.json')
		data = await res.text()
		if (data) {
			const obj = JSON.parse(data)
			for (let n = 0; n < obj.constants.length; n++) {
				if (!constantsMap.getByUUID(obj.constants[n].uuid)) {
					constants.value.push(obj.constants[n])
				}
			}
			let plainGlyphs = obj.glyphs
			let _glyphs = plainGlyphs.map((plainGlyph) => instanceGlyph(plainGlyph))
			_glyphs.map((glyph) => {
				addGlyph(glyph, Status.CompGlyphList)
			})
		}
	
		console.timeEnd('timer1')
		// loading.value = false
	
		let charObj = null
		if (charData) {
			charObj = JSON.parse(charData)
		}
	
		const charLength = charObj ? charObj.template.length : 0
		total.value = charLength + (glyphs.value.length + stroke_glyphs.value.length + radical_glyphs.value.length + comp_glyphs.value.length) * 2
		loaded.value = 0
	
		if (charObj) {
			for (let n = 0; n < charObj.template.length; n++) {
				loaded.value += 1
				const charInfo = charObj.template[n]
				const charInfo2 = parseLayout(charInfo)
				const charFile: ICharacterFile = generateCharFile(charInfo2)
				addCharacterForCurrentFile(charFile)
				addCharacterTemplate(generateCharacterTemplate(charFile))
				emitter.emit('renderPreviewCanvasByUUID', charFile.uuid)
			}
		}
	
		stroke_glyphs.value.map((glyph) => {
			addGlyphTemplate(glyph, Status.StrokeGlyphList)
		})
		radical_glyphs.value.map((glyph) => {
			addGlyphTemplate(glyph, Status.RadicalGlyphList)
		})
		comp_glyphs.value.map((glyph) => {
			addGlyphTemplate(glyph, Status.CompGlyphList)
		})
		glyphs.value.map((glyph) => {
			addGlyphTemplate(glyph, Status.GlyphList)
		})
	
		emitter.emit('renderPreviewCanvas')
		emitter.emit('renderGlyphPreviewCanvas')
		emitter.emit('renderStrokeGlyphPreviewCanvas')
		emitter.emit('renderRadicalGlyphPreviewCanvas')
		emitter.emit('renderCompGlyphPreviewCanvas')
	}
}

const parseLayout = (info) => {
  const { char, layout, data } = info
  if (layout === '左右') {
    const cursor = data.indexOf('右')
    const part1 = data.slice(2, cursor - 1)
    const part2 = data.slice(cursor + 2, data.length - 1)
    return {
      name: char,
      layout,
      left: parseData(part1),
      right: parseData(part2),
    }
  }
	return {
		name: char,
		layout,
	}
}

const parseData = (data) => {
  const arr = data.split(',')
  const glyph_name = arr[0]
  const x = Number(arr[1])
  const y = Number(arr[2])
  const w = Number(arr[3])
  const h = Number(arr[4])
  return {
    glyph_name,
    x,
    y,
    w,
    h,
  }
}

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
      },
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
  //component.value._o.getJoints().map((joint) => {
  //  joint.component = component
  //})

  linkComponentsForJoints(component)
  return component
}

const electron_handlers: IHandlerMap = {
	'create-file': createFile,
	'open-file': openFile_electron,
	'save-file': saveFile_electron,
	'save-as': saveAs_electron,
	'undo': undo,
	'redo': redo,
	'cut': cut,
	'copy': copy,
	'paste': paste,
	'delete': del,
	'import-font-file': importFont_electron,
	'import-templates-file': importTemplates,
	'import-glyphs': importGlyphs_electron,
	'import-pic': importPic_electron,
	'import-svg': importSVG_electron,
	'export-font-file': exportFont_electron,
	'export-glyphs': exportGlyphs_electron,
	'export-jpeg': exportJPEG_electron,
	'export-png': exportPNG_electron,
	'export-svg': exportSVG_electron,
	'add-character': addCharacter,
	'add-icon': addIcon,
	'font-settings': fontSettings,
	'preference-settings': preferenceSettings,
	'language-settings': languageSettings,
	'template-1': importTemplate1,
}

const web_handlers: IHandlerMap = {
	'create-file': createFile,
	'open-file': openFile,
	'save-file': saveFile_web,//saveFile,
	'clear-cache': clearCache,
	'sync-data': syncData,
	'save-as-json': exportJSON,
	'undo': undo,
	'redo': redo,
	'cut': cut,
	'copy': copy,
	'paste': paste,
	'delete': del,
	'import-font-file': importFont,
	'import-templates-file': importTemplates,
	'import-glyphs': importGlyphs,
	'import-pic': importPic,
	'import-svg': importSVG,
	'export-font-file': exportFont,
	'export-glyphs': exportGlyphs,
	'export-jpeg': exportJPEG,
	'export-png': exportPNG,
	'export-svg': exportSVG,
	'add-character': addCharacter,
	'add-icon': addIcon,
	'font-settings': fontSettings,
	'preference-settings': preferenceSettings,
	'language-settings': languageSettings,
	'template-1': importTemplate1,
}

interface IHandlerMap {
	[key: string]: Function;
}

export {
	electron_handlers,
	web_handlers,
	instanceGlyph,
	createFile,
	openFile,
	syncData,
	saveFile,
	plainFile,
	plainGlyph,
	mapToObject,
	importTemplate1,
	importFont,
}