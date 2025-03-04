const shu_length = glyph.getParam('竖-长度')
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

// 竖
const shu_start = new FP.Joint(
  'shu_start',
  {
    x: ox - tiao_horizonalSpan / 2,
    y: oy - shu_length / 2,
  },
)
const shu_end = new FP.Joint(
  'shu_end',
  {
    x: shu_start.x,
    y: shu_start.y + shu_length,
  },
)

// 挑
const tiao_start = shu_end
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

glyph.addJoint(shu_start)
glyph.addJoint(shu_end)
glyph.addJoint(tiao_start)
glyph.addJoint(tiao_bend)
glyph.addJoint(tiao_end)

const skeloton = {
  shu_start,
  shu_end,
  tiao_start,
  tiao_bend,
  tiao_end,
}

glyph.addRefLine(refline(shu_start, shu_end))
glyph.addRefLine(refline(tiao_start, tiao_bend))
glyph.addRefLine(refline(tiao_bend, tiao_end))