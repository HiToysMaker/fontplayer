const pie_horizonalSpan = glyph.getParam('撇-水平延伸')
const pie_verticalSpan = glyph.getParam('撇-竖直延伸')
const pie_bendCursor = glyph.getParam('撇-弯曲游标')
const pie_bendDegree = glyph.getParam('撇-弯曲度')
const tiao_horizonalSpan = glyph.getParam('挑-水平延伸')
const tiao_verticalSpan = glyph.getParam('挑-竖直延伸')
const tiao_bendCursor = glyph.getParam('挑-弯曲游标')
const tiao_bendDegree = glyph.getParam('挑-弯曲度')
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
  'pie_start',
  {
    x: ox + Math.max(pie_horizonalSpan, tiao_horizonalSpan) / 2,
    y: oy - pie_verticalSpan / 2,
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

// 挑
const tiao_start = pie_end
const tiao_end = new FP.Joint(
  'tiao_end',
  {
    x: tiao_start.x + tiao_horizonalSpan,
    y: tiao_start.y - tiao_verticalSpan,
  },
)

const tiao_length = distance(tiao_start, tiao_end)
const tiao_cursor_x = tiao_start.x + tiao_bendCursor * tiao_horizonalSpan
const tiao_cursor_y = tiao_start.y - tiao_bendCursor * tiao_verticalSpan
const tiao_angle = Math.atan2(tiao_verticalSpan, tiao_horizonalSpan)

const tiao_bend = new FP.Joint(
  'tiao_bend',
  {
    x: tiao_cursor_x - tiao_bendDegree * Math.sin(tiao_angle),
    y: tiao_cursor_y - tiao_bendDegree * Math.cos(tiao_angle),
  },
)

glyph.addJoint(pie_start)
glyph.addJoint(pie_bend)
glyph.addJoint(pie_end)
glyph.addJoint(tiao_start)
glyph.addJoint(tiao_bend)
glyph.addJoint(tiao_end)

const skeloton = {
  pie_start,
  pie_bend,
  pie_end,
  tiao_start,
  tiao_bend,
  tiao_end,
}

glyph.addRefLine(refline(pie_start, pie_bend))
glyph.addRefLine(refline(pie_bend, pie_end))
glyph.addRefLine(refline(tiao_start, tiao_bend))
glyph.addRefLine(refline(tiao_bend, tiao_end))