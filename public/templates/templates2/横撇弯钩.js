const heng_length = glyph.getParam('横-长度')
const pie_horizonalSpan = glyph.getParam('撇-水平延伸')
const pie_verticalSpan = glyph.getParam('撇-竖直延伸')
const wangou_verticalSpan = glyph.getParam('弯钩-竖直延伸')
const wangou_bendCursor = glyph.getParam('弯钩-弯曲游标')
const wangou_bendDegree = glyph.getParam('弯钩-弯曲度')
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
    y: oy - (pie_verticalSpan + wangou_verticalSpan) / 2,
  },
)
const heng_end = new FP.Joint(
  'heng_end',
  {
    x: ox + heng_length / 2,
    y: oy - (pie_verticalSpan + wangou_verticalSpan) / 2,
  },
)

// 撇
const pie_start = heng_end
const pie_end = new FP.Joint(
  'pie_end',
  {
    x: pie_start.x - pie_horizonalSpan,
    y: pie_start.y + pie_verticalSpan,
  },
)

// 弯钩
const wangou_start = pie_end
const wangou_end = new FP.Joint(
  'wangou_end',
  {
    x: wangou_start.x,
    y: wangou_start.y + wangou_verticalSpan,
  },
)

const wangou_length = distance(wangou_start, wangou_end)
const wangou_cursor_x = wangou_start.x
const wangou_cursor_y = wangou_start.y + wangou_bendCursor * wangou_verticalSpan

const wangou_bend = new FP.Joint(
  'wangou_bend',
  {
    x: wangou_cursor_x + wangou_bendDegree,
    y: wangou_cursor_y,
  },
)

glyph.addJoint(heng_start)
glyph.addJoint(heng_end)
glyph.addJoint(pie_start)
glyph.addJoint(pie_end)
glyph.addJoint(wangou_start)
glyph.addJoint(wangou_bend)
glyph.addJoint(wangou_end)

const skeloton = {
  heng_start,
  heng_end,
  pie_start,
  pie_end,
  wangou_start,
  wangou_bend,
  wangou_end,
}

glyph.addRefLine(refline(heng_start, heng_end))
glyph.addRefLine(refline(pie_start, pie_end))
glyph.addRefLine(refline(wangou_start, wangou_bend))
glyph.addRefLine(refline(wangou_bend, wangou_end))