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
  stress_ratio: glyph.getParam('竖横比'),
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
  let { draggingJoint, deltaX, deltaY } = data
  const jointsMap = Object.assign({}, glyph.tempData)
  switch (draggingJoint.name) {
    case 'end': {
      const vertical_span_range = glyph.getParamRange('竖直延伸')
      deltaY = range(deltaY, vertical_span_range)
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
    stress_ratio,
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

  // 竖横比，竖的厚度比横的厚度
  const serif_size = 2.0
  const radius = 10
  const _weight = weight / stress_ratio
  const a = _weight * 3 * end_style_value//serif_size
  const b = a * Math.cos(FP.degreeToRadius(50)) * 2

  // out指上侧（外侧）轮廓线
  // in指下侧（内侧）轮廓线
  const { out_heng_start, out_heng_end, in_heng_start, in_heng_end } = FP.getLineContours('heng', { heng_start: start, heng_end: end }, _weight)

  const end_p0 = FP.getPointOnLine(in_heng_end, in_heng_start, b)
  const end_p1 = in_heng_end
  const end_p2 = FP.turnAngleFromEnd(end_p0, end_p1, FP.degreeToRadius(130), a)
  const { corner: end_p3 } = FP.getIntersection(
    { type: 'line', start: end_p2, end: end_p0 },
    { type: 'line', start: out_heng_start, end: out_heng_end },
  )
  const end_p1_radius_before = FP.getPointOnLine(end_p1, end_p0, radius)
  const end_p1_radius_after = FP.getPointOnLine(end_p1, end_p2, radius)
  const end_p2_radius_before = FP.getPointOnLine(end_p2, end_p1, radius)
  const end_p2_radius_after = FP.getPointOnLine(end_p2, end_p3, radius)

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  // 绘制横的下侧轮廓
  pen.moveTo(in_heng_start.x, in_heng_start.y)

  if (end_style_type === 1) {
    // 绘制衬线
    pen.lineTo(end_p0.x, end_p0.y)
    pen.lineTo(end_p1_radius_before.x, end_p1_radius_before.y)
    pen.quadraticBezierTo(end_p1.x, end_p1.y, end_p1_radius_after.x, end_p1_radius_after.y)
    pen.lineTo(end_p2_radius_before.x, end_p2_radius_before.y)
    pen.quadraticBezierTo(end_p2.x, end_p2.y, end_p2_radius_after.x, end_p2_radius_after.y)
    pen.lineTo(end_p3.x, end_p3.y)
  } else {
    pen.lineTo(in_heng_end.x, in_heng_end.y)
    pen.lineTo(out_heng_end.x, out_heng_end.y)
  }

  // 绘制横的上侧轮廓
  pen.lineTo(out_heng_start.x, out_heng_start.y)

  // 绘制轮廓连接线
  pen.lineTo(in_heng_start.x, in_heng_start.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)