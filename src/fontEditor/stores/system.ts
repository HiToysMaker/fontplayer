import { ref } from 'vue'

// 当前环境，'web'为网页，'tauri'为Tauri桌面应用
// current environment, 'web' for web page, 'tauri' for Tauri
const ENV = ref('web')

const LOADING = ref(true)

export {
	ENV,
	LOADING,
}