const strokes = [
  {
    name: '横',
    params: [
      {
        name: '长度',
        default: 500,
        min: 50,
        max: 1000,
      },
      {
        name: '字重',
        default: 50,
        min: 10,
        max: 100,
      },
    ]
  },
  {
    name: '竖',
    params: [
      {
        name: '长度',
        default: 500,
        min: 50,
        max: 1000,
      },
      {
        name: '字重',
        default: 50,
        min: 10,
        max: 100,
      },
    ]
  },
  {
    name: '撇',
    params: [
      {
        name: '水平延伸',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '竖直延伸',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '弯曲游标',
        default: 0.5,
        min: 0,
        max: 1,
      },
      {
        name: '弯曲度',
        default: 150,
        min: 0,
        max: 500,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '竖撇',
    params: [
      {
        name: '竖-长度',
        default: 200,
        min: 0,
        max: 1000,
      },
      {
        name: '撇-水平延伸',
        default: 200,
        min: 0,
        max: 1000,
      },
      {
        name: '撇-竖直延伸',
        default: 300,
        min: 0,
        max: 1000,
      },
      {
        name: '撇-弯曲游标',
        default: 0.5,
        min: 0,
        max: 1,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '捺',
    params: [
      {
        name: '水平延伸',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '竖直延伸',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '弯曲游标',
        default: 0.5,
        min: 0,
        max: 1,
      },
      {
        name: '弯曲度',
        default: 150,
        min: 0,
        max: 500,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '平捺',
    params: [
      {
        name: '水平延伸',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '竖直延伸',
        default: 150,
        min: 0,
        max: 1000,
      },
      {
        name: '弯曲游标',
        default: 0.2,
        min: 0,
        max: 0.5,
      },
      {
        name: '弯曲度',
        default: 150,
        min: 0,
        max: 500,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '挑捺',
    params: [
      {
        name: '挑-水平延伸',
        default: 100,
        min: 0,
        max: 500,
      },
      {
        name: '挑-竖直延伸',
        default: 150,
        min: 0,
        max: 500,
      },
      {
        name: '捺-水平延伸',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '捺-竖直延伸',
        default: 150,
        min: 0,
        max: 1000,
      },
      {
        name: '捺-弯曲游标',
        default: 0.2,
        min: 0,
        max: 0.5,
      },
      {
        name: '捺-弯曲度',
        default: 150,
        min: 0,
        max: 500,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '点',
    params: [
      {
        name: '水平延伸',
        default: 100,
        min: 0,
        max: 500,
      },
      {
        name: '竖直延伸',
        default: 150,
        min: 0,
        max: 500,
      },
      {
        name: '弯曲游标',
        default: 0.5,
        min: 0,
        max: 1,
      },
      {
        name: '弯曲度',
        default: 30,
        min: 0,
        max: 200,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '挑',
    params: [
      {
        name: '水平延伸',
        default: 200,
        min: 0,
        max: 500,
      },
      {
        name: '竖直延伸',
        default: 200,
        min: 0,
        max: 500,
      },
      {
        name: '弯曲游标',
        default: 0.5,
        min: 0,
        max: 1,
      },
      {
        name: '弯曲度',
        default: 30,
        min: 0,
        max: 200,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '横撇',
    params: [
      {
        name: '横-长度',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '撇-水平延伸',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '撇-竖直延伸',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '撇-弯曲游标',
        default: 0.5,
        min: 0,
        max: 1,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '横折折撇',
    params: [
      {
        name: '横-长度',
        default: 220,
        min: 0,
        max: 1000,
      },
      {
        name: '折1-水平延伸',
        default: 150,
        min: 0,
        max: 1000,
      },
      {
        name: '折1-竖直延伸',
        default: 200,
        min: 0,
        max: 1000,
      },
      {
        name: '折2-长度',
        default: 150,
        min: 0,
        max: 1000,
      },
      {
        name: '撇-水平延伸',
        default: 300,
        min: 0,
        max: 1000,
      },
      {
        name: '撇-竖直延伸',
        default: 420,
        min: 0,
        max: 1000,
      },
      {
        name: '撇-弯曲游标',
        default: 0.5,
        min: 0,
        max: 1,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '撇点',
    params: [
      {
        name: '撇-水平延伸',
        default: 100,
        min: 0,
        max: 1000,
      },
      {
        name: '撇-竖直延伸',
        default: 300,
        min: 0,
        max: 1000,
      },
      {
        name: '撇-弯曲游标',
        default: 0.5,
        min: 0,
        max: 1,
      },
      {
        name: '撇-弯曲度',
        default: 50,
        min: 0,
        max: 500,
      },
      {
        name: '点-水平延伸',
        default: 100,
        min: 0,
        max: 1000,
      },
      {
        name: '点-竖直延伸',
        default: 300,
        min: 0,
        max: 1000,
      },
      {
        name: '点-弯曲游标',
        default: 0.5,
        min: 0,
        max: 1,
      },
      {
        name: '点-弯曲度',
        default: 50,
        min: 0,
        max: 500,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '撇挑',
    params: [
      {
        name: '撇-水平延伸',
        default: 300,
        min: 0,
        max: 1000,
      },
      {
        name: '撇-竖直延伸',
        default: 300,
        min: 0,
        max: 1000,
      },
      {
        name: '撇-弯曲游标',
        default: 0.5,
        min: 0,
        max: 1,
      },
      {
        name: '撇-弯曲度',
        default: 50,
        min: 0,
        max: 500,
      },
      {
        name: '挑-水平延伸',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '挑-竖直延伸',
        default: 100,
        min: 0,
        max: 1000,
      },
      {
        name: '挑-弯曲游标',
        default: 0.5,
        min: 0,
        max: 1,
      },
      {
        name: '挑-弯曲度',
        default: 50,
        min: 0,
        max: 500,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '竖挑',
    params: [
      {
        name: '竖-长度',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '挑-水平延伸',
        default: 160,
        min: 0,
        max: 1000,
      },
      {
        name: '挑-竖直延伸',
        default: 120,
        min: 0,
        max: 1000,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '横折挑',
    params: [
      {
        name: '横-长度',
        default: 150,
        min: 0,
        max: 1000,
      },
      {
        name: '折-长度',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '挑-水平延伸',
        default: 120,
        min: 0,
        max: 1000,
      },
      {
        name: '挑-竖直延伸',
        default: 120,
        min: 0,
        max: 1000,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '竖钩',
    params: [
      {
        name: '竖-长度',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '钩-水平延伸',
        default: 100,
        min: 0,
        max: 300,
      },
      {
        name: '钩-竖直延伸',
        default: -15,
        min: -300,
        max: 300,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '横钩',
    params: [
      {
        name: '横-长度',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '钩-水平延伸',
        default: 100,
        min: 0,
        max: 300,
      },
      {
        name: '钩-竖直延伸',
        default: 100,
        min: 0,
        max: 300,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '弯钩',
    params: [
      {
        name: '弯-长度',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '弯-弯曲度',
        default: 100,
        min: 0,
        max: 350,
      },
      {
        name: '钩-水平延伸',
        default: 100,
        min: 0,
        max: 300,
      },
      {
        name: '钩-竖直延伸',
        default: -30,
        min: -300,
        max: 300,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '斜钩',
    params: [
      {
        name: '斜-水平延伸',
        default: 300,
        min: 0,
        max: 1000,
      },
      {
        name: '斜-竖直延伸',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '斜-弯曲游标',
        default: 0.5,
        min: 0,
        max: 1,
      },
      {
        name: '斜-弯曲度',
        default: 200,
        min: 0,
        max: 500,
      },
      {
        name: '钩-水平延伸',
        default: 100,
        min: 0,
        max: 300,
      },
      {
        name: '钩-竖直延伸',
        default: 100,
        min: 0,
        max: 300,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '竖弯钩',
    params: [
      {
        name: '竖-长度',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '弯-长度',
        default: 260,
        min: 0,
        max: 1000,
      },
      {
        name: '钩-水平延伸',
        default: 25,
        min: -150,
        max: 150,
      },
      {
        name: '钩-竖直延伸',
        default: 80,
        min: 0,
        max: 200,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '竖折折钩',
    params: [
      {
        name: '竖-长度',
        default: 200,
        min: 0,
        max: 1000,
      },
      {
        name: '折1-长度',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '折2-水平延伸',
        default: 100,
        min: 0,
        max: 1000,
      },
      {
        name: '折2-竖直延伸',
        default: 300,
        min: 0,
        max: 1000,
      },
      {
        name: '钩-水平延伸',
        default: 80,
        min: 0,
        max: 300,
      },
      {
        name: '钩-竖直延伸',
        default: -60,
        min: -300,
        max: 300,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '横折钩',
    params: [
      {
        name: '横-长度',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '折-水平延伸',
        default: 100,
        min: 0,
        max: 1000,
      },
      {
        name: '折-竖直延伸',
        default: 300,
        min: 0,
        max: 1000,
      },
      {
        name: '钩-水平延伸',
        default: 80,
        min: 0,
        max: 300,
      },
      {
        name: '钩-竖直延伸',
        default: -60,
        min: -300,
        max: 300,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '横弯钩',
    params: [
      {
        name: '横-长度',
        default: 300,
        min: 0,
        max: 1000,
      },
      {
        name: '弯-水平延伸',
        default: 100,
        min: 0,
        max: 1000,
      },
      {
        name: '弯-竖直延伸',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '弯-弯曲游标',
        default: 0.5,
        min: 0,
        max: 1,
      },
      {
        name: '弯-弯曲度',
        default: 100,
        min: 0,
        max: 350,
      },
      {
        name: '钩-水平延伸',
        default: 60,
        min: 0,
        max: 300,
      },
      {
        name: '钩-竖直延伸',
        default: 60,
        min: 0,
        max: 300,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '横折弯钩',
    params: [
      {
        name: '横-长度',
        default: 300,
        min: 0,
        max: 1000,
      },
      {
        name: '折-水平延伸',
        default: 300,
        min: 0,
        max: 1000,
      },
      {
        name: '折-竖直延伸',
        default: 380,
        min: 0,
        max: 1000,
      },
      {
        name: '折-弯曲游标',
        default: 0.5,
        min: 0,
        max: 1,
      },
      {
        name: '折-弯曲度',
        default: 100,
        min: 0,
        max: 300,
      },
      {
        name: '弯-长度',
        default: 380,
        min: 0,
        max: 1000,
      },
      {
        name: '钩-水平延伸',
        default: 60,
        min: 0,
        max: 300,
      },
      {
        name: '钩-竖直延伸',
        default: 60,
        min: 0,
        max: 300,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '横撇弯钩',
    params: [
      {
        name: '横-长度',
        default: 260,
        min: 0,
        max: 1000,
      },
      {
        name: '撇-水平延伸',
        default: 120,
        min: 0,
        max: 1000,
      },
      {
        name: '撇-竖直延伸',
        default: 200,
        min: 0,
        max: 1000,
      },
      {
        name: '弯钩-竖直延伸',
        default: 300,
        min: 0,
        max: 1000,
      },
      {
        name: '弯钩-弯曲游标',
        default: 0.5,
        min: 0,
        max: 1,
      },
      {
        name: '弯钩-弯曲度',
        default: 150,
        min: 0,
        max: 500,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '横折折弯钩',
    params: [
      {
        name: '横-长度',
        default: 350,
        min: 0,
        max: 1000,
      },
      {
        name: '折1-水平延伸',
        default: 120,
        min: 0,
        max: 1000,
      },
      {
        name: '折1-竖直延伸',
        default: 180,
        min: 0,
        max: 1000,
      },
      {
        name: '折2-长度',
        default: 200,
        min: 0,
        max: 1000,
      },
      {
        name: '弯-水平延伸',
        default: 100,
        min: 0,
        max: 1000,
      },
      {
        name: '弯-竖直延伸',
        default: 300,
        min: 0,
        max: 1000,
      },
      {
        name: '钩-水平延伸',
        default: 80,
        min: 0,
        max: 300,
      },
      {
        name: '钩-竖直延伸',
        default: -60,
        min: -300,
        max: 300,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '横折',
    params: [
      {
        name: '横-长度',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '折-水平延伸',
        default: 100,
        min: 0,
        max: 1000,
      },
      {
        name: '折-竖直延伸',
        default: 300,
        min: 0,
        max: 1000,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '二横折',
    params: [
      {
        name: '横1-长度',
        default: 300,
        min: 0,
        max: 1000,
      },
      {
        name: '折1-水平延伸',
        default: 50,
        min: 0,
        max: 1000,
      },
      {
        name: '折1-竖直延伸',
        default: 200,
        min: 0,
        max: 1000,
      },
      {
        name: '横2-长度',
        default: 200,
        min: 0,
        max: 1000,
      },
      {
        name: '折2-水平延伸',
        default: 50,
        min: 0,
        max: 1000,
      },
      {
        name: '折2-竖直延伸',
        default: 200,
        min: 0,
        max: 1000,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '竖折',
    params: [
      {
        name: '竖-水平延伸',
        default: 0,
        min: 0,
        max: 200,
      },
      {
        name: '竖-竖直延伸',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '折-长度',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '竖弯',
    params: [
      {
        name: '竖-水平延伸',
        default: 0,
        min: 0,
        max: 200,
      },
      {
        name: '竖-竖直延伸',
        default: 300,
        min: 0,
        max: 1000,
      },
      {
        name: '弯-长度',
        default: 200,
        min: 0,
        max: 1000,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  },
  {
    name: '横折弯',
    params: [
      {
        name: '横-长度',
        default: 200,
        min: 0,
        max: 1000,
      },
      {
        name: '折-水平延伸',
        default: 0,
        min: -500,
        max: 500,
      },
      {
        name: '折-竖直延伸',
        default: 300,
        min: 0,
        max: 1000,
      },
      {
        name: '弯-长度',
        default: 200,
        min: 0,
        max: 1000,
      },
      {
        name: '字重',
        default: 50,
        min: 0,
        max: 200,
      },
    ]
  }
]

export {
  strokes,
}