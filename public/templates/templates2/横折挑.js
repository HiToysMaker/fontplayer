const heng_length = glyph.getParam('横-长度')
const zhe_length = glyph.getParam('折-长度')
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

// 横
const heng_start = new FP.Joint(
  'heng_start',
  {
    x: ox - heng_length / 2,
    y: oy - zhe_length / 2,
  },
)
const heng_end = new FP.Joint(
  'heng_end',
  {
    x: ox + heng_length / 2,
    y: heng_start.y,
  },
)

// 折
const zhe_start = heng_end
const zhe_end = new FP.Joint(
  'zhe_end',
  {
    x: zhe_start.x,
    y: zhe_start.y + zhe_length,
  },
)

// 挑
const tiao_start = zhe_end
const tiao_end = new FP.Joint(
  'tiao_end',
  {
    x: tiao_start.x + tiao_horizonalSpan,
    y: tiao_start.y - tiao_verticalSpan,
  },
)

const tiao_length = distance(tiao_start, tiao_end)
const tiao_cursor_x = tiao_end.x - tiao_bendCursor * tiao_horizonalSpan
const tiao_cursor_y = tiao_end.y + tiao_bendCursor * tiao_verticalSpan
const tiao_angle = Math.atan2(tiao_verticalSpan, tiao_horizonalSpan)

const tiao_bend = new FP.Joint(
  'tiao_bend',
  {
    x: tiao_cursor_x - tiao_bendDegree * Math.sin(tiao_angle),
    y: tiao_cursor_y - tiao_bendDegree * Math.cos(tiao_angle),
  },
)

glyph.addJoint(heng_start)
glyph.addJoint(heng_end)
glyph.addJoint(zhe_start)
glyph.addJoint(zhe_end)
glyph.addJoint(tiao_start)
glyph.addJoint(tiao_bend)
glyph.addJoint(tiao_end)

const skeloton = {
  heng_start,
  heng_end,
  zhe_start,
  zhe_end,
  tiao_start,
  tiao_bend,
  tiao_end,
}

glyph.addRefLine(refline(heng_start, heng_end))
glyph.addRefLine(refline(zhe_start, zhe_end))
glyph.addRefLine(refline(tiao_start, tiao_bend))
glyph.addRefLine(refline(tiao_bend, tiao_end))