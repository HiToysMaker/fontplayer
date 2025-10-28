const params = {
  h1: glyph.getParam('h1'),
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
const capitalWidth = 500
const xHeight = 500
const capitalHeight = 750
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
        x: glyph.tempData['skeleton_1'].x + deltaX,
        y: glyph.tempData['skeleton_1'].y,
      }
      jointsMap['skeleton_3'] = {
        x: glyph.tempData['skeleton_3'].x + deltaX,
        y: glyph.tempData['skeleton_3'].y,
      }
      jointsMap['skeleton_2'] = {
        x: glyph.tempData['skeleton_2'].x + deltaX,
        y: glyph.tempData['skeleton_2'].y,
      }
      break
    }
    case 'skeleton_2': {
      jointsMap['skeleton_1'] = {
        x: glyph.tempData['skeleton_1'].x + deltaX,
        y: glyph.tempData['skeleton_1'].y,
      }
      jointsMap['skeleton_4'] = {
        x: glyph.tempData['skeleton_4'].x,
        y: glyph.tempData['skeleton_4'].y + deltaY * 2,
      }
      jointsMap['skeleton_3'] = {
        x: glyph.tempData['skeleton_3'].x + deltaX,
        y: glyph.tempData['skeleton_3'].y + deltaY * 2,
      }
      jointsMap['skeleton_2'] = {
        x: glyph.tempData['skeleton_2'].x + deltaX,
        y: glyph.tempData['skeleton_2'].y + deltaY,
      }
      break
    }
    case 'skeleton_3': {
      jointsMap['skeleton_1'] = {
        x: glyph.tempData['skeleton_1'].x + deltaX,
        y: glyph.tempData['skeleton_1'].y,
      }
      jointsMap['skeleton_4'] = {
        x: glyph.tempData['skeleton_4'].x,
        y: glyph.tempData['skeleton_4'].y + deltaY,
      }
      jointsMap['skeleton_3'] = {
        x: glyph.tempData['skeleton_3'].x + deltaX,
        y: glyph.tempData['skeleton_3'].y + deltaY,
      }
      jointsMap['skeleton_2'] = {
        x: glyph.tempData['skeleton_2'].x + deltaX,
        y: glyph.tempData['skeleton_2'].y + deltaY / 2,
      }
      break
    }
    case 'skeleton_4': {
      jointsMap['skeleton_4'] = {
        x: glyph.tempData['skeleton_4'].x,
        y: glyph.tempData['skeleton_4'].y + deltaY,
      }
      jointsMap['skeleton_3'] = {
        x: glyph.tempData['skeleton_3'].x,
        y: glyph.tempData['skeleton_3'].y + deltaY,
      }
      jointsMap['skeleton_2'] = {
        x: glyph.tempData['skeleton_2'].x,
        y: glyph.tempData['skeleton_2'].y + deltaY / 2,
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
  const { skeleton_0, skeleton_1, skeleton_2, skeleton_3, skeleton_4, skeleton_5, skeleton_6, skeleton_7, skeleton_8, skeleton_9, skeleton_10 } = jointsMap
  const h1_range = glyph.getParamRange('h1')
  const w1_range = glyph.getParamRange('w1')
  const h1 = range(skeleton_4.y - skeleton_0.y, h1_range)
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
  const { h1, h2, h3, w1, w2 } = params
  const { weight } = global_params

  const skeleton_0 = new FP.Joint('skeleton_0', {
    x: x0,
    y: y0,
  })
  const skeleton_1 = new FP.Joint('skeleton_1', {
    x: skeleton_0.x + w1,
    y: skeleton_0.y,
  })
  const skeleton_2 = new FP.Joint('skeleton_2', {
    x: skeleton_1.x,
    y: skeleton_1.y + h1 / 2,
  })
  const skeleton_3 = new FP.Joint('skeleton_3', {
    x: skeleton_2.x,
    y: skeleton_2.y + h1 / 2,
  })
  const skeleton_4 = new FP.Joint('skeleton_4', {
    x: skeleton_0.x,
    y: skeleton_0.y + h1,
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
  glyph.addRefLine(refline(skeleton_1, skeleton_3))
  glyph.addRefLine(refline(skeleton_3, skeleton_4))
  glyph.addRefLine(refline(skeleton_4, skeleton_0))

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
  const { skeleton_0, skeleton_1, skeleton_2, skeleton_3, skeleton_4 } = skeleton

  // out指上侧（外侧）轮廓线
  // in指下侧（内侧）轮廓线
  const { out_stroke1_start, out_stroke1_end, in_stroke1_start, in_stroke1_end } = FP.getLineContours('stroke1', { stroke1_start: skeleton_0, stroke1_end: skeleton_4 }, weight)
  const { out_stroke2_curves, out_stroke2_points, in_stroke2_curves, in_stroke2_points } = FP.getCurveContours2(
    'stroke2',
    [
      {
        start: skeleton_0,
        bend: skeleton_1,
        end: skeleton_2,
      },
      {
        start: skeleton_2,
        bend: skeleton_3,
        end: skeleton_4,
      },
    ],
    weight
  )

  in_stroke1_start.y -= weight / 2
  in_stroke1_end.y += weight / 2
  const top_corner = {
    x: skeleton_0.x,
    y: skeleton_0.y - weight / 2,
  }
  const bottom_corner = {
    x: skeleton_4.x,
    y: skeleton_4.y + weight / 2,
  }

  // 创建钢笔组件
  const pen1 = new FP.PenComponent()
  pen1.beginPath()
  // 按逆时针方向绘制轮廓
  // 绘制stroke1
  pen1.moveTo(out_stroke1_start.x, out_stroke1_start.y)
  pen1.lineTo(out_stroke1_end.x, out_stroke1_end.y)
  pen1.lineTo(skeleton_4.x, skeleton_4.y)
  pen1.lineTo(bottom_corner.x, bottom_corner.y)
  pen1.lineTo(in_stroke1_end.x, in_stroke1_end.y)
  pen1.lineTo(in_stroke1_start.x, in_stroke1_start.y)
  pen1.lineTo(top_corner.x, top_corner.y)
  pen1.lineTo(skeleton_0.x, skeleton_0.y)
  pen1.lineTo(out_stroke1_start.x, out_stroke1_start.y)
  pen1.closePath()

  const pen2 = new FP.PenComponent()
  pen2.beginPath()
  pen2.moveTo(out_stroke2_curves[0].start.x, out_stroke2_curves[0].start.y)
  for (let i = 0; i < out_stroke2_curves.length; i++) {
    const curve = out_stroke2_curves[i]
    pen2.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }
  pen2.lineTo(in_stroke2_curves[in_stroke2_curves.length - 1].end.x, in_stroke2_curves[in_stroke2_curves.length - 1].end.y)
  for (let i = in_stroke2_curves.length - 1; i >= 0; i--) {
    const curve = in_stroke2_curves[i]
    pen2.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }
  pen2.lineTo(out_stroke2_curves[0].start.x, out_stroke2_curves[0].start.y)
  pen2.closePath()

  return [ pen1, pen2 ]
}

updateGlyphByParams(params, global_params)