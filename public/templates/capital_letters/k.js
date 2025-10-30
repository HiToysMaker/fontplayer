const params = {
  h1: glyph.getParam('h1'),
  h2: glyph.getParam('h2'),
  h3: glyph.getParam('h3'),
  h4: glyph.getParam('h4'),
  w1: glyph.getParam('w1'),
  w2: glyph.getParam('w2'),
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
        x: glyph.tempData['skeleton_1'].x,
        y: glyph.tempData['skeleton_1'].y + deltaY,
      }
      jointsMap['skeleton_5'] = {
        x: glyph.tempData['skeleton_5'].x,
        y: glyph.tempData['skeleton_5'].y + deltaY,
      }
      break
    }
    case 'skeleton_2': {
      jointsMap['skeleton_2'] = {
        x: glyph.tempData['skeleton_2'].x + deltaX,
        y: glyph.tempData['skeleton_2'].y + deltaY,
      }
      jointsMap['skeleton_5'] = {
        x: glyph.tempData['skeleton_5'].x + deltaX,
        y: glyph.tempData['skeleton_5'].y,
      }
      break
    }
    case 'skeleton_3': {
      jointsMap['skeleton_3'] = {
        x: glyph.tempData['skeleton_3'].x,
        y: glyph.tempData['skeleton_3'].y + deltaY,
      }
      jointsMap['skeleton_4'] = {
        x: glyph.tempData['skeleton_4'].x,
        y: glyph.tempData['skeleton_4'].y + deltaY,
      }
      break
    }
    case 'skeleton_5': {
      jointsMap['skeleton_1'] = {
        x: glyph.tempData['skeleton_1'].x,
        y: glyph.tempData['skeleton_1'].y + deltaY,
      }
      jointsMap['skeleton_2'] = {
        x: glyph.tempData['skeleton_2'].x + deltaX,
        y: glyph.tempData['skeleton_2'].y,
      }
      jointsMap['skeleton_5'] = {
        x: glyph.tempData['skeleton_5'].x + deltaX,
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
  glyph.setParam('h4', _params.h4)
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
  const { skeleton_0, skeleton_1, skeleton_2, skeleton_3, skeleton_4, skeleton_5 } = jointsMap
  const h1_range = glyph.getParamRange('h1')
  const h2_range = glyph.getParamRange('h2')
  const h3_range = glyph.getParamRange('h3')
  const h4_range = glyph.getParamRange('h4')
  const w1_range = glyph.getParamRange('w1')
  const w2_range = glyph.getParamRange('w2')
  const h1 = range(skeleton_1.y - skeleton_0.y, h1_range)
  const h2 = range(skeleton_2.y - skeleton_0.y, h2_range)
  const h3 = range(skeleton_3.y - skeleton_0.y, h3_range)
  const h4 = range(skeleton_5.y - skeleton_4.y, h4_range)
  const w1 = range(skeleton_2.x - skeleton_0.x, w1_range)
  const w2 = range(FP.distance(skeleton_3, skeleton_4), w2_range)
  return {
    h1,
    h2,
    h3,
    h4,
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
  const { h1, h2, h3, h4, w1, w2 } = params
  const { weight } = global_params

  const skeleton_0 = new FP.Joint('skeleton_0', {
    x: x0,
    y: y0,
  })
  const skeleton_1 = new FP.Joint('skeleton_1', {
    x: skeleton_0.x,
    y: skeleton_0.y + h1,
  })
  const skeleton_2 = new FP.Joint('skeleton_2', {
    x: skeleton_0.x + w1,
    y: skeleton_0.y + h2,
  })
  const skeleton_3 = new FP.Joint('skeleton_3', {
    x: skeleton_0.x,
    y: skeleton_0.y + h3,
  })
  const skeleton_5 = new FP.Joint('skeleton_5', {
    x: skeleton_0.x + w1,
    y: skeleton_1.y,
  })
  const skeleton_4_coords = FP.getPointOnLine(skeleton_3, skeleton_2, w2)
  const skeleton_4 = new FP.Joint('skeleton_4', {
    x: skeleton_4_coords.x,
    y: skeleton_4_coords.y,
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
  glyph.addRefLine(refline(skeleton_2, skeleton_3))
  glyph.addRefLine(refline(skeleton_4, skeleton_5))

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

  // out指上侧（外侧）轮廓线
  // in指下侧（内侧）轮廓线
  const { out_stroke1_start, out_stroke1_end, in_stroke1_start, in_stroke1_end } = FP.getLineContours('stroke1', { stroke1_start: skeleton_0, stroke1_end: skeleton_1 }, weight)
  const { out_stroke2_start, out_stroke2_end, in_stroke2_start, in_stroke2_end } = FP.getLineContours('stroke2', { stroke2_start: skeleton_2, stroke2_end: skeleton_3 }, weight)
  const { out_stroke3_start, out_stroke3_end, in_stroke3_start, in_stroke3_end } = FP.getLineContours('stroke3', { stroke3_start: skeleton_4, stroke3_end: skeleton_5 }, weight)

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
    start: in_stroke1_end,
    end: in_stroke1_start,
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

  const stroke2_start_serif_p0 = {
    x: skeleton_2.x - serif_w1 / 2,
    y: skeleton_2.y,
  }
  const stroke2_start_serif_p1 = {
    x: skeleton_2.x + serif_w1 * 0.35,
    y: skeleton_2.y,
  }
  const stroke2_start_serif_p2 = {
    x: stroke2_start_serif_p0.x,
    y: stroke2_start_serif_p0.y + serif_h2,
  }
  const stroke2_start_serif_p3 = {
    x: stroke2_start_serif_p1.x,
    y: stroke2_start_serif_p1.y + serif_h2,
  }
  const stroke2_start_serif_p4 = FP.getIntersection({
    type: 'line',
    start: stroke2_start_serif_p2,
    end: stroke2_start_serif_p3,
  }, {
    type: 'line',
    start: in_stroke2_end,
    end: in_stroke2_start,
  }).corner
  const stroke2_start_serif_p5 = FP.getIntersection({
    type: 'line',
    start: stroke2_start_serif_p2,
    end: stroke2_start_serif_p3,
  }, {
    type: 'line',
    start: out_stroke2_end,
    end: out_stroke2_start,
  }).corner
  const stroke2_start_serif_p6 = FP.goStraight(in_stroke2_start, stroke2_start_serif_p4, serif_h1)
  const stroke2_start_serif_p7 = FP.goStraight(out_stroke2_start, stroke2_start_serif_p5, serif_h1)
  const stroke2_start_serif_p4_before = FP.getPointOnLine(stroke2_start_serif_p4, stroke2_start_serif_p2, serif_c1)
  const stroke2_start_serif_p4_after = FP.getPointOnLine(stroke2_start_serif_p4, stroke2_start_serif_p6, serif_c2)
  const stroke2_start_serif_p5_before = FP.getPointOnLine(stroke2_start_serif_p5, stroke2_start_serif_p3, serif_c1)
  const stroke2_start_serif_p5_after = FP.getPointOnLine(stroke2_start_serif_p5, stroke2_start_serif_p7, serif_c2)

  const stroke3_end_serif_p0 = {
    x: skeleton_5.x - serif_w1 / 2,
    y: skeleton_5.y,
  }
  const stroke3_end_serif_p1 = {
    x: skeleton_5.x + serif_w1 / 2,
    y: skeleton_5.y,
  }
  const stroke3_end_serif_p2 = {
    x: stroke3_end_serif_p0.x,
    y: stroke3_end_serif_p0.y - serif_h2,
  }
  const stroke3_end_serif_p3 = {
    x: stroke3_end_serif_p1.x,
    y: stroke3_end_serif_p1.y - serif_h2,
  }
  const stroke3_end_serif_p4 = FP.getIntersection({
    type: 'line',
    start: stroke3_end_serif_p2,
    end: stroke3_end_serif_p3,
  }, {
    type: 'line',
    start: in_stroke3_end,
    end: in_stroke3_start,
  }).corner
  const stroke3_end_serif_p5 = FP.getIntersection({
    type: 'line',
    start: stroke3_end_serif_p2,
    end: stroke3_end_serif_p3,
  }, {
    type: 'line',
    start: out_stroke3_end,
    end: out_stroke3_start,
  }).corner
  const stroke3_end_serif_p6 = FP.goStraight(in_stroke3_end, stroke3_end_serif_p4, serif_h1)
  const stroke3_end_serif_p7 = FP.goStraight(out_stroke3_end, stroke3_end_serif_p5, serif_h1)
  const stroke3_end_serif_p4_before = FP.getPointOnLine(stroke3_end_serif_p4, stroke3_end_serif_p2, serif_c1)
  const stroke3_end_serif_p4_after = FP.getPointOnLine(stroke3_end_serif_p4, stroke3_end_serif_p6, serif_c2)
  const stroke3_end_serif_p5_before = FP.getPointOnLine(stroke3_end_serif_p5, stroke3_end_serif_p3, serif_c1)
  const stroke3_end_serif_p5_after = FP.getPointOnLine(stroke3_end_serif_p5, stroke3_end_serif_p7, serif_c2)

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
    pen2.moveTo(in_stroke2_start.x, in_stroke2_start.y)
    pen2.lineTo(in_stroke2_end.x, in_stroke2_end.y)
    pen2.lineTo(out_stroke2_end.x, out_stroke2_end.y)
    pen2.lineTo(out_stroke2_start.x, out_stroke2_start.y)
    pen2.lineTo(in_stroke2_start.x, in_stroke2_start.y)
  } else if (serifType === 1) {
    pen2.moveTo(stroke2_start_serif_p1.x, stroke2_start_serif_p1.y)
    pen2.lineTo(stroke2_start_serif_p0.x, stroke2_start_serif_p0.y)
    pen2.lineTo(stroke2_start_serif_p2.x, stroke2_start_serif_p2.y)
    pen2.bezierTo(
      stroke2_start_serif_p4_before.x, stroke2_start_serif_p4_before.y,
      stroke2_start_serif_p4_after.x, stroke2_start_serif_p4_after.y,
      stroke2_start_serif_p6.x, stroke2_start_serif_p6.y,
    )
    pen2.lineTo(in_stroke2_end.x, in_stroke2_end.y)
    pen2.lineTo(out_stroke2_end.x, out_stroke2_end.y)
    pen2.lineTo(stroke2_start_serif_p7.x, stroke2_start_serif_p7.y)
    pen2.bezierTo(
      stroke2_start_serif_p5_after.x, stroke2_start_serif_p5_after.y,
      stroke2_start_serif_p5_before.x, stroke2_start_serif_p5_before.y,
      stroke2_start_serif_p3.x, stroke2_start_serif_p3.y
    )
    pen2.lineTo(stroke2_start_serif_p1.x, stroke2_start_serif_p1.y)
  }
  pen2.closePath()

  const pen3 = new FP.PenComponent()
  pen3.beginPath()
  if (serifType === 0) {
    pen3.moveTo(in_stroke3_start.x, in_stroke3_start.y)
    pen3.lineTo(in_stroke3_end.x, in_stroke3_end.y)
    pen3.lineTo(out_stroke3_end.x, out_stroke3_end.y)
    pen3.lineTo(out_stroke3_start.x, out_stroke3_start.y)
    pen3.lineTo(in_stroke3_start.x, in_stroke3_start.y)
  } else if (serifType === 1) {
    pen3.moveTo(in_stroke3_start.x, in_stroke3_start.y)
    pen3.lineTo(stroke3_end_serif_p6.x, stroke3_end_serif_p6.y)
    pen3.bezierTo(
      stroke3_end_serif_p4_after.x, stroke3_end_serif_p4_after.y,
      stroke3_end_serif_p4_before.x, stroke3_end_serif_p4_before.y,
      stroke3_end_serif_p2.x, stroke3_end_serif_p2.y,
    )
    pen3.lineTo(stroke3_end_serif_p0.x, stroke3_end_serif_p0.y)
    pen3.lineTo(stroke3_end_serif_p1.x, stroke3_end_serif_p1.y)
    pen3.lineTo(stroke3_end_serif_p3.x, stroke3_end_serif_p3.y)
    pen3.bezierTo(
      stroke3_end_serif_p5_before.x, stroke3_end_serif_p5_before.y,
      stroke3_end_serif_p5_after.x, stroke3_end_serif_p5_after.y,
      stroke3_end_serif_p7.x, stroke3_end_serif_p7.y,
    )
    pen3.lineTo(out_stroke3_start.x, out_stroke3_start.y)
    pen3.lineTo(in_stroke3_start.x, in_stroke3_start.y)
  }
  pen3.closePath()

  // const pen1 = new FP.PenComponent()
  // pen1.beginPath()
  // pen1.moveTo(out_stroke1_start.x, out_stroke1_start.y)
  // pen1.lineTo(out_stroke1_end.x, out_stroke1_end.y)
  // pen1.lineTo(in_stroke1_end.x, in_stroke1_end.y)
  // pen1.lineTo(in_stroke1_start.x, in_stroke1_start.y)
  // pen1.lineTo(out_stroke1_start.x, out_stroke1_start.y)
  // pen1.closePath()

  // const pen2 = new FP.PenComponent()
  // pen2.beginPath()
  // pen2.moveTo(out_stroke2_start.x, out_stroke2_start.y)
  // pen2.lineTo(out_stroke2_end.x, out_stroke2_end.y)
  // pen2.lineTo(in_stroke2_end.x, in_stroke2_end.y)
  // pen2.lineTo(in_stroke2_start.x, in_stroke2_start.y)
  // pen2.lineTo(out_stroke2_start.x, out_stroke2_start.y)
  // pen2.closePath()

  // const pen3 = new FP.PenComponent()
  // pen3.beginPath()
  // pen3.moveTo(out_stroke3_start.x, out_stroke3_start.y)
  // pen3.lineTo(out_stroke3_end.x, out_stroke3_end.y)
  // pen3.lineTo(in_stroke3_end.x, in_stroke3_end.y)
  // pen3.lineTo(in_stroke3_start.x, in_stroke3_start.y)
  // pen3.lineTo(out_stroke3_start.x, out_stroke3_start.y)
  // pen3.closePath()

  return [ pen1, pen2, pen3 ]
}

updateGlyphByParams(params, global_params)