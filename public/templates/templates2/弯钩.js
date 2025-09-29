const ox = 500
const oy = 500
const x0 = 500
const y0 = 250
const global_params = {
  weights_variation_power: glyph.getParam('字重变化'),
  start_style_type: glyph.getParam('起笔风格'),
  start_style_value: glyph.getParam('起笔数值'),
  turn_style_type: glyph.getParam('转角风格'),
  turn_style_value: glyph.getParam('转角数值'),
  bending_degree: glyph.getParam('弯曲程度'),
  weight: glyph.getParam('字重') || 40,
}
const params = {
  wan_length: glyph.getParam('弯-长度'),
  wan_bendDegree: glyph.getParam('弯-弯曲度') + 30 * global_params.bending_degree,
  gou_horizontalSpan: glyph.getParam('钩-水平延伸'),
  gou_verticalSpan: glyph.getParam('钩-竖直延伸'),
}

const refline = (p1, p2) => {
  return {
    name: `${p1.name}-${p2.name}`,
    start: p1.name,
    end: p2.name,
  }
}

const distance = (p1, p2) => {
  return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y))
}

const getJointsMap = (data) => {
  const { draggingJoint, deltaX, deltaY } = data
  const jointsMap = Object.assign({}, glyph.tempData)
  switch (draggingJoint.name) {
    case 'wan_bend': {
      jointsMap['wan_bend'] = {
        x: glyph.tempData['wan_bend'].x + deltaX,
        y: glyph.tempData['wan_bend'].y,
      }
      break
    }
    case 'wan_end': {
      jointsMap['wan_end'] = {
        x: glyph.tempData['wan_end'].x,
        y: glyph.tempData['wan_end'].y + deltaY,
      }
      jointsMap['gou_start'] = {
        x: glyph.tempData['gou_start'].x,
        y: glyph.tempData['gou_start'].y + deltaY,
      }
      jointsMap['gou_end'] = {
        x: glyph.tempData['gou_end'].x,
        y: glyph.tempData['gou_end'].y + deltaY,
      }
      const newBend = getBend(jointsMap['wan_start'], jointsMap['wan_end'])
      jointsMap['wan_bend'] = {
        x: newBend.x,
        y: newBend.y,
      }
      break
    }
    case 'gou_start': {
      jointsMap['wan_end'] = {
        x: glyph.tempData['wan_end'].x,
        y: glyph.tempData['wan_end'].y + deltaY,
      }
      jointsMap['gou_start'] = {
        x: glyph.tempData['gou_start'].x,
        y: glyph.tempData['gou_start'].y + deltaY,
      }
      jointsMap['gou_end'] = {
        x: glyph.tempData['gou_end'].x,
        y: glyph.tempData['gou_end'].y + deltaY,
      }
      const newBend = getBend(jointsMap['wan_start'], jointsMap['wan_end'])
      jointsMap['wan_bend'] = {
        x: newBend.x,
        y: newBend.y,
      }
      break
    }
    case 'gou_end': {
      jointsMap['gou_end'] = {
        x: glyph.tempData['gou_end'].x + deltaX,
        y: glyph.tempData['gou_end'].y + deltaY,
      }
      break
    }
  }
  return jointsMap
}

const getBend = (start, end) => {
  // 改变end的情况下，不会改变弯曲度和弯曲游标，所以依据现有参数计算新的bend
  const { wan_bendDegree: bendDegree } = params
  const verticalSpan = Math.abs(end.y - start.y)
  const bend = {
    x: start.x + bendDegree,
    y: start.y + verticalSpan / 2,
  }

  return bend
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
  glyph.setParam('弯-长度', _params.wan_length)
  glyph.setParam('弯-弯曲度', _params.wan_bendDegree - 30 * global_params.bending_degree)
  glyph.setParam('钩-水平延伸', _params.gou_horizontalSpan)
  glyph.setParam('钩-竖直延伸', _params.gou_verticalSpan)
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
  const { wan_start, wan_end, wan_bend, gou_start, gou_end } = jointsMap
  const wan_length_range = glyph.getParamRange('弯-长度')
  const wan_bend_degree_range = glyph.getParamRange('弯-弯曲度')
  const gou_horizontal_span_range = glyph.getParamRange('钩-水平延伸')
  const gou_vertical_span_range = glyph.getParamRange('钩-竖直延伸')
  const wan_length = range(wan_end.y - wan_start.y, wan_length_range)
  const wan_bendDegree = range(wan_bend.x - wan_start.x, wan_bend_degree_range)
  const gou_horizontalSpan = range(gou_start.x - gou_end.x, gou_horizontal_span_range)
  const gou_verticalSpan = range(gou_end.y - gou_start.y, gou_vertical_span_range)
  return {
    wan_length,
    wan_bendDegree,
    gou_horizontalSpan,
    gou_verticalSpan,
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    wan_length,
    wan_bendDegree,
    gou_horizontalSpan,
    gou_verticalSpan,
  } = params

  // 弯
  const wan_start = new FP.Joint(
    'wan_start',
    {
      x: x0,
      y: y0,
    },
  )
  const wan_end = new FP.Joint(
    'wan_end',
    {
      x: wan_start.x,
      y: wan_start.y + wan_length,
    },
  )
  const wan_bend = new FP.Joint(
    'wan_bend',
    {
      x: wan_start.x + wan_bendDegree,
      y: wan_start.y + wan_length / 2,
    },
  )

  // 钩
  const gou_start = new FP.Joint(
    'gou_start',
    {
      x: wan_start.x,
      y: wan_start.y + wan_length,
    },
  )
  const gou_end = new FP.Joint(
    'gou_end',
    {
      x: gou_start.x - gou_horizontalSpan,
      y: gou_start.y + gou_verticalSpan,
    },
  )

  glyph.addJoint(wan_start)
  glyph.addJoint(wan_bend)
  glyph.addJoint(wan_end)
  glyph.addJoint(gou_start)
  glyph.addJoint(gou_end)

  const skeleton = {
    wan_start,
    wan_bend,
    wan_end,
    gou_start,
    gou_end,
  }

  glyph.addRefLine(refline(wan_start, wan_bend))
  glyph.addRefLine(refline(wan_bend, wan_end))
  glyph.addRefLine(refline(gou_start, gou_end))

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
    turn_style_type,
    turn_style_value,
    bending_degree,
    weight,
  } = global_params

  const getDistance = (p1, p2) => {
    if(!p1 || !p2) return 0
    return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y))
  }
  
  const getRadiusPoint = (options) => {
    const { start, end, radius } = options
    const angle = Math.atan2(end.y - start.y, end.x - start.x)
    const point = {
      x: start.x + Math.cos(angle) * radius,
      y: start.y + Math.sin(angle) * radius,
    }
    return point
  }

  // 根据骨架计算轮廓关键点
  const {
    wan_start,
    wan_bend,
    wan_end,
    gou_start,
    gou_end,
  } = skeleton

  // out指右侧（外侧）轮廓线
  // in指左侧（内侧）轮廓线
  const { out_wan_curves, out_wan_points, in_wan_curves, in_wan_points } = FP.getCurveContours('wan', { wan_start, wan_bend, wan_end }, weight)
  const { out_gou_start, out_gou_end, in_gou_start, in_gou_end } = FP.getLineContours('gou', { gou_start, gou_end }, weight)
  const { corner: in_corner_wan_gou } = FP.getIntersection(
    { type: 'line', start: in_wan_curves[in_wan_curves.length - 1].control2, end: in_wan_curves[in_wan_curves.length - 1].end },
    { type: 'line', start: in_gou_start, end: in_gou_end },
  )
  const { corner: out_corner_wan_gou } = FP.getIntersection(
    { type: 'line', start: out_wan_curves[out_wan_curves.length - 1].control2, end: out_wan_curves[out_wan_curves.length - 1].end },
    { type: 'line', start: out_gou_start, end: out_gou_end },
  )
  // 内侧弯曲线最后一个控制点使用in_corner_wan_gou
  in_wan_curves[in_wan_curves.length - 1].end = in_corner_wan_gou

  // 计算弯钩拐角处内外圆角相关的点与数据
  let in_radius = 30 * bending_degree
  let out_radius = 30 * bending_degree
  // 如果in_radius超出钩或弯的长度，取钩或弯的最小长度
  const in_radius_min_length = Math.min(
    getDistance(in_corner_wan_gou, in_gou_end),
    getDistance(in_corner_wan_gou, in_wan_curves[0].start),
  )
  const out_radius_min_length = Math.min(
    getDistance(gou_start, gou_end),
    getDistance(out_wan_curves[0].start, out_wan_curves[out_wan_curves.length - 1].end),
  )
  if (in_radius >= in_radius_min_length) {
    in_radius = in_radius_min_length
  }
  if (out_radius >= out_radius_min_length) {
    out_radius = out_radius_min_length
  }
  const in_radius_data = FP.getRadiusPointsOnCurve(FP.getCurvesPoints(in_wan_curves), in_radius, true)
  const in_radius_control = FP.getIntersection(
    { type: 'line', start: in_radius_data.tangent.start, end: in_radius_data.tangent.end },
    { type: 'line', start: in_gou_start, end: in_gou_end },
  ).corner
  const in_radius_start = in_radius_data.point
  const in_radius_end = getRadiusPoint({
    start: in_radius_control,
    end: in_gou_end,
    radius: in_radius,
  })
  const out_radius_data = FP.getRadiusPointsOnCurve(FP.getCurvesPoints(out_wan_curves), out_radius, true)
  const out_radius_control = FP.getIntersection(
    { type: 'line', start: out_radius_data.tangent.start, end: out_radius_data.tangent.end },
    { type: 'line', start: out_gou_start, end: out_gou_end },
  ).corner
  const out_radius_start = out_radius_data.point
  const out_radius_end = getRadiusPoint({
    start: out_radius_control,
    end: out_gou_end,
    radius: out_radius,
  })
  const in_wan_curves_final = in_radius_data.final_curves
  const out_wan_curves_final = out_radius_data.final_curves

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  // 绘制左侧（内侧）侧轮廓
  pen.moveTo(in_wan_curves_final[0].start.x, in_wan_curves_final[0].start.y)
  for (let i = 0; i < in_wan_curves_final.length; i++) {
    const curve = in_wan_curves_final[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }
  // 绘制内侧圆角
  pen.quadraticBezierTo(in_radius_control.x, in_radius_control.y, in_radius_end.x, in_radius_end.y)
  pen.lineTo(in_gou_end.x, in_gou_end.y)

  // 绘制轮廓连接线
  pen.lineTo(out_gou_end.x, out_gou_end.y)

  // 绘制右侧（外侧）侧轮廓
  pen.lineTo(out_radius_end.x, out_radius_end.y)
  // 绘制外侧圆角
  pen.quadraticBezierTo(out_radius_control.x, out_radius_control.y, out_radius_start.x, out_radius_start.y)
  for (let i = out_wan_curves_final.length - 1; i >= 0; i--) {
    const curve = out_wan_curves_final[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }

  // 绘制轮廓连接线
  pen.lineTo(in_wan_curves_final[0].start.x, in_wan_curves_final[0].start.y)


  // // 按顺时针方向绘制轮廓
  // // 绘制右侧（外侧）侧轮廓
  // pen.moveTo(out_wan_curves_final[0].start.x, out_wan_curves_final[0].start.y)
  // for (let i = 0; i < out_wan_curves_final.length; i++) {
  //   const curve = out_wan_curves_final[i]
  //   pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  // }
  // // 绘制外侧圆角
  // pen.quadraticBezierTo(out_radius_control.x, out_radius_control.y, out_radius_end.x, out_radius_end.y)
  // pen.lineTo(out_gou_end.x, out_gou_end.y)

  // // 绘制轮廓连接线
  // pen.lineTo(in_gou_end.x, in_gou_end.y)

  // // 绘制左侧（内侧）侧轮廓
  // // 绘制内侧圆角
  // pen.lineTo(in_radius_end.x, in_radius_end.y)
  // pen.quadraticBezierTo(in_radius_control.x, in_radius_control.y, in_radius_start.x, in_radius_start.y)
  // for (let i = in_wan_curves_final.length - 1; i >= 0; i--) {
  //   const curve = in_wan_curves_final[i]
  //   pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  // }

  // // 绘制轮廓连接线
  // pen.lineTo(out_wan_curves[0].start.x, out_wan_curves[0].start.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)