import { nanoid } from 'nanoid'

const genUUID = () => {
  // function S4() {
  //   return (((1 + Math.random())*0x10000)|0).toString(16).substring(1)
  // }
  // return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4())
  return nanoid()
}

const toUnicode = (character: string) => {
  return character.charCodeAt(0).toString(16)
}

const toIconUnicode = (count: number) => {
  const start = 41000
  return (start + count).toString(16)
}

export {
  genUUID,
  toUnicode,
  toIconUnicode,
}