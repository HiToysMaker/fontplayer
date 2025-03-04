const shu_length = glyph.getParam('竖-长度')
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

// 竖
const shu_start = new FP.Joint(
  'shu_start',
  {
    x: ox - pie_horizonalSpan / 2,
    y: oy - (shu_length + pie_verticalSpan) / 2,
  },
)
const shu_end = new FP.Joint(
  'shu_end',
  {
    x: shu_start.x,
    y: shu_start.y + shu_length,
  },
)

// 撇
const pie_start = shu_end
const pie_bend = new FP.Joint(
  'pie_bend',
  {
    x: pie_start.x,
    y: pie_start.y + pie_bendCursor * pie_verticalSpan,
  },
)
const pie_end = new FP.Joint(
  'pie_end',
  {
    x: pie_start.x + pie_horizonalSpan,
    y: pie_start.y + pie_verticalSpan,
  },
)

glyph.addJoint(shu_start)
glyph.addJoint(shu_end)
glyph.addJoint(pie_start)
glyph.addJoint(pie_end)
glyph.addJoint(pie_bend)

const skeloton = {
  shu_start,
  shu_end,
  pie_start,
  pie_end,
  pie_bend,
}

glyph.addRefLine(refline(shu_start, shu_end))
glyph.addRefLine(refline(pie_start, pie_bend))
glyph.addRefLine(refline(pie_bend, pie_end))