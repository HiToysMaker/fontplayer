const ox = 500
const oy = 500
const x0 = 300
const y0 = 250
const params = {
  heng_horizontalSpan: glyph.getParam('横-水平延伸'),
  heng_verticalSpan: glyph.getParam('横-竖直延伸'),
  wan_horizontalSpan: glyph.getParam('弯-水平延伸'),
  wan_verticalSpan: glyph.getParam('弯-竖直延伸'),
  wan_bendCursor: glyph.getParam('弯-弯曲游标'),
  wan_bendDegree: glyph.getParam('弯-弯曲度'),
  gou_horizontalSpan: glyph.getParam('钩-水平延伸'),
  gou_verticalSpan: glyph.getParam('钩-竖直延伸'),
  skeletonRefPos: glyph.getParam('参考位置'),
}
const global_params = {
  weights_variation_power: glyph.getParam('字重变化'),
  start_style_type: glyph.getParam('起笔风格'),
  start_style_value: glyph.getParam('起笔数值'),
  turn_style_type: glyph.getParam('转角风格'),
  turn_style_value: glyph.getParam('转角数值'),
  heng_wave_momentum: glyph.getParam('横-拱势'),
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
        y: glyph.tempData['heng_end'].y + deltaY,
      }
      jointsMap['wan_start'] = {
        x: glyph.tempData['wan_start'].x + deltaX,
        y: glyph.tempData['wan_start'].y + deltaY,
      }
      jointsMap['wan_bend'] = {
        x: glyph.tempData['wan_bend'].x + deltaX,
        y: glyph.tempData['wan_bend'].y + deltaY,
      }
      jointsMap['wan_end'] = {
        x: glyph.tempData['wan_end'].x + deltaX,
        y: glyph.tempData['wan_end'].y + deltaY,
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
    case 'wan_start': {
      jointsMap['heng_end'] = {
        x: glyph.tempData['heng_end'].x + deltaX,
        y: glyph.tempData['heng_end'].y + deltaY,
      }
      jointsMap['wan_start'] = {
        x: glyph.tempData['wan_start'].x + deltaX,
        y: glyph.tempData['wan_start'].y + deltaY,
      }
      jointsMap['wan_bend'] = {
        x: glyph.tempData['wan_bend'].x + deltaX,
        y: glyph.tempData['wan_bend'].y + deltaY,
      }
      jointsMap['wan_end'] = {
        x: glyph.tempData['wan_end'].x + deltaX,
        y: glyph.tempData['wan_end'].y + deltaY,
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
  const horizontalSpan = Math.abs(end.x - start.x)
  const verticalSpan = Math.abs(end.y - start.y)
  const cursor_x = start.x + bendCursor * horizontalSpan
  const cursor_y = start.y + bendCursor * verticalSpan
  const angle = Math.atan2(verticalSpan, horizontalSpan)
  
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
  glyph.setParam('横-水平延伸', _params.heng_horizontalSpan)
  glyph.setParam('横-竖直延伸', _params.heng_verticalSpan)
  glyph.setParam('弯-水平延伸', _params.wan_horizontalSpan)
  glyph.setParam('弯-竖直延伸', _params.wan_verticalSpan)
  glyph.setParam('弯-弯曲游标', _params.wan_bendCursor)
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
  const { heng_start, heng_end, wan_start, wan_end, wan_bend, gou_start, gou_end } = jointsMap
  const heng_horizontalSpan_range = glyph.getParamRange('横-水平延伸')
  const heng_verticalSpan_range = glyph.getParamRange('横-竖直延伸')
  const wan_horizontal_span_range = glyph.getParamRange('弯-水平延伸')
  const wan_vertical_span_range = glyph.getParamRange('弯-竖直延伸')
  const wan_bend_cursor_range = glyph.getParamRange('弯-弯曲游标')
  const wan_bend_degree_range = glyph.getParamRange('弯-弯曲度')
  const gou_horizontal_span_range = glyph.getParamRange('钩-水平延伸')
  const gou_vertical_span_range = glyph.getParamRange('钩-竖直延伸')
  const heng_horizontalSpan = range(heng_end.x - heng_start.x, heng_horizontalSpan_range)
  const heng_verticalSpan = range(heng_start.y - heng_end.y, heng_verticalSpan_range)
  const wan_horizontalSpan = range(wan_end.x - wan_start.x, wan_horizontal_span_range)
  const wan_verticalSpan = range(wan_end.y - wan_start.y, wan_vertical_span_range)
  const wan_data = FP.distanceAndFootPoint(wan_start, wan_end, wan_bend)
  const wan_bendCursor = range(wan_data.percentageFromA, wan_bend_cursor_range)
  const wan_bendDegree = range(wan_data.distance, wan_bend_degree_range)
  const gou_horizontalSpan = range(gou_end.x - gou_start.x, gou_horizontal_span_range)
  const gou_verticalSpan = range(gou_start.y - gou_end.y, gou_vertical_span_range)
  return {
    heng_horizontalSpan,
    heng_verticalSpan,
    wan_horizontalSpan,
    wan_verticalSpan,
    wan_bendCursor,
    wan_bendDegree,
    gou_horizontalSpan,
    gou_verticalSpan,
    skeletonRefPos: glyph.getParam('参考位置'),
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    heng_horizontalSpan,
    heng_verticalSpan,
    wan_horizontalSpan,
    wan_verticalSpan,
    wan_bendCursor,
    wan_bendDegree,
    gou_horizontalSpan,
    gou_verticalSpan,
    skeletonRefPos,
  } = params
  const { weight } = global_params

  const _weight = weight * 1.5

  // 横
  let heng_start, heng_end
  const heng_start_ref = new FP.Joint(
    'heng_start_ref',
    {
      x: x0,
      y: y0 + heng_verticalSpan / 2,
    },
  )
  const heng_end_ref = new FP.Joint(
    'heng_end_ref',
    {
      x: heng_start_ref.x + heng_horizontalSpan,
      y: heng_start_ref.y - heng_verticalSpan,
    },
  )
  if (skeletonRefPos === 1) {
    // 骨架参考位置为右侧（上侧）
    heng_start = new FP.Joint(
      'heng_start',
      {
        x: heng_start_ref.x,
        y: heng_start_ref.y + _weight / 2,
      },
    )
    heng_end = new FP.Joint(
      'heng_end',
      {
        x: heng_end_ref.x,
        y: heng_end_ref.y + _weight / 2,
      },
    )
  } else if (skeletonRefPos === 2) {
    // 骨架参考位置为左侧（下侧）
    heng_start = new FP.Joint(
      'heng_start',
      {
        x: heng_start_ref.x,
        y: heng_start_ref.y - _weight / 2,
      },
    )
    heng_end = new FP.Joint(
      'heng_end',
      {
        x: heng_end_ref.x,
        y: heng_end_ref.y - _weight / 2,
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
      x: heng_end.x,
      y: heng_end.y,
    },
  )
  const wan_end = new FP.Joint(
    'wan_end',
    {
      x: wan_start.x + wan_horizontalSpan,
      y: wan_start.y + wan_verticalSpan,
    },
  )
  const wan_length = distance(wan_start, wan_end)
  const wan_cursor_x = wan_start.x + wan_bendCursor * wan_horizontalSpan
  const wan_cursor_y = wan_start.y + wan_bendCursor * wan_verticalSpan
  const wan_angle = Math.atan2(wan_verticalSpan, wan_horizontalSpan)

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
      x: wan_start.x + wan_horizontalSpan,
      y: wan_start.y + wan_verticalSpan,
    },
  )
  const gou_end = new FP.Joint(
    'gou_end',
    {
      x: gou_start.x + gou_horizontalSpan,
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
  let {
    weights_variation_power,
    start_style_type,
    start_style_value,
    turn_style_type,
    turn_style_value,
    bending_degree,
    weight,
    heng_wave_momentum,
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

  const turn_angle_1 = FP.degreeToRadius(10)
  const turn_angle_2 = FP.degreeToRadius(15)
  const end_length = 10
  const radius = 30
  const _weight = weight * 1.5

  // out指右侧（外侧）轮廓线
  // in指左侧（内侧）轮廓线
  const { out_heng_start, out_heng_end, in_heng_start, in_heng_end } = FP.getLineContours('heng', { heng_start, heng_end }, _weight)
  const { out_wan_curves, out_wan_points, in_wan_curves, in_wan_points } = FP.getCurveContours('wan', { wan_start, wan_bend, wan_end }, _weight)
  const { out_gou_start, out_gou_end, in_gou_start, in_gou_end } = FP.getLineContours('gou', { gou_start, gou_end }, _weight, {
    startWeight: _weight,
    endWeight: _weight * 0.25,
  })
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
  const in_radius_data = FP.getRadiusPointsOnCurve(in_wan_points_final, in_radius * 2, true)
  const in_radius_control = FP.getIntersection(
    { type: 'line', start: in_radius_data.tangent.start, end: in_radius_data.tangent.end },
    { type: 'line', start: in_gou_start, end: in_gou_end },
  ).corner
  const in_radius_start = in_radius_data.point
  const in_radius_end = getRadiusPoint({
    start: in_radius_control,
    end: in_gou_end,
    radius: Math.min(in_radius * 2, FP.distance(in_radius_control, in_gou_end) * 0.5),
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

  const end_p5 = out_gou_end
  const end_p4 = in_gou_end
  const end_p0 = in_radius_start
  const end_p1 = FP.getPointOnLine(in_radius_start, in_radius_control, FP.distance(in_radius_start, in_radius_control) * 0.5)
  const end_p3 = in_radius_end
  const end_p2 = FP.getPointOnLine(in_radius_end, in_radius_control, FP.distance(in_radius_end, in_radius_control) * 0.5)
  const end_p4_radius_before = FP.getPointOnLine(end_p4, end_p3, radius)
  const end_p5_radius_after = FP.getPointOnLine(end_p5, out_radius_control, radius)

  const end_p5_joint = new FP.Joint('end_p5_joint', {
    x: end_p5.x,
    y: end_p5.y,
  })
  const end_p4_joint = new FP.Joint('end_p4_joint', {
    x: end_p4.x,
    y: end_p4.y,
  })
  const end_p3_joint = new FP.Joint('end_p3_joint', {
    x: end_p3.x,
    y: end_p3.y,
  })
  const end_p2_joint = new FP.Joint('end_p2_joint', {
    x: end_p2.x,
    y: end_p2.y,
  })
  const end_p1_joint = new FP.Joint('end_p1_joint', {
    x: end_p1.x,
    y: end_p1.y,
  })
  const end_p0_joint = new FP.Joint('end_p0_joint', {
    x: end_p0.x,
    y: end_p0.y,
  })
  glyph.addJoint(end_p5_joint)
  glyph.addJoint(end_p4_joint)
  glyph.addJoint(end_p3_joint)
  glyph.addJoint(end_p2_joint)
  glyph.addJoint(end_p1_joint)
  glyph.addJoint(end_p0_joint)

  // 计算转角所需要的数据
  let turn_data = {}
  {
    const turn_length = 20 * turn_style_value
    const { inner_angle, mid_angle, angle1, angle2 } = FP.getTurnAngles(out_heng_start, out_corner_heng_wan, out_wan_curves_final[0].control1)
    const inner_corner_length = weight
    const corner_radius = (inner_corner_length / 2) / Math.sin(inner_angle / 2)
    const turn_control_1 = FP.getPointOnLine(out_corner_heng_wan, out_heng_start, corner_radius)
    const turn_start_1 = FP.getPointOnLine(turn_control_1, out_heng_start, corner_radius)
    const turn_end_1 = {
      x: turn_control_1.x + turn_length * Math.cos(mid_angle),
      y: turn_control_1.y - turn_length * Math.sin(mid_angle),
    }
    const turn_control_2_data = FP.getRadiusPointsOnCurve(FP.getCurvesPoints(out_wan_curves_final), corner_radius)
    const turn_control_2 = turn_control_2_data.point
    const turn_start_2_data = FP.getRadiusPointsOnCurve(FP.getCurvesPoints(turn_control_2_data.final_curves), corner_radius)
    const turn_start_2 = turn_start_2_data.point
    out_wan_curves_final = turn_start_2_data.final_curves
    const turn_end_2 = {
      x: turn_control_2.x + turn_length * Math.cos(mid_angle),
      y: turn_control_2.y - turn_length * Math.sin(mid_angle),
    }
    turn_data = {
      turn_start_1,
      turn_control_1,
      turn_end_1,
      turn_start_2,
      turn_control_2,
      turn_end_2,
    }
  }

  const leftAngle = FP.degreeToRadius(30)
  const start_length = Math.min(50, FP.distance(heng_start, heng_end) * 0.3)
  const d_2 = _weight * heng_wave_momentum
  const d = 6 + 3 * weights_variation_power
  const l = FP.distance(heng_start, heng_end)
  const control_length = Math.min(l * 0.5 - start_length, l * 0.5 - end_length, 45)

  let out_turn_p2 = FP.turnLeft(out_heng_end, FP.getPointOnLine(out_heng_end, out_heng_start, l * 0.5 - control_length), d)
  let out_turn_p1 = FP.turnLeft(out_heng_end, FP.getPointOnLine(out_heng_end, out_heng_start, l * 0.5), d)
  let out_turn_p0 = FP.turnLeft(out_heng_end, FP.getPointOnLine(out_heng_end, out_heng_start, l * 0.5 + control_length), d)
  let in_turn_p2 = FP.turnRight(in_heng_end, FP.getPointOnLine(in_heng_end, in_heng_start, l * 0.5 - control_length), d)
  let in_turn_p1 = FP.turnRight(in_heng_end, FP.getPointOnLine(in_heng_end, in_heng_start, l * 0.5), d)
  let in_turn_p0 = FP.turnRight(in_heng_end, FP.getPointOnLine(in_heng_end, in_heng_start, l * 0.5 + control_length), d)
  if (FP.distance(heng_start, heng_end) >= 250) {
    out_turn_p2 = FP.turnLeft(out_turn_p0, out_turn_p2, d_2)
    out_turn_p1 = FP.turnLeft(out_turn_p0, out_turn_p1, d_2)
    out_turn_p0 = FP.turnRight(out_turn_p2, out_turn_p0, d_2)
    in_turn_p2 = FP.turnLeft(in_turn_p0, in_turn_p2, d_2)
    in_turn_p1 = FP.turnLeft(in_turn_p0, in_turn_p1, d_2)
    in_turn_p0 = FP.turnRight(in_turn_p2, in_turn_p0, d_2)
  }
  const out_turn_p3 = turn_data.turn_start_1
  const out_turn_p6 = turn_data.turn_control_2
  const turn_p4_vector = FP.turnAngleFromStart(turn_data.turn_control_1, turn_data.turn_end_1, turn_angle_1, 100)
  const turn_p5_vector = FP.turnAngleFromStart(out_turn_p6, turn_data.turn_end_2, -turn_angle_2, 100)
  const { corner: out_turn_p4 } = FP.getIntersection(
    { type: 'line', start: turn_data.turn_control_1, end: turn_p4_vector },
    { type: 'line', start: turn_data.turn_end_2, end: turn_data.turn_end_1 }
  )
  const { corner: out_turn_p5 } = FP.getIntersection(
    { type: 'line', start: out_turn_p6, end: turn_p5_vector },
    { type: 'line', start: turn_data.turn_end_2, end: turn_data.turn_end_1 }
  )
  const in_turn_p3 = in_corner_heng_wan

  const out_turn_p4_radius_before = FP.getPointOnLine(out_turn_p4, out_turn_p3, FP.distance(out_turn_p4, out_turn_p3) * 0.7)
  const out_turn_p4_radius_after = FP.getPointOnLine(out_turn_p4, out_turn_p5, FP.distance(out_turn_p4, out_turn_p5) * 0.4)
  const out_turn_p5_radius_before = FP.getPointOnLine(out_turn_p5, out_turn_p4, FP.distance(out_turn_p5, out_turn_p4) * 0.4)
  const out_turn_p5_radius_after = FP.getPointOnLine(out_turn_p5, out_turn_p6, FP.distance(out_turn_p5, out_turn_p6) * 0.7)

  const start_p4 = heng_start
  const start_p5 = FP.turnAngleFromEnd(heng_end, heng_start, FP.degreeToRadius(90) - leftAngle, _weight * 0.6)
  const start_p3 = FP.turnAngleFromEnd(heng_end, heng_start, -(FP.degreeToRadius(90) + leftAngle), _weight * 0.75)
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
  pen.quadraticBezierTo(in_turn_p2.x, in_turn_p2.y, in_turn_p3.x, in_turn_p3.y)

  pen.lineTo(in_wan_curves_final[0].start.x, in_wan_curves_final[0].start.y)
  for (let i = 0; i < in_wan_curves_final.length; i++) {
    const curve = in_wan_curves_final[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }
  
  // 绘制钩
  pen.bezierTo(end_p1.x, end_p1.y, end_p2.x, end_p2.y, end_p3.x, end_p3.y)
  pen.lineTo(end_p4_radius_before.x, end_p4_radius_before.y)
  pen.bezierTo(end_p4.x, end_p4.y, end_p5.x, end_p5.y, end_p5_radius_after.x, end_p5_radius_after.y)
  pen.lineTo(out_radius_end.x, out_radius_end.y)
  pen.quadraticBezierTo(out_radius_control.x, out_radius_control.y, out_radius_start.x, out_radius_start.y)


  for (let i = out_wan_curves_final.length - 1; i >= 0; i--) {
    const curve = out_wan_curves_final[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }
  pen.quadraticBezierTo(out_turn_p6.x, out_turn_p6.y, out_turn_p5_radius_after.x, out_turn_p5_radius_after.y)
  pen.quadraticBezierTo(out_turn_p5.x, out_turn_p5.y, out_turn_p5_radius_before.x, out_turn_p5_radius_before.y)
  pen.lineTo(out_turn_p4_radius_after.x, out_turn_p4_radius_after.y)
  pen.quadraticBezierTo(out_turn_p4.x, out_turn_p4.y, out_turn_p4_radius_before.x, out_turn_p4_radius_before.y)
  pen.bezierTo(out_turn_p3.x, out_turn_p3.y, out_turn_p2.x, out_turn_p2.y, out_turn_p1.x, out_turn_p1.y)
  pen.quadraticBezierTo(out_turn_p0.x, out_turn_p0.y, start_p0.x, start_p0.y)

  pen.closePath()
  return [pen]
}

updateGlyphByParams(params, global_params)