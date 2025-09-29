const ox = 500
const oy = 500
const x0 = 500
const y0 = 250
const params = {
  length: glyph.getParam('长度'),
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
        x: glyph.tempData['end'].x,
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
  glyph.setParam('长度', _params.length)
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
  const length_range = glyph.getParamRange('长度')
  const length = range(end.y - start.y, length_range)
  return {
    length,
    skeletonRefPos: glyph.getParam('参考位置'),
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    length,
    skeletonRefPos,
  } = params
  const { weight } = global_params

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
      x: start_ref.x,
      y: start_ref.y + length,
    },
  )
  if (skeletonRefPos === 1) {
    // 骨架参考位置为右侧（上侧）
    start = new FP.Joint(
      'start',
      {
        x: start_ref.x - weight / 2,
        y: start_ref.y,
      },
    )
    end = new FP.Joint(
      'end',
      {
        x: end_ref.x - weight / 2,
        y: end_ref.y,
      },
    )
  } else if (skeletonRefPos === 2) {
    // 骨架参考位置为左侧（下侧）
    start = new FP.Joint(
      'start',
      {
        x: start_ref.x + weight / 2,
        y: start_ref.y,
      },
    )
    end = new FP.Joint(
      'end',
      {
        x: end_ref.x + weight / 2,
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

  // 竖横比，竖的厚度比横的厚度
  const stress_ratio = 3
  const serif_size = 2.0
  const radius = 10
  const start_length = 30
  const end_length = 100

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_shu_start, out_shu_end, in_shu_start, in_shu_end } = FP.getLineContours('shu', { shu_start: start, shu_end: end }, weight, {
    unticlockwise: true,
  })

  const start_p0 = FP.getPointOnLine(in_shu_start, in_shu_end, start_length * serif_size)
  const start_p3 = FP.getPointOnLine(out_shu_start, out_shu_end, start_length * serif_size * 0.5)
  const start_right_vector_end = FP.turnAngleFromEnd(in_shu_end, start_p0, FP.degreeToRadius(-(15 + 30 * start_style_value * 0.5)), start_length)
  const start_left_vector_end = FP.turnAngleFromEnd(out_shu_end, start_p3, FP.degreeToRadius(10), start_length)
  const start_top_vector_end = FP.turnAngleFromStart(start, in_shu_start, FP.degreeToRadius(-15), start_length)
  const { corner: start_p1 } = FP.getIntersection(
    { type: 'line', start: start_p0, end: start_right_vector_end },
    { type: 'line', start: start, end: start_top_vector_end },
  )
  const { corner: start_p2 } = FP.getIntersection(
    { type: 'line', start: start_p3, end: start_left_vector_end },
    { type: 'line', start: start, end: start_top_vector_end },
  )
  // const start_p1 = start_right_vector_end
  // const start_p2 = start_left_vector_end
  const start_p1_joint = new FP.Joint(
    'start_p1_joint',
    {
      x: start_p1.x,
      y: start_p1.y,
    },
  )
  const start_p2_joint = new FP.Joint(
    'start_p2_joint',
    {
      x: start_p2.x,
      y: start_p2.y,
    },
  )
  glyph.addJoint(start_p1_joint)
  glyph.addJoint(start_p2_joint)
  const start_p1_radius_before = FP.getPointOnLine(start_p1, start_p0, radius)
  const start_p1_radius_after = FP.getPointOnLine(start_p1, start_p2, radius)
  const start_p2_radius_before = FP.getPointOnLine(start_p2, start_p1, radius)
  const start_p2_radius_after = FP.getPointOnLine(start_p2, start_p3, radius)

  const end_p0 = FP.getPointOnLine(out_shu_end, out_shu_start, end_length)
  const end_p1 = FP.getPointOnLine(out_shu_end, out_shu_start, end_length * 0.5)
  const end_p5 = FP.getPointOnLine(in_shu_end, in_shu_start, end_length)
  const end_p4 = FP.getPointOnLine(in_shu_end, in_shu_start, end_length * 0.5)
  const end_right_vector_end = FP.turnAngleFromEnd(end_p5, end_p4, FP.degreeToRadius(10), end_length)
  const end_left_vector_end = FP.turnAngleFromEnd(end_p0, end_p1, FP.degreeToRadius(-10), end_length)
  const end_top_vector_end = FP.turnAngleFromStart(end, in_shu_end, FP.degreeToRadius(15), end_length)
  const { corner: end_p2 } = FP.getIntersection(
    { type: 'line', start: end_p1, end: end_left_vector_end },
    { type: 'line', start: end, end: end_top_vector_end },
  )
  const { corner: end_p3 } = FP.getIntersection(
    { type: 'line', start: end_p4, end: end_right_vector_end },
    { type: 'line', start: end, end: end_top_vector_end },
  )
  const end_p2_radius_before = FP.getPointOnLine(end_p2, end_p1, radius)
  const end_p2_radius_after = FP.getPointOnLine(end_p2, end_p3, radius)
  const end_p3_radius_before = FP.getPointOnLine(end_p3, end_p2, radius)
  const end_p3_radius_after = FP.getPointOnLine(end_p3, end_p4, radius)

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  if (start_style_type === 1) {
    // 绘制起笔衬线
    pen.moveTo(start_p0.x, start_p0.y)
    pen.lineTo(start_p1_radius_before.x, start_p1_radius_before.y)
    pen.quadraticBezierTo(start_p1.x, start_p1.y, start_p1_radius_after.x, start_p1_radius_after.y)
    pen.lineTo(start_p2_radius_before.x, start_p2_radius_before.y)
    pen.quadraticBezierTo(start_p2.x, start_p2.y, start_p2_radius_after.x, start_p2_radius_after.y)
    pen.lineTo(start_p3.x, start_p3.y)
  } else {
    pen.moveTo(in_shu_start.x, in_shu_start.y)
    pen.lineTo(out_shu_start.x, out_shu_start.y)
  }

  if (end_style_type === 1) {
    // 绘制收笔衬线
    pen.lineTo(end_p0.x, end_p0.y)
    pen.quadraticBezierTo(end_p1.x, end_p1.y, end_p2_radius_before.x, end_p2_radius_before.y)
    pen.quadraticBezierTo(end_p2.x, end_p2.y, end_p2_radius_after.x, end_p2_radius_after.y)
    pen.lineTo(end_p3_radius_before.x, end_p3_radius_before.y)
    pen.quadraticBezierTo(end_p3.x, end_p3.y, end_p3_radius_after.x, end_p3_radius_after.y)
    pen.quadraticBezierTo(end_p4.x, end_p4.y, end_p5.x, end_p5.y)
  } else {
    pen.lineTo(out_shu_end.x, out_shu_end.y)
    pen.lineTo(in_shu_end.x, in_shu_end.y)
  }

  if (start_style_type === 1) {
    // 绘制右侧（内侧）轮廓
    pen.lineTo(start_p0.x, start_p0.y)
  } else {
    pen.lineTo(in_shu_start.x, in_shu_start.y)
  }

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)