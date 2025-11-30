// 0x2a *
const params = {
}
const global_params = {
  weight: glyph.getParam('字重') || 40,
  serifType: glyph.getParam('衬线类型') || 0,
  serifSize: glyph.getParam('衬线大小') || 2.0,
  r1: glyph.getParam('r1'),
  penStyle: glyph.getParam('运笔样式') || 0,
  penPressureRate: glyph.getParam('运笔压力速率') || 1.0,
}
const ascender = 800
const descender = -200
const width = 360
const xHeight = 500
const capitalHeight = 750
const ox = 500
const oy = 500
const x0 = 500
const y0 = 500

const getJointsMap = (data) => {
  const { draggingJoint, deltaX, deltaY } = data
  const jointsMap = Object.assign({}, glyph.tempData)
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
  const { skeleton_0 } = jointsMap
  return {
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
  const { weight, r1 } = global_params

  const skeleton_0 = new FP.Joint('skeleton_0', {
    x: x0,
    y: y0,
  })
  const skeleton_1 = new FP.Joint('skeleton_1', {
    x: x0,
    y: y0 - r1,
  })
  const p2 = FP.turnAngleFromStart(skeleton_0, skeleton_1, FP.degreeToRadius(360 / 5), r1)
  const p3 = FP.turnAngleFromStart(skeleton_0, p2, FP.degreeToRadius(360 / 5), r1)
  const p4 = FP.turnAngleFromStart(skeleton_0, p3, FP.degreeToRadius(360 / 5), r1)
  const p5 = FP.turnAngleFromStart(skeleton_0, p4, FP.degreeToRadius(360 / 5), r1)

  const skeleton_2 = new FP.Joint('skeleton_2', {
    x: p2.x,
    y: p2.y,
  })
  const skeleton_3 = new FP.Joint('skeleton_3', {
    x: p3.x,
    y: p3.y,
  })
  const skeleton_4 = new FP.Joint('skeleton_4', {
    x: p4.x,
    y: p4.y,
  })
  const skeleton_5 = new FP.Joint('skeleton_5', {
    x: p5.x,
    y: p5.y,
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
  glyph.addRefLine(refline(skeleton_0, skeleton_1))
  glyph.addRefLine(refline(skeleton_0, skeleton_2))
  glyph.addRefLine(refline(skeleton_0, skeleton_3))
  glyph.addRefLine(refline(skeleton_0, skeleton_4))
  glyph.addRefLine(refline(skeleton_0, skeleton_5))

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
  const { weight, serifType, serifSize, r1, penStyle, penPressureRate } = global_params

  // 根据骨架计算轮廓关键点
  const { skeleton_0, skeleton_1, skeleton_2, skeleton_3, skeleton_4, skeleton_5 } = skeleton

  const { out_stroke1_start, out_stroke1_end, in_stroke1_start, in_stroke1_end } = FP.getLineContours('stroke1', { stroke1_start: skeleton_0, stroke1_end: skeleton_1 }, weight)
  const { out_stroke2_start, out_stroke2_end, in_stroke2_start, in_stroke2_end } = FP.getLineContours('stroke2', { stroke2_start: skeleton_0, stroke2_end: skeleton_2 }, weight)
  const { out_stroke3_start, out_stroke3_end, in_stroke3_start, in_stroke3_end } = FP.getLineContours('stroke3', { stroke3_start: skeleton_0, stroke3_end: skeleton_3 }, weight)
  const { out_stroke4_start, out_stroke4_end, in_stroke4_start, in_stroke4_end } = FP.getLineContours('stroke4', { stroke4_start: skeleton_0, stroke4_end: skeleton_4 }, weight)
  const { out_stroke5_start, out_stroke5_end, in_stroke5_start, in_stroke5_end } = FP.getLineContours('stroke5', { stroke5_start: skeleton_0, stroke5_end: skeleton_5 }, weight)
  const options = penStyle === 1 ? {
    weightsVariation: 'bezier',
    weightsVariationFnType: penStyle === 1 ? 'multiBezier1' : 'bezier',
    weightsVariationSpeed: penPressureRate,
  } : {}

  const { out_stroke1_curves, out_stroke1_points, in_stroke1_curves, in_stroke1_points } = FP.getCurveContours2(
    'stroke1',
    [
      {
        start: skeleton_0,
        end: skeleton_1,
      },
    ],
    weight,
    options,
  )

  const { out_stroke2_curves, out_stroke2_points, in_stroke2_curves, in_stroke2_points } = FP.getCurveContours2(
    'stroke2',
    [
      {
        start: skeleton_0,
        end: skeleton_2,
      },
    ],
    weight,
    options,
  )

  const { out_stroke3_curves, out_stroke3_points, in_stroke3_curves, in_stroke3_points } = FP.getCurveContours2(
    'stroke3',
    [
      {
        start: skeleton_0,
        end: skeleton_3,
      },
    ],
    weight,
    options,
  )

  const { out_stroke4_curves, out_stroke4_points, in_stroke4_curves, in_stroke4_points } = FP.getCurveContours2(
    'stroke4',
    [
      {
        start: skeleton_0,
        end: skeleton_4,
      },
    ],
    weight,
    options,
  )

  const { out_stroke5_curves, out_stroke5_points, in_stroke5_curves, in_stroke5_points } = FP.getCurveContours2(
    'stroke5',
    [
      {
        start: skeleton_0,
        end: skeleton_5,
      },
    ],
    weight,
    options,
  )

  const pen1 = new FP.PenComponent()
  if (penStyle === 0) {
    pen1.beginPath()
    pen1.moveTo(in_stroke1_start.x, in_stroke1_start.y)
    pen1.lineTo(in_stroke1_end.x, in_stroke1_end.y)
    pen1.lineTo(out_stroke1_end.x, out_stroke1_end.y)
    pen1.lineTo(out_stroke1_start.x, out_stroke1_start.y)
    pen1.lineTo(in_stroke1_start.x, in_stroke1_start.y)
    pen1.closePath()
  } else if (penStyle === 1) {
    pen1.beginPath()
    pen1.moveTo(in_stroke1_curves[0].start.x, in_stroke1_curves[0].start.y)
    for (let i = 0; i < in_stroke1_curves.length; i++) {
      const curve = in_stroke1_curves[i]
      pen1.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
    }
    pen1.lineTo(out_stroke1_curves[out_stroke1_curves.length - 1].end.x, out_stroke1_curves[out_stroke1_curves.length - 1].end.y)
    for (let i = out_stroke1_curves.length - 1; i >= 0; i--) {
      const curve = out_stroke1_curves[i]
      pen1.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
    }
    pen1.lineTo(in_stroke1_curves[0].start.x, in_stroke1_curves[0].start.y)
    pen1.closePath()
  }

  const pen2 = new FP.PenComponent()
  if (penStyle === 0) {
    pen2.beginPath()
    pen2.moveTo(in_stroke2_start.x, in_stroke2_start.y)
    pen2.lineTo(in_stroke2_end.x, in_stroke2_end.y)
    pen2.lineTo(out_stroke2_end.x, out_stroke2_end.y)
    pen2.lineTo(out_stroke2_start.x, out_stroke2_start.y)
    pen2.lineTo(in_stroke2_start.x, in_stroke2_start.y)
    pen2.closePath()
  } else if (penStyle === 1) {
    pen2.beginPath()
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
    pen2.closePath()
  }

  const pen3 = new FP.PenComponent()
  if (penStyle === 0) {
    pen3.beginPath()
    pen3.moveTo(in_stroke3_start.x, in_stroke3_start.y)
    pen3.lineTo(in_stroke3_end.x, in_stroke3_end.y)
    pen3.lineTo(out_stroke3_end.x, out_stroke3_end.y)
    pen3.lineTo(out_stroke3_start.x, out_stroke3_start.y)
    pen3.lineTo(in_stroke3_start.x, in_stroke3_start.y)
    pen3.closePath()
  } else if (penStyle === 1) {
    pen3.beginPath()
    pen3.moveTo(in_stroke3_curves[0].start.x, in_stroke3_curves[0].start.y)
    for (let i = 0; i < in_stroke3_curves.length; i++) {
      const curve = in_stroke3_curves[i]
      pen3.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
    }
    pen3.lineTo(out_stroke3_curves[out_stroke3_curves.length - 1].end.x, out_stroke3_curves[out_stroke3_curves.length - 1].end.y)
    for (let i = out_stroke3_curves.length - 1; i >= 0; i--) {
      const curve = out_stroke3_curves[i]
      pen3.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
    }
    pen3.lineTo(in_stroke3_curves[0].start.x, in_stroke3_curves[0].start.y)
    pen3.closePath()
  }

  const pen4 = new FP.PenComponent()
  if (penStyle === 0) {
    pen4.beginPath()
    pen4.moveTo(in_stroke4_start.x, in_stroke4_start.y)
    pen4.lineTo(in_stroke4_end.x, in_stroke4_end.y)
    pen4.lineTo(out_stroke4_end.x, out_stroke4_end.y)
    pen4.lineTo(out_stroke4_start.x, out_stroke4_start.y)
    pen4.lineTo(in_stroke4_start.x, in_stroke4_start.y)
    pen4.closePath()
  } else if (penStyle === 1) {
    pen4.beginPath()
    pen4.moveTo(in_stroke4_curves[0].start.x, in_stroke4_curves[0].start.y)
    for (let i = 0; i < in_stroke4_curves.length; i++) {
      const curve = in_stroke4_curves[i]
      pen4.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
    }
    pen4.lineTo(out_stroke4_curves[out_stroke4_curves.length - 1].end.x, out_stroke4_curves[out_stroke4_curves.length - 1].end.y)
    for (let i = out_stroke4_curves.length - 1; i >= 0; i--) {
      const curve = out_stroke4_curves[i]
      pen4.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
    }
    pen4.lineTo(in_stroke4_curves[0].start.x, in_stroke4_curves[0].start.y)
    pen4.closePath()
  }

  const pen5 = new FP.PenComponent()
  if (penStyle === 0) {
    pen5.beginPath()
    pen5.moveTo(in_stroke5_start.x, in_stroke5_start.y)
    pen5.lineTo(in_stroke5_end.x, in_stroke5_end.y)
    pen5.lineTo(out_stroke5_end.x, out_stroke5_end.y)
    pen5.lineTo(out_stroke5_start.x, out_stroke5_start.y)
    pen5.lineTo(in_stroke5_start.x, in_stroke5_start.y)
    pen5.closePath()
  } else if (penStyle === 1) {
    pen5.beginPath()
    pen5.moveTo(in_stroke5_curves[0].start.x, in_stroke5_curves[0].start.y)
    for (let i = 0; i < in_stroke5_curves.length; i++) {
      const curve = in_stroke5_curves[i]
      pen5.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
    }
    pen5.lineTo(out_stroke5_curves[out_stroke5_curves.length - 1].end.x, out_stroke5_curves[out_stroke5_curves.length - 1].end.y)
    for (let i = out_stroke5_curves.length - 1; i >= 0; i--) {
      const curve = out_stroke5_curves[i]
      pen5.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
    }
    pen5.lineTo(in_stroke5_curves[0].start.x, in_stroke5_curves[0].start.y)
    pen5.closePath()
  }

  return [ pen1, pen2, pen3, pen4, pen5 ]
}

updateGlyphByParams(params, global_params)