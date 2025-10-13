const ox = 500
const oy = 500
const x0 = 200
const y0 = 575
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
  tiao_horizontalSpan: glyph.getParam('挑-水平延伸'),
  tiao_verticalSpan: glyph.getParam('挑-竖直延伸'),
  na_horizontalSpan: glyph.getParam('捺-水平延伸'),
  na_verticalSpan: glyph.getParam('捺-竖直延伸'),
  na_bendCursor: glyph.getParam('捺-弯曲游标'),
  na_bendDegree: glyph.getParam('捺-弯曲度') + 30 * global_params.bending_degree,
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
    case 'tiao_end': {
      jointsMap['tiao_end'] = {
        x: glyph.tempData['tiao_end'].x + deltaX,
        y: glyph.tempData['tiao_end'].y + deltaY,
      }
      jointsMap['na_start'] = {
        x: glyph.tempData['na_start'].x + deltaX,
        y: glyph.tempData['na_start'].y + deltaY,
      }
      jointsMap['na_bend'] = {
        x: glyph.tempData['na_bend'].x + deltaX,
        y: glyph.tempData['na_bend'].y + deltaY,
      }
      jointsMap['na_end'] = {
        x: glyph.tempData['na_end'].x + deltaX,
        y: glyph.tempData['na_end'].y + deltaY,
      }
      break
    }
    case 'na_start': {
      jointsMap['tiao_end'] = {
        x: glyph.tempData['tiao_end'].x + deltaX,
        y: glyph.tempData['tiao_end'].y + deltaY,
      }
      jointsMap['na_start'] = {
        x: glyph.tempData['na_start'].x + deltaX,
        y: glyph.tempData['na_start'].y + deltaY,
      }
      jointsMap['na_bend'] = {
        x: glyph.tempData['na_bend'].x + deltaX,
        y: glyph.tempData['na_bend'].y + deltaY,
      }
      jointsMap['na_end'] = {
        x: glyph.tempData['na_end'].x + deltaX,
        y: glyph.tempData['na_end'].y + deltaY,
      }
      break
    }
    case 'na_bend': {
      jointsMap['na_bend'] = {
        x: glyph.tempData['na_bend'].x + deltaX,
        y: glyph.tempData['na_bend'].y + deltaY,
      }
      break
    }
    case 'na_end': {
      jointsMap['na_end'] = {
        x: glyph.tempData['na_end'].x + deltaX,
        y: glyph.tempData['na_end'].y + deltaY,
      }
      const newBend = getBend(jointsMap['na_start'], jointsMap['na_end'])
      jointsMap['na_bend'] = {
        x: newBend.x,
        y: newBend.y,
      }
      break
    }
  }
  return jointsMap
}

const getBend = (start, end) => {
  // 改变end的情况下，不会改变弯曲度和弯曲游标，所以依据现有参数计算新的bend
  const { na_bendCursor: bendCursor, na_bendDegree: bendDegree } = params
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
  glyph.setParam('挑-水平延伸', _params.tiao_horizontalSpan)
  glyph.setParam('挑-竖直延伸', _params.tiao_verticalSpan)
  glyph.setParam('捺-水平延伸', _params.na_horizontalSpan)
  glyph.setParam('捺-竖直延伸', _params.na_verticalSpan)
  glyph.setParam('捺-弯曲游标', _params.na_bendCursor)
  glyph.setParam('捺-弯曲度', _params.na_bendDegree - 30 * global_params.bending_degree)
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
  const { tiao_start, tiao_end, na_start, na_end, na_bend } = jointsMap
  const tiao_horizontal_span_range = glyph.getParamRange('挑-水平延伸')
  const tiao_vertical_span_range = glyph.getParamRange('挑-竖直延伸')
  const na_horizontal_span_range = glyph.getParamRange('捺-水平延伸')
  const na_vertical_span_range = glyph.getParamRange('捺-竖直延伸')
  const na_bend_cursor_range = glyph.getParamRange('捺-弯曲游标')
  const na_bend_degree_range = glyph.getParamRange('捺-弯曲度')
  const tiao_horizontalSpan = range(tiao_end.x - tiao_start.x, tiao_horizontal_span_range)
  const tiao_verticalSpan = range(tiao_start.y - tiao_end.y, tiao_vertical_span_range)
  const na_horizontalSpan = range(na_end.x - na_start.x, na_horizontal_span_range)
  const na_verticalSpan = range(na_end.y - na_start.y, na_vertical_span_range)
  const data = FP.distanceAndFootPoint(na_start, na_end, na_bend)
  const na_bendCursor = range(data.percentageFromA, na_bend_cursor_range)
  const na_bendDegree = range(data.distance, na_bend_degree_range)
  return {
    tiao_horizontalSpan,
    tiao_verticalSpan,
    na_horizontalSpan,
    na_verticalSpan,
    na_bendCursor,
    na_bendDegree,
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    tiao_horizontalSpan,
    tiao_verticalSpan,
    na_horizontalSpan,
    na_verticalSpan,
    na_bendCursor,
    na_bendDegree,
  } = params

  // 挑
  const tiao_start = new FP.Joint(
    'tiao_start',
    {
      x: x0,
      y: y0,
    },
  )
  const tiao_end = new FP.Joint(
    'tiao_end',
    {
      x: tiao_start.x + tiao_horizontalSpan,
      y: tiao_start.y - tiao_verticalSpan,
    },
  )

  // 捺
  const na_start = new FP.Joint(
    'na_start',
    {
      x: tiao_start.x + tiao_horizontalSpan,
      y: tiao_start.y - tiao_verticalSpan,
    },
  )
  const na_end = new FP.Joint(
    'na_end',
    {
      x: na_start.x + na_horizontalSpan,
      y: na_start.y + na_verticalSpan,
    },
  )

  const na_bend = new FP.Joint(
    'na_bend',
    {
      x: na_start.x + na_horizontalSpan * na_bendCursor,
      y: na_start.y + na_bendDegree,
    },
  )

  glyph.addJoint(tiao_start)
  glyph.addJoint(tiao_end)
  glyph.addJoint(na_start)
  glyph.addJoint(na_end)
  glyph.addJoint(na_bend)

  const skeleton = {
    tiao_start,
    tiao_end,
    na_start,
    na_bend,
    na_end,
  }

  glyph.addRefLine(refline(tiao_start, tiao_end))
  glyph.addRefLine(refline(na_start, na_bend))
  glyph.addRefLine(refline(na_bend, na_end))

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

  // 根据骨架计算轮廓关键点
  const {
    tiao_start,
    tiao_end,
    na_start,
    na_bend,
    na_end,
  } = skeleton

  // 竖横比，竖的厚度比横的厚度
  const stress_ratio = 3
  const serif_size = 2.0
  const radius = 10
  const start_length = 30
  const end_length = 100
  const _weight = weight * 1.8

  // in指左侧（外侧）轮廓线
  // out指右侧（内侧）轮廓线
  const { out_tiao_start, out_tiao_end, in_tiao_start, in_tiao_end } = FP.getLineContours('tiao', { tiao_start, tiao_end }, _weight, {
    unticlockwise: true,
    endWeight: weight * 0.1,
  })
  const { out_na_curves, out_na_points, in_na_curves, in_na_points } = FP.getCurveContours('na', { na_start, na_bend, na_end }, _weight, {
    unticlockwise: true,
    startWeight: weight * 0.1,
    weightsVariation: 'bezier',
    weightsVariationPower: weights_variation_power,
  })
  const { corner: in_corner_tiao_na } = FP.getIntersection(
    { type: 'line', start: in_tiao_start, end: in_tiao_end },
    { type: 'line', start: in_na_curves[0].start, end: in_na_curves[0].control1 },
  )
  const { corner: out_corner_tiao_na, corner_index: out_corner_index_tiao_na } = FP.getIntersection(
    { type: 'curve', points: out_na_points },
    { type: 'line', start: out_tiao_start, end: out_tiao_end },
  )
  let { curves: out_na_curves_final } = FP.fitCurvesByPoints(out_na_points.slice(out_corner_index_tiao_na))

  const end_data = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(out_na_curves_final),
    end_length,
    true,
  )
  out_na_curves_final = end_data.final_curves
  const end_p0 = end_data.point
  const end_p1 = FP.goStraight(out_na_curves_final[out_na_curves_final.length - 1].control2, end_p0, end_length * 0.3)
  const end_p2 = FP.turnAngleFromEnd(end_p0, end_p1, FP.degreeToRadius(-15), end_length * 0.3)
  const end_bottom_vector_end = FP.turnAngleFromStart(na_end, in_na_curves[in_na_curves.length - 1].end, FP.degreeToRadius(-30), end_length)
  let { corner: end_p4 } = FP.getIntersection(
    { type: 'line', start: na_end, end: end_bottom_vector_end, },
    { type: 'line', start: in_na_curves[in_na_curves.length - 1].control2, end: in_na_curves[in_na_curves.length - 1].end }
  )
  end_p4 = FP.goStraight(in_na_curves[in_na_curves.length - 1].end, end_p4, 0.1 * end_length)
  const end_p3 = na_end
  const end_p2_radius_before = FP.getPointOnLine(end_p2, end_p1, radius)
  const end_p2_radius_after = FP.getPointOnLine(end_p2, end_p3, radius)
  const end_p4_radius_before = FP.getPointOnLine(end_p4, end_p3, radius * 0.5)
  const end_p4_radius_after = FP.getPointOnLine(end_p4, in_na_curves[in_na_curves.length - 1].end, radius * 0.5)

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  // 绘制横的右侧（内侧）轮廓
  pen.moveTo(out_tiao_start.x, out_tiao_start.y)
  pen.lineTo(out_corner_tiao_na.x, out_corner_tiao_na.y)
  for (let i = 0; i < out_na_curves_final.length; i++) {
    const curve = out_na_curves_final[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }

  // 绘制收笔样式
  pen.quadraticBezierTo(end_p1.x, end_p1.y, end_p2_radius_before.x, end_p2_radius_before.y)
  pen.quadraticBezierTo(end_p2.x, end_p2.y, end_p2_radius_after.x, end_p2_radius_after.y)
  pen.quadraticBezierTo(end_p3.x, end_p3.y, end_p4_radius_before.x, end_p4_radius_before.y)
  pen.quadraticBezierTo(end_p4.x, end_p4.y, end_p4_radius_after.x, end_p4_radius_after.y)
  
  // 绘制轮廓连接线
  pen.lineTo(in_na_curves[in_na_curves.length - 1].end.x, in_na_curves[in_na_curves.length - 1].end.y)

  // 绘制左侧（外侧）轮廓
  for (let i = in_na_curves.length - 1; i >= 0; i--) {
    const curve = in_na_curves[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }
  pen.lineTo(in_corner_tiao_na.x, in_corner_tiao_na.y)
  pen.lineTo(in_tiao_start.x, in_tiao_start.y)

  // 绘制轮廓连接线
  pen.lineTo(out_tiao_start.x, out_tiao_start.y)


  // // 按顺时针方向绘制轮廓
  // // 绘制左侧（外侧）轮廓
  // pen.moveTo(in_tiao_start.x, in_tiao_start.y)
  // pen.lineTo(in_corner_tiao_na.x, in_corner_tiao_na.y)
  // for (let i = 0; i < in_na_curves.length; i++) {
  //   const curve = in_na_curves[i]
  //   pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  // }

  // // 绘制轮廓连接线
  // pen.lineTo(out_na_curves_final[out_na_curves_final.length - 1].end.x, out_na_curves_final[out_na_curves_final.length - 1].end.y)

  // // 绘制横的右侧（内侧）轮廓
  // for (let i = out_na_curves_final.length - 1; i >= 0; i--) {
  //   const curve = out_na_curves_final[i]
  //   pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  // }
  // pen.lineTo(out_corner_tiao_na.x, out_corner_tiao_na.y)
  // pen.lineTo(out_tiao_start.x, out_tiao_start.y)

  // // 绘制轮廓连接线
  // pen.lineTo(in_tiao_start.x, in_tiao_start.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)