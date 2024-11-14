import { ENV } from '../stores/system'
import { electron_handlers } from '../menus/handlers'
import { Status, editStatus } from '../stores/font'
import { watch } from 'vue'

/**
 * electron 渲染端初始化方法
 */
/**
 * electron renderer side initializer
 */
const initRenderer = () => {
	window.electronAPI._toggleMenuDisabled(Status.CharacterList)
	window.electronAPI.detectSystem(() => {
		ENV.value = 'electron'
	})
	window.electronAPI.createFile(() => {
		// 新建
		electron_handlers['create-file']()
	})
	window.electronAPI.openFile((data) => {
		electron_handlers['open-file'](data)
	})
	window.electronAPI.saveFile(() => {
		electron_handlers['save-file']()
	})
	window.electronAPI.undo(() => {
		electron_handlers['undo']()
	})
	window.electronAPI.redo(() => {
		electron_handlers['redo']()
	})
	window.electronAPI.cut(() => {
		electron_handlers['cut']()
	})
	window.electronAPI.copy(() => {
		electron_handlers['copy']()
	})
	window.electronAPI.paste(() => {
		electron_handlers['paste']()
	})
	window.electronAPI.del(() => {
		electron_handlers['delete']()
	})
	window.electronAPI.importFont((options) => {
		electron_handlers['import-font-file'](options)
	})
	window.electronAPI.importGlyphs((data) => {
		electron_handlers['import-glyphs'](data)
	})
	window.electronAPI.importPic((dataUrl) => {
		electron_handlers['import-pic'](dataUrl)
	})
	window.electronAPI.importSVG((data) => {
		electron_handlers['import-svg'](data)
	})
	window.electronAPI.exportFont(() => {
		electron_handlers['export-font-file']()
	})
	window.electronAPI.exportGlyphs(() => {
		electron_handlers['export-glyphs']()
	})
	window.electronAPI.exportJPEG(() => {
		electron_handlers['export-jpeg']()
	})
	window.electronAPI.exportPNG(() => {
		electron_handlers['export-png']()
	})
	window.electronAPI.exportSVG(() => {
		electron_handlers['export-svg']()
	})
	window.electronAPI.fontSettings(() => {
		electron_handlers['font-settings']()
	})
	window.electronAPI.languageSettings(() => {
		electron_handlers['language-settings']()
	})
	window.electronAPI.preferenceSettings(() => {
		electron_handlers['preference-settings']()
	})
	window.electronAPI.template1(() => {
		electron_handlers['template-1']()
	})
}

watch(editStatus, () => {
	if (ENV.value === 'electron') {
		window.electronAPI._toggleMenuDisabled(editStatus.value)
	}
})

export {
	initRenderer,
}