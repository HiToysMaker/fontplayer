import { createApp } from 'vue'

import App from './App.vue'
import router from './router'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { Files, Edit, Upload, Download, Tickets, Setting, List, Tools } from '@element-plus/icons-vue'

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
} from '@fortawesome/free-solid-svg-icons'
import {
	faHand,
	faSquare as faSquare_regular,
	faCircle as faCircle_regular,
} from '@fortawesome/free-regular-svg-icons'

import { initGlyphEnvironment } from './fontEditor/stores/glyph'

// import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
// import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
// import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

// import MyWorker from './fontEditor/worker/worker?worker'

//import { suggestion_items } from '@/fontEditor/programming/FPUtils'

import * as monaco from 'monaco-editor'

import { initWorker } from './fontEditor/worker'

import localForage from 'localforage'

self.MonacoEnvironment = {
	// getWorker: function (workerId, label) {
	// 	switch (label) {
	// 		case 'json':
	// 			//@ts-ignore
	// 			return jsonWorker();
	// 		case 'css':
	// 			//@ts-ignore
	// 			return cssWorker();
	// 		case 'scss':
	// 			//@ts-ignore
	// 			return cssWorker();
	// 		case 'less':
	// 			//@ts-ignore
	// 			return cssWorker();
	// 		case 'html':
	// 			//@ts-ignore
	// 			return htmlWorker();
	// 		case 'typescript':
	// 			//@ts-ignore
	// 			return tsWorker();
	// 		case 'javascript':
	// 			//@ts-ignore
	// 			return tsWorker();
	// 		default:
	// 			//@ts-ignore
	// 			return editorWorker();
	// 	}
	// }
	getWorker: function (workerId, label) {
		switch (label) {
			case 'typescript':
				//@ts-ignore
				return tsWorker();
			case 'javascript':
				//@ts-ignore
				return tsWorker();
			default:
				//@ts-ignore
				return editorWorker();
		}
	}
}

monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true)

// monaco.languages.registerCompletionItemProvider('typescript', {
// 	provideCompletionItems: (
// 		model: monaco.editor.ITextModel,
// 		position: monaco.Position,
// 		context: monaco.languages.CompletionContext,
// 		token: monaco.CancellationToken
// 	) => {
// 		const textUntilPosition = model.getValueInRange({
// 			startLineNumber: 1,
// 			startColumn: 1,
// 			endLineNumber: position.lineNumber,
// 			endColumn: position.column,
// 		});
// 		const word = model.getWordUntilPosition(position);
// 		const  range = {
// 			startLineNumber: position.lineNumber,
// 			endLineNumber: position.lineNumber,
// 			startColumn: word.startColumn,
// 			endColumn: word.endColumn,
// 		};
// 		return {
// 			suggestions: suggestion_items.map((suggestion) => {
// 				return {
// 					label: suggestion.item,
// 					insertText: suggestion.item,
// 					kind: monaco.languages.CompletionItemKind.Function,
// 					range,
// 				}
// 			})
// 		}
// 	}
// })

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
		electronAPI: any;
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
)

const app = createApp(App)

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
app.use(router)
app.use(i18n)

app.mount('#app')

const worker = initWorker()
//const worker = new MyWorker()

export {
  app,
	worker,
}
