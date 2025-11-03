/**
 * name表调试工具
 * Debugging utilities for name table
 */

import type { INameTable } from '../tables/name'

/**
 * 验证name表的数据完整性
 * Validate name table data integrity
 */
export function validateNameTable(table: INameTable): { valid: boolean, issues: string[] } {
  const issues: string[] = []
  
  // 1. 检查基本字段
  if (table.version === undefined) {
    issues.push('Missing version field')
  }
  
  if (table.count === undefined) {
    issues.push('Missing count field')
  }
  
  if (table.storageOffset === undefined) {
    issues.push('Missing storageOffset field')
  }
  
  // 2. 检查nameRecord
  if (!table.nameRecord || table.nameRecord.length === 0) {
    issues.push('Missing or empty nameRecord array')
  } else {
    // 验证count是否匹配
    if (table.count !== table.nameRecord.length) {
      issues.push(`count mismatch: count=${table.count}, actual records=${table.nameRecord.length}`)
    }
    
    // 验证每个record的字段
    table.nameRecord.forEach((record, index) => {
      if (record.platformID === undefined) issues.push(`Record ${index}: missing platformID`)
      if (record.encodingID === undefined) issues.push(`Record ${index}: missing encodingID`)
      if (record.languageID === undefined) issues.push(`Record ${index}: missing languageID`)
      if (record.nameID === undefined) issues.push(`Record ${index}: missing nameID`)
      if (record.length === undefined) issues.push(`Record ${index}: missing length`)
      if (record.stringOffset === undefined) issues.push(`Record ${index}: missing stringOffset`)
    })
  }
  
  // 3. 检查stringPool
  if (!table.stringPool) {
    issues.push('Missing stringPool')
  }
  
  // 4. 检查storageOffset计算
  const expectedStorageOffset = 6 + (table.nameRecord?.length || 0) * 12
  if (table.storageOffset !== expectedStorageOffset) {
    issues.push(`storageOffset mismatch: expected=${expectedStorageOffset}, actual=${table.storageOffset}`)
  }
  
  // 5. 检查stringOffset是否在stringPool范围内
  if (table.nameRecord && table.stringPool) {
    table.nameRecord.forEach((record, index) => {
      if (record.stringOffset + record.length > table.stringPool!.length) {
        issues.push(`Record ${index}: stringOffset ${record.stringOffset} + length ${record.length} exceeds stringPool size ${table.stringPool!.length}`)
      }
    })
  }
  
  return {
    valid: issues.length === 0,
    issues
  }
}

/**
 * 计算name表的预期大小
 * Calculate expected name table size
 */
export function calculateNameTableSize(table: INameTable): number {
  let size = 0
  
  // 表头：version(2) + count(2) + storageOffset(2)
  size += 6
  
  // nameRecord数组：每个12字节
  size += (table.nameRecord?.length || 0) * 12
  
  // version 1的额外字段
  if (table.version >= 1) {
    size += 2  // langTagCount
    if (table.langTagRecord) {
      size += table.langTagRecord.length * 4  // 每个langTag 4字节
    }
  }
  
  // stringPool
  size += table.stringPool?.length || 0
  
  return size
}

/**
 * 打印name表的详细信息（用于调试）
 * Print name table details for debugging
 */
export function debugPrintNameTable(table: INameTable): void {
  console.log('=== Name Table Debug Info ===')
  console.log(`Version: ${table.version}`)
  console.log(`Count: ${table.count}`)
  console.log(`StorageOffset: ${table.storageOffset}`)
  console.log(`Actual nameRecord count: ${table.nameRecord?.length}`)
  console.log(`StringPool size: ${table.stringPool?.length} bytes`)
  
  const expectedSize = calculateNameTableSize(table)
  console.log(`Expected total size: ${expectedSize} bytes`)
  
  console.log('\n=== Name Records ===')
  table.nameRecord?.forEach((record, index) => {
    console.log(`[${index}] nameID=${record.nameID}, platform=${record.platformID}, ` +
                `encoding=${record.encodingID}, language=${record.languageID}, ` +
                `length=${record.length}, offset=${record.stringOffset}`)
  })
  
  // 验证
  const validation = validateNameTable(table)
  console.log('\n=== Validation ===')
  if (validation.valid) {
    console.log('✅ Name table is valid')
  } else {
    console.log('❌ Name table has issues:')
    validation.issues.forEach(issue => console.log(`  - ${issue}`))
  }
  
  console.log('=============================\n')
}

/**
 * 验证name表的二进制数据
 * Validate name table binary data
 */
export function validateNameTableBinary(data: number[], expectedSize?: number): { valid: boolean, issues: string[] } {
  const issues: string[] = []
  
  if (data.length < 6) {
    issues.push(`Data too short: ${data.length} bytes (minimum 6 bytes required)`)
    return { valid: false, issues }
  }
  
  // 解析表头
  const version = (data[0] << 8) | data[1]
  const count = (data[2] << 8) | data[3]
  const storageOffset = (data[4] << 8) | data[5]
  
  console.log(`Binary data: version=${version}, count=${count}, storageOffset=${storageOffset}`)
  console.log(`Binary data total size: ${data.length} bytes`)
  
  // 检查数据大小
  const minExpectedSize = 6 + count * 12
  if (data.length < minExpectedSize) {
    issues.push(`Data size ${data.length} is less than minimum ${minExpectedSize} (header + ${count} records)`)
  }
  
  if (expectedSize && data.length !== expectedSize) {
    issues.push(`Data size mismatch: expected=${expectedSize}, actual=${data.length}`)
  }
  
  // 检查storageOffset是否合理
  const expectedStorageOffset = 6 + count * 12
  if (storageOffset !== expectedStorageOffset) {
    issues.push(`storageOffset mismatch: expected=${expectedStorageOffset}, actual=${storageOffset}`)
  }
  
  return {
    valid: issues.length === 0,
    issues
  }
}

