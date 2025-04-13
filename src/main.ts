import { createApp } from 'vue'

import App from './App.vue'
import router from './router'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { Files, Edit, Upload, Download, Tickets, Setting, List, Tools, QuestionFilled } from '@element-plus/icons-vue'

import { i18n } from './i18n'

import './assets/main.css'

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// import { fas } from '@fortawesome/free-solid-svg-icons'
// import { far } from '@fortawesome/free-regular-svg-icons'
// import { fab } from '@fortawesome/free-brands-svg-icons'

import {
	faArrowPointer,
	faCircle,
	faPercent,
	faArrowDownWideShort,
	faPenNib,
	faSquare,
	faDrawPolygon,
	faImage,
	faFont,
	faTerminal,
	faSliders,
	faTableCells,
	faHand as faHandSolid,
	faTextWidth,
} from '@fortawesome/free-solid-svg-icons'
import {
	faHand,
	faSquare as faSquare_regular,
	faCircle as faCircle_regular,
} from '@fortawesome/free-regular-svg-icons'

import { initWorker } from './fontEditor/worker'

import localForage from 'localforage'


localForage.config({
	driver      : localForage.INDEXEDDB, // Force WebSQL; same as using setDriver()
	name        : 'myDatabase',
	version     : 1.0,
	size        : 4980736, // Size of database, in bytes. WebSQL-only for now.
	storeName   : 'keyvaluepairs', // Should be alphanumeric, with underscores.
	description : 'my database'
})

declare global {
  interface Window {
    FP: any;
    constantsMap: any;
		glyph: any;
		comp_glyph: any;
		character: any;
		__constants: any;
		__parameters: any;
		__script: any;
		__is_web: boolean;
  }
}

// await initGlyphEnvironment()

// library.add(fas, far, fab)

library.add(
	faArrowPointer,
	faCircle,
	faPercent,
	faArrowDownWideShort,
	faPenNib,
	faSquare,
	faDrawPolygon,
	faImage,
	faFont,
	faTerminal,
	faSliders,
	faTableCells,
	faHand,
	faSquare_regular,
	faCircle_regular,
	faHandSolid,
	faTextWidth,
)

const app = createApp(App)

app.config.errorHandler = (err, vm, info) => {
  console.error('全局错误:', err)
}

app.component('font-awesome-icon', FontAwesomeIcon)
app.use(ElementPlus)
// for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
//   app.component(key, component)
// }
app.component('Files', Files)
app.component('Edit', Edit)
app.component('Upload', Upload)
app.component('Download', Download)
app.component('Tickets', Tickets)
app.component('Setting', Setting)
app.component('List', List)
app.component('Tools', Tools)
app.component('QuestionFilled', QuestionFilled)
app.use(router)
app.use(i18n)

app.mount('#app')

const worker = initWorker()
//const worker = new MyWorker()

export {
  app,
	worker,
}