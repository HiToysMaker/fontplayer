const listToMap = (list: Array<Object>, key: string) => {
  const map: Object = {}
  list.map((item: Object) => {
    // @ts-ignore
    map[item[key]] = item
  })
  return map
}

export {
  listToMap,
}