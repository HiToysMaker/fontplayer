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
        y: start_ref.y + weight / 2,
      },
    )
    end = new FP.Joint(
      'end',
      {
        x: end_ref.x,
        y: end_ref.y + weight / 2,
      },
    )
  } else if (skeletonRefPos === 2) {
    // 骨架参考位置为左侧（下侧）
    start = new FP.Joint(
      'start',
      {
        x: start_ref.x,
        y: start_ref.y - weight / 2,
      },
    )
    end = new FP.Joint(
      'end',
      {
        x: end_ref.x,
        y: end_ref.y - weight / 2,
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
  const leftAngle = FP.degreeToRadius(20)
  let start_length = Math.min(50, FP.distance(start, end) * 0.3)
  const endTopAngle = FP.degreeToRadius(25 + 5 * end_style_value)
  const endBottomAngle = FP.degreeToRadius(-(0 + 5 * end_style_value))
  const endRightAngle = FP.degreeToRadius(20)
  let end_length = Math.min(60, FP.distance(start, end) * 0.3)
  const d = 6 + 3 * weights_variation_power
  const l = FP.distance(start, end)
  const control_length = Math.min(l * 0.5 - start_length, l * 0.5 - end_length, 45)
  // if (FP.distance(start, end) <= 250) {
  //   start_length = FP.distance(start, end) * 0.05
  //   end_length = FP.distance(start, end) * 0.05
  // }

  const p0 = FP.getPointOnLine(out_heng_start, out_heng_end, start_length)
  const p3 = FP.getPointOnLine(in_heng_start, in_heng_end, start_length)
  const p0_p1_vector = FP.turnAngleFromEnd(out_heng_end, p0, topAngle, 100)
  const p3_p2_vector = FP.turnAngleFromEnd(in_heng_end, p3, bottomAngle, 100)
  const p1_p2_vector = FP.turnAngleFromStart(start, in_heng_start, leftAngle, 100)
  const { corner: p1 } = FP.getIntersection(
    { type: 'line', start: p0, end: p0_p1_vector },
    { type: 'line', start: start, end: p1_p2_vector }
  )
  const { corner: p2 } = FP.getIntersection(
    { type: 'line', start: p3, end: p3_p2_vector },
    { type: 'line', start: start, end: p1_p2_vector }
  )

  const p14 = FP.turnLeft(out_heng_end, FP.getPointOnLine(out_heng_end, out_heng_start, l * 0.5 - control_length), d)
  const p15 = FP.turnLeft(out_heng_end, FP.getPointOnLine(out_heng_end, out_heng_start, l * 0.5), d)
  const p16 = FP.turnLeft(out_heng_end, FP.getPointOnLine(out_heng_end, out_heng_start, l * 0.5 + control_length), d)
  const p7 = FP.turnRight(in_heng_end, FP.getPointOnLine(in_heng_end, in_heng_start, l * 0.5 - control_length), d)
  const p6 = FP.turnRight(in_heng_end, FP.getPointOnLine(in_heng_end, in_heng_start, l * 0.5), d)
  const p5 = FP.turnRight(in_heng_end, FP.getPointOnLine(in_heng_end, in_heng_start, l * 0.5 + control_length), d)

  const p12 = FP.getPointOnLine(out_heng_end, out_heng_start, end_length)
  const p9 = FP.getPointOnLine(in_heng_end, in_heng_start, end_length)
  const p11_p10_vector = FP.turnAngleFromStart(end, in_heng_end, endRightAngle, 100)
  const p12_p11_vector = FP.turnAngleFromEnd(out_heng_start, p12, endTopAngle, 100)
  const p9_p10_vector = FP.turnAngleFromEnd(in_heng_start, p9, endBottomAngle, 100)
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

  const p1_radius_before = FP.getPointOnLine(p1, p0, Math.min(radius, FP.distance(p1, p0) * 0.5))
  const p1_radius_after = FP.getPointOnLine(p1, p2, Math.min(radius, FP.distance(p1, p2) * 0.5))
  const p2_radius_before = FP.getPointOnLine(p2, p1, Math.min(radius, FP.distance(p2, p1) * 0.5))
  const p2_radius_after = FP.getPointOnLine(p2, p3, Math.min(radius, FP.distance(p2, p3) * 0.5))
  const p11_radius_before = FP.getPointOnLine(p11, p10, Math.min(radius, FP.distance(p11, p10) * 0.5))
  const p11_radius_after = FP.getPointOnLine(p11, p12, Math.min(radius, FP.distance(p11, p12) * 0.5))
  const p10_radius_before = FP.getPointOnLine(p10, p9, Math.min(radius, FP.distance(p10, p9) * 0.5))
  const p10_radius_after = FP.getPointOnLine(p10, p11, Math.min(radius, FP.distance(p10, p11) * 0.5))

  const p0_joint = new FP.Joint('p0', p0)
  const p1_joint = new FP.Joint('p1', p1)
  const p2_joint = new FP.Joint('p2', p2)
  const p3_joint = new FP.Joint('p3', p3)
  const p4_joint = new FP.Joint('p4', p4)
  const p5_joint = new FP.Joint('p5', p5)
  const p6_joint = new FP.Joint('p6', p6)
  const p7_joint = new FP.Joint('p7', p7)
  const p8_joint = new FP.Joint('p8', p8)
  const p9_joint = new FP.Joint('p9', p9)
  const p10_joint = new FP.Joint('p10', p10)
  const p11_joint = new FP.Joint('p11', p11)
  const p12_joint = new FP.Joint('p12', p12)
  const p13_joint = new FP.Joint('p13', p13)
  const p14_joint = new FP.Joint('p14', p14)
  const p15_joint = new FP.Joint('p15', p15)
  const p16_joint = new FP.Joint('p16', p16)
  const p17_joint = new FP.Joint('p17', p17)
  // 创建钢笔组件
  glyph.addJoint(p0_joint)
  glyph.addJoint(p1_joint)
  glyph.addJoint(p2_joint)
  glyph.addJoint(p3_joint)
  glyph.addJoint(p4_joint)
  glyph.addJoint(p5_joint)
  glyph.addJoint(p6_joint)
  glyph.addJoint(p7_joint)
  glyph.addJoint(p8_joint)
  glyph.addJoint(p9_joint)
  glyph.addJoint(p10_joint)
  glyph.addJoint(p11_joint)
  glyph.addJoint(p12_joint)
  glyph.addJoint(p13_joint)
  glyph.addJoint(p14_joint)
  glyph.addJoint(p15_joint)
  glyph.addJoint(p16_joint)
  glyph.addJoint(p17_joint)

  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  if (FP.distance(start, end) > 250) {
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
  } else if (FP.distance(start, end) <= 250 && FP.distance(start, end) > 150) {
    pen.moveTo(p15.x, p15.y)
    pen.quadraticBezierTo(p17.x, p17.y, p1_radius_before.x, p1_radius_before.y)
    pen.quadraticBezierTo(p1.x, p1.y, p1_radius_after.x, p1_radius_after.y)
    pen.lineTo(p2_radius_before.x, p2_radius_before.y)
    pen.quadraticBezierTo(p2.x, p2.y, p2_radius_after.x, p2_radius_after.y)
    pen.quadraticBezierTo(p4.x, p4.y, p6.x, p6.y)
    pen.quadraticBezierTo(p8.x, p8.y, p10_radius_before.x, p10_radius_before.y)
    pen.quadraticBezierTo(p10.x, p10.y, p10_radius_after.x, p10_radius_after.y)
    pen.lineTo(p11_radius_before.x, p11_radius_before.y)
    pen.quadraticBezierTo(p11.x, p11.y, p11_radius_after.x, p11_radius_after.y)
    pen.quadraticBezierTo(p13.x, p13.y, p15.x, p15.y)
  } else if (FP.distance(start, end) <= 150) {
    pen.moveTo(p11_radius_after.x, p11_radius_after.y)
    pen.quadraticBezierTo(p15.x, p15.y, p1_radius_before.x, p1_radius_before.y)
    pen.quadraticBezierTo(p1.x, p1.y, p1_radius_after.x, p1_radius_after.y)
    pen.lineTo(p2_radius_before.x, p2_radius_before.y)
    pen.quadraticBezierTo(p2.x, p2.y, p2_radius_after.x, p2_radius_after.y)
    pen.quadraticBezierTo(p5.x, p5.y, p10_radius_before.x, p10_radius_before.y)
    pen.quadraticBezierTo(p10.x, p10.y, p10_radius_after.x, p10_radius_after.y)
    pen.lineTo(p11_radius_before.x, p11_radius_before.y)
    pen.quadraticBezierTo(p11.x, p11.y, p11_radius_after.x, p11_radius_after.y)
  }

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)