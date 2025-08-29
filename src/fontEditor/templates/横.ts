import { CustomGlyph } from "../programming/CustomGlyph";
import { ICustomGlyph } from "../stores/glyph";
import { refline, range } from "../../utils/glyph";
import { FP } from "../programming/FPUtils";
import { applySkeletonTransformation, glyphSkeletonBind } from "../../features/glyphSkeletonBind";
import { updateSkeletonTransformation } from "./strokeFnMap";

const instanceBasicGlyph_heng = (plainGlyph: ICustomGlyph) => {
  const glyph = new CustomGlyph(plainGlyph)
  const params = {
    length: glyph.getParam('长度'),
  }

  updateGlyphByParams(params, glyph)

  return
}

const bindSkeletonGlyph_heng = (plainGlyph: ICustomGlyph) => {
  if (!plainGlyph._o) {
    instanceBasicGlyph_heng(plainGlyph)
  }
  glyphSkeletonBind(plainGlyph._o)
}

const updateGlyphByParams = (params, glyph) => {
  const { length } = params

  const { ox : _ox, oy : _oy } = glyph._glyph.skeleton

  const ox = 500
  const oy = 500
  const x0 = 250 + _ox || 0
  const y0 = 500 + _oy || 0

  let start, end
  start = new FP.Joint(
    'start',
    {
      x: x0,
      y: y0,
    },
  )
  end = new FP.Joint(
    'end',
    {
      x: start.x + length,
      y: start.y,
    },
  )
  glyph.addJoint(start)
  glyph.addJoint(end)
  glyph.addRefLine(refline(start, end, 'ref'))

  const skeleton = {
    start,
    end,
  }
  
  glyph.addRefLine(refline(start, end))

  glyph.getSkeleton = () => {
    return skeleton
  }
}

const computeParamsByJoints = (jointsMap, glyph) => {
  const { start, end } = jointsMap
  const length_range = glyph.getParamRange('长度')
  const length = range(end.x - start.x, length_range)
  return {
    length,
  }
}

const updateSkeletonListener_before_bind_heng = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'start': {
        console.log('start')
        // 拖拽第一个joint，整体移动骨架
        const deltaX = data.deltaX
        const deltaY = data.deltaY
        
        // 更新骨架的ox, oy
        if (glyph._glyph.skeleton) {
          glyph._glyph.skeleton.ox = (glyph.tempData.ox || 0) + deltaX
          glyph._glyph.skeleton.oy = (glyph.tempData.oy || 0) + deltaY
        }
        
        // 更新所有joint的位置
        Object.keys(jointsMap).forEach(key => {
          jointsMap[key] = {
            x: glyph.tempData[key].x + deltaX,
            y: glyph.tempData[key].y + deltaY,
          }
        })
        break
      }
      case 'end': {
        jointsMap['end'] = {
          x: glyph.tempData['end'].x + deltaX,
          y: glyph.tempData['end'].y,
        }
        break
      }
    }
    return jointsMap
  }

  glyph.onSkeletonDragStart = (data) => {
    // joint数据格式：{x, y, name}
    const { draggingJoint } = data
    glyph.tempData = {}
    glyph.tempData.ox = glyph._glyph.skeleton.ox
    glyph.tempData.oy = glyph._glyph.skeleton.oy
    glyph.getJoints().map((joint) => {
      const _joint = {
        name: joint.name,
        x: joint.x,
        y: joint.y,
      }
      glyph.tempData[_joint.name] = _joint
    })
  }
  
  glyph.onSkeletonDrag = (data) => {
    console.log('onSkeletonDrag', data)
    if (!glyph.tempData) return
    glyph.clear()
    // joint数据格式：{x, y, name}
    const jointsMap = getJointsMap(data)
    const _params = computeParamsByJoints(jointsMap, glyph)
    updateGlyphByParams(_params, glyph)
    //updateSkeletonTransformation(glyph)
  }
  
  glyph.onSkeletonDragEnd = (data) => {
    if (!glyph.tempData) return
    glyph.clear()
    // joint数据格式：{x, y, name}
    const jointsMap = getJointsMap(data)
    const _params = computeParamsByJoints(jointsMap, glyph)
    updateGlyphByParams(_params, glyph)
    //updateSkeletonTransformation(glyph)
    glyph.setParam('长度', _params.length)
    glyph.tempData = null
  }
}

const updateSkeletonListener_after_bind_heng = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'end': {
        jointsMap['end'] = {
          x: glyph.tempData['end'].x + deltaX,
          y: glyph.tempData['end'].y,
        }
        break
      }
    }
    return jointsMap
  }

  glyph.onSkeletonDragStart = (data) => {
    // joint数据格式：{x, y, name}
    const { draggingJoint } = data
    glyph.tempData = {}
    glyph.getJoints().map((joint) => {
      const _joint = {
        name: joint.name,
        x: joint.x,
        y: joint.y,
      }
      glyph.tempData[_joint.name] = _joint
    })
  }
  
  glyph.onSkeletonDrag = (data) => {
    console.log('onSkeletonDrag after bind', data)
    if (!glyph.tempData) return
    glyph.clear()
    // joint数据格式：{x, y, name}
    const jointsMap = getJointsMap(data)
    const _params = computeParamsByJoints(jointsMap, glyph)
    updateGlyphByParams(_params, glyph)
    console.log('updateSkeletonTransformation')
    updateSkeletonTransformation(glyph)
  }
  
  glyph.onSkeletonDragEnd = (data) => {
    if (!glyph.tempData) return
    glyph.clear()
    // joint数据格式：{x, y, name}
    const jointsMap = getJointsMap(data)
    const _params = computeParamsByJoints(jointsMap, glyph)
    updateGlyphByParams(_params, glyph)
    updateSkeletonTransformation(glyph)
    glyph.setParam('长度', _params.length)
    glyph.tempData = null
  }
}

export {
  instanceBasicGlyph_heng,
  bindSkeletonGlyph_heng,
  updateSkeletonListener_after_bind_heng,
  updateSkeletonListener_before_bind_heng,
}