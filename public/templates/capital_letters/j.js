const params = {
  h1: glyph.getParam('h1'),
  h2: glyph.getParam('h2'),
  h3: glyph.getParam('h3'),
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
const x0 = 500 + capitalWidth / 4
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
      jointsMap['skeleton_1'] = {
        x: glyph.tempData['skeleton_1'].x,
        y: glyph.tempData['skeleton_1'].y + deltaY,
      }
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
      break
    }
    case 'skeleton_3': {
      jointsMap['skeleton_1'] = {
        x: glyph.tempData['skeleton_1'].x,
        y: glyph.tempData['skeleton_1'].y + deltaY,
      }
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
      break
    }
    case 'skeleton_4': {
      jointsMap['skeleton_1'] = {
        x: glyph.tempData['skeleton_1'].x,
        y: glyph.tempData['skeleton_1'].y + deltaY,
      }
      jointsMap['skeleton_2'] = {
        x: glyph.tempData['skeleton_2'].x,
        y: glyph.tempData['skeleton_2'].y + deltaY,
      }
      jointsMap['skeleton_3'] = {
        x: glyph.tempData['skeleton_3'].x + deltaX / 2,
        y: glyph.tempData['skeleton_3'].y + deltaY,
      }
      jointsMap['skeleton_4'] = {
        x: glyph.tempData['skeleton_4'].x + deltaX,
        y: glyph.tempData['skeleton_4'].y + deltaY,
      }
      jointsMap['skeleton_5'] = {
        x: glyph.tempData['skeleton_5'].x + deltaX,
        y: glyph.tempData['skeleton_5'].y + deltaY,
      }
      break
    }
    case 'skeleton_5': {
      jointsMap['skeleton_5'] = {
        x: glyph.tempData['skeleton_5'].x,
        y: glyph.tempData['skeleton_5'].y + deltaY,
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
  const w1_range = glyph.getParamRange('w1')
  const h1 = range(skeleton_2.y - skeleton_0.y, h1_range)
  const h2 = range(skeleton_4.y - skeleton_5.y, h2_range)
  const h3 = range(skeleton_2.y - skeleton_1.y, h3_range)
  const w1 = range(skeleton_2.x - skeleton_4.x, w1_range)
  return {
    h1,
    h2,
    h3,
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
  const { h1, h2, h3, w1, w2 } = params
  const { weight } = global_params

  const skeleton_0 = new FP.Joint('skeleton_0', {
    x: x0,
    y: y0,
  })
  const skeleton_1 = new FP.Joint('skeleton_1', {
    x: skeleton_0.x,
    y: skeleton_0.y + h1 - h3,
  })
  const skeleton_2 = new FP.Joint('skeleton_2', {
    x: skeleton_1.x,
    y: skeleton_1.y + h3,
  })
  const skeleton_3 = new FP.Joint('skeleton_3', {
    x: skeleton_2.x - w1 / 2,
    y: skeleton_2.y,
  })
  const skeleton_4 = new FP.Joint('skeleton_4', {
    x: skeleton_3.x - w1 / 2,
    y: skeleton_3.y,
  })
  const skeleton_5 = new FP.Joint('skeleton_5', {
    x: skeleton_4.x,
    y: skeleton_4.y - h2,
  })
  const skeleton = {
    skeleton_0,
    skeleton_1,
    skeleton_2,
    skeleton_3,
    skeleton_4,
    skeleton_5,
  }
  
  glyph.addJoint(skeleton_0)
  glyph.addJoint(skeleton_1)
  glyph.addJoint(skeleton_2)
  glyph.addJoint(skeleton_3)
  glyph.addJoint(skeleton_4)
  glyph.addJoint(skeleton_5)
  glyph.addRefLine(refline(skeleton_1, skeleton_0))
  glyph.addRefLine(refline(skeleton_2, skeleton_1))
  glyph.addRefLine(refline(skeleton_3, skeleton_2))
  glyph.addRefLine(refline(skeleton_4, skeleton_3))
  glyph.addRefLine(refline(skeleton_5, skeleton_4))

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
  const { skeleton_0, skeleton_1, skeleton_2, skeleton_3, skeleton_4, skeleton_5 } = skeleton

  const { out_stroke1_start, out_stroke1_end, in_stroke1_start, in_stroke1_end } = FP.getLineContours('stroke1', { stroke1_start: skeleton_0, stroke1_end: skeleton_1 }, weight)
  const { out_stroke2_curves, out_stroke2_points, in_stroke2_curves, in_stroke2_points } = FP.getCurveContours2(
    'stroke2',
    [
      {
        start: skeleton_1,
        bend: skeleton_2,
        end: skeleton_3,
      },
      {
        start: skeleton_3,
        bend: skeleton_4,
        end: skeleton_5,
      },
    ],
    weight
  )

  const serif_w1 = serifSize * 100
  const serif_h1 = 100
  const serif_h2 = 20
  const serif_c1 = 20
  const serif_c2 = 20
  const stroke1_start_serif_p0 = {
    x: skeleton_0.x - serif_w1 / 2,
    y: skeleton_0.y,
  }
  const stroke1_start_serif_p1 = {
    x: skeleton_0.x + serif_w1 / 2,
    y: skeleton_0.y,
  }
  const stroke1_start_serif_p2 = {
    x: stroke1_start_serif_p0.x,
    y: stroke1_start_serif_p0.y + serif_h2,
  }
  const stroke1_start_serif_p3 = {
    x: stroke1_start_serif_p1.x,
    y: stroke1_start_serif_p1.y + serif_h2,
  }
  const stroke1_start_serif_p4 = FP.getIntersection({
    type: 'line',
    start: stroke1_start_serif_p2,
    end: stroke1_start_serif_p3,
  }, {
    type: 'line',
    start: in_stroke1_start,
    end: in_stroke1_end,
  }).corner
  const stroke1_start_serif_p5 = FP.getIntersection({
    type: 'line',
    start: stroke1_start_serif_p2,
    end: stroke1_start_serif_p3,
  }, {
    type: 'line',
    start: out_stroke1_end,
    end: out_stroke1_start,
  }).corner
  const stroke1_start_serif_p6 = FP.goStraight(in_stroke1_start, stroke1_start_serif_p4, serif_h1)
  const stroke1_start_serif_p7 = FP.goStraight(out_stroke1_start, stroke1_start_serif_p5, serif_h1)
  const stroke1_start_serif_p4_before = FP.getPointOnLine(stroke1_start_serif_p4, stroke1_start_serif_p2, serif_c1)
  const stroke1_start_serif_p4_after = FP.getPointOnLine(stroke1_start_serif_p4, stroke1_start_serif_p6, serif_c2)
  const stroke1_start_serif_p5_before = FP.getPointOnLine(stroke1_start_serif_p5, stroke1_start_serif_p3, serif_c1)
  const stroke1_start_serif_p5_after = FP.getPointOnLine(stroke1_start_serif_p5, stroke1_start_serif_p7, serif_c2)

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
    points: in_stroke2_points,
  })
  const {
    final_curves: in_stroke2_curves_final,
  } = FP.getRadiusPointsOnCurve(in_stroke2_points.slice(0, end_serif_corner_data.corner_index[1] + 1), end_serif_size, true)
  const end_serif_control = FP.getIntersection({
    type: 'line',
    start: end_serif_curves_final[end_serif_curves_final.length - 1].control2,
    end: end_serif_curves_final[end_serif_curves_final.length - 1].end,
  }, {
    type: 'line',
    start: in_stroke2_curves_final[in_stroke2_curves_final.length - 1].end,
    end: in_stroke2_curves_final[in_stroke2_curves_final.length - 1].control2,
  }).corner

  const pen1 = new FP.PenComponent()
  pen1.beginPath()
  if (serifType === 0) {
    pen1.moveTo(in_stroke1_start.x, in_stroke1_start.y)
    pen1.lineTo(in_stroke1_end.x, in_stroke1_end.y)
    pen1.lineTo(out_stroke1_end.x, out_stroke1_end.y)
    pen1.lineTo(out_stroke1_start.x, out_stroke1_start.y)
    pen1.lineTo(in_stroke1_start.x, in_stroke1_start.y)
  } else if (serifType === 1) {
    pen1.moveTo(stroke1_start_serif_p1.x, stroke1_start_serif_p1.y)
    pen1.lineTo(stroke1_start_serif_p0.x, stroke1_start_serif_p0.y)
    pen1.lineTo(stroke1_start_serif_p2.x, stroke1_start_serif_p2.y)
    pen1.bezierTo(
      stroke1_start_serif_p4_before.x, stroke1_start_serif_p4_before.y,
      stroke1_start_serif_p4_after.x, stroke1_start_serif_p4_after.y,
      stroke1_start_serif_p6.x, stroke1_start_serif_p6.y,
    )
    pen1.lineTo(in_stroke1_end.x, in_stroke1_end.y)
    pen1.lineTo(out_stroke1_end.x, out_stroke1_end.y)
    pen1.lineTo(stroke1_start_serif_p7.x, stroke1_start_serif_p7.y)
    pen1.bezierTo(
      stroke1_start_serif_p5_after.x, stroke1_start_serif_p5_after.y,
      stroke1_start_serif_p5_before.x, stroke1_start_serif_p5_before.y,
      stroke1_start_serif_p3.x, stroke1_start_serif_p3.y
    )
    pen1.lineTo(stroke1_start_serif_p1.x, stroke1_start_serif_p1.y)
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
    pen2.moveTo(in_stroke2_curves_final[0].start.x, in_stroke2_curves[0].start.y)
    for (let i = 0; i < in_stroke2_curves_final.length; i++) {
      const curve = in_stroke2_curves_final[i]
      pen2.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
    }
    pen2.quadraticBezierTo(end_serif_control.x, end_serif_control.y, end_serif_curves_final[end_serif_curves_final.length - 1].end.x, end_serif_curves_final[end_serif_curves_final.length - 1].end.y)
    for (let i = end_serif_curves_final.length - 1; i >= 0; i--) {
      const curve = end_serif_curves_final[i]
      pen2.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
    }
    for (let i = out_stroke2_curves.length - 1; i >= 0; i--) {
      const curve = out_stroke2_curves[i]
      pen2.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
    }
    pen2.lineTo(in_stroke2_curves[0].start.x, in_stroke2_curves[0].start.y)
  }
  pen2.closePath()

  return [ pen1, pen2 ]
}

updateGlyphByParams(params, global_params)