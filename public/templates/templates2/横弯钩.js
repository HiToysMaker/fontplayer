const heng_length = glyph.getParam('横-长度')
const wan_horizonalSpan = glyph.getParam('弯-水平延伸')
const wan_verticalSpan = glyph.getParam('弯-竖直延伸')
const wan_bendCursor = glyph.getParam('弯-弯曲游标')
const wan_bendDegree = glyph.getParam('弯-弯曲度')
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
    x: ox - (heng_length + wan_horizonalSpan) / 2,
    y: oy - wan_verticalSpan / 2,
  },
)
const heng_end = new FP.Joint(
  'heng_end',
  {
    x: heng_start.x + heng_length,
    y: heng_start.y,
  },
)

// 弯
const wan_start = heng_end
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
const gou_start = wan_end
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

const skeloton = {
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