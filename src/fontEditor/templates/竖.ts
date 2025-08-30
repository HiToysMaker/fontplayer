import { CustomGlyph } from "../programming/CustomGlyph";
import { ICustomGlyph } from "../stores/glyph";
import { refline, range } from "../../utils/glyph";
import { FP } from "../programming/FPUtils";
import { applySkeletonTransformation, glyphSkeletonBind } from "../../features/glyphSkeletonBind";
import { updateSkeletonTransformation } from "./strokeFnMap";

const instanceBasicGlyph_shu = (plainGlyph: ICustomGlyph) => {
  const glyph = new CustomGlyph(plainGlyph)
  const params = {
    length: glyph.getParam('长度'),
    skeletonRefPos: glyph.getParam('参考位置'),
  }

  updateGlyphByParams(params, glyph)

  return
}

const bindSkeletonGlyph_shu = (plainGlyph: ICustomGlyph) => {
  if (!plainGlyph._o) {
    instanceBasicGlyph_shu(plainGlyph)
  }
  glyphSkeletonBind(plainGlyph._o)
}

const updateGlyphByParams = (params, glyph) => {
  const { length, skeletonRefPos } = params

  const { ox : _ox, oy : _oy } = glyph._glyph.skeleton

  const ox = 500
  const oy = 500
  const x0 = 500 + _ox || 0
  const y0 = 250 + _oy || 0

  const weight = glyph.getParam('字重') || 40

  let start, end
  const start_ref = new FP.Joint(
    'start_ref',
    {
      x: x0,
      y: y0,
    },
  )
  const end_ref = new FP.Joint(
    'end_ref',
    {
      x: start_ref.x,
      y: start_ref.y + length,
    },
  )
  
  if (skeletonRefPos === 1) {
    // 骨架参考位置为右侧（上侧）
    start = new FP.Joint(
      'start',
      {
        x: start_ref.x - weight / 2,
        y: start_ref.y,
      },
    )
    end = new FP.Joint(
      'end',
      {
        x: end_ref.x - weight / 2,
        y: end_ref.y,
      },
    )
  } else if (skeletonRefPos === 2) {
    // 骨架参考位置为左侧（下侧）
    start = new FP.Joint(
      'start',
      {
        x: start_ref.x + weight / 2,
        y: start_ref.y,
      },
    )
    end = new FP.Joint(
      'end',
      {
        x: end_ref.x + weight / 2,
        y: end_ref.y,
      },
    )
  } else {
    // 默认骨架参考位置，即骨架参考位置为中间实际绘制的骨架位置
    start = new FP.Joint(
      'start',
      {
        x: start_ref.x,
        y: start_ref.y,
      },
    )
    end = new FP.Joint(
      'end',
      {
        x: end_ref.x,
        y: end_ref.y,
      },
    )
  }
  
  glyph.addJoint(start_ref)
  glyph.addJoint(end_ref)
  glyph.addRefLine(refline(start_ref, end_ref, 'ref'))
  
  glyph.addJoint(start)
  glyph.addJoint(end)
  
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
  const length = range(end.y - start.y, length_range)
  return {
    length,
    skeletonRefPos: glyph.getParam('参考位置'),
  }
}

const updateSkeletonListener_before_bind_shu = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'start': {
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
          x: glyph.tempData['end'].x,
          y: glyph.tempData['end'].y + deltaY,
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

const updateSkeletonListener_after_bind_shu = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'end': {
        jointsMap['end'] = {
          x: glyph.tempData['end'].x,
          y: glyph.tempData['end'].y + deltaY,
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
    if (!glyph.tempData) return
    glyph.clear()
    // joint数据格式：{x, y, name}
    const jointsMap = getJointsMap(data)
    const _params = computeParamsByJoints(jointsMap, glyph)
    updateGlyphByParams(_params, glyph)
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
  instanceBasicGlyph_shu,
  bindSkeletonGlyph_shu,
  updateSkeletonListener_after_bind_shu,
  updateSkeletonListener_before_bind_shu,
}
