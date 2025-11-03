/**
 * 可变字体创建示例（包含axes和instances）
 * Example of creating a variable font with both axes and instances
 */

import { createFont, type IVariationAxis, type IVariationInstance, type IVariants } from '../font'
import type { ICharacter } from '../character'

/**
 * 示例：创建一个包含多个实例的可变字体
 */
export async function createVariableFontWithInstances(characters: ICharacter[]) {
  // 1. 定义可变字体的轴
  const axes: IVariationAxis[] = [
    {
      tag: 'wght',
      name: 'Weight',
      minValue: 100,
      defaultValue: 400,
      maxValue: 900,
    },
    {
      tag: 'wdth',
      name: 'Width',
      minValue: 75,
      defaultValue: 100,
      maxValue: 125,
    }
  ]

  // 2. 定义预设实例
  // 注意：postScriptName会自动生成（格式：FamilyName-SubfamilyName，无空格）
  // 也可以手动指定postScriptName来覆盖自动生成的值
  const instances: IVariationInstance[] = [
    {
      subfamilyName: 'Thin',
      coordinates: [100, 100],  // wght=100, wdth=100
      // postScriptName会自动生成为：'MyVariableFont-Thin'
      flags: 0,
    },
    {
      subfamilyName: 'Light',
      coordinates: [300, 100],
      // postScriptName会自动生成为：'MyVariableFont-Light'
      flags: 0,
    },
    {
      subfamilyName: 'Regular',
      coordinates: [400, 100],
      // postScriptName会自动生成为：'MyVariableFont-Regular'
      flags: 0,
    },
    {
      subfamilyName: 'Bold',
      coordinates: [700, 100],
      // postScriptName会自动生成为：'MyVariableFont-Bold'
      flags: 0,
    },
    {
      subfamilyName: 'Black',
      coordinates: [900, 100],
      // postScriptName会自动生成为：'MyVariableFont-Black'
      flags: 0,
    },
    // 宽体变体
    {
      subfamilyName: 'Wide',
      coordinates: [400, 125],
      // postScriptName会自动生成为：'MyVariableFont-Wide'
      flags: 0,
    },
    {
      subfamilyName: 'Bold Wide',
      coordinates: [700, 125],
      // postScriptName会自动生成为：'MyVariableFont-BoldWide'（空格被移除）
      flags: 0,
    },
    // 窄体变体
    {
      subfamilyName: 'Condensed',
      coordinates: [400, 75],
      // postScriptName会自动生成为：'MyVariableFont-Condensed'
      flags: 0,
    },
    {
      subfamilyName: 'Bold Condensed',
      coordinates: [700, 75],
      // postScriptName会自动生成为：'MyVariableFont-BoldCondensed'（空格被移除）
      flags: 0,
    }
  ]

  // 3. 准备variants配置
  const variants: IVariants = {
    axes: axes,
    instances: instances
  }

  // 4. 创建字体
  const font = await createFont(characters, {
    familyName: 'MyVariableFont',
    styleName: 'Regular',
    fullName: 'My Variable Font Regular',
    postScriptName: 'MyVariableFont-Regular',
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    
    variants: variants,
    
    tables: {
      name: [
        {
          nameID: 1,
          nameLabel: 'fontFamily',
          platformID: 3,
          encodingID: 1,
          langID: 0x409,
          value: 'MyVariableFont',
        },
        {
          nameID: 2,
          nameLabel: 'fontSubfamily',
          platformID: 3,
          encodingID: 1,
          langID: 0x409,
          value: 'Regular',
        },
        {
          nameID: 4,
          nameLabel: 'fullName',
          platformID: 3,
          encodingID: 1,
          langID: 0x409,
          value: 'My Variable Font Regular',
        }
      ]
    }
  })

  // 5. 检查自动分配的nameID
  console.log('=== Axes nameIDs ===')
  axes.forEach(axis => {
    console.log(`${axis.name} (${axis.tag}): nameID = ${axis.nameID}`)
  })

  console.log('\n=== Instances nameIDs ===')
  instances.forEach(instance => {
    console.log(`${instance.subfamilyName}:`)
    console.log(`  subfamilyNameID = ${instance.subfamilyNameID}`)
    console.log(`  postScriptName = ${instance.postScriptName} (自动生成)`)
    console.log(`  postScriptNameID = ${instance.postScriptNameID}`)
  })

  return { font, axes, instances }
}

/**
 * 示例：中文字体的可变字体实例
 */
export async function createChineseVariableFontWithInstances(characters: ICharacter[]) {
  const axes: IVariationAxis[] = [
    {
      tag: 'wght',
      name: 'Weight',  // 英文名称
      minValue: 100,
      defaultValue: 400,
      maxValue: 900,
    }
  ]

  const instances: IVariationInstance[] = [
    {
      subfamilyName: 'ExtraLight',  // 极细
      coordinates: [100],
    },
    {
      subfamilyName: 'Light',       // 细体
      coordinates: [300],
    },
    {
      subfamilyName: 'Regular',     // 常规
      coordinates: [400],
    },
    {
      subfamilyName: 'Medium',      // 中等
      coordinates: [500],
    },
    {
      subfamilyName: 'Bold',        // 粗体
      coordinates: [700],
    },
    {
      subfamilyName: 'ExtraBold',   // 特粗
      coordinates: [800],
    },
    {
      subfamilyName: 'Black',       // 黑体
      coordinates: [900],
    }
  ]

  const font = await createFont(characters, {
    familyName: '我的可变字体',
    styleName: '常规',
    unitsPerEm: 1000,
    ascender: 880,
    descender: -120,
    
    variants: {
      axes: axes,
      instances: instances
    },
    
    tables: {
      name: [
        {
          nameID: 1,
          nameLabel: 'fontFamily',
          platformID: 3,
          encodingID: 1,
          langID: 0x804,
          value: '我的可变字体',
        },
        {
          nameID: 1,
          nameLabel: 'fontFamily',
          platformID: 3,
          encodingID: 1,
          langID: 0x409,
          value: 'MyChineseVariableFont',
        }
      ]
    }
  })

  return { font, axes, instances }
}

/**
 * 示例：使用自动分配的nameID创建fvar表
 */
export function createFvarTableFromVariants(axes: IVariationAxis[], instances: IVariationInstance[]) {
  return {
    majorVersion: 1,
    minorVersion: 0,
    axisCount: axes.length,
    axes: axes.map(axis => ({
      axisTag: axis.tag,
      minValue: axis.minValue,
      defaultValue: axis.defaultValue,
      maxValue: axis.maxValue,
      flags: 0,
      axisNameID: axis.nameID!  // 使用自动分配的nameID
    })),
    instanceCount: instances.length,
    instances: instances.map(instance => ({
      subfamilyNameID: instance.subfamilyNameID!,  // 使用自动分配的nameID
      flags: instance.flags || 0,
      coordinates: instance.coordinates,
      postScriptNameID: instance.postScriptNameID  // 如果有的话
    }))
  }
}

/**
 * 验证函数：检查所有nameID是否正确分配
 */
export function validateVariantsNameIDs(axes: IVariationAxis[], instances: IVariationInstance[]): boolean {
  let isValid = true

  // 验证axes
  for (const axis of axes) {
    if (!axis.nameID || axis.nameID < 256) {
      console.error(`Axis ${axis.tag} has invalid nameID: ${axis.nameID}`)
      isValid = false
    }
  }

  // 验证instances
  for (const instance of instances) {
    if (!instance.subfamilyNameID || instance.subfamilyNameID < 256) {
      console.error(`Instance "${instance.subfamilyName}" has invalid subfamilyNameID: ${instance.subfamilyNameID}`)
      isValid = false
    }

    if (instance.postScriptName && (!instance.postScriptNameID || instance.postScriptNameID < 256)) {
      console.error(`Instance "${instance.subfamilyName}" has invalid postScriptNameID: ${instance.postScriptNameID}`)
      isValid = false
    }
  }

  // 检查nameID是否唯一
  const allNameIDs = [
    ...axes.map(a => a.nameID!),
    ...instances.map(i => i.subfamilyNameID!),
    ...instances.filter(i => i.postScriptNameID).map(i => i.postScriptNameID!)
  ]

  const uniqueNameIDs = new Set(allNameIDs)
  if (allNameIDs.length !== uniqueNameIDs.size) {
    console.error('Duplicate nameIDs found!')
    isValid = false
  }

  return isValid
}

/**
 * 使用示例
 */
export async function runExample(characters: ICharacter[]) {
  console.log('Creating variable font with instances...\n')
  
  const { font, axes, instances } = await createVariableFontWithInstances(characters)
  
  // 验证nameID
  const isValid = validateVariantsNameIDs(axes, instances)
  console.log(`\nValidation result: ${isValid ? 'PASS ✓' : 'FAIL ✗'}`)
  
  // 创建fvar表数据
  const fvarTableData = createFvarTableFromVariants(axes, instances)
  console.log('\nfvar table data:', JSON.stringify(fvarTableData, null, 2))
  
  return font
}

