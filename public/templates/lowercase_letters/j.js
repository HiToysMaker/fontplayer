const params = {
  h1: glyph.getParam('h1'),
  h2: glyph.getParam('h2'),
  h3: glyph.getParam('h3'),
  h4: glyph.getParam('h4'),
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
const ox = 500
const oy = 500
const x0 = 500 + params.w1 / 2
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
    case 'skeleton_3': {
      jointsMap['skeleton_2'] = {
        x: glyph.tempData['skeleton_2'].x,
        y: glyph.tempData['skeleton_2'].y + deltaY,
      }
      jointsMap['skeleton_3'] = {
        x: glyph.tempData['skeleton_3'].x,
        y: glyph.tempData['skeleton_3'].y + deltaY,
      }
      jointsMap['skeleton_4'] = {
        x: glyph.tempData['skeleton_4'].x,
        y: glyph.tempData['skeleton_4'].y + deltaY,
      }
      jointsMap['skeleton_5'] = {
        x: glyph.tempData['skeleton_5'].x,
        y: glyph.tempData['skeleton_5'].y + deltaY,
      }
      jointsMap['skeleton_6'] = {
        x: glyph.tempData['skeleton_6'].x,
        y: glyph.tempData['skeleton_6'].y + deltaY,
      }
      break
    }
    case 'skeleton_4': {
      jointsMap['skeleton_2'] = {
        x: glyph.tempData['skeleton_2'].x,
        y: glyph.tempData['skeleton_2'].y + deltaY,
      }
      jointsMap['skeleton_3'] = {
        x: glyph.tempData['skeleton_3'].x,
        y: glyph.tempData['skeleton_3'].y + deltaY,
      }
      jointsMap['skeleton_4'] = {
        x: glyph.tempData['skeleton_4'].x,
        y: glyph.tempData['skeleton_4'].y + deltaY,
      }
      jointsMap['skeleton_5'] = {
        x: glyph.tempData['skeleton_5'].x,
        y: glyph.tempData['skeleton_5'].y + deltaY,
      }
      jointsMap['skeleton_6'] = {
        x: glyph.tempData['skeleton_6'].x,
        y: glyph.tempData['skeleton_6'].y + deltaY,
      }
      break
    }
    case 'skeleton_5': {
      jointsMap['skeleton_2'] = {
        x: glyph.tempData['skeleton_2'].x,
        y: glyph.tempData['skeleton_2'].y + deltaY,
      }
      jointsMap['skeleton_3'] = {
        x: glyph.tempData['skeleton_3'].x,
        y: glyph.tempData['skeleton_3'].y + deltaY,
      }
      jointsMap['skeleton_4'] = {
        x: glyph.tempData['skeleton_4'].x + deltaX / 2,
        y: glyph.tempData['skeleton_4'].y + deltaY,
      }
      jointsMap['skeleton_5'] = {
        x: glyph.tempData['skeleton_5'].x + deltaX,
        y: glyph.tempData['skeleton_5'].y + deltaY,
      }
      jointsMap['skeleton_6'] = {
        x: glyph.tempData['skeleton_6'].x + deltaX,
        y: glyph.tempData['skeleton_6'].y + deltaY,
      }
      break
    }
    case 'skeleton_6': {
      jointsMap['skeleton_4'] = {
        x: glyph.tempData['skeleton_4'].x + deltaX / 2,
        y: glyph.tempData['skeleton_4'].y,
      }
      jointsMap['skeleton_5'] = {
        x: glyph.tempData['skeleton_5'].x + deltaX,
        y: glyph.tempData['skeleton_5'].y,
      }
      jointsMap['skeleton_6'] = {
        x: glyph.tempData['skeleton_6'].x + deltaX,
        y: glyph.tempData['skeleton_6'].y + deltaY,
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
  glyph.setParam('h3', _params.h3)
  glyph.setParam('h4', _params.h4)
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
  const h2_range = glyph.getParamRange('h2')
  const h3_range = glyph.getParamRange('h3')
  const h4_range = glyph.getParamRange('h4')
  const w1_range = glyph.getParamRange('w1')
  const h1 = range(skeleton_3.y - skeleton_0.y, h1_range)
  const h2 = range(skeleton_1.y - skeleton_0.y, h2_range)
  const h3 = range(skeleton_5.y - skeleton_6.y, h3_range)
  const h4 = range(skeleton_2.y - skeleton_1.y, h4_range)
  const w1 = range(skeleton_0.x - skeleton_5.x, w1_range)
  return {
    h1,
    h2,
    h3,
    h4,
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
  const { h1, h2, h3, h4, w1 } = params
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
    y: skeleton_1.y + h4,
  })
  const skeleton_3 = new FP.Joint('skeleton_3', {
    x: skeleton_2.x,
    y: skeleton_0.y + h1,
  })
  const skeleton_4 = new FP.Joint('skeleton_4', {
    x: skeleton_3.x - w1 / 2,
    y: skeleton_3.y,
  })
  const skeleton_5 = new FP.Joint('skeleton_5', {
    x: skeleton_4.x - w1 / 2,
    y: skeleton_4.y,
  })
  const skeleton_6 = new FP.Joint('skeleton_6', {
    x: skeleton_5.x,
    y: skeleton_5.y - h3,
  })
  const skeleton = {
    skeleton_0,
    skeleton_1,
    skeleton_2,
    skeleton_3,
    skeleton_4,
    skeleton_5,
    skeleton_6,
  }
  
  glyph.addJoint(skeleton_0)
  glyph.addJoint(skeleton_1)
  glyph.addJoint(skeleton_2)
  glyph.addJoint(skeleton_3)
  glyph.addJoint(skeleton_4)
  glyph.addJoint(skeleton_5)
  glyph.addJoint(skeleton_6)

  glyph.addRefLine(refline(skeleton_1, skeleton_2))
  glyph.addRefLine(refline(skeleton_2, skeleton_3))
  glyph.addRefLine(refline(skeleton_3, skeleton_4))
  glyph.addRefLine(refline(skeleton_4, skeleton_5))
  glyph.addRefLine(refline(skeleton_5, skeleton_6))

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
  const { skeleton_0, skeleton_1, skeleton_2, skeleton_3, skeleton_4, skeleton_5, skeleton_6 } = skeleton

  // out指上侧（外侧）轮廓线
  // in指下侧（内侧）轮廓线
  const stroke1_beziers = FP.getCircle(skeleton_0, weight / 2)
  const { out_stroke2_curves, out_stroke2_points, in_stroke2_curves, in_stroke2_points } = FP.getCurveContours2(
    'stroke2',
    [
      {
        start: skeleton_1,
        end: skeleton_2,
      },
      {
        start: skeleton_2,
        bend: skeleton_3,
        end: skeleton_4,
      },
      {
        start: skeleton_4,
        bend: skeleton_5,
        end: skeleton_6,
      },
    ],
    weight
  )

  const serif2_w1 = weight * 1.5 * serifSize
  const serif2_h1 = serif2_w1 * 0.5
  const serif2_radius = 20
  const serif2_radius2 = 50
  const serif2_angle = -FP.degreeToRadius(30)
  const start_serif_p0 = out_stroke2_curves[0].start
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
    start: in_stroke2_curves[0].start,
    end: in_stroke2_curves[0].control1,
  }).corner
  const start_serif_p5 = FP.getPointOnLine(start_serif_p4, in_stroke2_curves[0].control1, serif2_radius2)
  const start_serif_p4_before = FP.getPointOnLine(start_serif_p4, start_serif_p23, serif2_radius2 * 0.5)
  const start_serif_p4_after = FP.getPointOnLine(start_serif_p4, start_serif_p5, serif2_radius2 * 0.5)
  const start_serif_p2 = FP.getPointOnLine(start_serif_p23, start_serif_p1, serif2_radius)
  const start_serif_p3 = FP.getPointOnLine(start_serif_p23, start_serif_p4, serif2_radius)
  const { final_curves: in_stroke2_curves_final } = FP.getRadiusPointsOnCurve(in_stroke2_points, FP.distance(in_stroke2_curves[0].start, start_serif_p5))

  const end_serif_size = serifSize ? serifSize * weight : weight
  const end_serif_o = FP.getPointOnLine(
    out_stroke2_curves[out_stroke2_curves.length - 1].end,
    in_stroke2_curves[in_stroke2_curves.length - 1].end,
    end_serif_size / 2,
  )
  const end_serif_curves = FP.getCircle(end_serif_o, end_serif_size / 2, 0, true)
  const {
    tangent: end_serif_tangent_1,
    final_curves: end_serif_curves_final,
  } = FP.getTangentOnCurves(end_serif_curves, 0.6)
  const end_serif_corner_data = FP.getIntersection({
    type: 'curve',
    points: FP.getCurvesPoints(end_serif_curves),
  }, {
    type: 'curve',
    points: FP.getCurvesPoints(in_stroke2_curves_final),
  })
  const {
    final_curves: in_stroke2_curves_final_2,
  } = FP.getRadiusPointsOnCurve(FP.getCurvesPoints(in_stroke2_curves_final).slice(0, end_serif_corner_data.corner_index[1] + 1), end_serif_size, true)
  const end_serif_control = FP.getIntersection({
    type: 'line',
    start: end_serif_curves_final[end_serif_curves_final.length - 1].control2,
    end: end_serif_curves_final[end_serif_curves_final.length - 1].end,
  }, {
    type: 'line',
    start: in_stroke2_curves_final_2[in_stroke2_curves_final_2.length - 1].end,
    end: in_stroke2_curves_final_2[in_stroke2_curves_final_2.length - 1].control2,
  }).corner

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
    pen2.moveTo(in_stroke2_curves[0].start.x, in_stroke2_curves[0].start.y)
    for (let i = 0; i < in_stroke2_curves.length; i++) {
      const curve = in_stroke2_curves[i]
      pen2.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
    }
    pen2.lineTo(out_stroke2_curves[out_stroke2_curves.length - 1].end.x, out_stroke2_curves[out_stroke2_curves.length - 1].end.y)
    for (let i = out_stroke2_curves.length - 1; i >= 0; i--) {
      const curve = out_stroke2_curves[i]
      pen2.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
    }
    pen2.lineTo(in_stroke2_curves[0].start.x, in_stroke2_curves[0].start.y)
  } else if (serifType === 1) {
    pen2.moveTo(start_serif_p0.x, start_serif_p0.y)
    pen2.lineTo(start_serif_p1.x, start_serif_p1.y)
    pen2.lineTo(start_serif_p2.x, start_serif_p2.y)
    pen2.lineTo(start_serif_p3.x, start_serif_p3.y)
    pen2.lineTo(start_serif_p4_before.x, start_serif_p4_before.y)
    pen2.quadraticBezierTo(start_serif_p4.x, start_serif_p4.y, start_serif_p5.x, start_serif_p5.y)
    for (let i = 0; i < in_stroke2_curves_final_2.length; i++) {
      const curve = in_stroke2_curves_final_2[i]
      pen2.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
    }
    pen2.quadraticBezierTo(end_serif_control.x, end_serif_control.y, end_serif_curves_final[end_serif_curves_final.length - 1].end.x, end_serif_curves_final[end_serif_curves_final.length - 1].end.y)
    for (let i = end_serif_curves_final.length - 1; i >= 0; i--) {
      const curve = end_serif_curves_final[i]
      pen2.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
    }
    pen2.lineTo(out_stroke2_curves[out_stroke2_curves.length - 1].end.x, out_stroke2_curves[out_stroke2_curves.length - 1].end.y)
    for (let i = out_stroke2_curves.length - 1; i >= 0; i--) {
      const curve = out_stroke2_curves[i]
      pen2.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
    }
    pen2.lineTo(start_serif_p0.x, start_serif_p0.y)
  }
  pen2.closePath()

  return [ pen1, pen2 ]
}

updateGlyphByParams(params, global_params)