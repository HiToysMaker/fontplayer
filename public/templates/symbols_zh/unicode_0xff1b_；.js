// 0xff1b ；
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
  r1: glyph.getParam('r1'),
}
const ascender = 800
const descender = -200
const width = 360
const xHeight = 500
const capitalHeight = 750
const ox = 500
const oy = 500
const x0 = 500
const y0 = 500 - 286 * 0.5

const getJointsMap = (data) => {
  const { draggingJoint, deltaX, deltaY } = data
  const jointsMap = Object.assign({}, glyph.tempData)
  switch (draggingJoint.name) {
    case 'skeleton_1': {
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
      break
    }
    case 'skeleton_3': {
      jointsMap['skeleton_3'] = {
        x: glyph.tempData['skeleton_3'].x,
        y: glyph.tempData['skeleton_3'].y + deltaY,
      }
      break
    }
    case 'skeleton_4': {
      jointsMap['skeleton_4'] = {
        x: glyph.tempData['skeleton_4'].x + deltaX,
        y: glyph.tempData['skeleton_4'].y + deltaY,
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
  const { skeleton_0, skeleton_1, skeleton_2, skeleton_3 } = jointsMap
  const h1_range = glyph.getParamRange('h1')
  const h2_range = glyph.getParamRange('h2')
  const h3_range = glyph.getParamRange('h3')
  const w1_range = glyph.getParamRange('w1')
  const h1 = range(skeleton_1.y - skeleton_0.y, h1_range)
  const h2 = range(skeleton_4.y - skeleton_1.y, h2_range)
  const h3 = range(skeleton_3.y - skeleton_2.y, h3_range)
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
  const { weight, r1 } = global_params
  const { h1, h2, h3, w1 } = params

  const skeleton_0 = new FP.Joint('skeleton_0', {
    x: x0,
    y: y0,
  })
  const skeleton_1 = new FP.Joint('skeleton_1', {
    x: x0,
    y: y0 + h1,
  })
  const skeleton_2 = new FP.Joint('skeleton_2', {
    x: x0 + r1,
    y: y0 + h1,
  })
  const skeleton_3 = new FP.Joint('skeleton_3', {
    x: skeleton_2.x,
    y: skeleton_2.y + h3,
  })
  const skeleton_4 = new FP.Joint('skeleton_4', {
    x: skeleton_3.x - w1,
    y: skeleton_2.y + h2,
  })
  const skeleton = {
    skeleton_0,
    skeleton_1,
    skeleton_2,
    skeleton_3,
    skeleton_4,
  }
  
  glyph.addJoint(skeleton_0)
  glyph.addJoint(skeleton_1)
  glyph.addJoint(skeleton_2)
  glyph.addJoint(skeleton_3)
  glyph.addJoint(skeleton_4)
  glyph.addRefLine(refline(skeleton_0, skeleton_1))
  glyph.addRefLine(refline(skeleton_1, skeleton_2))
  glyph.addRefLine(refline(skeleton_2, skeleton_3))
  glyph.addRefLine(refline(skeleton_3, skeleton_4))

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
  const { weight, serifType, serifSize, r1 } = global_params

  // 根据骨架计算轮廓关键点
  const { skeleton_0, skeleton_1, skeleton_2, skeleton_3, skeleton_4 } = skeleton

  // out指上侧（外侧）轮廓线
  // in指下侧（内侧）轮廓线
  const stroke1_beziers = FP.getCircle(skeleton_0, weight / 2 + r1)
  const stroke2_beziers = FP.getCircle(skeleton_1, weight / 2 + r1)
  const { out_stroke3_curves, out_stroke3_points, in_stroke3_curves, in_stroke3_points } = FP.getCurveContours2(
    'stroke3',
    [
      {
        start: skeleton_2,
        bend: skeleton_3,
        end: skeleton_4,
      },
    ],
    weight
  )

  const pen1 = new FP.PenComponent()
  pen1.beginPath()
  pen1.moveTo(stroke1_beziers[0].start.x, stroke1_beziers[0].start.y)
  for (let i = 0; i < stroke1_beziers.length; i++) {
    const curve = stroke1_beziers[i]
    pen1.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }
  pen1.closePath()

  const pen2 = new FP.PenComponent()
  pen2.beginPath()
  pen2.moveTo(stroke2_beziers[0].start.x, stroke2_beziers[0].start.y)
  for (let i = 0; i < stroke2_beziers.length; i++) {
    const curve = stroke2_beziers[i]
    pen2.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }
  pen2.closePath()

  const pen3 = new FP.PenComponent()
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

  return [ pen1, pen2, pen3 ]
}

updateGlyphByParams(params, global_params)