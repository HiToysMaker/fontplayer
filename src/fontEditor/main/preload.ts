import { Status } from "../stores/font"

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  handleCounter: (callback: Function) => ipcRenderer.on('update-counter', callback),
  detectSystem: (callback: Function) => {
    ipcRenderer.on('detect-system', callback)
  },
  createFile: (callback: Function) => {
    ipcRenderer.on('create-file', () => {
      callback()
    })
  },
  openFile: (callback: Function) => {
    ipcRenderer.on('open-file', (event, data) => {
      callback(data)
    })
  },
  saveFile: (callback: Function) => {
    ipcRenderer.on('save-file', callback)
  },
  saveAs: (callback: Function) => {
    ipcRenderer.on('save-as', callback)
  },
  undo: (callback: Function) => {
    ipcRenderer.on('undo', callback)
  },
  redo: (callback: Function) => {
    ipcRenderer.on('redo', callback)
  },
  cut: (callback: Function) => {
    ipcRenderer.on('cut', callback)
  },
  copy: (callback: Function) => {
    ipcRenderer.on('copy', callback)
  },
  paste: (callback: Function) => {
    ipcRenderer.on('paste', callback)
  },
  del: (callback: Function) => {
    ipcRenderer.on('delete', callback)
  },
  importFont: (callback: Function) => {
    ipcRenderer.on('import-font-file', (event, options) => {
      callback(options)
    })
  },
  importGlyphs: (callback: Function) => {
    ipcRenderer.on('import-glyphs', (event, data) => {
      callback(data)
    })
  },
  importPic: (callback: Function) => {
    ipcRenderer.on('import-pic', (event, dataUrl) => {
      callback(dataUrl)
    })
  },
  importSVG: (callback: Function) => {
    ipcRenderer.on('import-svg', (event, data) => {
      callback(data)
    })
  },
  exportFont: (callback: Function) => {
    ipcRenderer.on('export-font-file', callback)
  },
  exportGlyphs: (callback: Function) => {
    ipcRenderer.on('export-glyphs', callback)
  },
  exportJPEG: (callback: Function) => {
    ipcRenderer.on('export-jpeg', callback)
  },
  exportPNG: (callback: Function) => {
    ipcRenderer.on('export-png', callback)
  },
  exportSVG: (callback: Function) => {
    ipcRenderer.on('export-svg', callback)
  },
  fontSettings: (callback: Function) => {
    ipcRenderer.on('font-settings', callback)
  },
  languageSettings: (callback: Function) => {
    ipcRenderer.on('language-settings', callback)
  },
  template1: (callback: Function) => {
    ipcRenderer.on('template-1', callback)
  },
  preferenceSettings: (callback: Function) => {
    ipcRenderer.on('preference-settings', callback)
  },
  _saveFile: (data: string, fileName: string) => {
    ipcRenderer.invoke('event:save-file', data, fileName)
  },
  _saveFile2: (data: string, fileName: string) => {
    ipcRenderer.invoke('event:save-file-2', data, fileName)
  },
  _toggleMenuDisabled: (editStatus: Status) => {
    ipcRenderer.invoke('event:toggle-menu-disabled', editStatus)
  },
  _changeLanguage: (language: string) => {
    ipcRenderer.invoke('event:change-language', language)
  },
  copyToClipboard: (text) => ipcRenderer.send('copy-to-clipboard', text),
  pasteFromClipboard: () => new Promise((resolve) => {
    ipcRenderer.once('pasted-text', (event, text) => {
      resolve(text);
    });
    ipcRenderer.send('paste-from-clipboard');
  }),
})