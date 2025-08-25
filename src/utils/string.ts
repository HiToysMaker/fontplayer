import { nanoid } from 'nanoid'

// 轻量级ID生成器，用于大量字符处理
let lightIdCounter = 0
const lightIdPrefix = Date.now().toString(36)

const genLightId = () => {
  lightIdCounter++
  return `${lightIdPrefix}_${lightIdCounter.toString(36)}`
}

// 重置轻量级ID计数器（在处理新字体时调用）
const resetLightIdCounter = () => {
  lightIdCounter = 0
}

// 性能测试函数
const testIdGeneratorPerformance = (count: number = 10000) => {
  console.log(`Testing ID generator performance with ${count} iterations...`)
  
  // 测试nanoid性能
  const start1 = performance.now()
  for (let i = 0; i < count; i++) {
    nanoid()
  }
  const time1 = performance.now() - start1
  
  // 测试轻量级ID性能
  const start2 = performance.now()
  for (let i = 0; i < count; i++) {
    genLightId()
  }
  const time2 = performance.now() - start2
  
  console.log(`nanoid: ${time1.toFixed(2)}ms`)
  console.log(`genLightId: ${time2.toFixed(2)}ms`)
  console.log(`Performance improvement: ${(time1 / time2).toFixed(2)}x faster`)
  
  return { nanoid: time1, genLightId: time2 }
}

const genUUID = () => {
  // function S4() {
  //   return (((1 + Math.random())*0x10000)|0).toString(16).substring(1)
  // }
  // return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4())
  return nanoid()
}

const toUnicode = (character: string) => {
  return character.charCodeAt(0).toString(16).padStart(4, '0')
}

const toIconUnicode = (count: number) => {
  const start = 41000
  return (start + count).toString(16)
}

export {
  genUUID,
  genLightId,
  resetLightIdCounter,
  testIdGeneratorPerformance,
  toUnicode,
  toIconUnicode,
}