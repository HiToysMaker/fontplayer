const heng_length = glyph.getParam('横-长度')
const zhe1_horizonalSpan = glyph.getParam('折1-水平延伸')
const zhe1_verticalSpan = glyph.getParam('折1-竖直延伸')
const zhe2_length = glyph.getParam('折2-长度')
const pie_horizonalSpan = glyph.getParam('撇-水平延伸')
const pie_verticalSpan = glyph.getParam('撇-竖直延伸')
const pie_bendCursor = glyph.getParam('撇-弯曲游标')
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
    y: oy - (pie_verticalSpan + zhe1_verticalSpan) / 2,
  },
)
const heng_end = new FP.Joint(
  'heng_end',
  {
    x: ox + heng_length / 2,
    y: oy - (pie_verticalSpan + zhe1_verticalSpan) / 2,
  },
)

// 折1
const zhe1_start = heng_end
const zhe1_end = new FP.Joint(
  'zhe1_end',
  {
    x: zhe1_start.x - zhe1_horizonalSpan,
    y: zhe1_start.y + zhe1_verticalSpan,
  },
)

// 折2
const zhe2_start = zhe1_end
const zhe2_end = new FP.Joint(
  'zhe2_end',
  {
    x: zhe2_start.x + zhe2_length,
    y: zhe2_start.y,
  },
)

// 撇
const pie_start = zhe2_end
const pie_end = new FP.Joint(
  'pie_end',
  {
    x: pie_start.x - pie_horizonalSpan,
    y: pie_start.y + pie_verticalSpan,
  },
)

const pie_bend = new FP.Joint(
  'pie_bend',
  {
    x: pie_start.x,
    y: pie_start.y + pie_bendCursor * pie_verticalSpan,
  },
)

glyph.addJoint(heng_start)
glyph.addJoint(heng_end)
glyph.addJoint(zhe1_start)
glyph.addJoint(zhe1_end)
glyph.addJoint(zhe2_start)
glyph.addJoint(zhe2_end)
glyph.addJoint(pie_start)
glyph.addJoint(pie_end)
glyph.addJoint(pie_bend)

const skeloton = {
  heng_start,
  heng_end,
  zhe1_start,
  zhe1_end,
  zhe2_start,
  zhe2_end,
  pie_start,
  pie_end,
  pie_bend,
}

glyph.addRefLine(refline(heng_start, heng_end))
glyph.addRefLine(refline(zhe1_start, zhe1_end))
glyph.addRefLine(refline(zhe2_start, zhe2_end))
glyph.addRefLine(refline(pie_start, pie_bend))
glyph.addRefLine(refline(pie_bend, pie_end))