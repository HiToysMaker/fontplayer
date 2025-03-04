const tiao_horizonalSpan = glyph.getParam('挑-水平延伸')
const tiao_verticalSpan = glyph.getParam('挑-竖直延伸')
const na_horizonalSpan = glyph.getParam('捺-水平延伸')
const na_verticalSpan = glyph.getParam('捺-竖直延伸')
const na_bendCursor = glyph.getParam('捺-弯曲游标')
const na_bendDegree = glyph.getParam('捺-弯曲度')
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

// 挑
const tiao_start = new FP.Joint(
  'tiao_start',
  {
    x: ox - (na_horizonalSpan + tiao_horizonalSpan) / 2,
    y: oy + na_verticalSpan / 2,
  },
)
const tiao_end = new FP.Joint(
  'tiao_end',
  {
    x: tiao_start.x + tiao_horizonalSpan,
    y: tiao_start.y - tiao_verticalSpan,
  },
)

// 捺
const na_start = tiao_end
const na_end = new FP.Joint(
  'na_end',
  {
    x: na_start.x + na_horizonalSpan,
    y: na_start.y + na_verticalSpan,
  },
)

const na_bend = new FP.Joint(
  'na_bend',
  {
    x: na_start.x + na_horizonalSpan * na_bendCursor,
    y: na_start.y + na_bendDegree,
  },
)

glyph.addJoint(tiao_start)
glyph.addJoint(tiao_end)
glyph.addJoint(na_start)
glyph.addJoint(na_end)
glyph.addJoint(na_bend)

const skeloton = {
  tiao_start,
  tiao_end,
  na_start,
  na_bend,
  na_end,
}

glyph.addRefLine(refline(tiao_start, tiao_end))
glyph.addRefLine(refline(na_start, na_bend))
glyph.addRefLine(refline(na_bend, na_end))