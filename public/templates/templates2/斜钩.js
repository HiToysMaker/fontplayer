const xie_horizonalSpan = glyph.getParam('斜-水平延伸')
const xie_verticalSpan = glyph.getParam('斜-竖直延伸')
const xie_bendCursor = glyph.getParam('斜-弯曲游标')
const xie_bendDegree = glyph.getParam('斜-弯曲度')
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

// 斜
const xie_start = new FP.Joint(
  'xie_start',
  {
    x: ox - xie_horizonalSpan / 2,
    y: oy - xie_verticalSpan / 2,
  },
)
const xie_end = new FP.Joint(
  'xie_end',
  {
    x: ox + xie_horizonalSpan / 2,
    y: oy + xie_verticalSpan / 2,
  },
)

const xie_length = distance(xie_start, xie_end)
const xie_cursor_x = xie_start.x + xie_bendCursor * xie_horizonalSpan
const xie_cursor_y = xie_start.y + xie_bendCursor * xie_verticalSpan
const xie_angle = Math.atan2(xie_verticalSpan, xie_horizonalSpan)

const xie_bend = new FP.Joint(
  'xie_bend',
  {
    x: xie_cursor_x - xie_bendDegree * Math.sin(xie_angle),
    y: xie_cursor_y + xie_bendDegree * Math.cos(xie_angle),
  },
)

// 钩
const gou_start = xie_end
const gou_end = new FP.Joint(
  'gou_end',
  {
    x: gou_start.x + gou_horizonalSpan,
    y: gou_start.y - gou_verticalSpan,
  },
)

glyph.addJoint(xie_start)
glyph.addJoint(xie_end)
glyph.addJoint(xie_bend)
glyph.addJoint(gou_start)
glyph.addJoint(gou_end)

const skeloton = {
  xie_start,
  xie_bend,
  xie_end,
  gou_start,
  gou_end,
}

glyph.addRefLine(refline(xie_start, xie_bend))
glyph.addRefLine(refline(xie_bend, xie_end))
glyph.addRefLine(refline(gou_start, gou_end))