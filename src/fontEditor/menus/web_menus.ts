/**
 * web端使用的菜单
 */
/**
 * menu for web
 */

import { i18n } from '../../i18n'
const { tm } = i18n.global

interface IMenu {
	label: string;
	submenu?: Array<IMenu>;
	click?: Function;
	key?: string;
}

interface IHandlerMap {
	[key: string]: Function;
}

const web_menu: Array<IMenu> = [
	{
		label: tm('menus.file.file'),
		key: 'file',
		submenu: [
			{
				label: tm('menus.file.new'),
				key: 'create-file',
				click: (handlers: IHandlerMap) => {
					handlers['create-file']()
				}
			},
			{
				label: tm('menus.file.open'),
				key: 'open-file',
				click: (handlers: IHandlerMap) => {
					handlers['open-file']()
				}
			},
			{
				label: tm('menus.file.save'),
				key: 'save-file',
				click: (handlers: IHandlerMap) => {
					handlers['save-file']()
				}
			},
			{
				label: tm('menus.file.clear'),
				key: 'clear-cache',
				click: (handlers: IHandlerMap) => {
					handlers['clear-cache']()
				}
			},
			{
				label: tm('menus.file.sync_data'),
				key: 'sync-data',
				click: (handlers: IHandlerMap) => {
					handlers['sync-data']()
				}
			},
			{
				label: tm('menus.file.export'),
				key: 'save-as-json',
				click: (handlers: IHandlerMap) => {
					handlers['save-as-json']()
				}
			},
		],
	},
	{
		label: tm('menus.edit.edit'),
		key: 'edit',
		submenu: [
			{
				label: tm('menus.edit.undo'),
				key: 'undo',
				click: (handlers: IHandlerMap) => {
					handlers['undo']()
				}
			},
			{
				label: tm('menus.edit.redo'),
				key: 'redo',
				click: (handlers: IHandlerMap) => {
					handlers['redo']()
				}
			},
			{
				label: tm('menus.edit.cut'),
				key: 'cut',
				click: (handlers: IHandlerMap) => {
					handlers['cut']()
				}
			},
			{
				label: tm('menus.edit.copy'),
				key: 'copy',
				click: (handlers: IHandlerMap) => {
					handlers['copy']()
				}
			},
			{
				label: tm('menus.edit.paste'),
				key: 'paste',
				click: (handlers: IHandlerMap) => {
					handlers['paste']()
				}
			},
			{
				label: tm('menus.edit.delete'),
				key: 'delete',
				click: (handlers: IHandlerMap) => {
					handlers['delete']()
				}
			},
		]
	},
	{
		label: tm('menus.import.import'),
		key: 'import',
		submenu: [
			{
				label: tm('menus.import.font'),
				key: 'import-font-file',
				click: (handlers: IHandlerMap) => {
					handlers['import-font-file']()
				}
			},
			{
				label: tm('menus.import.glyph'),
				key: 'import-glyphs',
				click: (handlers: IHandlerMap) => {
					handlers['import-glyphs']()
				}
			},
			{
				label: tm('menus.import.picture'),
				key: 'import-pic',
				click: (handlers: IHandlerMap) => {
					handlers['import-pic']()
				}
			},
			{
				label: tm('menus.import.svg'),
				key: 'import-svg',
				click: (handlers: IHandlerMap) => {
					handlers['import-svg']()
				}
			},
		]
	},
	{
		label: tm('menus.export.export'),
		key: 'export',
		submenu: [
			{
				label: tm('menus.export.font'),
				key: 'export-font-file',
				click: (handlers: IHandlerMap) => {
					handlers['export-font-file']()
				}
			},
			{
				label: tm('menus.export.glyph'),
				key: 'export-glyphs',
				click: (handlers: IHandlerMap) => {
					handlers['export-glyphs']()
				}
			},
			{
				label: tm('menus.export.jpeg'),
				key: 'export-jpeg',
				click: (handlers: IHandlerMap) => {
					handlers['export-jpeg']()
				}
			},
			{
				label: tm('menus.export.png'),
				key: 'export-png',
				click: (handlers: IHandlerMap) => {
					handlers['export-png']()
				}
			},
			{
				label: tm('menus.export.svg'),
				key: 'export-svg',
				click: (handlers: IHandlerMap) => {
					handlers['export-svg']()
				}
			},
		]
	},
	{
		label: tm('menus.char.char'),
		key: 'character',
		submenu: [
			{
				label: tm('menus.char.character'),
				key: 'add-character',
				click: (handlers: IHandlerMap) => {
					handlers['add-character']()
				}
			},
			{
				label: tm('menus.char.icon'),
				key: 'add-icon',
				click: (handlers: IHandlerMap) => {
					handlers['add-icon']()
				}
			},
		]
	},
	{
		label: tm('menus.settings.settings'),
		key: 'settings',
		submenu: [
			{
				label: tm('menus.settings.font'),
				key: 'font-settings',
				click: (handlers: IHandlerMap) => {
					handlers['font-settings']()
				}
			},
			{
				label: tm('menus.settings.preference'),
				key: 'preference-settings',
				click: (handlers: IHandlerMap) => {
					handlers['preference-settings']()
				}
			},
			{
				label: tm('menus.settings.language'),
				key: 'language-settings',
				click: (handlers: IHandlerMap) => {
					handlers['language-settings']()
				}
			},
		]
	},
	{
		label: tm('menus.templates.templates'),
		key: 'templates',
		submenu: [
			{
				label: tm('menus.templates.test1'),
				key: 'template-1',
				click: (handlers: IHandlerMap) => {
					handlers['template-1']()
				}
			},
			{
				label: tm('menus.templates.test2'),
				key: 'template-2',
				click: (handlers: IHandlerMap) => {
					handlers['template-2']()
				}
			},
			{
				label: tm('menus.templates.test3'),
				key: 'template-3',
				click: (handlers: IHandlerMap) => {
					handlers['template-3']()
				}
			},
			{
				label: tm('menus.templates.test4'),
				key: 'template-4',
				click: (handlers: IHandlerMap) => {
					handlers['template-4']()
				}
			},
				{
					label: tm('menus.templates.test5'),
					key: 'template-5',
					click: (handlers: IHandlerMap) => {
						handlers['template-5']()
					}
				},
				{
					label: tm('menus.templates.test6'),
					key: 'template-6',
					click: (handlers: IHandlerMap) => {
						handlers['template-6']()
					}
				},
		]
	},
	{
		label: tm('menus.tools.tools'),
		key: 'tools',
		submenu: [
			{
				label: tm('menus.tools.remove_overlap'),
				key: 'remove_overlap',
				click: (handlers: IHandlerMap) => {
					handlers['remove_overlap']()
				}
			},
		]
	}
]

const traverse_web_menu = (handlers: IHandlerMap, menu: Array<IMenu>) => {
	const _menu = menu.map((item: IMenu) => {
		const _item: any = {}
		_item.label = item.label
		_item.key = item.key
		item.click && (_item.click = () => {
			item && item.click && item.click(handlers)
		})
		const submenu = item.submenu ? traverse_web_menu(handlers, item.submenu) : null
		item.submenu && (_item.submenu = submenu)
		return _item
	})
	return _menu
}

export {
	traverse_web_menu,
	web_menu,
}