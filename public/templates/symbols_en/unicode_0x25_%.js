// 0x25 %
const params = {
  h1: glyph.getParam('h1'),
  h2: glyph.getParam('h2'),
  w1: glyph.getParam('w1'),
  w2: glyph.getParam('w2'),
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
  switch (draggingJoint.name) {
    case 'skeleton_0': {
      jointsMap['skeleton_0'] = {
        x: glyph.tempData['skeleton_0'].x + deltaX,
        y: glyph.tempData['skeleton_0'].y + deltaY,
      }
      jointsMap['skeleton_1'] = {
        x: glyph.tempData['skeleton_1'].x - deltaX,
        y: glyph.tempData['skeleton_1'].y - deltaY,
      }
      break
    }
    case 'skeleton_1': {
      jointsMap['skeleton_0'] = {
        x: glyph.tempData['skeleton_0'].x - deltaX,
        y: glyph.tempData['skeleton_0'].y - deltaY,
      }
      jointsMap['skeleton_1'] = {
        x: glyph.tempData['skeleton_1'].x + deltaX,
        y: glyph.tempData['skeleton_1'].y + deltaY,
      }
      break
    }
    case 'skeleton_2': {
      jointsMap['skeleton_2'] = {
        x: glyph.tempData['skeleton_2'].x + deltaX,
        y: glyph.tempData['skeleton_2'].y + deltaY,
      }
      jointsMap['skeleton_3'] = {
        x: glyph.tempData['skeleton_3'].x - deltaX,
        y: glyph.tempData['skeleton_3'].y - deltaY,
      }
      break
    }
    case 'skeleton_3': {
      jointsMap['skeleton_2'] = {
        x: glyph.tempData['skeleton_2'].x - deltaX,
        y: glyph.tempData['skeleton_2'].y - deltaY,
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
  glyph.setParam('h2', _params.h2)
  glyph.setParam('w1', _params.w1)
  glyph.setParam('w2', _params.w2)
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
  const { skeleton_0, skeleton_1, skeleton_2, skeleton_3 } = jointsMap
  const h1_range = glyph.getParamRange('h1')
  const h2_range = glyph.getParamRange('h2')
  const w1_range = glyph.getParamRange('w1')
  const w2_range = glyph.getParamRange('w2')
  const h1 = range((skeleton_1.y - skeleton_0.y) / 2, h1_range)
  const h2 = range(skeleton_1.y - skeleton_2.y, h2_range)
  const w1 = range((skeleton_0.x - skeleton_1.x) / 2, w1_range)
  const w2 = range(skeleton_2.x - skeleton_1.x, w2_range)
  return {
    h1,
    h2,
    w1,
    w2,
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
    x: x0 + w1,
    y: y0 - h1,
  })
  const skeleton_1 = new FP.Joint('skeleton_1', {
    x: x0 - w1,
    y: y0 + h1,
  })
  const skeleton_2 = new FP.Joint('skeleton_2', {
    x: skeleton_1.x + w2,
    y: skeleton_1.y - h2,
  })
  const skeleton_3 = new FP.Joint('skeleton_3', {
    x: skeleton_0.x - w2,
    y: skeleton_0.y + h2,
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
  const { weight, serifType, serifSize, r1, penStyle, penPressureRate } = global_params
  const options = penStyle === 1 ? {
    weightsVariation: 'bezier',
    weightsVariationFnType: penStyle === 1 ? 'multiBezier1' : 'bezier',
    weightsVariationSpeed: penPressureRate,
  } : {}
  // 根据骨架计算轮廓关键点
  const { skeleton_0, skeleton_1, skeleton_2, skeleton_3 } = skeleton

  // out指上侧（外侧）轮廓线
  // in指下侧（内侧）轮廓线
  const stroke2_beziers_inner = FP.getCircle(skeleton_2, r1)
  const stroke2_beziers_outer = FP.getCircle(skeleton_2, r1 + weight)
  const stroke3_beziers_inner = FP.getCircle(skeleton_3, r1)
  const stroke3_beziers_outer = FP.getCircle(skeleton_3, r1 + weight)
  const { out_stroke1_start, out_stroke1_end, in_stroke1_start, in_stroke1_end } = FP.getLineContours('stroke1', { stroke1_start: skeleton_0, stroke1_end: skeleton_1 }, weight)
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
  pen2.beginPath()
  pen2.moveTo(stroke2_beziers_outer[0].start.x, stroke2_beziers_outer[0].start.y)
  for (let i = 0; i < stroke2_beziers_outer.length; i++) {
    const curve = stroke2_beziers_outer[i]
    pen2.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }
  pen2.closePath()

  const pen3 = new FP.PenComponent()
  pen3.beginPath()
  pen3.moveTo(stroke2_beziers_inner[stroke2_beziers_inner.length - 1].end.x, stroke2_beziers_inner[stroke2_beziers_inner.length - 1].end.y)
  for (let i = stroke2_beziers_inner.length - 1; i >= 0; i--) {
    const curve = stroke2_beziers_inner[i]
    pen3.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }
  pen3.closePath()

  const pen4 = new FP.PenComponent()
  pen4.beginPath()
  pen4.moveTo(stroke3_beziers_outer[0].start.x, stroke3_beziers_outer[0].start.y)
  for (let i = 0; i < stroke3_beziers_outer.length; i++) {
    const curve = stroke3_beziers_outer[i]
    pen4.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }
  pen4.closePath()

  const pen5 = new FP.PenComponent()
  pen5.beginPath()
  pen5.moveTo(stroke3_beziers_inner[stroke3_beziers_inner.length - 1].end.x, stroke3_beziers_inner[stroke3_beziers_inner.length - 1].end.y)
  for (let i = stroke3_beziers_inner.length - 1; i >= 0; i--) {
    const curve = stroke3_beziers_inner[i]
    pen5.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }
  pen5.closePath()

  return [ pen1, pen2, pen3, pen4, pen5 ]
}

updateGlyphByParams(params, global_params)