// 测试WASM重叠去除功能的修复效果
import { removeOverlapWithWasm } from '../src/utils/overlap-remover.js';

// 测试数据：两个重叠的矩形
const testContours = [
  [
    // 第一个矩形（外轮廓）
    {
      type: 'LINE',
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 }
    },
    {
      type: 'LINE',
      start: { x: 100, y: 0 },
      end: { x: 100, y: 100 }
    },
    {
      type: 'LINE',
      start: { x: 100, y: 100 },
      end: { x: 0, y: 100 }
    },
    {
      type: 'LINE',
      start: { x: 0, y: 100 },
      end: { x: 0, y: 0 }
    }
  ],
  [
    // 第二个矩形（与第一个重叠）
    {
      type: 'LINE',
      start: { x: 50, y: 50 },
      end: { x: 150, y: 50 }
    },
    {
      type: 'LINE',
      start: { x: 150, y: 50 },
      end: { x: 150, y: 150 }
    },
    {
      type: 'LINE',
      start: { x: 150, y: 150 },
      end: { x: 50, y: 150 }
    },
    {
      type: 'LINE',
      start: { x: 50, y: 150 },
      end: { x: 50, y: 50 }
    }
  ]
];

// 测试数据：带孔洞的形状
const testContoursWithHole = [
  [
    // 外轮廓（逆时针）
    {
      type: 'LINE',
      start: { x: 0, y: 0 },
      end: { x: 200, y: 0 }
    },
    {
      type: 'LINE',
      start: { x: 200, y: 0 },
      end: { x: 200, y: 200 }
    },
    {
      type: 'LINE',
      start: { x: 200, y: 200 },
      end: { x: 0, y: 200 }
    },
    {
      type: 'LINE',
      start: { x: 0, y: 200 },
      end: { x: 0, y: 0 }
    }
  ],
  [
    // 内轮廓（孔洞，顺时针）
    {
      type: 'LINE',
      start: { x: 50, y: 50 },
      end: { x: 50, y: 150 }
    },
    {
      type: 'LINE',
      start: { x: 50, y: 150 },
      end: { x: 150, y: 150 }
    },
    {
      type: 'LINE',
      start: { x: 150, y: 150 },
      end: { x: 150, y: 50 }
    },
    {
      type: 'LINE',
      start: { x: 150, y: 50 },
      end: { x: 50, y: 50 }
    }
  ]
];

async function testOverlapRemoval() {
  console.log('Testing WASM overlap removal...');
  
  try {
    // 测试1：重叠矩形
    console.log('\n=== Test 1: Overlapping Rectangles ===');
    const result1 = await removeOverlapWithWasm(testContours);
    console.log('Result 1:', result1);
    
    // 测试2：带孔洞的形状
    console.log('\n=== Test 2: Shape with Hole ===');
    const result2 = await removeOverlapWithWasm(testContoursWithHole);
    console.log('Result 2:', result2);
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// 运行测试
testOverlapRemoval(); 