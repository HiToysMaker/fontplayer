import { ENV } from '../stores/system'
import { tauri_handlers } from '../menus/handlers'
import { Status, editStatus } from '../stores/font'
import { watch } from 'vue'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'

const editStatusToString = (status: Status) => {
	if (editStatus.value === Status.Edit) {
		return 'edit'
	} else if (editStatus.value === Status.Glyph) {
		return 'glyph'
	} else if (editStatus.value === Status.Pic) {
		return 'pic'
	}
	return 'list'
}

watch(editStatus, () => {
	if (ENV.value === 'tauri') {
		invoke('toggle_menu_disabled', { editStatus: editStatusToString(editStatus.value) })
	}
})

const initTauri = () => {
	//@ts-ignore
	if (!!window.__TAURI_INTERNALS__) {
		ENV.value = 'tauri'
		invoke('toggle_menu_disabled', { editStatus: editStatusToString(editStatus.value) })
		const keys = Object.keys(tauri_handlers)
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i]
			listen(key, (event) => {
				tauri_handlers[key]()
			})
		}
	}
}

export {
	initTauri,
}