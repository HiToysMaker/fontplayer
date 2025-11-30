import {
  setClipBoard,
  clipBoard,
  setSelectionForCurrentCharacterFile,
  removeComponentForCurrentCharacterFile,
  addComponentForCurrentCharacterFile,
  selectedComponent,
  selectedComponents,
} from '../stores/files'
import { setGlyphDraggerTool, setTool } from '../stores/global'
import { undo as _undo, redo as _redo } from '../stores/edit'
import type { IComponent } from '../stores/files'
import * as R from 'ramda'
import { genUUID } from '../../utils/string'

const undo = () => {
  // 暂时禁用redo/undo功能
  // _undo()
}

const redo = () => {
  // 暂时禁用redo/undo功能
  // _redo()
}

const copy = () => {
  if (!selectedComponent.value) return
  setClipBoard(R.clone(selectedComponents.value))
}

const paste = () => {
  const components = clipBoard.value
  let lastComponent: any = null

  components.map((component) => {
    const clonedComponent = R.clone(component)
    clonedComponent.uuid = genUUID()
    addComponentForCurrentCharacterFile(clonedComponent)
    lastComponent = clonedComponent
  })

  if (lastComponent && lastComponent.type === 'glyph') {
    setGlyphDraggerTool('glyphDragger')
  } else {
    setTool('select')
  }
}

const cut = () => {
  if (!selectedComponent.value) return
  setClipBoard(R.clone(selectedComponents.value))
  selectedComponents.value.map((component: IComponent) => {
    removeComponentForCurrentCharacterFile(component.uuid)
  })
  setSelectionForCurrentCharacterFile('')
}

const del = () => {
  selectedComponents.value.map((component: IComponent) => {
    removeComponentForCurrentCharacterFile(component.uuid)
  })
  setSelectionForCurrentCharacterFile('')
}

export {
  undo,
  redo,
  copy,
  paste,
  cut,
  del,
}


