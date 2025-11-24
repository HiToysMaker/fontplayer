// 0xffe5 ￥
// 0x2027 —
const params = {
  w1: glyph.getParam('w1'),
  w2: glyph.getParam('w2'),
  h1: glyph.getParam('h1'),
  h2: glyph.getParam('h2'),
  h3: glyph.getParam('h3'),
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
const ox = 500
const oy = 500
const x0 = 500
const y0 = ascender - capitalHeight * 0.4

const getJointsMap = (data) => {
  const { draggingJoint, deltaX, deltaY } = data
  const jointsMap = Object.assign({}, glyph.tempData)
  switch (draggingJoint.name) {
    case 'skeleton_1': {
      jointsMap['skeleton_1'] = {
        x: glyph.tempData['skeleton_1'].x + deltaX,
        y: glyph.tempData['skeleton_1'].y + deltaY,
      }
      jointsMap['skeleton_2'] = {
        x: glyph.tempData['skeleton_2'].x - deltaX,
        y: glyph.tempData['skeleton_2'].y + deltaY,
      }
      break
    }
    case 'skeleton_2': {
      jointsMap['skeleton_2'] = {
        x: glyph.tempData['skeleton_2'].x + deltaX,
        y: glyph.tempData['skeleton_2'].y + deltaY,
      }
      jointsMap['skeleton_1'] = {
        x: glyph.tempData['skeleton_1'].x - deltaX,
        y: glyph.tempData['skeleton_1'].y + deltaY,
      }
      break
    }
    case 'skeleton_3': {
      jointsMap['skeleton_3'] = {
        x: glyph.tempData['skeleton_3'].x + deltaX,
        y: glyph.tempData['skeleton_3'].y,
      }
      jointsMap['skeleton_4'] = {
        x: glyph.tempData['skeleton_4'].x - deltaX,
        y: glyph.tempData['skeleton_4'].y,
      }
      jointsMap['skeleton_5'] = {
        x: glyph.tempData['skeleton_5'].x + deltaX,
        y: glyph.tempData['skeleton_5'].y,
      }
      jointsMap['skeleton_6'] = {
        x: glyph.tempData['skeleton_6'].x - deltaX,
        y: glyph.tempData['skeleton_6'].y,
      }
      break
    }
    case 'skeleton_4': {
      jointsMap['skeleton_3'] = {
        x: glyph.tempData['skeleton_3'].x - deltaX,
        y: glyph.tempData['skeleton_3'].y,
      }
      jointsMap['skeleton_4'] = {
        x: glyph.tempData['skeleton_4'].x + deltaX,
        y: glyph.tempData['skeleton_4'].y,
      }
      jointsMap['skeleton_5'] = {
        x: glyph.tempData['skeleton_5'].x - deltaX,
        y: glyph.tempData['skeleton_5'].y,
      }
      jointsMap['skeleton_6'] = {
        x: glyph.tempData['skeleton_6'].x + deltaX,
        y: glyph.tempData['skeleton_6'].y,
      }
      break
    }
    case 'skeleton_5': {
      jointsMap['skeleton_3'] = {
        x: glyph.tempData['skeleton_3'].x + deltaX,
        y: glyph.tempData['skeleton_3'].y,
      }
      jointsMap['skeleton_4'] = {
        x: glyph.tempData['skeleton_4'].x - deltaX,
        y: glyph.tempData['skeleton_4'].y,
      }
      jointsMap['skeleton_5'] = {
        x: glyph.tempData['skeleton_5'].x + deltaX,
        y: glyph.tempData['skeleton_5'].y + deltaY,
      }
      jointsMap['skeleton_6'] = {
        x: glyph.tempData['skeleton_6'].x - deltaX,
        y: glyph.tempData['skeleton_6'].y + deltaY,
      }
      break
    }
    case 'skeleton_6': {
      jointsMap['skeleton_3'] = {
        x: glyph.tempData['skeleton_3'].x - deltaX,
        y: glyph.tempData['skeleton_3'].y,
      }
      jointsMap['skeleton_4'] = {
        x: glyph.tempData['skeleton_4'].x + deltaX,
        y: glyph.tempData['skeleton_4'].y,
      }
      jointsMap['skeleton_5'] = {
        x: glyph.tempData['skeleton_5'].x - deltaX,
        y: glyph.tempData['skeleton_5'].y + deltaY,
      }
      jointsMap['skeleton_6'] = {
        x: glyph.tempData['skeleton_6'].x + deltaX,
        y: glyph.tempData['skeleton_6'].y + deltaY,
      }
      break
    }
    case 'skeleton_7': {
      jointsMap['skeleton_7'] = {
        x: glyph.tempData['skeleton_7'].x,
        y: glyph.tempData['skeleton_7'].y + deltaY,
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
  glyph.setParam('w1', _params.w1)
  glyph.setParam('w2', _params.w2)
  glyph.setParam('h1', _params.h1)
  glyph.setParam('h2', _params.h2)
  glyph.setParam('h3', _params.h3)
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
  const { skeleton_1, skeleton_2, skeleton_3, skeleton_4, skeleton_5, skeleton_6, skeleton_7 } = jointsMap
  const w1_range = glyph.getParamRange('w1')
  const w1 = range(skeleton_2.x - skeleton_1.x, w1_range)
  const w2_range = glyph.getParamRange('w2')
  const w2 = range(skeleton_4.x - skeleton_3.x, w2_range)
  const h1_range = glyph.getParamRange('h1')
  const h1 = range(skeleton_4.y - skeleton_1.y, h1_range)
  const h2_range = glyph.getParamRange('h2')
  const h2 = range(skeleton_6.y - skeleton_4.y, h2_range)
  const h3_range = glyph.getParamRange('h3')
  const h3 = range(skeleton_7.y - skeleton_6.y, h3_range)
  return {
    w1,
    w2,
    h1,
    h2,
    h3,
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
  const { h1, w1, w2, h2, h3 } = params
  const { weight } = global_params

  const skeleton_0 = new FP.Joint('skeleton_0', {
    x: x0,
    y: y0,
  })
  const skeleton_1 = new FP.Joint('skeleton_1', {
    x: skeleton_0.x - w1 / 2,
    y: skeleton_0.y - h1,
  })
  const skeleton_2 = new FP.Joint('skeleton_2', {
    x: skeleton_0.x + w1 / 2,
    y: skeleton_0.y - h1,
  })
  const skeleton_3 = new FP.Joint('skeleton_3', {
    x: skeleton_0.x - w2 / 2,
    y: skeleton_0.y,
  })
  const skeleton_4 = new FP.Joint('skeleton_4', {
    x: skeleton_0.x + w2 / 2,
    y: skeleton_0.y,
  })
  const skeleton_5 = new FP.Joint('skeleton_5', {
    x: skeleton_0.x - w2 / 2,
    y: skeleton_0.y + h2,
  })
  const skeleton_6 = new FP.Joint('skeleton_6', {
    x: skeleton_0.x + w2 / 2,
    y: skeleton_0.y + h2,
  })
  const skeleton_7 = new FP.Joint('skeleton_7', { 
    x: skeleton_0.x,
    y: skeleton_0.y + h2 + h3,
  })

  const skeleton = {
    skeleton_0,
    skeleton_1,
    skeleton_2,
    skeleton_3,
    skeleton_4,
    skeleton_5,
    skeleton_6,
    skeleton_7,
  }
  glyph.addJoint(skeleton_0)
  glyph.addJoint(skeleton_1)
  glyph.addJoint(skeleton_2)
  glyph.addJoint(skeleton_3)
  glyph.addJoint(skeleton_4)
  glyph.addJoint(skeleton_5)
  glyph.addJoint(skeleton_6)
  glyph.addJoint(skeleton_7)
  glyph.addRefLine(refline(skeleton_0, skeleton_1))
  glyph.addRefLine(refline(skeleton_0, skeleton_2))
  glyph.addRefLine(refline(skeleton_3, skeleton_4))
  glyph.addRefLine(refline(skeleton_5, skeleton_6))
  glyph.addRefLine(refline(skeleton_0, skeleton_7))

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
  const { skeleton_0, skeleton_1, skeleton_2, skeleton_3, skeleton_4, skeleton_5, skeleton_6, skeleton_7 } = skeleton

  const { out_stroke1_start, out_stroke1_end, in_stroke1_start, in_stroke1_end } = FP.getLineContours('stroke1', { stroke1_start: skeleton_0, stroke1_end: skeleton_1 }, weight)
  const { out_stroke2_start, out_stroke2_end, in_stroke2_start, in_stroke2_end } = FP.getLineContours('stroke2', { stroke2_start: skeleton_0, stroke2_end: skeleton_2 }, weight)
  const { out_stroke3_start, out_stroke3_end, in_stroke3_start, in_stroke3_end } = FP.getLineContours('stroke3', { stroke3_start: skeleton_3, stroke3_end: skeleton_4 }, weight)
  const { out_stroke4_start, out_stroke4_end, in_stroke4_start, in_stroke4_end } = FP.getLineContours('stroke4', { stroke4_start: skeleton_5, stroke4_end: skeleton_6 }, weight)
  const { out_stroke5_start, out_stroke5_end, in_stroke5_start, in_stroke5_end } = FP.getLineContours('stroke5', { stroke5_start: skeleton_0, stroke5_end: skeleton_7 }, weight)

  const pen1 = new FP.PenComponent()
  pen1.beginPath()
  pen1.moveTo(in_stroke1_start.x, in_stroke1_start.y)
  pen1.lineTo(in_stroke1_end.x, in_stroke1_end.y)
  pen1.lineTo(out_stroke1_end.x, out_stroke1_end.y)
  pen1.lineTo(out_stroke1_start.x, out_stroke1_start.y)
  pen1.lineTo(in_stroke1_start.x, in_stroke1_start.y)
  pen1.closePath()

  const pen2 = new FP.PenComponent()
  pen2.beginPath()
  pen2.moveTo(in_stroke2_start.x, in_stroke2_start.y)
  pen2.lineTo(in_stroke2_end.x, in_stroke2_end.y)
  pen2.lineTo(out_stroke2_end.x, out_stroke2_end.y)
  pen2.lineTo(out_stroke2_start.x, out_stroke2_start.y)
  pen2.lineTo(in_stroke2_start.x, in_stroke2_start.y)
  pen2.closePath()
  
  const pen3 = new FP.PenComponent()
  pen3.beginPath()
  pen3.moveTo(in_stroke3_start.x, in_stroke3_start.y)
  pen3.lineTo(in_stroke3_end.x, in_stroke3_end.y)
  pen3.lineTo(out_stroke3_end.x, out_stroke3_end.y)
  pen3.lineTo(out_stroke3_start.x, out_stroke3_start.y)
  pen3.lineTo(in_stroke3_start.x, in_stroke3_start.y)
  pen3.closePath()
  
  const pen4 = new FP.PenComponent()
  pen4.beginPath()
  pen4.moveTo(in_stroke4_start.x, in_stroke4_start.y)
  pen4.lineTo(in_stroke4_end.x, in_stroke4_end.y)
  pen4.lineTo(out_stroke4_end.x, out_stroke4_end.y)
  pen4.lineTo(out_stroke4_start.x, out_stroke4_start.y)
  pen4.lineTo(in_stroke4_start.x, in_stroke4_start.y)
  pen4.closePath()
  
  const pen5 = new FP.PenComponent()
  pen5.beginPath()
  pen5.moveTo(in_stroke5_start.x, in_stroke5_start.y)
  pen5.lineTo(in_stroke5_end.x, in_stroke5_end.y)
  pen5.lineTo(out_stroke5_end.x, out_stroke5_end.y)
  pen5.lineTo(out_stroke5_start.x, out_stroke5_start.y)
  pen5.lineTo(in_stroke5_start.x, in_stroke5_start.y)
  pen5.closePath()

  return [ pen1, pen2, pen3, pen4, pen5 ]
}

updateGlyphByParams(params, global_params)