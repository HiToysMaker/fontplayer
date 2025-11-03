/**
 * name表调试包装器
 * 在createTable2前后添加验证和日志
 */

import { createTable2 } from './name'
import { validateNameTable, debugPrintNameTable, calculateNameTableSize } from '../utils/debugNameTable'

/**
 * 带调试的createTable2包装器
 */
export function createTable2WithDebug(names: Array<any>, variants?: any) {
  console.log('=== createTable2 Debug Start ===')
  console.log('Input names count:', names.length)
  console.log('Has variants:', !!variants)
  
  if (variants) {
    console.log('Variants.axes count:', variants.axes?.length || 0)
    console.log('Variants.instances count:', variants.instances?.length || 0)
    
    if (variants.axes) {
      console.log('Axes:', variants.axes.map((a: any) => ({
        tag: a.tag,
        name: a.name,
        nameID: a.nameID
      })))
    }
    
    if (variants.instances) {
      console.log('Instances:', variants.instances.map((i: any) => ({
        subfamilyName: i.subfamilyName,
        subfamilyNameID: i.subfamilyNameID,
        postScriptNameID: i.postScriptNameID
      })))
    }
  }
  
  // 调用原函数
  const nameTable = createTable2(names, variants)
  
  // 验证结果
  console.log('\n=== Name Table Created ===')
  const validation = validateNameTable(nameTable)
  
  if (!validation.valid) {
    console.error('❌ Name table validation failed!')
    validation.issues.forEach(issue => console.error(`  - ${issue}`))
  } else {
    console.log('✅ Name table validation passed')
  }
  
  debugPrintNameTable(nameTable)
  
  const expectedSize = calculateNameTableSize(nameTable)
  console.log(`Expected binary size: ${expectedSize} bytes`)
  
  console.log('=== createTable2 Debug End ===\n')
  
  return nameTable
}

