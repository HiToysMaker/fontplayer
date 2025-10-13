const ox = 500
const oy = 500
const x0 = 500
const y0 = 250
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
  bending_degree: glyph.getParam('弯曲程度'),
  weight: glyph.getParam('字重') || 40,
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
  const horizontal_span_range = glyph.getParamRange('水平延伸')
  const vertical_span_range = glyph.getParamRange('竖直延伸')
  const horizontalSpan = range(end.x - start.x, horizontal_span_range)
  const verticalSpan = range(end.y - start.y, vertical_span_range)
  return {
    horizontalSpan,
    verticalSpan,
    skeletonRefPos: glyph.getParam('参考位置'),
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    horizontalSpan,
    verticalSpan,
    skeletonRefPos,
  } = params
  const { weight } = global_params
  const _weight = weight * 1.5

  let start, end
  const start_ref = new FP.Joint(
    'start_ref',
    {
      x: x0,
      y: y0,
    },
  )
  const end_ref = new FP.Joint(
    'end_ref',
    {
      x: start_ref.x + horizontalSpan,
      y: start_ref.y + verticalSpan,
    },
  )
  if (skeletonRefPos === 1) {
    // 骨架参考位置为右侧（上侧）
    start = new FP.Joint(
      'start',
      {
        x: start_ref.x - _weight / 2,
        y: start_ref.y,
      },
    )
    end = new FP.Joint(
      'end',
      {
        x: end_ref.x - _weight / 2,
        y: end_ref.y,
      },
    )
  } else if (skeletonRefPos === 2) {
    // 骨架参考位置为左侧（下侧）
    start = new FP.Joint(
      'start',
      {
        x: start_ref.x + _weight / 2,
        y: start_ref.y,
      },
    )
    end = new FP.Joint(
      'end',
      {
        x: end_ref.x + _weight / 2,
        y: end_ref.y,
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

const getComponents = (skeleton) => {
  const {
    weights_variation_power,
    start_style_type,
    start_style_value,
    end_style_type,
    end_style_value,
    turn_style_type,
    turn_style_value,
    bending_degree,
    weight,
  } = global_params

  const getStartStyle = (start_style_type, start_style_value) => {
    if (start_style_type === 1) {
      // 起笔上下凸起长方形
      return {
        start_style_decorator_height: start_style_value * 20,
        start_style_decorator_width: weight * 0.25,
      }
    } else if (start_style_type === 2) {
      // 起笔上下凸起长方形，长方形内侧转角为圆角
      return {
        start_style_decorator_height: start_style_value * 20,
        start_style_decorator_width: weight * 0.25,
        start_style_decorator_radius: 20,
      }
    }
    return {}
  }
  
  const start_style = getStartStyle(start_style_type, start_style_value)

  // 根据骨架计算轮廓关键点
  const { start, end } = skeleton

  const _weight = weight * 1.5

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_shu_start, out_shu_end, in_shu_start, in_shu_end } = FP.getLineContours('shu', { shu_start: start, shu_end: end }, _weight, {
    unticlockwise: true,
  })

  const radius = 15
  const startRightAngle = FP.degreeToRadius(-(3 + 3 * start_style_value))
  const startLeftAngle = FP.degreeToRadius(3 + 3 * start_style_value)
  const startTopAngle = FP.degreeToRadius(-10)
  const start_length = Math.min(100, FP.distance(start, end) * 0.3)
  const endRightAngle = FP.degreeToRadius(3 + 3 * end_style_value)
  const endLeftAngle = FP.degreeToRadius(-(0 + 3 * end_style_value))
  const endBottomAngle = FP.degreeToRadius(10)
  const end_length = Math.min(80, FP.distance(start, end) * 0.3)
  const d = 3 + 3 * weights_variation_power
  const l = FP.distance(start, end)
  const control_length = Math.min(l * 0.5 - start_length, l * 0.5 - end_length, 45)

  const p0 = FP.getPointOnLine(in_shu_start, in_shu_end, start_length)
  const p3 = FP.getPointOnLine(out_shu_start, out_shu_end, start_length)
  const p0_p1_vector = FP.turnAngleFromEnd(in_shu_end, p0, startRightAngle, 100)
  const p3_p2_vector = FP.turnAngleFromEnd(out_shu_end, p3, startLeftAngle, 100)
  const p1_p2_vector = FP.turnAngleFromStart(start, in_shu_start, startTopAngle, 100)
  const { corner: p1 } = FP.getIntersection(
    { type: 'line', start: p0, end: p0_p1_vector },
    { type: 'line', start: start, end: p1_p2_vector }
  )
  const { corner: p2 } = FP.getIntersection(
    { type: 'line', start: p3, end: p3_p2_vector },
    { type: 'line', start: start, end: p1_p2_vector }
  )

  const p14 = FP.turnLeft(in_shu_end, FP.getPointOnLine(in_shu_end, in_shu_start, l * 0.5 - control_length), d)
  const p15 = FP.turnLeft(in_shu_end, FP.getPointOnLine(in_shu_end, in_shu_start, l * 0.5), d)
  const p16 = FP.turnLeft(in_shu_end, FP.getPointOnLine(in_shu_end, in_shu_start, l * 0.5 + control_length), d)
  const p7 = FP.turnRight(out_shu_end, FP.getPointOnLine(out_shu_end, out_shu_start, l * 0.5 - control_length), d)
  const p6 = FP.turnRight(out_shu_end, FP.getPointOnLine(out_shu_end, out_shu_start, l * 0.5), d)
  const p5 = FP.turnRight(out_shu_end, FP.getPointOnLine(out_shu_end, out_shu_start, l * 0.5 + control_length), d)

  const p12 = FP.getPointOnLine(in_shu_end, in_shu_start, end_length)
  const p9 = FP.getPointOnLine(out_shu_end, out_shu_start, end_length)
  const p11_p10_vector = FP.turnAngleFromStart(end, in_shu_end, endBottomAngle, 100)
  const p12_p11_vector = FP.turnAngleFromEnd(in_shu_start, p12, endRightAngle, 100)
  const p9_p10_vector = FP.turnAngleFromEnd(out_shu_start, p9, endLeftAngle, 100)
  const { corner: p11 } = FP.getIntersection(
    { type: 'line', start: p12, end: p12_p11_vector },
    { type: 'line', start: end, end: p11_p10_vector },
  )
  const { corner: p10 } = FP.getIntersection(
    { type: 'line', start: p9, end: p9_p10_vector },
    { type: 'line', start: end, end: p11_p10_vector },
  )

  const p17 = FP.getPointOnLine(p0, p16, FP.distance(p0, p16) * 0.5)
  const p4 = FP.getPointOnLine(p3, p5, FP.distance(p3, p5) * 0.5)
  const p13 = FP.getPointOnLine(p12, p14, FP.distance(p12, p14) * 0.5)
  const p8 = FP.getPointOnLine(p9, p7, FP.distance(p9, p7) * 0.5)

  const p1_radius_before = FP.getPointOnLine(p1, p0, FP.distance(p1, p0) * 0.5)
  const p1_radius_after = FP.getPointOnLine(p1, p2, FP.distance(p1, p2) * 0.4)
  const p2_radius_before = FP.getPointOnLine(p2, p1, FP.distance(p2, p1) * 0.4)
  const p2_radius_after = FP.getPointOnLine(p2, p3, FP.distance(p2, p3) * 0.5)
  const p11_radius_before = FP.getPointOnLine(p11, p10, FP.distance(p11, p10) * 0.5)
  const p11_radius_after = FP.getPointOnLine(p11, p12, FP.distance(p11, p12) * 0.4)
  const p10_radius_before = FP.getPointOnLine(p10, p9, FP.distance(p10, p9) * 0.4)
  const p10_radius_after = FP.getPointOnLine(p10, p11, FP.distance(p10, p11) * 0.5)
  // const p1_radius_before = FP.getPointOnLine(p1, p0, radius)
  // const p1_radius_after = FP.getPointOnLine(p1, p2, radius)
  // const p2_radius_before = FP.getPointOnLine(p2, p1, radius)
  // const p2_radius_after = FP.getPointOnLine(p2, p3, radius)
  // const p11_radius_before = FP.getPointOnLine(p11, p10, radius)
  // const p11_radius_after = FP.getPointOnLine(p11, p12, radius)
  // const p10_radius_before = FP.getPointOnLine(p10, p9, radius)
  // const p10_radius_after = FP.getPointOnLine(p10, p11, radius)

  const p1_radius_before_joint = new FP.Joint('p1_radius_before_joint', p1_radius_before)
  const p1_radius_after_joint = new FP.Joint('p1_radius_after_joint', p1_radius_after)
  const p2_radius_before_joint = new FP.Joint('p2_radius_before_joint', p2_radius_before)
  const p2_radius_after_joint = new FP.Joint('p2_radius_after_joint', p2_radius_after)

  glyph.addJoint(p1_radius_before_joint)
  glyph.addJoint(p1_radius_after_joint)
  glyph.addJoint(p2_radius_before_joint)
  glyph.addJoint(p2_radius_after_joint)

  const p0_joint = new FP.Joint('p0_joint', p0)
  glyph.addJoint(p0_joint)

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  pen.moveTo(p1_radius_before.x, p1_radius_before.y)
  pen.quadraticBezierTo(p1.x, p1.y, p1_radius_after.x, p1_radius_after.y)
  pen.lineTo(p2_radius_before.x, p2_radius_before.y)
  pen.quadraticBezierTo(p2.x, p2.y, p2_radius_after.x, p2_radius_after.y)
  pen.quadraticBezierTo(p3.x, p3.y, p4.x, p4.y)
  pen.quadraticBezierTo(p5.x, p5.y, p6.x, p6.y)
  pen.quadraticBezierTo(p7.x, p7.y, p8.x, p8.y)
  pen.quadraticBezierTo(p9.x, p9.y, p10_radius_before.x, p10_radius_before.y)
  pen.quadraticBezierTo(p10.x, p10.y, p10_radius_after.x, p10_radius_after.y)
  pen.lineTo(p11_radius_before.x, p11_radius_before.y)
  pen.quadraticBezierTo(p11.x, p11.y, p11_radius_after.x, p11_radius_after.y)
  pen.quadraticBezierTo(p12.x, p12.y, p13.x, p13.y)
  pen.quadraticBezierTo(p14.x, p14.y, p15.x, p15.y)
  pen.quadraticBezierTo(p16.x, p16.y, p17.x, p17.y)
  pen.quadraticBezierTo(p0.x, p0.y, p1_radius_before.x, p1_radius_before.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)