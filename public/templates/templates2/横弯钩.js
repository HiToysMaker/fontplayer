const ox = 500
const oy = 500
const x0 = 300
const y0 = 250
const params = {
  heng_length: glyph.getParam('横-长度'),
  wan_horizonalSpan: glyph.getParam('弯-水平延伸'),
  wan_verticalSpan: glyph.getParam('弯-竖直延伸'),
  wan_bendCursor: glyph.getParam('弯-弯曲游标'),
  wan_bendDegree: glyph.getParam('弯-弯曲度'),
  gou_horizonalSpan: glyph.getParam('钩-水平延伸'),
  gou_verticalSpan: glyph.getParam('钩-竖直延伸'),
  skeletonRefPos: glyph.getParam('参考位置'),
}
const global_params = {
  weights_variation_power: glyph.getParam('字重变化'),
  start_style_type: glyph.getParam('起笔风格'),
  start_style_value: glyph.getParam('起笔数值'),
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

const distance = (p1, p2) => {
  return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y))
}

const getJointsMap = (data) => {
  const { draggingJoint, deltaX, deltaY } = data
  const jointsMap = Object.assign({}, glyph.tempData)
  switch (draggingJoint.name) {
    case 'heng_end': {
      jointsMap['heng_end'] = {
        x: glyph.tempData['heng_end'].x + deltaX,
        y: glyph.tempData['heng_end'].y,
      }
      jointsMap['wan_start'] = {
        x: glyph.tempData['wan_start'].x + deltaX,
        y: glyph.tempData['wan_start'].y,
      }
      jointsMap['wan_bend'] = {
        x: glyph.tempData['wan_bend'].x + deltaX,
        y: glyph.tempData['wan_bend'].y,
      }
      jointsMap['wan_end'] = {
        x: glyph.tempData['wan_end'].x + deltaX,
        y: glyph.tempData['wan_end'].y,
      }
      jointsMap['gou_start'] = {
        x: glyph.tempData['gou_start'].x + deltaX,
        y: glyph.tempData['gou_start'].y,
      }
      jointsMap['gou_end'] = {
        x: glyph.tempData['gou_end'].x + deltaX,
        y: glyph.tempData['gou_end'].y,
      }
      break
    }
    case 'wan_start': {
      jointsMap['heng_end'] = {
        x: glyph.tempData['heng_end'].x + deltaX,
        y: glyph.tempData['heng_end'].y,
      }
      jointsMap['wan_start'] = {
        x: glyph.tempData['wan_start'].x + deltaX,
        y: glyph.tempData['wan_start'].y,
      }
      jointsMap['wan_bend'] = {
        x: glyph.tempData['wan_bend'].x + deltaX,
        y: glyph.tempData['wan_bend'].y,
      }
      jointsMap['wan_end'] = {
        x: glyph.tempData['wan_end'].x + deltaX,
        y: glyph.tempData['wan_end'].y,
      }
      jointsMap['gou_start'] = {
        x: glyph.tempData['gou_start'].x + deltaX,
        y: glyph.tempData['gou_start'].y,
      }
      jointsMap['gou_end'] = {
        x: glyph.tempData['gou_end'].x + deltaX,
        y: glyph.tempData['gou_end'].y,
      }
      break
    }
    case 'wan_bend': {
      jointsMap['wan_bend'] = {
        x: glyph.tempData['wan_bend'].x + deltaX,
        y: glyph.tempData['wan_bend'].y + deltaY,
      }
      break
    }
    case 'wan_end': {
      jointsMap['wan_end'] = {
        x: glyph.tempData['wan_end'].x + deltaX,
        y: glyph.tempData['wan_end'].y + deltaY,
      }
      const newBend = getBend(jointsMap['wan_start'], jointsMap['wan_end'])
      jointsMap['wan_bend'] = {
        x: newBend.x,
        y: newBend.y,
      }
      jointsMap['gou_start'] = {
        x: glyph.tempData['gou_start'].x + deltaX,
        y: glyph.tempData['gou_start'].y + deltaY,
      }
      jointsMap['gou_end'] = {
        x: glyph.tempData['gou_end'].x + deltaX,
        y: glyph.tempData['gou_end'].y + deltaY,
      }
      break
    }
    case 'gou_start': {
      jointsMap['wan_end'] = {
        x: glyph.tempData['wan_end'].x + deltaX,
        y: glyph.tempData['wan_end'].y + deltaY,
      }
      const newBend = getBend(jointsMap['wan_start'], jointsMap['wan_end'])
      jointsMap['wan_bend'] = {
        x: newBend.x,
        y: newBend.y,
      }
      jointsMap['gou_start'] = {
        x: glyph.tempData['gou_start'].x + deltaX,
        y: glyph.tempData['gou_start'].y + deltaY,
      }
      jointsMap['gou_end'] = {
        x: glyph.tempData['gou_end'].x + deltaX,
        y: glyph.tempData['gou_end'].y + deltaY,
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
  const { wan_bendCursor: bendCursor, wan_bendDegree: bendDegree } = params
  const horizonalSpan = Math.abs(end.x - start.x)
  const verticalSpan = Math.abs(end.y - start.y)
  const cursor_x = start.x + bendCursor * horizonalSpan
  const cursor_y = start.y + bendCursor * verticalSpan
  const angle = Math.atan2(verticalSpan, horizonalSpan)
  
  const bend = {
    x: cursor_x - bendDegree * Math.sin(angle),
    y: cursor_y + bendDegree * Math.cos(angle),
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
  glyph.setParam('横-长度', _params.heng_length)
  glyph.setParam('弯-水平延伸', _params.wan_horizonalSpan)
  glyph.setParam('弯-竖直延伸', _params.wan_verticalSpan)
  glyph.setParam('弯-弯曲游标', _params.wan_bendCursor)
  glyph.setParam('弯-弯曲度', _params.wan_bendDegree - 30 * global_params.bending_degree)
  glyph.setParam('钩-水平延伸', _params.gou_horizonalSpan)
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
  const { heng_start, heng_end, wan_start, wan_end, wan_bend, gou_start, gou_end } = jointsMap
  const heng_length_range = glyph.getParamRange('横-长度')
  const wan_horizonal_span_range = glyph.getParamRange('弯-水平延伸')
  const wan_vertical_span_range = glyph.getParamRange('弯-竖直延伸')
  const wan_bend_cursor_range = glyph.getParamRange('弯-弯曲游标')
  const wan_bend_degree_range = glyph.getParamRange('弯-弯曲度')
  const gou_horizonal_span_range = glyph.getParamRange('钩-水平延伸')
  const gou_vertical_span_range = glyph.getParamRange('钩-竖直延伸')
  const heng_length = range(heng_end.x - heng_start.x, heng_length_range)
  const wan_horizonalSpan = range(wan_end.x - wan_start.x, wan_horizonal_span_range)
  const wan_verticalSpan = range(wan_end.y - wan_start.y, wan_vertical_span_range)
  const wan_data = FP.distanceAndFootPoint(wan_start, wan_end, wan_bend)
  const wan_bendCursor = range(wan_data.percentageFromA, wan_bend_cursor_range)
  const wan_bendDegree = range(wan_data.distance, wan_bend_degree_range)
  const gou_horizonalSpan = range(gou_end.x - gou_start.x, gou_horizonal_span_range)
  const gou_verticalSpan = range(gou_start.y - gou_end.y, gou_vertical_span_range)
  return {
    heng_length,
    wan_horizonalSpan,
    wan_verticalSpan,
    wan_bendCursor,
    wan_bendDegree,
    gou_horizonalSpan,
    gou_verticalSpan,
    skeletonRefPos: glyph.getParam('参考位置'),
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    heng_length,
    wan_horizonalSpan,
    wan_verticalSpan,
    wan_bendCursor,
    wan_bendDegree,
    gou_horizonalSpan,
    gou_verticalSpan,
    skeletonRefPos,
  } = params
  const { weight } = global_params

  // 横
  let heng_start, heng_end
  const heng_start_ref = new FP.Joint(
    'heng_start_ref',
    {
      x: x0,
      y: y0,
    },
  )
  const heng_end_ref = new FP.Joint(
    'heng_end_ref',
    {
      x: heng_start_ref.x + heng_length,
      y: heng_start_ref.y,
    },
  )
  if (skeletonRefPos === 1) {
    // 骨架参考位置为右侧（上侧）
    heng_start = new FP.Joint(
      'heng_start',
      {
        x: heng_start_ref.x,
        y: heng_start_ref.y + weight / 2,
      },
    )
    heng_end = new FP.Joint(
      'heng_end',
      {
        x: heng_end_ref.x,
        y: heng_end_ref.y + weight / 2,
      },
    )
  } else if (skeletonRefPos === 2) {
    // 骨架参考位置为左侧（下侧）
    heng_start = new FP.Joint(
      'heng_start',
      {
        x: heng_start_ref.x,
        y: heng_start_ref.y - weight / 2,
      },
    )
    heng_end = new FP.Joint(
      'heng_end',
      {
        x: heng_end_ref.x,
        y: heng_end_ref.y - weight / 2,
      },
    )
  } else {
    // 默认骨架参考位置，即骨架参考位置为中间实际绘制的骨架位置
    heng_start = new FP.Joint(
      'heng_start',
      {
        x: heng_start_ref.x,
        y: heng_start_ref.y,
      },
    )
    heng_end = new FP.Joint(
      'heng_end',
      {
        x: heng_end_ref.x,
        y: heng_end_ref.y,
      },
    )
  }
  glyph.addJoint(heng_start_ref)
  glyph.addJoint(heng_end_ref)
  glyph.addRefLine(refline(heng_start_ref, heng_end_ref, 'ref'))

  // 弯
  const wan_start = new FP.Joint(
    'wan_start',
    {
      x: heng_start.x + heng_length,
      y: heng_start.y,
    },
  )
  const wan_end = new FP.Joint(
    'wan_end',
    {
      x: wan_start.x + wan_horizonalSpan,
      y: wan_start.y + wan_verticalSpan,
    },
  )
  const wan_length = distance(wan_start, wan_end)
  const wan_cursor_x = wan_start.x + wan_bendCursor * wan_horizonalSpan
  const wan_cursor_y = wan_start.y + wan_bendCursor * wan_verticalSpan
  const wan_angle = Math.atan2(wan_verticalSpan, wan_horizonalSpan)

  const wan_bend = new FP.Joint(
    'wan_bend',
    {
      x: wan_cursor_x - wan_bendDegree * Math.sin(wan_angle),
      y: wan_cursor_y + wan_bendDegree * Math.cos(wan_angle),
    },
  )

  // 钩
  const gou_start = new FP.Joint(
    'gou_start',
    {
      x: wan_start.x + wan_horizonalSpan,
      y: wan_start.y + wan_verticalSpan,
    },
  )
  const gou_end = new FP.Joint(
    'gou_end',
    {
      x: gou_start.x + gou_horizonalSpan,
      y: gou_start.y - gou_verticalSpan,
    },
  )

  glyph.addJoint(heng_start)
  glyph.addJoint(heng_end)
  glyph.addJoint(wan_start)
  glyph.addJoint(wan_bend)
  glyph.addJoint(wan_end)
  glyph.addJoint(gou_start)
  glyph.addJoint(gou_end)

  const skeleton = {
    heng_start,
    heng_end,
    wan_start,
    wan_bend,
    wan_end,
    gou_start,
    gou_end,
  }

  glyph.addRefLine(refline(heng_start, heng_end))
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
    heng_start,
    heng_end,
    wan_start,
    wan_bend,
    wan_end,
    gou_start,
    gou_end,
  } = skeleton

  // out指右侧（外侧）轮廓线
  // in指左侧（内侧）轮廓线
  const { out_heng_start, out_heng_end, in_heng_start, in_heng_end } = FP.getLineContours('heng', { heng_start, heng_end }, weight)
  const { out_wan_curves, out_wan_points, in_wan_curves, in_wan_points } = FP.getCurveContours('wan', { wan_start, wan_bend, wan_end }, weight)
  const { out_gou_start, out_gou_end, in_gou_start, in_gou_end } = FP.getLineContours('gou', { gou_start, gou_end }, weight)
  const { corner: in_corner_heng_wan, corner_index: in_corner_index_heng_wan } = FP.getIntersection(
    { type: 'curve', points: in_wan_points },
    { type: 'line', start: in_heng_start, end: in_heng_end },
  )
  const { corner: out_corner_heng_wan } = FP.getIntersection(
    { type: 'line', start: out_wan_curves[0].start, end: out_wan_curves[0].control1 },
    { type: 'line', start: out_heng_start, end: out_heng_end },
  )
  const { corner: in_corner_wan_gou } = FP.getIntersection(
    { type: 'line', start: in_wan_curves[in_wan_curves.length - 1].control2, end: in_wan_curves[in_wan_curves.length - 1].end },
    { type: 'line', start: in_gou_start, end: in_gou_end },
  )
  const { corner: out_corner_wan_gou, corner_index: out_corner_index_wan_gou } = FP.getIntersection(
    { type: 'curve', points: out_wan_points },
    { type: 'line', start: out_gou_start, end: out_gou_end },
  )
  let in_wan_points_final = in_wan_points.slice(in_corner_index_heng_wan)
  let { curves: in_wan_curves_final } = FP.fitCurvesByPoints(in_wan_points_final)
  let { curves: out_wan_curves_final } = FP.fitCurvesByPoints(out_wan_points.slice(0, out_corner_index_wan_gou))

  // 计算弯钩拐角处内外圆角相关的点与数据
  let in_radius = 30 * bending_degree
  let out_radius = 30 * bending_degree
  // 如果in_radius超出钩或弯的长度，取钩或弯的最小长度
  const in_radius_min_length = Math.min(
    getDistance(in_gou_start, in_gou_end),
    getDistance(in_wan_curves_final[0].start, in_wan_curves_final[in_wan_curves_final.length - 1].end),
  )
  const out_radius_min_length = Math.min(
    getDistance(out_wan_curves_final[out_wan_curves_final.length - 1].end, out_gou_end),
    getDistance(out_wan_curves_final[0].start, out_wan_curves_final[out_wan_curves_final.length - 1].end),
  )
  if (in_radius >= in_radius_min_length) {
    in_radius = in_radius_min_length
  }
  if (out_radius >= out_radius_min_length) {
    out_radius = out_radius_min_length
  }
  //const in_radius_data = FP.getRadiusPointsOnCurve(FP.getCurvesPoints(in_wan_curves_final), in_radius, true)
  const in_radius_data = FP.getRadiusPointsOnCurve(in_wan_points_final, in_radius, true)
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
  const out_radius_data = FP.getRadiusPointsOnCurve(FP.getCurvesPoints(out_wan_curves_final), out_radius, true)
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
  in_wan_curves_final = in_radius_data.final_curves
  in_wan_points_final = in_wan_points_final.slice(0, in_wan_curves_final.length - in_radius_data.index + 1)
  out_wan_curves_final = out_radius_data.final_curves
  // in_wan_points.map((p, index) => {
  //   glyph.addJoint(new FP.Joint(
  //     'test' + index,
  //     {
  //       x: p.x,
  //       y: p.y,
  //     },
  //   ))
  // })

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 绘制右侧（外侧）侧轮廓
  if (start_style_type === 0) {
    // 无起笔样式
    pen.moveTo(out_heng_start.x, out_corner_heng_wan.y)
  } else if (start_style_type === 1) {
    // 起笔上下凸起长方形
    pen.moveTo(out_heng_start.x, out_corner_heng_wan.y - start_style.start_style_decorator_height)
    pen.lineTo(out_heng_start.x + start_style.start_style_decorator_width, out_corner_heng_wan.y - start_style.start_style_decorator_height)
    pen.lineTo(out_heng_start.x + start_style.start_style_decorator_width, out_corner_heng_wan.y)
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    pen.moveTo(out_heng_start.x, out_corner_heng_wan.y - start_style.start_style_decorator_height)
    pen.lineTo(out_heng_start.x + start_style.start_style_decorator_width, out_corner_heng_wan.y - start_style.start_style_decorator_height)
    pen.quadraticBezierTo(
      out_heng_start.x + start_style.start_style_decorator_width,
      out_corner_heng_wan.y,
      out_heng_start.x + start_style.start_style_decorator_width + start_style.start_style_decorator_radius,
      out_corner_heng_wan.y,
    )
  }
  pen.lineTo(out_corner_heng_wan.x, out_corner_heng_wan.y)
  pen.lineTo(out_wan_curves_final[0].start.x, out_wan_curves_final[0].start.y)
  for (let i = 0; i < out_wan_curves_final.length; i++) {
    const curve = out_wan_curves_final[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }
  // 绘制外侧圆角
  pen.quadraticBezierTo(out_radius_control.x, out_radius_control.y, out_radius_end.x, out_radius_end.y)
  pen.lineTo(out_gou_end.x, out_gou_end.y)

  // 绘制轮廓连接线
  pen.lineTo(in_gou_end.x, in_gou_end.y)

  // 绘制左侧（内侧）侧轮廓
  // 绘制内侧圆角
  pen.lineTo(in_radius_end.x, in_radius_end.y)
  pen.quadraticBezierTo(in_radius_control.x, in_radius_control.y, in_radius_start.x, in_radius_start.y)
  for (let i = in_wan_curves_final.length - 1; i >= 0; i--) {
    const curve = in_wan_curves_final[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }
  if (start_style_type === 0) {
    // 无起笔样式
    pen.lineTo(in_heng_start.x, in_wan_curves_final[0].start.y)
  } else if (start_style_type === 1) {
    // 起笔上下凸起长方形
    pen.lineTo(in_heng_start.x + start_style.start_style_decorator_width, in_wan_curves_final[0].start.y)
    pen.lineTo(in_heng_start.x + start_style.start_style_decorator_width, in_wan_curves_final[0].start.y + start_style.start_style_decorator_height)
    pen.lineTo(in_heng_start.x, in_wan_curves_final[0].start.y + start_style.start_style_decorator_height)
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    pen.lineTo(
      in_heng_start.x + start_style.start_style_decorator_width + start_style.start_style_decorator_radius,
      in_wan_curves_final[0].start.y,
    )
    pen.quadraticBezierTo(
      in_heng_start.x + start_style.start_style_decorator_width,
      in_wan_curves_final[0].start.y,
      in_heng_start.x + start_style.start_style_decorator_width,
      in_wan_curves_final[0].start.y + start_style.start_style_decorator_height,
    )
    pen.lineTo(in_heng_start.x, in_wan_curves_final[0].start.y + start_style.start_style_decorator_height)
  }

  // 绘制轮廓连接线
  if (start_style_type === 0) {
    // 无起笔样式
    pen.lineTo(out_heng_start.x, out_corner_heng_wan.y)
  } else if (start_style_type === 1) {
    // 起笔上下凸起长方形
    pen.lineTo(out_heng_start.x, out_corner_heng_wan.y - start_style.start_style_decorator_height)
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    pen.lineTo(out_heng_start.x, out_corner_heng_wan.y - start_style.start_style_decorator_height)
  }

  pen.closePath()
  return [pen]
}

updateGlyphByParams(params, global_params)