const ox = 500
const oy = 500
const x0 = 250
const y0 = 500
const params = {
  horizontalSpan: glyph.getParam('水平延伸'),
  verticalSpan: glyph.getParam('竖直延伸'),
  skeletonRefPos: glyph.getParam('参考位置'),
}
const global_params = {
  weights_variation_power: glyph.getParam('字重变化'),
  start_style_type: glyph.getParam('起笔风格'),
  start_style_value: glyph.getParam('起笔数值'),
  end_style_type: glyph.getParam('收笔风格'),
  end_style_value: glyph.getParam('收笔数值'),
  turn_style_type: glyph.getParam('转角风格'),
  turn_style_value: glyph.getParam('转角数值'),
  wave_momentum: glyph.getParam('拱势'),
  bending_degree: glyph.getParam('弯曲程度'),
  weights_variation_power: glyph.getParam('字重变化'),
  weight: glyph.getParam('字重') || 40,
}

const getJointsMap = (data) => {
  const { draggingJoint, deltaX, deltaY } = data
  const jointsMap = Object.assign({}, glyph.tempData)
  switch (draggingJoint.name) {
    case 'end': {
      jointsMap['end'] = {
        x: glyph.tempData['end'].x + deltaX,
        y: glyph.tempData['end'].y + deltaY,
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
  glyph.setParam('水平延伸', _params.horizontalSpan)
  glyph.setParam('竖直延伸', _params.verticalSpan)
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
  const { start, end } = jointsMap
  const horizontalSpan_range = glyph.getParamRange('水平延伸')
  const verticalSpan_range = glyph.getParamRange('竖直延伸')
  const horizontalSpan = range(end.x - start.x, horizontalSpan_range)
  const verticalSpan = range(start.y - end.y, verticalSpan_range)
  return {
    horizontalSpan,
    verticalSpan,
    skeletonRefPos: glyph.getParam('参考位置'),
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
  const { horizontalSpan, verticalSpan, skeletonRefPos } = params
  const { weight } = global_params
  const length = Math.sqrt(horizontalSpan * horizontalSpan + verticalSpan * verticalSpan)

  const _weight = weight * 1.5

  let start, end
  const start_ref = new FP.Joint(
    'start_ref',
    {
      x: x0,
      y: y0 + verticalSpan / 2,
    },
  )
  const end_ref = new FP.Joint(
    'end_ref',
    {
      x: start_ref.x + horizontalSpan,
      y: start_ref.y - verticalSpan,
    },
  )
  if (skeletonRefPos === 1) {
    // 骨架参考位置为右侧（上侧）
    start = new FP.Joint(
      'start',
      {
        x: start_ref.x,
        y: start_ref.y + _weight / 2,
      },
    )
    end = new FP.Joint(
      'end',
      {
        x: end_ref.x,
        y: end_ref.y + _weight / 2,
      },
    )
  } else if (skeletonRefPos === 2) {
    // 骨架参考位置为左侧（下侧）
    start = new FP.Joint(
      'start',
      {
        x: start_ref.x,
        y: start_ref.y - _weight / 2,
      },
    )
    end = new FP.Joint(
      'end',
      {
        x: end_ref.x,
        y: end_ref.y - _weight / 2,
      },
    )
  } else {
    // 默认骨架参考位置，即骨架参考位置为中间实际绘制的骨架位置
    start = new FP.Joint(
      'start',
      {
        x: start_ref.x,
        y: start_ref.y,
      },
    )
    end = new FP.Joint(
      'end',
      {
        x: end_ref.x,
        y: end_ref.y,
      },
    )
  }
  glyph.addJoint(start_ref)
  glyph.addJoint(end_ref)
  glyph.addRefLine(refline(start_ref, end_ref, 'ref'))
  
  glyph.addJoint(start)
  glyph.addJoint(end)

  const skeleton = {
    start,
    end,
  }
  
  glyph.addRefLine(refline(start, end))

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
  const {
    start_style_type,
    start_style_value,
    end_style_type,
    end_style_value,
    weight,
    weights_variation_power,
    wave_momentum,
  } = global_params

  const getStartStyle = (start_style_type, start_style_value) => {
    if (start_style_type === 1) {
      // 起笔上下凸起长方形
      return {
        start_style_decorator_width: start_style_value * 20,
        start_style_decorator_height: weight * 0.25,
      }
    } else if (start_style_type === 2) {
      // 起笔上下凸起长方形，长方形内侧转角为圆角
      return {
        start_style_decorator_width: start_style_value * 20,
        start_style_decorator_height: weight * 0.25,
        start_style_decorator_radius: 20,
      }
    }
    return {}
  }

  const start_style = getStartStyle(start_style_type, start_style_value)

  // 根据骨架计算轮廓关键点
  const { start, end } = skeleton

  const _weight = weight * 1.5

  // out指上侧（外侧）轮廓线
  // in指下侧（内侧）轮廓线
  const { out_heng_start, out_heng_end, in_heng_start, in_heng_end } = FP.getLineContours('heng', { heng_start: start, heng_end: end }, _weight)

  const radius = 15
  const topAngle = FP.degreeToRadius(-(5 + 5 * start_style_value))
  const bottomAngle = FP.degreeToRadius(25 + 5 * start_style_value)
  const leftAngle = FP.degreeToRadius(30)
  const start_length = Math.min(50, FP.distance(start, end) * 0.3)
  const endTopAngle = FP.degreeToRadius(25 + 5 * end_style_value)
  const endBottomAngle = FP.degreeToRadius(-(0 + 5 * end_style_value))
  const endRightAngle = FP.degreeToRadius(-30)
  const end_length = Math.min(60, FP.distance(start, end) * 0.3)
  const d = 6 + 3 * weights_variation_power
  const l = FP.distance(start, end)
  const control_length = Math.min((l - start_length - end_length) * 0.3, 45)
  const d_2 = _weight * wave_momentum
  const end_weight = _weight * 1.2

  let out_turn_p2 = FP.turnLeft(out_heng_end, FP.getPointOnLine(out_heng_end, out_heng_start, l * 0.55 - control_length), d)
  let out_turn_p1 = FP.turnLeft(out_heng_end, FP.getPointOnLine(out_heng_end, out_heng_start, l * 0.55), d)
  let out_turn_p0 = FP.turnLeft(out_heng_end, FP.getPointOnLine(out_heng_end, out_heng_start, l * 0.55 + control_length), d)
  let in_turn_p2 = FP.turnRight(in_heng_end, FP.getPointOnLine(in_heng_end, in_heng_start, l * 0.55 - control_length), d)
  let in_turn_p1 = FP.turnRight(in_heng_end, FP.getPointOnLine(in_heng_end, in_heng_start, l * 0.55), d)
  let in_turn_p0 = FP.turnRight(in_heng_end, FP.getPointOnLine(in_heng_end, in_heng_start, l * 0.55 + control_length), d)
  out_turn_p2 = FP.turnLeft(out_turn_p0, out_turn_p2, d_2)
  out_turn_p1 = FP.turnLeft(out_turn_p0, out_turn_p1, d_2)
  out_turn_p0 = FP.turnRight(out_turn_p2, out_turn_p0, d_2)
  in_turn_p2 = FP.turnLeft(in_turn_p0, in_turn_p2, d_2)
  in_turn_p1 = FP.turnLeft(in_turn_p0, in_turn_p1, d_2)
  in_turn_p0 = FP.turnRight(in_turn_p2, in_turn_p0, d_2)

  // const out_turn_p2_joint = new FP.Joint('out_turn_p2_joint', out_turn_p2)
  // const out_turn_p1_joint = new FP.Joint('out_turn_p1_joint', out_turn_p1)
  // const out_turn_p0_joint = new FP.Joint('out_turn_p0_joint', out_turn_p0)
  // const in_turn_p2_joint = new FP.Joint('in_turn_p2_joint', in_turn_p2)
  // const in_turn_p1_joint = new FP.Joint('in_turn_p1_joint', in_turn_p1)
  // const in_turn_p0_joint = new FP.Joint('in_turn_p0_joint', in_turn_p0)
  // glyph.addJoint(out_turn_p2_joint)
  // glyph.addJoint(out_turn_p1_joint)
  // glyph.addJoint(out_turn_p0_joint)
  // glyph.addJoint(in_turn_p2_joint)
  // glyph.addJoint(in_turn_p1_joint)
  // glyph.addJoint(in_turn_p0_joint)

  const start_p4 = start
  const start_p5 = FP.turnAngleFromEnd(end, start, FP.degreeToRadius(90) - leftAngle, _weight * 0.6)
  const start_p3 = FP.turnAngleFromEnd(end, start, -(FP.degreeToRadius(90) + leftAngle), _weight * 0.75)
  const start_p6 = FP.turnLeft(start_p4, start_p5, _weight * 0.5)
  const start_p7 = FP.turnLeft(start_p4, start_p5, _weight)
  const start_p7_p9_vector = FP.turnLeft(start_p5, start_p7, 100)
  const { corner: start_p9 } = FP.getIntersection(
    { type: 'line', start: start_p7, end: start_p7_p9_vector },
    { type: 'line', start: in_heng_start, end: in_heng_end }
  )
  const start_p8 = FP.getPointOnLine(start_p7, start_p9, FP.distance(start_p7, start_p9) * 0.5)
  const start_p10 = FP.getPointOnLine(start_p9, in_turn_p0, FP.distance(start_p9, in_turn_p0) * 0.5)
  const start_p1 = FP.turnRight(start_p4, start_p3, _weight * 0.5)
  const start_p2 = FP.getPointOnLine(start_p3, start_p1, FP.distance(start_p3, start_p1) * 0.5)
  const start_p0 = FP.getPointOnLine(start_p1, out_turn_p0, FP.distance(start_p1, out_turn_p0) * 0.5)

  const end_p4_p3_vector = FP.turnAngleFromStart(end, in_heng_end, endRightAngle, 100)
  const { corner: end_p4 } = FP.getIntersection(
    { type: 'line', start: end, end: end_p4_p3_vector },
    { type: 'line', start: out_heng_start, end: out_heng_end },
  )
  const end_heng_start = FP.turnLeft(out_heng_end, out_heng_start, end_weight)
  const end_heng_end = FP.turnRight(out_heng_start, out_heng_end, end_weight)
  const { corner: end_p3 } = FP.getIntersection(
    { type: 'line', start: end, end: end_p4_p3_vector },
    { type: 'line', start: end_heng_start, end: end_heng_end },
  )
  const end_p6 = FP.turnLeft(end_p4, FP.getPointOnLine(end_p4, out_heng_start, end_length * 0.6), end_weight - _weight)
  const end_p5 = FP.turnLeft(end_p4, FP.getPointOnLine(end_p4, out_heng_start, end_length * 0.4), end_weight - _weight)
  const end_p7 = FP.turnLeft(end_p4, FP.getPointOnLine(end_p4, out_heng_start, end_length * 0.8), end_weight - _weight)
  const end_p2 = FP.getPointOnLine(end_p3, end_heng_start, end_length * 0.5)
  const end_p1 = FP.getPointOnLine(end_p3, end_heng_start, end_length)
  const end_p8 = FP.getPointOnLine(end_p7, out_turn_p2, FP.distance(end_p7, out_turn_p2) * 0.5)
  const end_p0 = FP.getPointOnLine(end_p1, in_turn_p2, FP.distance(end_p1, in_turn_p2) * 0.5)

  // const end_p0_joint = new FP.Joint('end_p0_joint', end_p0)
  // const end_p1_joint = new FP.Joint('end_p1_joint', end_p1)
  // const end_p2_joint = new FP.Joint('end_p2_joint', end_p2)
  // const end_p3_joint = new FP.Joint('end_p3_joint', end_p3)
  // const end_p4_joint = new FP.Joint('end_p4_joint', end_p4)
  // const end_p5_joint = new FP.Joint('end_p5_joint', end_p5)
  // const end_p6_joint = new FP.Joint('end_p6_joint', end_p6)
  // const end_p7_joint = new FP.Joint('end_p7_joint', end_p7)
  // const end_p8_joint = new FP.Joint('end_p8_joint', end_p8)
  // glyph.addJoint(end_p0_joint)
  // glyph.addJoint(end_p1_joint)
  // glyph.addJoint(end_p2_joint)
  // glyph.addJoint(end_p3_joint)
  // glyph.addJoint(end_p4_joint)
  // glyph.addJoint(end_p5_joint)
  // glyph.addJoint(end_p6_joint)
  // glyph.addJoint(end_p7_joint)
  // glyph.addJoint(end_p8_joint)

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  pen.moveTo(start_p0.x, start_p0.y)
  pen.quadraticBezierTo(start_p1.x, start_p1.y, start_p2.x, start_p2.y)
  pen.quadraticBezierTo(start_p3.x, start_p3.y, start_p4.x, start_p4.y)
  pen.quadraticBezierTo(start_p5.x, start_p5.y, start_p6.x, start_p6.y)
  pen.quadraticBezierTo(start_p7.x, start_p7.y, start_p8.x, start_p8.y)
  pen.quadraticBezierTo(start_p9.x, start_p9.y, start_p10.x, start_p10.y)
  
  pen.quadraticBezierTo(in_turn_p0.x, in_turn_p0.y, in_turn_p1.x, in_turn_p1.y)
  pen.quadraticBezierTo(in_turn_p2.x, in_turn_p2.y, end_p0.x, end_p0.y)
  pen.quadraticBezierTo(end_p1.x, end_p1.y, end_p2.x, end_p2.y)
  pen.quadraticBezierTo(end_p3.x, end_p3.y, end_p4.x, end_p4.y)
  pen.quadraticBezierTo(end_p5.x, end_p5.y, end_p6.x, end_p6.y)
  pen.quadraticBezierTo(end_p7.x, end_p7.y, end_p8.x, end_p8.y)
  
  pen.quadraticBezierTo(out_turn_p2.x, out_turn_p2.y, out_turn_p1.x, out_turn_p1.y)
  pen.quadraticBezierTo(out_turn_p0.x, out_turn_p0.y, start_p0.x, start_p0.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)