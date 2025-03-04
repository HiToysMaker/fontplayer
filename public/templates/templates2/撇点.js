const pie_horizonalSpan = glyph.getParam('撇-水平延伸')
const pie_verticalSpan = glyph.getParam('撇-竖直延伸')
const pie_bendCursor = glyph.getParam('撇-弯曲游标')
const pie_bendDegree = glyph.getParam('撇-弯曲度')
const dian_horizonalSpan = glyph.getParam('点-水平延伸')
const dian_verticalSpan = glyph.getParam('点-竖直延伸')
const dian_bendCursor = glyph.getParam('点-弯曲游标')
const dian_bendDegree = glyph.getParam('点-弯曲度')
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

// 撇
const pie_start = new FP.Joint(
  'start',
  {
    x: ox + pie_horizonalSpan / 2,
    y: oy - (pie_verticalSpan + dian_verticalSpan) / 2,
  },
)
const pie_end = new FP.Joint(
  'end',
  {
    x: ox - pie_horizonalSpan / 2,
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
const dian_start = pie_end
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

const skeloton = {
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