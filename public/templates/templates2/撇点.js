const ox = 500
const oy = 500
const x0 = 550
const y0 = 200
const BENDING_DEGREE = 0
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
  pie_horizonalSpan: glyph.getParam('撇-水平延伸'),
  pie_verticalSpan: glyph.getParam('撇-竖直延伸'),
  pie_bendCursor: glyph.getParam('撇-弯曲游标'),
  pie_bendDegree: glyph.getParam('撇-弯曲度') + BENDING_DEGREE * global_params.bending_degree,
  dian_horizonalSpan: glyph.getParam('点-水平延伸'),
  dian_verticalSpan: glyph.getParam('点-竖直延伸'),
  dian_bendCursor: glyph.getParam('点-弯曲游标'),
  dian_bendDegree: glyph.getParam('点-弯曲度') + BENDING_DEGREE * global_params.bending_degree,
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
    case 'pie_bend': {
      jointsMap['pie_bend'] = {
        x: glyph.tempData['pie_bend'].x + deltaX,
        y: glyph.tempData['pie_bend'].y + deltaY,
      }
      break
    }
    case 'pie_end': {
      jointsMap['pie_end'] = {
        x: glyph.tempData['pie_end'].x + deltaX,
        y: glyph.tempData['pie_end'].y + deltaY,
      }
      const newBend = getBend(jointsMap['pie_start'], jointsMap['pie_end'], 'pie')
      jointsMap['pie_bend'] = {
        x: newBend.x,
        y: newBend.y,
      }
      jointsMap['dian_start'] = {
        x: glyph.tempData['dian_start'].x + deltaX,
        y: glyph.tempData['dian_start'].y + deltaY,
      }
      jointsMap['dian_bend'] = {
        x: glyph.tempData['dian_bend'].x + deltaX,
        y: glyph.tempData['dian_bend'].y + deltaY,
      }
      jointsMap['dian_end'] = {
        x: glyph.tempData['dian_end'].x + deltaX,
        y: glyph.tempData['dian_end'].y + deltaY,
      }
      break
    }
    case 'dian_start': {
      jointsMap['pie_end'] = {
        x: glyph.tempData['pie_end'].x + deltaX,
        y: glyph.tempData['pie_end'].y + deltaY,
      }
      const newBend = getBend(jointsMap['pie_start'], jointsMap['pie_end'], 'pie')
      jointsMap['pie_bend'] = {
        x: newBend.x,
        y: newBend.y,
      }
      jointsMap['dian_start'] = {
        x: glyph.tempData['dian_start'].x + deltaX,
        y: glyph.tempData['dian_start'].y + deltaY,
      }
      jointsMap['dian_bend'] = {
        x: glyph.tempData['dian_bend'].x + deltaX,
        y: glyph.tempData['dian_bend'].y + deltaY,
      }
      jointsMap['dian_end'] = {
        x: glyph.tempData['dian_end'].x + deltaX,
        y: glyph.tempData['dian_end'].y + deltaY,
      }
      break
    }
    case 'dian_bend': {
      jointsMap['dian_bend'] = {
        x: glyph.tempData['dian_bend'].x + deltaX,
        y: glyph.tempData['dian_bend'].y + deltaY,
      }
      break
    }
    case 'dian_end': {
      jointsMap['dian_end'] = {
        x: glyph.tempData['dian_end'].x + deltaX,
        y: glyph.tempData['dian_end'].y + deltaY,
      }
      const newBend = getBend(jointsMap['dian_start'], jointsMap['dian_end'], 'dian')
      jointsMap['dian_bend'] = {
        x: newBend.x,
        y: newBend.y,
      }
      break
    }
  }
  return jointsMap
}

const getBend = (start, end, name) => {
  // 改变撇end的情况下，不会改变弯曲度和弯曲游标，所以依据现有参数计算新的bend
  if (name === 'pie') {
    let { pie_bendCursor: bendCursor, pie_bendDegree: bendDegree } = params
    const horizonalSpan = Math.abs(end.x - start.x)
    const verticalSpan = Math.abs(end.y - start.y)
    const cursor_x = start.x - bendCursor * horizonalSpan
    const cursor_y = start.y + bendCursor * verticalSpan
    const angle = Math.atan2(verticalSpan, horizonalSpan)
    
    const bend = {
      x: cursor_x + bendDegree * Math.sin(angle),
      y: cursor_y + bendDegree * Math.cos(angle),
    }
    return bend
  } else if (name === 'dian') {
    let { dian_bendCursor: bendCursor, dian_bendDegree: bendDegree } = params
    const horizonalSpan = Math.abs(end.x - start.x)
    const verticalSpan = Math.abs(end.y - start.y)
    const cursor_x = start.x + bendCursor * horizonalSpan
    const cursor_y = start.y + bendCursor * verticalSpan
    const angle = Math.atan2(verticalSpan, horizonalSpan)
    
    const bend = {
      x: cursor_x + bendDegree * Math.sin(angle),
      y: cursor_y - bendDegree * Math.cos(angle),
    }
    return bend
  }

  return null
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
  glyph.setParam('撇-水平延伸', _params.pie_horizonalSpan)
  glyph.setParam('撇-竖直延伸', _params.pie_verticalSpan)
  glyph.setParam('撇-弯曲游标', _params.pie_bendCursor)
  glyph.setParam('撇-弯曲度', _params.pie_bendDegree - BENDING_DEGREE * global_params.bending_degree)
  glyph.setParam('点-水平延伸', _params.dian_horizonalSpan)
  glyph.setParam('点-竖直延伸', _params.dian_verticalSpan)
  glyph.setParam('点-弯曲游标', _params.dian_bendCursor)
  glyph.setParam('点-弯曲度', _params.dian_bendDegree - BENDING_DEGREE * global_params.bending_degree)
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
  const { pie_start, pie_bend, pie_end, dian_start, dian_bend, dian_end } = jointsMap
  const pie_horizonal_span_range = glyph.getParamRange('撇-水平延伸')
  const pie_vertical_span_range = glyph.getParamRange('撇-竖直延伸')
  const pie_bend_cursor_range = glyph.getParamRange('撇-弯曲游标')
  const pie_bend_degree_range = glyph.getParamRange('撇-弯曲度')
  const dian_horizonal_span_range = glyph.getParamRange('点-水平延伸')
  const dian_vertical_span_range = glyph.getParamRange('点-竖直延伸')
  const dian_bend_cursor_range = glyph.getParamRange('点-弯曲游标')
  const dian_bend_degree_range = glyph.getParamRange('点-弯曲度')
  const pie_horizonalSpan = range(pie_start.x - pie_end.x, pie_horizonal_span_range)
  const pie_verticalSpan = range(pie_end.y - pie_start.y, pie_vertical_span_range)
  const pie_data = FP.distanceAndFootPoint(pie_start, pie_end, pie_bend)
  const pie_bendCursor = range(pie_data.percentageFromA, pie_bend_cursor_range)
  const pie_bendDegree = range(pie_data.distance, pie_bend_degree_range)
  const dian_horizonalSpan = range(dian_end.x - dian_start.x, dian_horizonal_span_range)
  const dian_verticalSpan = range(dian_end.y - dian_start.y, dian_vertical_span_range)
  const dian_data = FP.distanceAndFootPoint(dian_start, dian_end, dian_bend)
  const dian_bendCursor = range(dian_data.percentageFromA, dian_bend_cursor_range)
  const dian_bendDegree = range(dian_data.distance, dian_bend_degree_range)
  return {
    pie_horizonalSpan,
    pie_verticalSpan,
    pie_bendCursor,
    pie_bendDegree,
    dian_horizonalSpan,
    dian_verticalSpan,
    dian_bendCursor,
    dian_bendDegree,
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    pie_horizonalSpan,
    pie_verticalSpan,
    pie_bendCursor,
    pie_bendDegree,
    dian_horizonalSpan,
    dian_verticalSpan,
    dian_bendCursor,
    dian_bendDegree,
  } = params

  // 撇
  const pie_start = new FP.Joint(
    'pie_start',
    {
      x: x0,
      y: y0,
    },
  )
  const pie_end = new FP.Joint(
    'pie_end',
    {
      x: pie_start.x - pie_horizonalSpan,
      y: pie_start.y + pie_verticalSpan,
    },
  )

  const pie_length = distance(pie_start, pie_end)
  const pie_cursor_x = pie_start.x - pie_bendCursor * pie_horizonalSpan
  const pie_cursor_y = pie_start.y + pie_bendCursor * pie_verticalSpan
  const pie_angle = Math.atan2(pie_verticalSpan, pie_horizonalSpan)

  const pie_bend = new FP.Joint(
    'pie_bend',
    {
      x: pie_cursor_x + pie_bendDegree * Math.sin(pie_angle),
      y: pie_cursor_y + pie_bendDegree * Math.cos(pie_angle),
    },
  )

  // 点
  const dian_start = new FP.Joint(
    'dian_start',
    {
      x: pie_start.x - pie_horizonalSpan,
      y: pie_start.y + pie_verticalSpan,
    },
  )
  const dian_end = new FP.Joint(
    'dian_end',
    {
      x: dian_start.x + dian_horizonalSpan,
      y: dian_start.y + dian_verticalSpan,
    },
  )

  const dian_length = distance(dian_start, dian_end)
  const dian_cursor_x = dian_start.x + dian_bendCursor * dian_horizonalSpan
  const dian_cursor_y = dian_start.y + dian_bendCursor * dian_verticalSpan
  const dian_angle = Math.atan2(dian_verticalSpan, dian_horizonalSpan)

  const dian_bend = new FP.Joint(
    'dian_bend',
    {
      x: dian_cursor_x + dian_bendDegree * Math.sin(dian_angle),
      y: dian_cursor_y - dian_bendDegree * Math.cos(dian_angle),
    },
  )

  glyph.addJoint(pie_start)
  glyph.addJoint(pie_bend)
  glyph.addJoint(pie_end)
  glyph.addJoint(dian_start)
  glyph.addJoint(dian_bend)
  glyph.addJoint(dian_end)

  const skeleton = {
    pie_start,
    pie_bend,
    pie_end,
    dian_start,
    dian_bend,
    dian_end,
  }

  glyph.addRefLine(refline(pie_start, pie_bend))
  glyph.addRefLine(refline(pie_bend, pie_end))
  glyph.addRefLine(refline(dian_start, dian_bend))
  glyph.addRefLine(refline(dian_bend, dian_end))

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
    pie_start,
    pie_bend,
    pie_end,
    dian_start,
    dian_bend,
    dian_end,
  } = skeleton

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_pie_curves, out_pie_points, in_pie_curves, in_pie_points } = FP.getCurveContours('pie', { pie_start, pie_bend, pie_end }, weight, {
    unticlockwise: true,
  })
  const { out_dian_curves, out_dian_points, in_dian_curves, in_dian_points } = FP.getCurveContours('dian', { dian_start, dian_bend, dian_end }, weight, {
    unticlockwise: true,
  })
  const { corner: out_corner_pie_dian } = FP.getIntersection(
    { type: 'line', start: out_pie_curves[out_pie_curves.length - 1].control2, end: out_pie_curves[out_pie_curves.length - 1].end },
    { type: 'line', start: out_dian_curves[0].start, end: out_dian_curves[0].control1 }
  )
  const { corner: in_corner_pie_dian, corner_index: in_corner_index_pie_dian } = FP.getIntersection(
    { type: 'curve', points: in_pie_points },
    { type: 'curve', points: in_dian_points },
  )
  const { curves: in_pie_curves_final } = FP.fitCurvesByPoints(in_pie_points.slice(0, in_corner_index_pie_dian[0]))
  const { curves: in_dian_curves_final } = FP.fitCurvesByPoints(in_dian_points.slice(in_corner_index_pie_dian[1]))

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 绘制横的右侧（内侧）轮廓
  pen.moveTo(in_pie_curves_final[0].start.x, in_pie_curves_final[0].start.y)
  for (let i = 0; i < in_pie_curves_final.length; i++) {
    const curve = in_pie_curves_final[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }
  for (let i = 0; i < in_dian_curves_final.length; i++) {
    const curve = in_dian_curves_final[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }

  // 绘制轮廓连接线
  pen.lineTo(out_dian_curves[out_dian_curves.length - 1].end.x, out_dian_curves[out_dian_curves.length - 1].end.y)

  // 绘制横的左侧（外侧）轮廓
  for (let i = out_dian_curves.length - 1; i >= 0; i--) {
    const curve = out_dian_curves[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }
  pen.lineTo(out_corner_pie_dian.x, out_corner_pie_dian.y)
  pen.lineTo(out_pie_curves[out_pie_curves.length - 1].end.x, out_pie_curves[out_pie_curves.length - 1].end.y)
  for (let i = out_pie_curves.length - 1; i >= 0; i--) {
    const curve = out_pie_curves[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }

  // 绘制轮廓连接线
  pen.lineTo(in_pie_curves[0].start.x, in_pie_curves[0].start.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)