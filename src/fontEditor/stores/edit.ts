import { ref, type Ref } from 'vue'
import { editCharacterFile, editCharacterFileUUID, selectedFile } from './files'
import { comp_glyphs, editGlyph, editGlyphUUID, glyphs, radical_glyphs, stroke_glyphs } from './glyph'
import { jointsCheckedMap, tool } from './global'
import { editing as editingPen, points as pointsPen, mousedown as mousedownPen, mousemove as mousemovePen } from './pen'
import { editing as editingPolygon, points as pointsPolygon, mousedown as mousedownPolygon, mousemove as mousemovePolygon } from './polygon'
import {
  editing as editingRectangle,
	rectX,
	rectY,
	rectWidth,
	rectHeight,
} from './rectangle'
import {
  editing as editingEllipse,
	ellipseX,
	ellipseY,
	radiusX,
	radiusY,
} from './ellipse'
import { selectAnchor, selectPenPoint } from './select'
import { dragOption, draggable, checkJoints, checkRefLines } from './global'
import * as R from 'ramda'
import { ElMessage, ElMessageBox } from 'element-plus'
import { editStatus } from './font'

const redoStack = []
const undoStack = []

enum StoreType {
  EditCharacter,
  EditGlyph,
  Tools,
  Pen,
  Polygon,
  Rectangle,
  Ellipse,
  GlyphCompnent,
  Status,
}

enum OpType {
  Undo,
  Redo,
}

interface OpOption {
  newRecord?: boolean;
  undoTip?: string;
  redoTip?: string;
  [key: string]: any;
}

const saveState = (opName: String, opStores: StoreType[], opType: OpType, options: OpOption = {
  newRecord: true,
  undoTip: '',
  redoTip: '',
}) => {
  let stack = []
  if (opType === OpType.Redo) {
    stack = redoStack
  } else if (opType === OpType.Undo) {
    redoStack.length = 0
    stack = undoStack
  }
  let states: any = {}
  for (let i = 0; i < opStores.length; i++) {
    const opStore = opStores[i]
    switch(opStore) {
      case StoreType.EditCharacter: {
        states.editCharacterFile = R.clone(options.editCharacterFile || editCharacterFile.value)
        break
      }
      case StoreType.GlyphCompnent: {
        states.draggable = options.draggable || draggable.value
        states.dragOption = R.clone(options.dragOption || dragOption.value)
        states.checkRefLines = options.checkRefLines || checkRefLines.value
        states.checkJoints = options.checkJoints || checkJoints.value
        //states.jointsCheckedMap = R.clone(options.jointsCheckedMap || jointsCheckedMap.value)
        break
      }
      case StoreType.EditGlyph: {
        states.editGlyph = R.clone(options.editGlyph || editGlyph.value)
        break
      }
      case StoreType.Status: {
        states.editStatus = options.editStatus || editStatus.value
        break
      }
      case StoreType.Tools: {
        states.tool = R.clone(options.tool || tool.value)
        break
      }
      case StoreType.Pen: {
        states.editingPen = R.clone(editingPen.value)
        states.pointsPen = R.clone(pointsPen.value)
        states.selectAnchor = R.clone(selectAnchor.value)
        states.selectPenPoint = R.clone(selectPenPoint.value)
        states.mousedownPen = mousedownPen.value
        states.mousemovePen = mousemovePen.value
        break
      }
      case StoreType.Polygon: {
        states.editingPolygon = R.clone(editingPolygon.value)
        states.pointsPolygon = R.clone(pointsPolygon.value)
        states.mousedownPolygon = mousedownPolygon.value
        states.mousemovePolygon = mousemovePolygon.value
        break
      }
      case StoreType.Rectangle: {
        states.editingRectangle = R.clone(editingRectangle.value)
        states.rectX = R.clone(rectX.value)
        states.rectY = R.clone(rectY.value)
        states.rectWidth = R.clone(rectWidth.value)
        states.rectHeight = R.clone(rectHeight.value)
        break
      }
      case StoreType.Ellipse: {
        states.editingEllipse = R.clone(editingEllipse.value)
        states.ellipseX = R.clone(ellipseX.value)
        states.ellipseY = R.clone(ellipseY.value)
        states.radiusX = R.clone(radiusX.value)
        states.radiusY = R.clone(radiusY.value)
        break
      }
    }
  }
  if (options.newRecord || !stack.length) {
    stack.push({
      opName,
      opStores,
      states,
      options
    })
  } else {
    const record = stack.pop()
    record.opName = opName
    record.opStores = opStores
    record.states = states
    record.options = options
    stack.push(record)
  }
}

const undo = () => {
  if (!undoStack.length) return
  const record = undoStack[undoStack.length - 1]
  if (record.options.undoTip) {
    ElMessageBox.confirm(
      record.options.undoTip,
      `撤销${record.opName}`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    .then(() => {
      undoStack.pop()
      saveState(record.opName, record.opStores, OpType.Redo, record.options)
      updateState(record)
      ElMessage({
        type: 'success',
        message: `撤销${record.opName}`,
      })
    })
    .catch(() => {
    })
  } else {
    undoStack.pop()
    saveState(record.opName, record.opStores, OpType.Redo, record.options)
    updateState(record)
  }
}

const redo = () => {
  if (!redoStack.length) return
  const record = redoStack[redoStack.length - 1]
  if (record.options.redoTip) {
    ElMessageBox.confirm(
      record.options.redoTip,
      `重做${record.opName}`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    .then(() => {
      redoStack.pop()
      updateState(record)
      saveState(record.opName, record.opStores, OpType.Undo, record.options)
      ElMessage({
        type: 'success',
        message: `重做${record.opName}`,
      })
    })
    .catch(() => {
    })
  } else {
    redoStack.pop()
    updateState(record)
    saveState(record.opName, record.opStores, OpType.Undo, record.options)
  }
}

const updateState = (record) => {
  for (let i = 0; i < record.opStores.length; i++) {
    const opStore = record.opStores[i]
    switch(opStore) {
      case StoreType.EditCharacter: {
        for (let i = 0; i < selectedFile.value.characterList.length; i++) {
          if (editCharacterFileUUID.value === selectedFile.value.characterList[i].uuid) {
            selectedFile.value.characterList[i] = record.states.editCharacterFile
          }
        }
        break
      }
      case StoreType.EditGlyph: {
        for (let i = 0; i < glyphs.value.length; i++) {
          if (glyphs.value[i].uuid === editGlyphUUID.value) {
            glyphs.value[i] = record.states.editGlyph
          }
        }
        for (let i = 0; i < radical_glyphs.value.length; i++) {
          if (radical_glyphs.value[i].uuid === editGlyphUUID.value) {
            radical_glyphs.value[i] = record.states.editGlyph
          }
        }
        for (let i = 0; i < stroke_glyphs.value.length; i++) {
          if (stroke_glyphs.value[i].uuid === editGlyphUUID.value) {
            stroke_glyphs.value[i] = record.states.editGlyph
          }
        }
        for (let i = 0; i < comp_glyphs.value.length; i++) {
          if (comp_glyphs.value[i].uuid === editGlyphUUID.value) {
            comp_glyphs.value[i] = record.states.editGlyph
          }
        }
        break
      }
      case StoreType.Tools: {
        tool.value = record.states.tool
        break
      }
      case StoreType.Status: {
        editStatus.value = record.states.editStatus
        break
      }
      case StoreType.Pen: {
        pointsPen.value = record.states.pointsPen
        editingPen.value = record.states.editingPen
        selectAnchor.value = record.states.selectAnchor
        selectPenPoint.value = record.states.selectPenPoint
        mousedownPen.value = record.states.mousedownPen
        mousemovePen.value = record.states.mousemovePen
        break
      }
      case StoreType.Polygon: {
        pointsPolygon.value = record.states.pointsPolygon
        editingPolygon.value = record.states.editingPolygon
        mousedownPolygon.value = record.states.mousedownPolygon
        mousemovePolygon.value = record.states.mousemovePolygon
        break
      }
      case StoreType.Rectangle: {
        editingRectangle.value = record.states.editingRectangle
        rectX.value = record.states.rectX
        rectY.value = record.states.rectY
        rectWidth.value = record.states.rectWidth
        rectHeight.value = record.states.rectHeight
        break
      }
      case StoreType.Ellipse: {
        editingEllipse.value = record.states.editingEllipse
        ellipseX.value = record.states.ellipseY
        ellipseY.value = record.states.ellipseX
        radiusX.value = record.states.radiusX
        radiusY.value = record.states.radiusY
        break
      }
    }
  }
}

const clearState = () => {
  redoStack.length = 0
  undoStack.length = 0
}

export {
  OpType,
  StoreType,
  undo,
  redo,
  saveState,
  clearState,
}