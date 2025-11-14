import * as R from "ramda"

const strokes = [
  {
    name: '横',
    uuid: 'KXIDGV2F_Pyd7r0C6_TB1',
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
    uuid: 'aH2ns8O1EHIIESpjVzSy8',
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
    uuid: 'LrdRipEgPadhamoHzTuJ1',
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
    uuid: 'HcR12pTrOLu4ZOAuQuriM',
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
    uuid: '-ubJbIG2A8mc-nSDlljeb',
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
    uuid: 'NhmE6WShXfKTOUOH4V7zk',
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
    uuid: 'QcHLqxGmyKRhv4yyA0HqR',
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
    uuid: 'ioUJIJq5204Sa43hz5iev',
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
    uuid: 'krVrPdyfoe9sKIT_wQX-7',
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
    uuid: 'lbMVwrKP_q4p1oPHu4anJ',
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
    uuid: 'EPBo33qt9wCQ1qYj1u71k',
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
    uuid: 'fMIzxBo7oSEFUayQx_cCO',
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
    uuid: 'OXQCmaRKaoLjigiNIwicW',
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
    uuid: 'aiqF1SoB4nhfEDkhRmB3k',
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
    uuid: 'JYSKwaS9xvilKQMcRZ3E0',
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
    uuid: '1Qdp3QzLK64BtwctXszQZ',
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
    uuid: 'YENGMQs6EL4dBiMrf1-nh',
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
    uuid: 'equYbH1yyUiKQ6b34jZea',
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
    uuid: 'hfyoooj2emaeJLcgRctnc',
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
    uuid: 'fr4w85QKX0poi7nSBmjFK',
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
    uuid: 'FuEXpS2xyTJA73Z2WcrOz',
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
    uuid: 'c8Pd8VSPjClASnXbxipaV',
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
    uuid: '3RKgyX_a2ZvPsfushHJg2',
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
    uuid: 'R6GeGWSWvEc-yqfuzSuKo',
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
    uuid: 'F6ywDDM5lvSxM5XkMnT35',
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
    uuid: 'vLtc_ON5tYCc27bn2gl9f',
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
    uuid: 'SeF5EncRABMJnvz2sfGC0',
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
    name: '横折2',
    uuid: 'IInqUl_DAjYg-8Tmw_NHE',
    params: [
      {
        name: '横-长度',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '折-长度',
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
    uuid: 'Di0BaW5M-zifjadwEdyPh',
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
    uuid: 'MqIp7k0ZDGTDWdQIrVHD0',
    params: [
      {
        name: '竖-水平延伸',
        default: 0,
        min: -200,
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
    uuid: 'oyP7Yql1-auw4uJDNpxxw',
    params: [
      {
        name: '竖-长度',
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
    uuid: '3ogIJZDcPTAUT67ob1mmH',
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

const kai_strokes = [
  {
    name: '横',
    uuid: 'KXIDGV2F_Pyd7r0C6_TB1',
    params: [
      {
        name: '水平延伸',
        default: 500,
        min: 50,
        max: 1000,
        originParam: '长度',
      },
      {
        name: '竖直延伸',
        default: 0,
        min: 0,
        max: 200,
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
    uuid: 'aH2ns8O1EHIIESpjVzSy8',
    params: [
      {
        name: '竖直延伸',
        default: 500,
        min: 50,
        max: 1000,
        originParam: '长度',
      },
      {
        name: '水平延伸',
        default: 0,
        min: -200,
        max: 200,
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
    uuid: 'LrdRipEgPadhamoHzTuJ1',
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
    uuid: 'HcR12pTrOLu4ZOAuQuriM',
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
    uuid: '-ubJbIG2A8mc-nSDlljeb',
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
    uuid: 'NhmE6WShXfKTOUOH4V7zk',
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
    uuid: 'QcHLqxGmyKRhv4yyA0HqR',
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
    uuid: 'ioUJIJq5204Sa43hz5iev',
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
    uuid: 'krVrPdyfoe9sKIT_wQX-7',
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
    uuid: 'lbMVwrKP_q4p1oPHu4anJ',
    params: [
      {
        name: '横-水平延伸',
        default: 500,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 200,
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
    uuid: 'EPBo33qt9wCQ1qYj1u71k',
    params: [
      {
        name: '横-水平延伸',
        default: 220,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 200,
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
        name: '折2-水平延伸',
        default: 150,
        min: 0,
        max: 1000,
        originParam: '折2-长度',
      },
      {
        name: '折2-竖直延伸',
        default: 0,
        min: 0,
        max: 200,
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
    uuid: 'fMIzxBo7oSEFUayQx_cCO',
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
    uuid: 'OXQCmaRKaoLjigiNIwicW',
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
    uuid: 'aiqF1SoB4nhfEDkhRmB3k',
    params: [
      {
        name: '竖-竖直延伸',
        default: 500,
        min: 0,
        max: 1000,
        originParam: '竖-长度',
      },
      {
        name: '竖-水平延伸',
        default: 0,
        min: -200,
        max: 200,
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
    uuid: 'JYSKwaS9xvilKQMcRZ3E0',
    params: [
      {
        name: '横-水平延伸',
        default: 150,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 200,
      },
      {
        name: '折-水平延伸',
        default: -10,
        min: -200,
        max: 200,
      },
      {
        name: '折-竖直延伸',
        default: 500,
        min: 0,
        max: 1000,
        originParam: '折-长度',
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
    uuid: '1Qdp3QzLK64BtwctXszQZ',
    params: [
      {
        name: '竖-竖直延伸',
        default: 500,
        min: 0,
        max: 1000,
        originParam: '竖-长度',
      },
      {
        name: '竖-水平延伸',
        default: 0,
        min: -200,
        max: 200,
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
    uuid: 'YENGMQs6EL4dBiMrf1-nh',
    params: [
      {
        name: '横-水平延伸',
        default: 500,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 200,
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
    uuid: 'equYbH1yyUiKQ6b34jZea',
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
    uuid: 'hfyoooj2emaeJLcgRctnc',
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
    uuid: 'fr4w85QKX0poi7nSBmjFK',
    params: [
      {
        name: '竖-竖直延伸',
        default: 500,
        min: 0,
        max: 1000,
        originParam: '竖-长度',
      },
      {
        name: '竖-水平延伸',
        default: 0,
        min: -200,
        max: 200,
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
    uuid: 'FuEXpS2xyTJA73Z2WcrOz',
    params: [
      {
        name: '竖-竖直延伸',
        default: 200,
        min: 0,
        max: 1000,
        originParam: '竖-长度',
      },
      {
        name: '竖-水平延伸',
        default: -10,
        min: -200,
        max: 200,
      },
      {
        name: '折1-水平延伸',
        default: 500,
        min: 0,
        max: 1000,
        originParam: '折1-长度',
      },
      {
        name: '折1-竖直延伸',
        default: 0,
        min: 0,
        max: 200,
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
    uuid: 'c8Pd8VSPjClASnXbxipaV',
    params: [
      {
        name: '横-水平延伸',
        default: 500,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 200,
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
    uuid: '3RKgyX_a2ZvPsfushHJg2',
    params: [
      {
        name: '横-水平延伸',
        default: 300,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 200,
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
    uuid: 'R6GeGWSWvEc-yqfuzSuKo',
    params: [
      {
        name: '横-水平延伸',
        default: 300,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 200,
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
    uuid: 'F6ywDDM5lvSxM5XkMnT35',
    params: [
      {
        name: '横-水平延伸',
        default: 260,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 200,
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
    uuid: 'vLtc_ON5tYCc27bn2gl9f',
    params: [
      {
        name: '横-水平延伸',
        default: 350,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 200,
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
        name: '折2-水平延伸',
        default: 200,
        min: 0,
        max: 1000,
        originParam: '折2-长度',
      },
      {
        name: '折2-竖直延伸',
        default: 0,
        min: 0,
        max: 200,
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
    uuid: 'SeF5EncRABMJnvz2sfGC0',
    params: [
      {
        name: '横-水平延伸',
        default: 500,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 200,
      },
      {
        name: '折-水平延伸',
        default: 0,
        min: -200,
        max: 200,
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
    name: '横折2',
    uuid: 'IInqUl_DAjYg-8Tmw_NHE',
    params: [
      {
        name: '横-水平延伸',
        default: 500,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 200,
      },
      {
        name: '折-长度',
        default: 300,
        min: 0,
        max: 1000,
        originParam: '折-长度',
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
    uuid: 'Di0BaW5M-zifjadwEdyPh',
    params: [
      {
        name: '横1-水平延伸',
        default: 300,
        min: 0,
        max: 1000,
        originParam: '横1-长度',
      },
      {
        name: '横1-竖直延伸',
        default: 0,
        min: 0,
        max: 200,
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
        name: '横2-水平延伸',
        default: 200,
        min: 0,
        max: 1000,
        originParam: '横2-长度',
      },
      {
        name: '横2-竖直延伸',
        default: 0,
        min: 0,
        max: 200,
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
    uuid: 'MqIp7k0ZDGTDWdQIrVHD0',
    params: [
      {
        name: '竖-水平延伸',
        default: 0,
        min: -200,
        max: 200,
      },
      {
        name: '竖-竖直延伸',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '折-水平延伸',
        default: 500,
        min: 0,
        max: 1000,
        originParam: '折-长度',
      },
      {
        name: '折-竖直延伸',
        default: 0,
        min: -200,
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
    uuid: 'oyP7Yql1-auw4uJDNpxxw',
    params: [
      {
        name: '竖-竖直延伸',
        default: 300,
        min: 0,
        max: 1000,
        originParam: '竖-长度',
      },
      {
        name: '竖-水平延伸',
        default: 0,
        min: -200,
        max: 200,
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
    uuid: '3ogIJZDcPTAUT67ob1mmH',
    params: [
      {
        name: '横-水平延伸',
        default: 200,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 200,
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

const hei_strokes = [
  {
    name: '横',
    uuid: 'KXIDGV2F_Pyd7r0C6_TB1',
    params: [
      {
        name: '水平延伸',
        default: 500,
        min: 50,
        max: 1000,
        originParam: '长度',
      },
      {
        name: '竖直延伸',
        default: 0,
        min: 0,
        max: 0,
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
    uuid: 'aH2ns8O1EHIIESpjVzSy8',
    params: [
      {
        name: '竖直延伸',
        default: 500,
        min: 50,
        max: 1000,
        originParam: '长度',
      },
      {
        name: '水平延伸',
        default: 0,
        min: 0,
        max: 0,
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
    uuid: 'LrdRipEgPadhamoHzTuJ1',
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
    uuid: 'HcR12pTrOLu4ZOAuQuriM',
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
    uuid: '-ubJbIG2A8mc-nSDlljeb',
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
    uuid: 'NhmE6WShXfKTOUOH4V7zk',
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
    uuid: 'QcHLqxGmyKRhv4yyA0HqR',
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
    uuid: 'ioUJIJq5204Sa43hz5iev',
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
    uuid: 'krVrPdyfoe9sKIT_wQX-7',
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
    uuid: 'lbMVwrKP_q4p1oPHu4anJ',
    params: [
      {
        name: '横-水平延伸',
        default: 500,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 0,
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
    uuid: 'EPBo33qt9wCQ1qYj1u71k',
    params: [
      {
        name: '横-水平延伸',
        default: 220,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 0,
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
        name: '折2-水平延伸',
        default: 150,
        min: 0,
        max: 1000,
        originParam: '折2-长度',
      },
      {
        name: '折2-竖直延伸',
        default: 0,
        min: 0,
        max: 200,
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
    uuid: 'fMIzxBo7oSEFUayQx_cCO',
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
    uuid: 'OXQCmaRKaoLjigiNIwicW',
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
    uuid: 'aiqF1SoB4nhfEDkhRmB3k',
    params: [
      {
        name: '竖-竖直延伸',
        default: 500,
        min: 0,
        max: 1000,
        originParam: '竖-长度',
      },
      {
        name: '竖-水平延伸',
        default: 0,
        min: 0,
        max: 0,
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
    uuid: 'JYSKwaS9xvilKQMcRZ3E0',
    params: [
      {
        name: '横-水平延伸',
        default: 150,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 0,
      },
      {
        name: '折-水平延伸',
        default: -10,
        min: -200,
        max: 200,
      },
      {
        name: '折-竖直延伸',
        default: 500,
        min: 0,
        max: 1000,
        originParam: '折-长度',
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
    uuid: '1Qdp3QzLK64BtwctXszQZ',
    params: [
      {
        name: '竖-竖直延伸',
        default: 500,
        min: 0,
        max: 1000,
        originParam: '竖-长度',
      },
      {
        name: '竖-水平延伸',
        default: 0,
        min: 0,
        max: 0,
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
    uuid: 'YENGMQs6EL4dBiMrf1-nh',
    params: [
      {
        name: '横-水平延伸',
        default: 500,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 0,
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
    uuid: 'equYbH1yyUiKQ6b34jZea',
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
    uuid: 'hfyoooj2emaeJLcgRctnc',
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
    uuid: 'fr4w85QKX0poi7nSBmjFK',
    params: [
      {
        name: '竖-竖直延伸',
        default: 500,
        min: 0,
        max: 1000,
        originParam: '竖-长度',
      },
      {
        name: '竖-水平延伸',
        default: 0,
        min: 0,
        max: 0,
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
    uuid: 'FuEXpS2xyTJA73Z2WcrOz',
    params: [
      {
        name: '竖-竖直延伸',
        default: 200,
        min: 0,
        max: 1000,
        originParam: '竖-长度',
      },
      {
        name: '竖-水平延伸',
        default: -10,
        min: 0,
        max: 0,
      },
      {
        name: '折1-水平延伸',
        default: 500,
        min: 0,
        max: 1000,
        originParam: '折1-长度',
      },
      {
        name: '折1-竖直延伸',
        default: 0,
        min: 0,
        max: 0,
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
    uuid: 'c8Pd8VSPjClASnXbxipaV',
    params: [
      {
        name: '横-水平延伸',
        default: 500,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 0,
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
    uuid: '3RKgyX_a2ZvPsfushHJg2',
    params: [
      {
        name: '横-水平延伸',
        default: 300,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 0,
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
    uuid: 'R6GeGWSWvEc-yqfuzSuKo',
    params: [
      {
        name: '横-水平延伸',
        default: 300,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 0,
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
    uuid: 'F6ywDDM5lvSxM5XkMnT35',
    params: [
      {
        name: '横-水平延伸',
        default: 260,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 0,
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
    uuid: 'vLtc_ON5tYCc27bn2gl9f',
    params: [
      {
        name: '横-水平延伸',
        default: 350,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 0,
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
        name: '折2-水平延伸',
        default: 200,
        min: 0,
        max: 1000,
        originParam: '折2-长度',
      },
      {
        name: '折2-竖直延伸',
        default: 0,
        min: 0,
        max: 200,
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
    uuid: 'SeF5EncRABMJnvz2sfGC0',
    params: [
      {
        name: '横-水平延伸',
        default: 500,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 0,
      },
      {
        name: '折-水平延伸',
        default: 0,
        min: -200,
        max: 200,
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
    name: '横折2',
    uuid: 'IInqUl_DAjYg-8Tmw_NHE',
    params: [
      {
        name: '横-水平延伸',
        default: 500,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 0,
      },
      {
        name: '折-长度',
        default: 300,
        min: 0,
        max: 1000,
        originParam: '折-长度',
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
    uuid: 'Di0BaW5M-zifjadwEdyPh',
    params: [
      {
        name: '横1-水平延伸',
        default: 300,
        min: 0,
        max: 1000,
        originParam: '横1-长度',
      },
      {
        name: '横1-竖直延伸',
        default: 0,
        min: 0,
        max: 0,
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
        name: '横2-水平延伸',
        default: 200,
        min: 0,
        max: 1000,
        originParam: '横2-长度',
      },
      {
        name: '横2-竖直延伸',
        default: 0,
        min: 0,
        max: 0,
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
    uuid: 'MqIp7k0ZDGTDWdQIrVHD0',
    params: [
      {
        name: '竖-水平延伸',
        default: 0,
        min: -200,
        max: 200,
      },
      {
        name: '竖-竖直延伸',
        default: 500,
        min: 0,
        max: 1000,
      },
      {
        name: '折-水平延伸',
        default: 500,
        min: 0,
        max: 1000,
        originParam: '折-长度',
      },
      {
        name: '折-竖直延伸',
        default: 0,
        min: -200,
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
    uuid: 'oyP7Yql1-auw4uJDNpxxw',
    params: [
      {
        name: '竖-竖直延伸',
        default: 300,
        min: 0,
        max: 1000,
        originParam: '竖-长度',
      },
      {
        name: '竖-水平延伸',
        default: 0,
        min: 0,
        max: 0,
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
    uuid: '3ogIJZDcPTAUT67ob1mmH',
    params: [
      {
        name: '横-水平延伸',
        default: 200,
        min: 0,
        max: 1000,
        originParam: '横-长度',
      },
      {
        name: '横-竖直延伸',
        default: 0,
        min: 0,
        max: 0,
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

const li_strokes = R.clone(kai_strokes)

li_strokes.push(  {
  name: '横波',
  uuid: 'KXIDGV2F_Pyd7r0C6_TB1',
  params: [
    {
      name: '水平延伸',
      default: 500,
      min: 50,
      max: 1000,
      originParam: '长度',
    },
    {
      name: '竖直延伸',
      default: 0,
      min: 0,
      max: 200,
    },
    {
      name: '拱势',
      default: 0.5,
      min: 0,
      max: 1,
    },
    {
      name: '字重',
      default: 50,
      min: 10,
      max: 100,
    },
  ]
},)
li_strokes.find(stroke => stroke.name === '横').params.push({
  name: '拱势',
  default: 0.5,
  min: 0,
  max: 1,
})
li_strokes.find(stroke => stroke.name === '横折').params.push({
  name: '横-拱势',
  default: 0.5,
  min: 0,
  max: 1,
})
li_strokes.find(stroke => stroke.name === '二横折').params.push({
  name: '横1-拱势',
  default: 0.5,
  min: 0,
  max: 1,
})
li_strokes.find(stroke => stroke.name === '二横折').params.push({
  name: '横2-拱势',
  default: 0.5,
  min: 0,
  max: 1,
})
li_strokes.find(stroke => stroke.name === '横钩').params.push({
  name: '横-拱势',
  default: 0.5,
  min: 0,
  max: 1,
})
li_strokes.find(stroke => stroke.name === '横撇').params.push({
  name: '横-拱势',
  default: 0.5,
  min: 0,
  max: 1,
})
li_strokes.find(stroke => stroke.name === '横弯钩').params.push({
  name: '横-拱势',
  default: 0.5,
  min: 0,
  max: 1,
})
li_strokes.find(stroke => stroke.name === '横折2').params.push({
  name: '横-拱势',
  default: 0.5,
  min: 0,
  max: 1,
})
li_strokes.find(stroke => stroke.name === '横折钩').params.push({
  name: '横-拱势',
  default: 0.5,
  min: 0,
  max: 1,
})
li_strokes.find(stroke => stroke.name === '横折弯钩').params.push({
  name: '横-拱势',
  default: 0.5,
  min: 0,
  max: 1,
})
li_strokes.find(stroke => stroke.name === '横折折弯钩').params.push({
  name: '横-拱势',
  default: 0.5,
  min: 0,
  max: 1,
})
li_strokes.find(stroke => stroke.name === '横折折弯钩').params.push({
  name: '折2-拱势',
  default: 0.5,
  min: 0,
  max: 1,
})

export {
  strokes,
  kai_strokes,
  li_strokes,
  hei_strokes,
}