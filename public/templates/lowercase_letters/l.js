const params = {
  h1: glyph.getParam('h1'),
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
const y0 = ascender - capitalHeight

const getJointsMap = (data) => {
  const { draggingJoint, deltaX, deltaY } = data
  const jointsMap = Object.assign({}, glyph.tempData)
  switch (draggingJoint.name) {
    case 'skeleton_1': {
      jointsMap['skeleton_1'] = {
        x: glyph.tempData['skeleton_1'].x,
        y: glyph.tempData['skeleton_1'].y + deltaY,
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
  const h1 = range(skeleton_1.y - skeleton_0.y, h1_range)
  return {
    h1,
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
  const { h1, h2, h3, w1, w2 } = params
  const { weight } = global_params

  const skeleton_0 = new FP.Joint('skeleton_0', {
    x: x0,
    y: y0,
  })
  const skeleton_1 = new FP.Joint('skeleton_1', {
    x: skeleton_0.x,
    y: skeleton_0.y + h1,
  })
  const skeleton = {
    skeleton_0,
    skeleton_1,
  }
  
  glyph.addJoint(skeleton_0)
  glyph.addJoint(skeleton_1)
  glyph.addRefLine(refline(skeleton_1, skeleton_0))

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
  const { skeleton_0, skeleton_1 } = skeleton

  // out指上侧（外侧）轮廓线
  // in指下侧（内侧）轮廓线
  const { out_stroke1_start, out_stroke1_end, in_stroke1_start, in_stroke1_end } = FP.getLineContours('stroke1', { stroke1_start: skeleton_0, stroke1_end: skeleton_1 }, weight)

  const serif_w1 = serifSize * 100
  const serif_h1 = 100
  const serif_h2 = 20
  const serif_c1 = 20
  const serif_c2 = 20
  const stroke1_end_serif_p0 = {
    x: skeleton_1.x - serif_w1 / 2,
    y: skeleton_1.y,
  }
  const stroke1_end_serif_p1 = {
    x: skeleton_1.x + serif_w1 / 2,
    y: skeleton_1.y,
  }
  const stroke1_end_serif_p2 = {
    x: stroke1_end_serif_p0.x,
    y: stroke1_end_serif_p0.y - serif_h2,
  }
  const stroke1_end_serif_p3 = {
    x: stroke1_end_serif_p1.x,
    y: stroke1_end_serif_p1.y - serif_h2,
  }
  const stroke1_end_serif_p4 = FP.getIntersection({
    type: 'line',
    start: stroke1_end_serif_p2,
    end: stroke1_end_serif_p3,
  }, {
    type: 'line',
    start: in_stroke1_end,
    end: in_stroke1_start,
  }).corner
  const stroke1_end_serif_p5 = FP.getIntersection({
    type: 'line',
    start: stroke1_end_serif_p2,
    end: stroke1_end_serif_p3,
  }, {
    type: 'line',
    start: out_stroke1_end,
    end: out_stroke1_start,
  }).corner
  const stroke1_end_serif_p6 = FP.goStraight(in_stroke1_end, stroke1_end_serif_p4, serif_h1)
  const stroke1_end_serif_p7 = FP.goStraight(out_stroke1_end, stroke1_end_serif_p5, serif_h1)
  const stroke1_end_serif_p4_before = FP.getPointOnLine(stroke1_end_serif_p4, stroke1_end_serif_p2, serif_c1)
  const stroke1_end_serif_p4_after = FP.getPointOnLine(stroke1_end_serif_p4, stroke1_end_serif_p6, serif_c2)
  const stroke1_end_serif_p5_before = FP.getPointOnLine(stroke1_end_serif_p5, stroke1_end_serif_p3, serif_c1)
  const stroke1_end_serif_p5_after = FP.getPointOnLine(stroke1_end_serif_p5, stroke1_end_serif_p7, serif_c2)

  const serif2_w1 = weight * 1.5 * serifSize
  const serif2_h1 = serif2_w1 * 0.5
  const serif2_radius = 20
  const serif2_radius2 = 50
  const serif2_angle = -FP.degreeToRadius(30)
  const start_serif_p0 = out_stroke1_start
  const start_serif_p1 = {
    x: start_serif_p0.x - serif2_radius,
    y: start_serif_p0.y,
  }
  const start_serif_p23 = {
    x: start_serif_p1.x - serif2_w1,
    y: start_serif_p1.y + serif2_h1,
  }
  const start_serif_vec_p23_4 = FP.turnAngleFromStart(start_serif_p23, start_serif_p1, serif2_angle, 100)
  const start_serif_p4 = FP.getIntersection({
    type: 'line',
    start: start_serif_p23,
    end: start_serif_vec_p23_4,
  }, {
    type: 'line',
    start: in_stroke1_start,
    end: in_stroke1_end,
  }).corner
  const start_serif_p5 = FP.getPointOnLine(start_serif_p4, in_stroke1_end, serif2_radius2)
  const start_serif_p4_before = FP.getPointOnLine(start_serif_p4, start_serif_p23, serif2_radius2 * 0.5)
  const start_serif_p4_after = FP.getPointOnLine(start_serif_p4, start_serif_p5, serif2_radius2 * 0.5)
  const start_serif_p2 = FP.getPointOnLine(start_serif_p23, start_serif_p1, serif2_radius)
  const start_serif_p3 = FP.getPointOnLine(start_serif_p23, start_serif_p4, serif2_radius)

  // 创建钢笔组件
  const pen1 = new FP.PenComponent()
  pen1.beginPath()
  if (serifType === 0) {
    pen1.moveTo(in_stroke1_start.x, in_stroke1_start.y)
    pen1.lineTo(in_stroke1_end.x, in_stroke1_end.y)
    pen1.lineTo(out_stroke1_end.x, out_stroke1_end.y)
    pen1.lineTo(out_stroke1_start.x, out_stroke1_start.y)
    pen1.lineTo(in_stroke1_start.x, in_stroke1_start.y)
  } else if (serifType === 1) {
    pen1.moveTo(start_serif_p0.x, start_serif_p0.y)
    pen1.lineTo(start_serif_p1.x, start_serif_p1.y)
    pen1.lineTo(start_serif_p2.x, start_serif_p2.y)
    pen1.lineTo(start_serif_p3.x, start_serif_p3.y)
    pen1.lineTo(start_serif_p4_before.x, start_serif_p4_before.y)
    pen1.quadraticBezierTo(start_serif_p4.x, start_serif_p4.y, start_serif_p5.x, start_serif_p5.y)
    pen1.lineTo(stroke1_end_serif_p6.x, stroke1_end_serif_p6.y)
    pen1.bezierTo(
      stroke1_end_serif_p4_after.x, stroke1_end_serif_p4_after.y,
      stroke1_end_serif_p4_before.x, stroke1_end_serif_p4_before.y,
      stroke1_end_serif_p2.x, stroke1_end_serif_p2.y,
    )
    pen1.lineTo(stroke1_end_serif_p0.x, stroke1_end_serif_p0.y)
    pen1.lineTo(stroke1_end_serif_p1.x, stroke1_end_serif_p1.y)
    pen1.lineTo(stroke1_end_serif_p3.x, stroke1_end_serif_p3.y)
    pen1.bezierTo(
      stroke1_end_serif_p5_before.x, stroke1_end_serif_p5_before.y,
      stroke1_end_serif_p5_after.x, stroke1_end_serif_p5_after.y,
      stroke1_end_serif_p7.x, stroke1_end_serif_p7.y,
    )
    pen1.lineTo(start_serif_p0.x, start_serif_p0.y)
  }
  pen1.closePath()

  return [ pen1 ]
}

updateGlyphByParams(params, global_params)