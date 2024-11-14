/**
 * electron桌面程序使用的菜单
 */
/**
 * menu for electron
 */

const { app, BrowserWindow, dialog } = require('electron')
const path = require('path');
const fs = require('fs')
import { i18next } from '../../i18n/electron'
const { t } = i18next

interface IMenu {
	label: string;
	submenu?: Array<IMenu>;
	click?: Function;
	key?: string;
	enabled? : Function;
}

const electron_menu: Array<IMenu> = [
	{
		label: "字玩",//app.name,
		key: 'app',
		submenu: [
			{
				label: t('menus.about'),
				key: 'about',
			}
		]
	},
	{
		label: t('menus.file.file'),
		key: 'file',
		submenu: [
			{
				label: t('menus.file.new'),
				click: (mainWindow: typeof BrowserWindow) => {
					mainWindow.webContents.send('create-file')
				},
				key: 'create-file',
			},
			{
				label: t('menus.file.open'),
				click: async (mainWindow: typeof BrowserWindow) => {
					// 打开文件选择对话框
					const { canceled, filePaths } = await dialog.showOpenDialog({
						properties: ['openFile']
					});
					// 如果用户没有取消选择，则发送文件路径
					if (!canceled && filePaths.length > 0) {
						const filePath = filePaths[0]
						const data = fs.readFileSync(filePath, { encoding: 'utf8' })
						mainWindow.webContents.send('open-file', data)
					}
					//mainWindow.webContents.send('open-file')
				},
				key: 'open-file',
			},
			{
				label: t('menus.file.save'),
				click: (mainWindow: typeof BrowserWindow) => {
					mainWindow.webContents.send('save-file')
				},
				key: 'save-file',
			},
			{
				label: t('menus.file.saveas'),
				click: (mainWindow: typeof BrowserWindow) => {
					mainWindow.webContents.send('save-as')
				},
				key: 'save-as',
			},
		],
	},
	{
		label: t('menus.edit.edit'),
		key: 'edit',
		submenu: [
			{
				label: t('menus.edit.undo'),
				click: (mainWindow: typeof BrowserWindow) => {
					mainWindow.webContents.send('undo')
				},
				key: 'undo',
			},
			{
				label: t('menus.edit.redo'),
				click: (mainWindow: typeof BrowserWindow) => {
					mainWindow.webContents.send('redo')
				},
				key: 'redo',
			},
			{
				label: t('menus.edit.cut'),
				click: (mainWindow: typeof BrowserWindow) => {
					mainWindow.webContents.send('cut')
				},
				key: 'cut',
			},
			{
				label: t('menus.edit.copy'),
				click: (mainWindow: typeof BrowserWindow) => {
					mainWindow.webContents.send('copy')
				},
				key: 'copy',
			},
			{
				label: t('menus.edit.paste'),
				click: (mainWindow: typeof BrowserWindow) => {
					mainWindow.webContents.send('paste')
				},
				key: 'paste',
			},
			{
				label: t('menus.edit.delete'),
				click: (mainWindow: typeof BrowserWindow) => {
					mainWindow.webContents.send('delete')
				},
				key: 'delete',
			},
		]
	},
	{
		label: t('menus.import.import'),
		key: 'import',
		submenu: [
			{
				label: t('menus.import.font'),
				click: async (mainWindow: typeof BrowserWindow) => {
					// 打开文件选择对话框
					const { canceled, filePaths } = await dialog.showOpenDialog({
						properties: ['openFile']
					});
					// 如果用户没有取消选择，则发送文件路径
					if (!canceled && filePaths.length > 0) {
						const filePath = filePaths[0]
						const fileName = path.parse(filePath).name
						const buffer = fs.readFileSync(filePath)
						mainWindow.webContents.send('import-font-file', { buffer, fileName })
					}
					//mainWindow.webContents.send('import-font-file')
				},
				key: 'import-font-file',
			},
			{
				label: t('menus.import.glyph'),
				click: async (mainWindow: typeof BrowserWindow) => {
					// 打开文件选择对话框
					const { canceled, filePaths } = await dialog.showOpenDialog({
						properties: ['openFile']
					});
					// 如果用户没有取消选择，则发送文件路径
					if (!canceled && filePaths.length > 0) {
						const filePath = filePaths[0]
						const data = fs.readFileSync(filePath, { encoding: 'utf8' })
						mainWindow.webContents.send('import-glyphs', data)
					}
					//mainWindow.webContents.send('import-glyphs')
				},
				key: 'import-glyphs',
			},
			{
				label: t('menus.import.picture'),
				click: async (mainWindow: typeof BrowserWindow) => {
					// 打开文件选择对话框
					const { canceled, filePaths } = await dialog.showOpenDialog({
						properties: ['openFile']
					});
					// 如果用户没有取消选择，则发送文件路径
					if (!canceled && filePaths.length > 0) {
						const filePath = filePaths[0]
						const data = fs.readFileSync(filePath, { encoding: 'base64' })
						const dataUrl = `data:image/png;base64,${data}`
						mainWindow.webContents.send('import-pic', dataUrl)
					}
					//mainWindow.webContents.send('import-pic')
				},
				key: 'import-pic',
			},
			{
				label: t('menus.import.svg'),
				click: async (mainWindow: typeof BrowserWindow) => {
					// 打开文件选择对话框
					const { canceled, filePaths } = await dialog.showOpenDialog({
						properties: ['openFile']
					});
					// 如果用户没有取消选择，则发送文件路径
					if (!canceled && filePaths.length > 0) {
						const filePath = filePaths[0]
						const data = fs.readFileSync(filePath, { encoding: 'utf8' })
						mainWindow.webContents.send('import-svg', data)
					}
					//mainWindow.webContents.send('import-svg')
				},
				key: 'import-svg',
			},
		]
	},
	{
		label: t('menus.export.export'),
		key: 'export',
		submenu: [
			{
				label: t('menus.export.font'),
				click: (mainWindow: typeof BrowserWindow) => {
					mainWindow.webContents.send('export-font-file')
				},
				key: 'export-font-file',
			},
			{
				label: t('menus.export.glyph'),
				click: (mainWindow: typeof BrowserWindow) => {
					mainWindow.webContents.send('export-glyphs')
				},
				key: 'export-glyphs',
			},
			{
				label: t('menus.export.jpeg'),
				click: (mainWindow: typeof BrowserWindow) => {
					mainWindow.webContents.send('export-jpeg')
				},
				key: 'export-jpeg',
			},
			{
				label: t('menus.export.png'),
				click: (mainWindow: typeof BrowserWindow) => {
					mainWindow.webContents.send('export-png')
				},
				key: 'export-png',
			},
			{
				label: t('menus.export.svg'),
				click: (mainWindow: typeof BrowserWindow) => {
					mainWindow.webContents.send('export-svg')
				},
				key: 'export-svg',
			},
		]
	},
	{
		label: t('menus.char.char'),
		key: 'character',
		submenu: [
			{
				label: t('menus.char.character'),
				click: (mainWindow: typeof BrowserWindow) => {
					mainWindow.webContents.send('add-character')
				},
				key: 'add-character',
			},
			{
				label: t('menus.char.icon'),
				click: (mainWindow: typeof BrowserWindow) => {
					mainWindow.webContents.send('add-icon')
				},
				key: 'add-icon',
			},
		]
	},
	{
		label: t('menus.settings.settings'),
		key: 'settings',
		submenu: [
			{
				label: t('menus.settings.font'),
				click: (mainWindow: typeof BrowserWindow) => {
					mainWindow.webContents.send('font-settings')
				},
				key: 'font-settings',
			},
			{
				label: t('menus.settings.preference'),
				click: (mainWindow: typeof BrowserWindow) => {
					mainWindow.webContents.send('preference-settings')
				},
				key: 'preference-settings',
			},
			{
				label: t('menus.settings.language'),
				click: (mainWindow: typeof BrowserWindow) => {
					mainWindow.webContents.send('language-settings')
				},
				key: 'language-settings',
			},
		]
	},
	{
		label: t('menus.templates.templates'),
		key: 'templates',
		submenu: [
			{
				label: t('menus.templates.test1'),
				click: (mainWindow: typeof BrowserWindow) => {
					mainWindow.webContents.send('template-1')
				},
				key: 'template-1',
			},
		]
	},
]

interface ILabelsMap {
  [key: string]: String;
}

const electron_labels: ILabelsMap = {
	'app': 'menus.app',
  'about': 'menus.about',
  'file': 'menus.file.file',
  'create-file': 'menus.file.new',
  'open-file': 'menus.file.open',
  'save-file': 'menus.file.save',
  'save-as': 'menus.file.saveas',
  'edit': 'menus.edit.edit',
  'undo': 'menus.edit.undo',
  'redo': 'menus.edit.redo',
  'cut': 'menus.edit.cut',
  'copy': 'menus.edit.copy',
  'paste': 'menus.edit.paste',
  'delete': 'menus.edit.delete',
  'import': 'menus.import.import',
  'import-font-file': 'menus.import.font',
  'import-pic': 'menus.import.picture',
  'import-svg': 'menus.import.svg',
  'export': 'menus.export.export',
  'export-font-file': 'menus.export.font',
  'export-jpeg': 'menus.export.jpeg',
  'export-png': 'menus.export.png',
  'export-svg': 'menus.export.svg',
  'character': 'menus.char.char',
  'add-character': 'menus.char.character',
  'add-icon': 'menus.char.icon',
  'settings': 'menus.settings.settings',
  'font-settings': 'menus.settings.font',
  'preference-settings': 'menus.settings.preference',
  'language-settings': 'menus.settings.language',
}

const traverse_electron_menu = (mainWindow: typeof BrowserWindow, menu: Array<IMenu>) => {
	const _menu = menu.map((item: IMenu) => {
		const _item: any = {}
		_item.label = t(electron_labels[item.key]) || item.label
		item.click && (_item.click = () => {
			item && item.click && item.click(mainWindow)
		})
		_item.id = item.key
		const submenu = item.submenu ? traverse_electron_menu(mainWindow, item.submenu) : null
		item.submenu && (_item.submenu = submenu)
		return _item
	})
	return _menu
}

export {
	traverse_electron_menu,
	electron_menu,
}