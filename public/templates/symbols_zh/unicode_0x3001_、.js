// 0x3001 、
// 0xff08 （
const params = {
  h1: glyph.getParam('h1'),
  w1: glyph.getParam('w1'),
  bendCursor: glyph.getParam('bendCursor'),
  bendDegree: glyph.getParam('bendDegree'),
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
const x0 = 500 - width * 0.5 * 0.5
const y0 = ascender - capitalHeight * 0.3

const getBend = (start, end) => {
  // 改变撇end的情况下，不会改变弯曲度和弯曲游标，所以依据现有参数计算新的bend
  const { bendCursor, bendDegree } = params
  const horizontalSpan = Math.abs(end.x - start.x)
  const verticalSpan = Math.abs(end.y - start.y)
  const cursor_x = start.x + bendCursor * horizontalSpan
  const cursor_y = start.y + bendCursor * verticalSpan
  const angle = Math.atan2(verticalSpan, horizontalSpan)
  
  const bend = {
    x: cursor_x + bendDegree * Math.sin(angle),
    y: cursor_y - bendDegree * Math.cos(angle),
  }

  return bend
}

const getJointsMap = (data) => {
  const { draggingJoint, deltaX, deltaY } = data
  const jointsMap = Object.assign({}, glyph.tempData)
  switch (draggingJoint.name) {
    case 'skeleton_1': {
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
      const newBend = getBend(jointsMap['skeleton_0'], jointsMap['skeleton_2'])
      jointsMap['skeleton_1'] = {
        x: newBend.x,
        y: newBend.y,
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
  glyph.setParam('bendCursor', _params.bendCursor)
  glyph.setParam('bendDegree', _params.bendDegree)
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
  const { skeleton_0, skeleton_1, skeleton_2 } = jointsMap
  const h1_range = glyph.getParamRange('h1')
  const h1 = range(skeleton_2.y - skeleton_0.y, h1_range)
  const w1_range = glyph.getParamRange('w1')
  const w1 = range(skeleton_2.x - skeleton_0.x, w1_range)
  const bend_cursor_range = glyph.getParamRange('bendCursor')
  const bend_degree_range = glyph.getParamRange('bendDegree')
  const data = FP.distanceAndFootPoint(skeleton_0, skeleton_2, skeleton_1)
  const bendCursor = range(data.percentageFromA, bend_cursor_range)
  const bendDegree = range(data.distance, bend_degree_range)
  return {
    h1,
    w1,
    bendCursor,
    bendDegree,
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
  const { h1, w1, bendCursor, bendDegree } = params
  const { weight } = global_params

  const skeleton_0 = new FP.Joint('skeleton_0', {
    x: x0,
    y: y0,
  })
  const skeleton_2 = new FP.Joint('skeleton_2', {
    x: skeleton_0.x + w1,
    y: skeleton_0.y + h1,
  })
  const cursor_x = skeleton_0.x + bendCursor * w1
  const cursor_y = skeleton_0.y + bendCursor * h1
  const angle = Math.atan2(h1, w1)
  const skeleton_1 = new FP.Joint(
    'skeleton_1',
    {
      x: cursor_x + bendDegree * Math.sin(angle),
      y: cursor_y - bendDegree * Math.cos(angle),
    },
  )
  const skeleton = {
    skeleton_0,
    skeleton_1,
    skeleton_2,
  }
  
  glyph.addJoint(skeleton_0)
  glyph.addJoint(skeleton_1)
  glyph.addJoint(skeleton_2)
  glyph.addRefLine(refline(skeleton_0, skeleton_1))
  glyph.addRefLine(refline(skeleton_1, skeleton_2))

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
  const { skeleton_0, skeleton_1, skeleton_2 } = skeleton

  const { out_stroke1_curves, out_stroke1_points, in_stroke1_curves, in_stroke1_points } = FP.getCurveContours2(
    'stroke1',
    [
      {
        start: skeleton_0,
        bend: skeleton_1,
        end: skeleton_2,
      },
    ],
    weight
  )

  const pen1 = new FP.PenComponent()
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

  return [ pen1 ]
}

updateGlyphByParams(params, global_params)