const heng_length = glyph.getParam('横-长度')
const zhe_horizonalSpan = glyph.getParam('折-水平延伸')
const zhe_verticalSpan = glyph.getParam('折-竖直延伸')
const gou_horizonalSpan = glyph.getParam('钩-水平延伸')
const gou_verticalSpan = glyph.getParam('钩-竖直延伸')
const weight = glyph.getParam('字重') || 40
const ox = 500
const oy = 500

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

// 横
const heng_start = new FP.Joint(
  'heng_start',
  {
    x: ox - heng_length / 2,
    y: oy - zhe_verticalSpan / 2,
  },
)
const heng_end = new FP.Joint(
  'heng_end',
  {
    x: heng_start.x + heng_length,
    y: heng_start.y,
  },
)

// 折
const zhe_start = heng_end
const zhe_end = new FP.Joint(
  'zhe_end',
  {
    x: zhe_start.x - zhe_horizonalSpan,
    y: zhe_start.y + zhe_verticalSpan,
  },
)

// 钩
const gou_start = zhe_end
const gou_end = new FP.Joint(
  'gou_end',
  {
    x: gou_start.x - gou_horizonalSpan,
    y: gou_start.y + gou_verticalSpan,
  },
)

glyph.addJoint(heng_start)
glyph.addJoint(heng_end)
glyph.addJoint(zhe_start)
glyph.addJoint(zhe_end)
glyph.addJoint(gou_start)
glyph.addJoint(gou_end)

const skeleton = {
  heng_start,
  heng_end,
  zhe_start,
  zhe_end,
  gou_start,
  gou_end,
}

glyph.addRefLine(refline(heng_start, heng_end))
glyph.addRefLine(refline(zhe_start, zhe_end))
glyph.addRefLine(refline(gou_start, gou_end))

const start_style_type = glyph.getParam('起笔风格')
const start_style_value = glyph.getParam('起笔数值')
const bending_degree = glyph.getParam('弯曲程度')
const turn_style_type = glyph.getParam('转角风格')
const turn_style_value = glyph.getParam('转角数值')

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

const getLength = (horizonalSpan, verticalSpan) => {
  return Math.sqrt(horizonalSpan * horizonalSpan + verticalSpan * verticalSpan)
}

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

const getComponents = (skeleton) => {
  // 根据骨架计算轮廓关键点

  const {
    heng_start,
    heng_end,
    zhe_start,
    zhe_end,
    gou_start,
    gou_end,
  } = skeleton

  // out指右侧（外侧）轮廓线
  // in指左侧（内侧）轮廓线
  const { out_heng_start, out_heng_end, in_heng_start, in_heng_end } = FP.getLineContours('heng', { heng_start, heng_end }, weight)
  const { out_zhe_start, out_zhe_end, in_zhe_start, in_zhe_end } = FP.getLineContours('zhe', { zhe_start, zhe_end }, weight)
  const { out_gou_start, out_gou_end, in_gou_start, in_gou_end } = FP.getLineContours('gou', { gou_start, gou_end }, weight)
  const { corner: in_corner_heng_zhe } = FP.getIntersection(
    { type: 'line', start: in_heng_start, end: in_heng_end },
    { type: 'line', start: in_zhe_start, end: in_zhe_end },
  )
  const { corner: out_corner_heng_zhe } = FP.getIntersection(
    { type: 'line', start: out_heng_start, end: out_heng_end },
    { type: 'line', start: out_zhe_start, end: out_zhe_end },
  )
  const { corner: in_corner_zhe_gou } = FP.getIntersection(
    { type: 'line', start: in_zhe_start, end: in_zhe_end },
    { type: 'line', start: in_gou_start, end: in_gou_end },
  )
  const { corner: out_corner_zhe_gou } = FP.getIntersection(
    { type: 'line', start: out_zhe_start, end: out_zhe_end },
    { type: 'line', start: out_gou_start, end: out_gou_end },
  )

  // 计算横折拐角处内外圆角相关的点与数据
  let in_radius_heng_zhe = 60 * bending_degree
  let out_radius_heng_zhe = 80 * bending_degree
  // 如果in_radius超出折1或折2长度，取折1或折2的最小长度
  const in_radius_min_length_heng_zhe = Math.min(
    getDistance(in_corner_heng_zhe, in_heng_start),
    getDistance(in_corner_heng_zhe, in_corner_zhe_gou),
  )
  const out_radius_min_length_heng_zhe = Math.min(
    getDistance(out_zhe_end, out_heng_start),
    getDistance(out_zhe_start, out_zhe_end),
  )
  if (in_radius_heng_zhe >= in_radius_min_length_heng_zhe) {
    in_radius_heng_zhe = in_radius_min_length_heng_zhe
  }
  if (out_radius_heng_zhe >= out_radius_min_length_heng_zhe) {
    out_radius_heng_zhe = out_radius_min_length_heng_zhe
  }
  const in_radius_start_heng_zhe = {
    x: in_corner_heng_zhe.x - in_radius_heng_zhe,
    y: in_corner_heng_zhe.y,
  }
  const in_radius_end_heng_zhe = getRadiusPoint({
    start: in_corner_heng_zhe,
    end: in_corner_zhe_gou,
    radius: in_radius_heng_zhe,
  })
  const out_radius_start_heng_zhe = {
    x: out_corner_heng_zhe.x - out_radius_heng_zhe,
    y: out_corner_heng_zhe.y,
  }
  const out_radius_end_heng_zhe = getRadiusPoint({
    start: out_corner_heng_zhe,
    end: out_corner_zhe_gou,
    radius: out_radius_heng_zhe,
  })

  // 计算折2钩拐角处内外圆角相关的点与数据
  let in_radius_zhe_gou = 30 * bending_degree
  let out_radius_zhe_gou = 30 * bending_degree
  // 如果in_radius超出折2或钩的长度，取折2或钩的最小长度
  const in_radius_min_length_zhe_gou = Math.min(
    getDistance(in_corner_zhe_gou, in_gou_end),
    getDistance(in_corner_zhe_gou, in_radius_end_heng_zhe),
  )
  const out_radius_min_length_zhe_gou = Math.min(
    getLength(gou_horizonalSpan, gou_verticalSpan),
    getDistance(out_zhe_end, out_radius_end_heng_zhe),
  )
  if (in_radius_zhe_gou >= in_radius_min_length_zhe_gou) {
    in_radius_zhe_gou = in_radius_min_length_zhe_gou
  }
  if (out_radius_zhe_gou >= out_radius_min_length_zhe_gou) {
    out_radius_zhe_gou = out_radius_min_length_zhe_gou
  }
  const in_radius_start_zhe_gou = getRadiusPoint({
    start: in_corner_zhe_gou,
    end: in_corner_heng_zhe,
    radius: in_radius_zhe_gou,
  })
  const in_radius_end_zhe_gou = getRadiusPoint({
    start: in_corner_zhe_gou,
    end: in_gou_end,
    radius: in_radius_zhe_gou,
  })
  const out_radius_start_zhe_gou = getRadiusPoint({
    start: out_zhe_end,
    end: out_radius_end_heng_zhe,
    radius: out_radius_zhe_gou,
  })
  const out_radius_end_zhe_gou = getRadiusPoint({
    start: out_gou_start,
    end: out_gou_end,
    radius: out_radius_zhe_gou,
  })

  let turn_data = {}
  if (turn_style_type === 1) {
    // 计算转角风格1（凸起，圆滑连接）所需要的数据
    const turn_length = 20 * turn_style_value
    const { inner_angle, mid_angle, angle1, angle2 } = FP.getTurnAngles(out_heng_start, out_corner_heng_zhe, out_zhe_end)
    const inner_corner_length = weight
    const corner_radius = (inner_corner_length / 2) / Math.sin(inner_angle / 2)
    const turn_control_1 = {
      x: out_corner_heng_zhe.x - corner_radius,
      y: out_corner_heng_zhe.y,
    }
    const turn_start_1 = {
      x: turn_control_1.x - corner_radius,
      y: turn_control_1.y,
    }
    const turn_end_1 = {
      x: turn_control_1.x + turn_length * Math.cos(mid_angle),
      y: turn_control_1.y - turn_length * Math.sin(mid_angle),
    }
    const turn_control_2 = getRadiusPoint({
      start: out_corner_heng_zhe,
      end: out_zhe_end,
      radius: corner_radius,
    })
    const turn_start_2 = getRadiusPoint({
      start: turn_control_2,
      end: out_zhe_end,
      radius: corner_radius,
    })
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

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 绘制右侧（外侧）轮廓
  if (start_style_type === 0) {
    // 无起笔样式
    pen.moveTo(out_heng_start.x, out_heng_start.y)
  } else if (start_style_type === 1) {
    // 起笔上下凸起长方形
    pen.moveTo(out_heng_start.x, out_heng_start.y - start_style.start_style_decorator_height)
    pen.lineTo(out_heng_start.x + start_style.start_style_decorator_width, out_heng_start.y - start_style.start_style_decorator_height)
    pen.lineTo(out_heng_start.x + start_style.start_style_decorator_width, out_heng_start.y)
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    pen.moveTo(out_heng_start.x, out_heng_start.y - start_style.start_style_decorator_height)
    pen.lineTo(out_heng_start.x + start_style.start_style_decorator_width, out_heng_start.y - start_style.start_style_decorator_height)
    pen.quadraticBezierTo(
      out_heng_start.x + start_style.start_style_decorator_width,
      out_heng_start.y,
      out_heng_start.x + start_style.start_style_decorator_width + start_style.start_style_decorator_radius,
      out_heng_start.y,
    )
  }
  if (turn_style_type === 0) {
    // 默认转角样式
    // 绘制外侧横折圆角
    pen.lineTo(out_radius_start_heng_zhe.x, out_radius_start_heng_zhe.y)
    pen.quadraticBezierTo(out_corner_heng_zhe.x, out_corner_heng_zhe.y, out_radius_end_heng_zhe.x, out_radius_end_heng_zhe.y)
  } else if (turn_style_type === 1) {
    // 转角样式1
    pen.lineTo(turn_data.turn_start_1.x, turn_data.turn_start_1.y)
    pen.quadraticBezierTo(turn_data.turn_control_1.x, turn_data.turn_control_1.y, turn_data.turn_end_1.x, turn_data.turn_end_1.y)
    pen.lineTo(turn_data.turn_end_2.x, turn_data.turn_end_2.y)
    pen.quadraticBezierTo(turn_data.turn_control_2.x, turn_data.turn_control_2.y, turn_data.turn_start_2.x, turn_data.turn_start_2.y)
  }
  // 绘制外侧折钩圆角
  pen.lineTo(out_radius_start_zhe_gou.x, out_radius_start_zhe_gou.y)
  pen.quadraticBezierTo(out_corner_zhe_gou.x, out_corner_zhe_gou.y, out_radius_end_zhe_gou.x, out_radius_end_zhe_gou.y)
  pen.lineTo(out_gou_end.x, out_gou_end.y)

  // 绘制轮廓连接线
  pen.lineTo(in_gou_end.x, in_gou_end.y)

  // 绘制左侧（内侧）轮廓
  // 绘制内侧折钩圆角
  pen.lineTo(in_radius_end_zhe_gou.x, in_radius_end_zhe_gou.y)
  pen.quadraticBezierTo(in_corner_zhe_gou.x, in_corner_zhe_gou.y, in_radius_start_zhe_gou.x, in_radius_start_zhe_gou.y)
  // 绘制内侧横折圆角
  pen.lineTo(in_radius_end_heng_zhe.x, in_radius_end_heng_zhe.y)
  pen.quadraticBezierTo(in_corner_heng_zhe.x, in_corner_heng_zhe.y, in_radius_start_heng_zhe.x, in_radius_start_heng_zhe.y)
  if (start_style_type === 0) {
    // 无起笔样式
    pen.lineTo(in_heng_start.x, in_heng_start.y)
  } else if (start_style_type === 1) {
    // 起笔上下凸起长方形
    pen.lineTo(in_heng_start.x + start_style.start_style_decorator_width, in_heng_start.y)
    pen.lineTo(in_heng_start.x + start_style.start_style_decorator_width, in_heng_start.y + start_style.start_style_decorator_height)
    pen.lineTo(in_heng_start.x, in_heng_start.y + start_style.start_style_decorator_height)
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    pen.lineTo(
      in_heng_start.x + start_style.start_style_decorator_width + start_style.start_style_decorator_radius,
      in_heng_start.y,
    )
    pen.quadraticBezierTo(
      in_heng_start.x + start_style.start_style_decorator_width,
      in_heng_start.y,
      in_heng_start.x + start_style.start_style_decorator_width,
      in_heng_start.y + start_style.start_style_decorator_height,
    )
    pen.lineTo(in_heng_start.x, in_heng_start.y + start_style.start_style_decorator_height)
  }

  // 绘制轮廓连接线
  pen.lineTo(out_heng_start.x, out_heng_start.y)
  if (start_style_type === 0) {
    // 无起笔样式
    pen.lineTo(out_heng_start.x, out_heng_start.y)
  } else if (start_style_type === 1) {
    // 起笔上下凸起长方形
    pen.lineTo(out_heng_start.x, out_heng_start.y - start_style.start_style_decorator_height)
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    pen.lineTo(out_heng_start.x, out_heng_start.y - start_style.start_style_decorator_height)
  }

  pen.closePath()
  return [ pen ]
}

const components = getComponents(skeleton)
for (let i = 0; i < components.length; i++) {
  glyph.addComponent(components[i])
}