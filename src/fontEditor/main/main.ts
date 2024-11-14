const { app, BrowserWindow, Menu, ipcMain, dialog, IpcMainEvent, screen } = require('electron')
const path = require('path')
const serve = require('electron-serve')
const fs = require('fs')
const { Buffer } = require('buffer')

const { clipboard } = require('electron')

import { Status } from '../stores/font'
import { electron_menu, traverse_electron_menu } from '../menus/electron_menus'
import { i18next } from '../../i18n/electron'
import { selectedFile } from '../stores/files'

const isDevelopment = process.env.NODE_ENV !== 'production'

//const loadURL = serve({directory: '../../../dist'})
const loadURL = serve({directory: '../dist'})

let mainWindow: any
let _editStatus: Status = Status.CharacterList

app.name = "字玩"

async function createWindow () {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const _width = Math.min(1280, width)
  const _height = Math.min(800, height)
  mainWindow = new BrowserWindow({
    width: _width,
    height: _height,
    icon: path.join(__dirname, '../dist/fontPlayer-logo.icns'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // 确保启用上下文隔离
      enableRemoteModule: false, // 禁用远程模块
    }
  })

  const _menu = traverse_electron_menu(mainWindow, electron_menu)
  // _menu.push({
  //   label: 'View',
  //   submenu: [
  //     {
  //       label: 'Toggle Developer Tools',
  //       click: (item, focusedWindow) => {
  //         if (focusedWindow) {
  //           focusedWindow.webContents.toggleDevTools();
  //         }
  //       }
  //     }
  //   ]
  // })
  const menu = Menu.buildFromTemplate(_menu)

  Menu.setApplicationMenu(menu)

  mainWindow.webContents.once('dom-ready', () => {
    mainWindow.webContents.send('detect-system')
  })

  if (isDevelopment) {
    mainWindow.loadURL('http://localhost:5173/')
  } else {
    await loadURL(mainWindow)
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // 在主进程中处理剪贴板
  ipcMain.on('copy-to-clipboard', (event, text) => {
    clipboard.writeText(text);
  });

  ipcMain.on('paste-from-clipboard', (event) => {
    const text = clipboard.readText();
    event.sender.send('pasted-text', text);
  });
}

const handleFileSave = async (event: typeof IpcMainEvent, data: string | Uint8Array | Buffer, fileName: string) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: fileName,
  })
  if (!canceled) {
    fs.writeFileSync(filePath, data)
    return filePath
  }
}

const handleFileSave2 = async (event: typeof IpcMainEvent, data: string, fileName: string) => {
  const matches: any = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
  
  if (matches.length !== 3) {
    return new Error('Invalid input string')
  }

  const _data = Buffer.from(matches[2], 'base64')
  handleFileSave(event, _data, fileName)
}

interface IDisabledMap {
  [key: string]: Function;
}

const enable = (editStatus: Status) => {
  return true
}

const enableAtEdit = (editStatus: Status) => {
  if (editStatus === Status.Edit || editStatus === Status.Glyph) {
    return true
  }
  return false
}

const enableAtList = (editStatus: Status) => {
  if (editStatus !== Status.Edit && editStatus !== Status.Glyph && editStatus !== Status.Pic) {
    return true
  }
  return false
}

const TemplateEnable = (editStatus: Status) => {
  if (editStatus !== Status.Edit && editStatus !== Status.Glyph && editStatus !== Status.Pic) {
    return true
  }
  return false
}

const electron_disabled: IDisabledMap = {
  'create-file': enableAtList,
  'open-file': enableAtList,
  'save-file': enable,
  'save-as': enable,
  'undo': enableAtEdit,
  'redo': enableAtEdit,
  'cut': enableAtEdit,
  'copy': enableAtEdit,
  'paste': enableAtEdit,
  'delete': enableAtEdit,
  'import-font-file': enableAtList,
  'import-glyphs': enableAtList,
  'import-pic': enableAtEdit,
  'import-svg': enableAtEdit,
  'export-font-file': enable,
  'export-glyphs': enableAtList,
  'export-jpeg': enableAtEdit,
  'export-png': enableAtEdit,
  'export-svg': enableAtEdit,
  'add-character': enableAtList,
  'add-icon': enableAtList,
  'font-settings': enable,
  'preference-settings': enable,
  'language-settings': enable,
  'template-1': TemplateEnable,
}

const handleToggleMenuDisabled = (event: typeof IpcMainEvent, editStatus: Status) => {
  const menu: typeof Menu = Menu.getApplicationMenu() as typeof Menu
  _editStatus = editStatus
  Object.keys(electron_disabled).map((key) => {
    menu.getMenuItemById(key).enabled = electron_disabled[key](editStatus)
  })
}

const handleChangeLanguage = (event: typeof IpcMainEvent, language: string) => {
  i18next.changeLanguage(language)
  const _menu = traverse_electron_menu(mainWindow, electron_menu)
  const menu = Menu.buildFromTemplate(_menu)
  Object.keys(electron_disabled).map((key) => {
    menu.getMenuItemById(key).enabled = electron_disabled[key](_editStatus)
  })
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(async () => {
  ipcMain.handle('event:save-file-2', handleFileSave2)
  ipcMain.handle('event:save-file', handleFileSave)
  ipcMain.handle('event:toggle-menu-disabled', handleToggleMenuDisabled)
  ipcMain.handle('event:change-language', handleChangeLanguage)

  await createWindow()

  app.on('activate', async function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow()
    }
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})