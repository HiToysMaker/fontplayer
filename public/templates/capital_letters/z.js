const params = {
  h1: glyph.getParam('h1'),
  w1: glyph.getParam('w1'),
}
const global_params = {
  weight: glyph.getParam('字重') || 40,
  serifType: glyph.getParam('衬线类型') || 0,
  serifSize: glyph.getParam('衬线大小') || 2.0,
}
const ascender = 800
const descender = -200
const width = 360
const xHeight = 500
const capitalHeight = 750
const capitalWidth = 500
const ox = 500
const oy = 500
const x0 = 500 - capitalWidth / 2
const y0 = ascender - capitalHeight

const getJointsMap = (data) => {
  const { draggingJoint, deltaX, deltaY } = data
  const jointsMap = Object.assign({}, glyph.tempData)
  switch (draggingJoint.name) {
    case 'skeleton_1': {
      jointsMap['skeleton_1'] = {
        x: glyph.tempData['skeleton_1'].x + deltaX,
        y: glyph.tempData['skeleton_1'].y,
      }
      jointsMap['skeleton_3'] = {
        x: glyph.tempData['skeleton_3'].x + deltaX,
        y: glyph.tempData['skeleton_3'].y
      }
      break
    }
    case 'skeleton_2': {
      jointsMap['skeleton_2'] = {
        x: glyph.tempData['skeleton_2'].x,
        y: glyph.tempData['skeleton_2'].y + deltaY,
      }
      jointsMap['skeleton_3'] = {
        x: glyph.tempData['skeleton_3'].x,
        y: glyph.tempData['skeleton_3'].y + deltaY,
      }
      break
    }
    case 'skeleton_3': {
      jointsMap['skeleton_1'] = {
        x: glyph.tempData['skeleton_1'].x + deltaX,
        y: glyph.tempData['skeleton_1'].y,
      }
      jointsMap['skeleton_2'] = {
        x: glyph.tempData['skeleton_2'].x,
        y: glyph.tempData['skeleton_2'].y + deltaY,
      }
      jointsMap['skeleton_3'] = {
        x: glyph.tempData['skeleton_3'].x + deltaX,
        y: glyph.tempData['skeleton_3'].y + deltaY,
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
  const _params = computeParamsByJoints(jointsMap)
  updateGlyphByParams(_params, global_params)
}

glyph.onSkeletonDragEnd = (data) => {
  if (!glyph.tempData) return
  glyph.clear()
  // joint数据格式：{x, y, name}
  const jointsMap = getJointsMap(data)
  const _params = computeParamsByJoints(jointsMap)
  updateGlyphByParams(_params, global_params)
  glyph.setParam('h1', _params.h1)
  glyph.setParam('w1', _params.w1)
  glyph.tempData = null
}

const range = (value, range) => {
  if (value < range.min) {
    return range.min
  } else if (value > range.max) {
    return range.max
  }
  return value
}

const computeParamsByJoints = (jointsMap) => {
  const { skeleton_0, skeleton_1, skeleton_2, skeleton_3, skeleton_4, skeleton_5, skeleton_6, skeleton_7, skeleton_8, skeleton_9, skeleton_10 } = jointsMap
  const h1_range = glyph.getParamRange('h1')
  const w1_range = glyph.getParamRange('w1')
  const h1 = range(skeleton_2.y - skeleton_0.y, h1_range)
  const w1 = range(skeleton_1.x - skeleton_0.x, w1_range)
  return {
    h1,
    w1,
  }
}

const refline = (p1, p2, type) => {
  const refline =  {
    name: `${p1.name}-${p2.name}`,
    start: p1.name,
    end: p2.name,
  }
  if (type) {
    refline.type = type
  }
  return refline
}

const updateGlyphByParams = (params, global_params) => {
  const { h1, w1 } = params
  const { weight } = global_params

  const skeleton_0 = new FP.Joint('skeleton_0', {
    x: x0,
    y: y0,
  })
  const skeleton_1 = new FP.Joint('skeleton_1', {
    x: skeleton_0.x + w1,
    y: skeleton_0.y,
  })
  const skeleton_2 = new FP.Joint('skeleton_2', {
    x: skeleton_0.x,
    y: skeleton_0.y + h1,
  })
  const skeleton_3 = new FP.Joint('skeleton_3', {
    x: skeleton_0.x + w1,
    y: skeleton_0.y + h1,
  })
  const skeleton = {
    skeleton_0,
    skeleton_1,
    skeleton_2,
    skeleton_3,
  }
  
  glyph.addJoint(skeleton_0)
  glyph.addJoint(skeleton_1)
  glyph.addJoint(skeleton_2)
  glyph.addJoint(skeleton_3)
  glyph.addRefLine(refline(skeleton_0, skeleton_1))
  glyph.addRefLine(refline(skeleton_1, skeleton_2))
  glyph.addRefLine(refline(skeleton_3, skeleton_2))

  const components = getComponents(skeleton, global_params)
  for (let i = 0; i < components.length; i++) {
    glyph.addComponent(components[i])
  }

  glyph.getSkeleton = () => {
    return skeleton
  }
  glyph.getComponentsBySkeleton = (skeleton) => {
    return getComponents(skeleton, global_params)
  }
}

const getComponents = (skeleton, global_params) => {
  // 获取骨架以外的全局风格变量
  const { weight, serifType, serifSize } = global_params

  // 根据骨架计算轮廓关键点
  const { skeleton_0, skeleton_1, skeleton_2, skeleton_3 } = skeleton

  // out指上侧（外侧）轮廓线
  // in指下侧（内侧）轮廓线
  const { out_stroke1_start, out_stroke1_end, in_stroke1_start, in_stroke1_end } = FP.getLineContours('stroke1', { stroke1_start: skeleton_0, stroke1_end: skeleton_1 }, weight)
  const { out_stroke2_start, out_stroke2_end, in_stroke2_start, in_stroke2_end } = FP.getLineContours('stroke2', { stroke2_start: skeleton_1, stroke2_end: skeleton_2 }, weight)
  const { out_stroke3_start, out_stroke3_end, in_stroke3_start, in_stroke3_end } = FP.getLineContours('stroke3', { stroke3_start: skeleton_2, stroke3_end: skeleton_3 }, weight)

  const corner_top = FP.getIntersection(
    { type: 'line', start: in_stroke1_end, end: out_stroke1_end },
    { type: 'line', start: out_stroke2_start, end: out_stroke2_end },
  ).corner
  const corner_bottom = FP.getIntersection(
    { type: 'line', start: in_stroke2_start, end: in_stroke2_end },
    { type: 'line', start: out_stroke3_start, end: in_stroke3_start },
  ).corner

  // 创建钢笔组件
  const pen1 = new FP.PenComponent()
  pen1.beginPath()
  pen1.moveTo(out_stroke1_start.x, out_stroke1_start.y)
  pen1.lineTo(out_stroke1_end.x, out_stroke1_end.y)
  pen1.lineTo(in_stroke1_end.x, in_stroke1_end.y)
  pen1.lineTo(in_stroke1_start.x, in_stroke1_start.y)
  pen1.lineTo(out_stroke1_start.x, out_stroke1_start.y)
  pen1.closePath()

  const pen2 = new FP.PenComponent()
  pen2.beginPath()
  pen2.moveTo(skeleton_1.x, skeleton_1.y)
  pen2.lineTo(corner_top.x, corner_top.y)
  pen2.lineTo(out_stroke2_end.x, out_stroke2_end.y)
  pen2.lineTo(skeleton_2.x, skeleton_2.y)
  pen2.lineTo(corner_bottom.x, corner_bottom.y)
  pen2.lineTo(in_stroke2_start.x, in_stroke2_start.y)
  pen2.lineTo(skeleton_1.x, skeleton_1.y)
  pen2.closePath()

  const pen3 = new FP.PenComponent()
  pen3.beginPath()
  pen3.moveTo(out_stroke3_start.x, out_stroke3_start.y)
  pen3.lineTo(out_stroke3_end.x, out_stroke3_end.y)
  pen3.lineTo(in_stroke3_end.x, in_stroke3_end.y)
  pen3.lineTo(in_stroke3_start.x, in_stroke3_start.y)
  pen3.lineTo(out_stroke3_start.x, out_stroke3_start.y)
  pen3.closePath()

  return [ pen1, pen2, pen3 ]
}

updateGlyphByParams(params, global_params)