import { ref } from 'vue'

// 当前环境，'web'为网页，'electron'为electron桌面应用
// current environment, 'web' for web page, 'electron' for electron
const ENV = ref('web')

const LOADING = ref(true)

export {
	ENV,
	LOADING,
}