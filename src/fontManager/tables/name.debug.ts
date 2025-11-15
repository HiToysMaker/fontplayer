/**
 * name表调试版本
 * 在生成数据时添加详细日志
 */

import type { INameTable } from './name'
import { encoder } from '../encode'

export function createWithDebug(table: INameTable) {
  let data: Array<number> = []
  
  console.log('\n=== Name Table Binary Generation Debug ===')
  console.log('Input table:', {
    version: table.version,
    count: table.count,
    storageOffset: table.storageOffset,
    nameRecordCount: table.nameRecord?.length,
    stringPoolSize: table.stringPool?.length
  })
  
  // 1. 写入表头
  console.log('\n1. Writing header...')
  const versionBytes = encoder.uint16(table.version)
  const countBytes = encoder.uint16(table.count)
  const storageOffsetBytes = encoder.uint16(table.storageOffset)
  
  console.log(`  version=${table.version}, bytes:`, versionBytes)
  console.log(`  count=${table.count}, bytes:`, countBytes)
  console.log(`  storageOffset=${table.storageOffset}, bytes:`, storageOffsetBytes)
  
  if (versionBytes) data = data.concat(versionBytes)
  if (countBytes) data = data.concat(countBytes)
  if (storageOffsetBytes) data = data.concat(storageOffsetBytes)
  
  console.log(`  Header size: ${data.length} bytes (expected 6)`)
  
  // 2. 写入nameRecord数组
  console.log('\n2. Writing nameRecord array...')
  if (table.nameRecord) {
    for (let i = 0; i < table.nameRecord.length; i++) {
      const record = table.nameRecord[i]
      const startSize = data.length
      
      const platformIDBytes = encoder.uint16(record.platformID)
      const encodingIDBytes = encoder.uint16(record.encodingID)
      const languageIDBytes = encoder.uint16(record.languageID)
      const nameIDBytes = encoder.uint16(record.nameID)
      const lengthBytes = encoder.uint16(record.length)
      const stringOffsetBytes = encoder.uint16(record.stringOffset)
      
      if (platformIDBytes) data = data.concat(platformIDBytes)
      if (encodingIDBytes) data = data.concat(encodingIDBytes)
      if (languageIDBytes) data = data.concat(languageIDBytes)
      if (nameIDBytes) data = data.concat(nameIDBytes)
      if (lengthBytes) data = data.concat(lengthBytes)
      if (stringOffsetBytes) data = data.concat(stringOffsetBytes)
      
      const recordSize = data.length - startSize
      console.log(`  Record[${i}]: nameID=${record.nameID}, size=${recordSize} bytes (expected 12)`)
      
      if (recordSize !== 12) {
        console.error(`    ❌ ERROR: Record size mismatch!`)
      }
    }
  }
  
  const headerAndRecordsSize = data.length
  console.log(`  Total header+records size: ${headerAndRecordsSize} bytes`)
  console.log(`  Expected: ${6 + (table.nameRecord?.length || 0) * 12} bytes`)
  
  // 3. 写入stringPool
  console.log('\n3. Writing stringPool...')
  if (table.stringPool && table.stringPool.length > 0) {
    console.log(`  StringPool size: ${table.stringPool.length} bytes`)
    data = data.concat(table.stringPool)
  } else {
    console.log(`  StringPool is empty or undefined`)
  }
  
  console.log(`\n=== Final Result ===`)
  console.log(`Total data size: ${data.length} bytes`)
  console.log(`Expected size: ${6 + (table.nameRecord?.length || 0) * 12 + (table.stringPool?.length || 0)} bytes`)
  
  if (data.length !== (6 + (table.nameRecord?.length || 0) * 12 + (table.stringPool?.length || 0))) {
    console.error('❌ Size mismatch detected!')
  } else {
    console.log('✅ Size matches expected')
  }
  
  console.log('===================================\n')
  
  return data
}

