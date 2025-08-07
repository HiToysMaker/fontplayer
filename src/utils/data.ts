import { curry, compose, tap } from 'ramda'

const listToMap = (list: Array<Object>, key: string) => {
  const map: Object = {}
  list.map((item: Object) => {
    // @ts-ignore
    map[item[key]] = item
  })
  return map
}

const debounce = curry((wait, fn) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), wait)
  };
})

export {
  listToMap,
  debounce,
}