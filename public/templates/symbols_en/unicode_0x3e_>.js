// 0x3e >
const params = {
  h1: glyph.getParam('h1'),
  w1: glyph.getParam('w1'),
}
const global_params = {
  weight: glyph.getParam('字重') || 40,
  serifType: glyph.getParam('衬线类型') || 0,
  serifSize: glyph.getParam('衬线大小') || 2.0,
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
const x0 = 500 - capitalHeight * 0.4
const y0 = 500 - 450 * 0.5

const getJointsMap = (data) => {
  const { draggingJoint, deltaX, deltaY } = data
  const jointsMap = Object.assign({}, glyph.tempData)
  switch (draggingJoint.name) {
    case 'skeleton_1': {
      jointsMap['skeleton_1'] = {
        x: glyph.tempData['skeleton_1'].x + deltaX,
        y: glyph.tempData['skeleton_1'].y,
      }
      break
    }
    case 'skeleton_2': {
      jointsMap['skeleton_1'] = {
        x: glyph.tempData['skeleton_1'].x,
        y: glyph.tempData['skeleton_1'].y + deltaY / 2,
      }
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
  const { skeleton_0, skeleton_1, skeleton_2, skeleton_3 } = jointsMap
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
    y: skeleton_0.y + h1 / 2,
  })
  const skeleton_2 = new FP.Joint('skeleton_2', {
    x: skeleton_1.x - w1,
    y: skeleton_1.y + h1 / 2,
  })
  const skeleton = {
    skeleton_0,
    skeleton_1,
    skeleton_2,
  }
  
  glyph.addJoint(skeleton_0)
  glyph.addJoint(skeleton_1)
  glyph.addJoint(skeleton_2)
  glyph.addRefLine(refline(skeleton_1, skeleton_0))
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
  const { weight, serifType, serifSize, r1, penStyle, penPressureRate } = global_params

  // 根据骨架计算轮廓关键点
  const { skeleton_0, skeleton_1, skeleton_2 } = skeleton
  const options = penStyle === 1 ? {
    weightsVariation: 'bezier',
    weightsVariationFnType: penStyle === 1 ? 'multiBezier1' : 'bezier',
    weightsVariationSpeed: penPressureRate,
  } : {}
  const { out_stroke1_start, out_stroke1_end, in_stroke1_start, in_stroke1_end } = FP.getLineContours('stroke1', { stroke1_start: skeleton_1, stroke1_end: skeleton_0 }, weight)
  const { out_stroke1_curves, out_stroke1_points, in_stroke1_curves, in_stroke1_points } = FP.getCurveContours2(
    'stroke1',
    [
      {
        start: skeleton_1,
        end: skeleton_0,
      },
    ],
    weight,
    options,
  )
  const { out_stroke2_start, out_stroke2_end, in_stroke2_start, in_stroke2_end } = FP.getLineContours('stroke2', { stroke2_start: skeleton_1, stroke2_end: skeleton_2 }, weight)
  const { out_stroke2_curves, out_stroke2_points, in_stroke2_curves, in_stroke2_points } = FP.getCurveContours2(
    'stroke2',
    [
      {
        start: skeleton_1,
        end: skeleton_2,
      },
    ],
    weight,
    options,
  )
  const refline_start = {
    x: skeleton_1.x,
    y: skeleton_1.y - 200,
  }
  const refline_end = {
    x: skeleton_1.x,
    y: skeleton_1.y + 200,
  }
  const out_corner_top = FP.getIntersection(
    { type: 'line', start: refline_start, end: refline_end },
    { type: 'line', start: in_stroke1_start, end: in_stroke1_end },
  ).corner
  const out_corner_bottom = FP.getIntersection(
    { type: 'line', start: refline_start, end: refline_end },
    { type: 'line', start: out_stroke2_start, end: out_stroke2_end },
  ).corner

  const pen1 = new FP.PenComponent()
  if (penStyle === 0) {
    pen1.beginPath()
    pen1.moveTo(out_corner_top.x, out_corner_top.y)
    pen1.lineTo(skeleton_1.x, skeleton_1.y)
    pen1.lineTo(out_stroke1_start.x, out_stroke1_start.y)
    pen1.lineTo(out_stroke1_end.x, out_stroke1_end.y)
    pen1.lineTo(in_stroke1_end.x, in_stroke1_end.y)
    pen1.lineTo(out_corner_top.x, out_corner_top.y)
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
    pen2.moveTo(out_corner_bottom.x, out_corner_bottom.y)
    pen2.lineTo(out_stroke2_end.x, out_stroke2_end.y)
    pen2.lineTo(in_stroke2_end.x, in_stroke2_end.y)
    pen2.lineTo(in_stroke2_start.x, in_stroke2_start.y)
    pen2.lineTo(skeleton_1.x, skeleton_1.y)
    pen2.lineTo(out_corner_bottom.x, out_corner_bottom.y)
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
  return [ pen1, pen2 ]
}

updateGlyphByParams(params, global_params)