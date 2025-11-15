/**
 * 可变字体创建示例
 * Example of creating a variable font with axis names
 */

import { createFont, type IVariationAxis, type IVariants } from '../font'
import { create as createFvarTable } from '../tables/fvar'
import type { ICharacter } from '../character'

/**
 * 示例：创建一个包含weight和width两个轴的可变字体
 */
export async function createVariableFontExample(characters: ICharacter[]) {
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

  // 2. 准备variants配置
  const variants: IVariants = {
    axes: axes,
    instances: []  // 可以定义预设的实例
  }

  // 3. 创建字体
  const font = await createFont(characters, {
    familyName: 'MyVariableFont',
    styleName: 'Regular',
    fullName: 'My Variable Font Regular',
    postScriptName: 'MyVariableFont-Regular',
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    
    // 传入variants配置
    variants: variants,
    
    // name表的基础条目
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
          nameID: 1,
          nameLabel: 'fontFamily',
          platformID: 3,
          encodingID: 1,
          langID: 0x804,
          value: '我的可变字体',
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
          nameID: 2,
          nameLabel: 'fontSubfamily',
          platformID: 3,
          encodingID: 1,
          langID: 0x804,
          value: '常规',
        },
        {
          nameID: 4,
          nameLabel: 'fullName',
          platformID: 3,
          encodingID: 1,
          langID: 0x409,
          value: 'My Variable Font Regular',
        },
        {
          nameID: 4,
          nameLabel: 'fullName',
          platformID: 3,
          encodingID: 1,
          langID: 0x804,
          value: '我的可变字体 常规',
        },
        {
          nameID: 6,
          nameLabel: 'postScriptName',
          platformID: 3,
          encodingID: 1,
          langID: 0x409,
          value: 'MyVariableFont-Regular',
        }
      ]
    }
  })

  // 4. 此时，axes数组中的每个对象已经有了nameID
  console.log('Weight axis nameID:', axes[0].nameID)  // 例如：256
  console.log('Width axis nameID:', axes[1].nameID)   // 例如：257

  // 5. 可以使用这些nameID创建fvar表
  // 注意：实际使用中，fvar表应该在createFont内部创建
  // 这里只是演示如何使用nameID
  const fvarTableExample = {
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
    instanceCount: 0,
    instances: []
  }

  console.log('fvar table example:', fvarTableExample)

  return font
}

/**
 * 示例：创建一个包含3个轴的可变字体
 */
export async function createThreeAxisVariableFont(characters: ICharacter[]) {
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
    },
    {
      tag: 'slnt',
      name: 'Slant',
      minValue: -15,
      defaultValue: 0,
      maxValue: 0,
    }
  ]

  const font = await createFont(characters, {
    familyName: 'AdvancedVariableFont',
    styleName: 'Regular',
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    
    variants: {
      axes: axes
    },
    
    tables: {
      name: [
        {
          nameID: 1,
          nameLabel: 'fontFamily',
          platformID: 3,
          encodingID: 1,
          langID: 0x409,
          value: 'AdvancedVariableFont',
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
          value: 'Advanced Variable Font Regular',
        }
      ]
    }
  })

  // 验证nameID已分配
  axes.forEach((axis, index) => {
    console.log(`${axis.name} (${axis.tag}) nameID: ${axis.nameID}`)
  })

  return font
}

/**
 * 辅助函数：验证axis nameID是否正确分配
 */
export function validateAxisNameIDs(axes: IVariationAxis[]): boolean {
  for (let i = 0; i < axes.length; i++) {
    if (!axes[i].nameID) {
      console.error(`Axis ${axes[i].tag} missing nameID`)
      return false
    }
    if (axes[i].nameID! < 256) {
      console.error(`Axis ${axes[i].tag} nameID ${axes[i].nameID} is invalid (should be >= 256)`)
      return false
    }
  }
  
  // 检查nameID是否唯一
  const nameIDs = axes.map(a => a.nameID!)
  const uniqueNameIDs = new Set(nameIDs)
  if (nameIDs.length !== uniqueNameIDs.size) {
    console.error('Duplicate nameIDs found in axes')
    return false
  }
  
  return true
}

