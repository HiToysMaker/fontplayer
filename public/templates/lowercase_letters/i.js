const params = {
  h1: glyph.getParam('h1'),
  h2: glyph.getParam('h2'),
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
    case 'skeleton_2': {
      jointsMap['skeleton_2'] = {
        x: glyph.tempData['skeleton_2'].x,
        y: glyph.tempData['skeleton_2'].y + deltaY,
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
  glyph.setParam('h2', _params.h2)
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
  const h2_range = glyph.getParamRange('h2')
  const h1 = range(skeleton_2.y - skeleton_0.y, h1_range)
  const h2 = range(skeleton_1.y - skeleton_0.y, h2_range)
  return {
    h1,
    h2,
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
    y: skeleton_0.y + h2,
  })
  const skeleton_2 = new FP.Joint('skeleton_2', {
    x: skeleton_1.x,
    y: skeleton_0.y + h1,
  })
  const skeleton = {
    skeleton_0,
    skeleton_1,
    skeleton_2,
  }
  
  glyph.addJoint(skeleton_0)
  glyph.addJoint(skeleton_1)
  glyph.addJoint(skeleton_2)

  glyph.addRefLine(refline(skeleton_2, skeleton_1))

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
  const { skeleton_0, skeleton_1, skeleton_2 } = skeleton

  // out指上侧（外侧）轮廓线
  // in指下侧（内侧）轮廓线
  const stroke1_beziers = FP.getCircle(skeleton_0, weight / 2)
  const { out_stroke2_start, out_stroke2_end, in_stroke2_start, in_stroke2_end } = FP.getLineContours('stroke2', { stroke2_start: skeleton_1, stroke2_end: skeleton_2 }, weight)

  const serif_w1 = serifSize * 100
  const serif_h1 = 100
  const serif_h2 = 20
  const serif_c1 = 20
  const serif_c2 = 20
  const stroke2_end_serif_p0 = {
    x: skeleton_2.x - serif_w1 / 2,
    y: skeleton_2.y,
  }
  const stroke2_end_serif_p1 = {
    x: skeleton_2.x + serif_w1 / 2,
    y: skeleton_2.y,
  }
  const stroke2_end_serif_p2 = {
    x: stroke2_end_serif_p0.x,
    y: stroke2_end_serif_p0.y - serif_h2,
  }
  const stroke2_end_serif_p3 = {
    x: stroke2_end_serif_p1.x,
    y: stroke2_end_serif_p1.y - serif_h2,
  }
  const stroke2_end_serif_p4 = FP.getIntersection({
    type: 'line',
    start: stroke2_end_serif_p2,
    end: stroke2_end_serif_p3,
  }, {
    type: 'line',
    start: in_stroke2_end,
    end: in_stroke2_start,
  }).corner
  const stroke2_end_serif_p5 = FP.getIntersection({
    type: 'line',
    start: stroke2_end_serif_p2,
    end: stroke2_end_serif_p3,
  }, {
    type: 'line',
    start: out_stroke2_end,
    end: out_stroke2_start,
  }).corner
  const stroke2_end_serif_p6 = FP.goStraight(in_stroke2_end, stroke2_end_serif_p4, serif_h1)
  const stroke2_end_serif_p7 = FP.goStraight(out_stroke2_end, stroke2_end_serif_p5, serif_h1)
  const stroke2_end_serif_p4_before = FP.getPointOnLine(stroke2_end_serif_p4, stroke2_end_serif_p2, serif_c1)
  const stroke2_end_serif_p4_after = FP.getPointOnLine(stroke2_end_serif_p4, stroke2_end_serif_p6, serif_c2)
  const stroke2_end_serif_p5_before = FP.getPointOnLine(stroke2_end_serif_p5, stroke2_end_serif_p3, serif_c1)
  const stroke2_end_serif_p5_after = FP.getPointOnLine(stroke2_end_serif_p5, stroke2_end_serif_p7, serif_c2)

  const serif2_w1 = weight * 1.5 * serifSize
  const serif2_h1 = serif2_w1 * 0.5
  const serif2_radius = 20
  const serif2_radius2 = 50
  const serif2_angle = -FP.degreeToRadius(30)
  const start_serif_p0 = out_stroke2_start
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
    start: in_stroke2_start,
    end: in_stroke2_end,
  }).corner
  const start_serif_p5 = FP.getPointOnLine(start_serif_p4, in_stroke2_end, serif2_radius2)
  const start_serif_p4_before = FP.getPointOnLine(start_serif_p4, start_serif_p23, serif2_radius2 * 0.5)
  const start_serif_p4_after = FP.getPointOnLine(start_serif_p4, start_serif_p5, serif2_radius2 * 0.5)
  const start_serif_p2 = FP.getPointOnLine(start_serif_p23, start_serif_p1, serif2_radius)
  const start_serif_p3 = FP.getPointOnLine(start_serif_p23, start_serif_p4, serif2_radius)

  // 创建钢笔组件
  const pen1 = new FP.PenComponent()
  pen1.beginPath()
  // 按逆时针方向绘制轮廓
  // 绘制stroke1
  pen1.moveTo(stroke1_beziers[0].start.x, stroke1_beziers[0].start.y)
  for (let i = 0; i < stroke1_beziers.length; i++) {
    const curve = stroke1_beziers[i]
    pen1.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }
  pen1.closePath()

  const pen2 = new FP.PenComponent()
  pen2.beginPath()
  if (serifType === 0) {
    pen2.moveTo(in_stroke2_start.x, in_stroke2_start.y)
    pen2.lineTo(in_stroke2_end.x, in_stroke2_end.y)
    pen2.lineTo(out_stroke2_end.x, out_stroke2_end.y)
    pen2.lineTo(out_stroke2_start.x, out_stroke2_start.y)
    pen2.lineTo(in_stroke2_start.x, in_stroke2_start.y)
  } else if (serifType === 1) {
    pen2.moveTo(start_serif_p0.x, start_serif_p0.y)
    pen2.lineTo(start_serif_p1.x, start_serif_p1.y)
    pen2.lineTo(start_serif_p2.x, start_serif_p2.y)
    pen2.lineTo(start_serif_p3.x, start_serif_p3.y)
    pen2.lineTo(start_serif_p4_before.x, start_serif_p4_before.y)
    pen2.quadraticBezierTo(start_serif_p4.x, start_serif_p4.y, start_serif_p5.x, start_serif_p5.y)
    pen2.lineTo(stroke2_end_serif_p6.x, stroke2_end_serif_p6.y)
    pen2.bezierTo(
      stroke2_end_serif_p4_after.x, stroke2_end_serif_p4_after.y,
      stroke2_end_serif_p4_before.x, stroke2_end_serif_p4_before.y,
      stroke2_end_serif_p2.x, stroke2_end_serif_p2.y,
    )
    pen2.lineTo(stroke2_end_serif_p0.x, stroke2_end_serif_p0.y)
    pen2.lineTo(stroke2_end_serif_p1.x, stroke2_end_serif_p1.y)
    pen2.lineTo(stroke2_end_serif_p3.x, stroke2_end_serif_p3.y)
    pen2.bezierTo(
      stroke2_end_serif_p5_before.x, stroke2_end_serif_p5_before.y,
      stroke2_end_serif_p5_after.x, stroke2_end_serif_p5_after.y,
      stroke2_end_serif_p7.x, stroke2_end_serif_p7.y,
    )
    pen2.lineTo(start_serif_p0.x, start_serif_p0.y)
  }
  pen2.closePath()

  return [ pen1, pen2 ]
}

updateGlyphByParams(params, global_params)