const fs = require('fs');
const path = require('path');

// 测试skeletonToBones函数
console.log('Testing skeletonToBones functions...');

// 测试横钩的骨架转骨骼
try {
  const { skeletonToBones_heng_gou } = require('../src/fontEditor/templates/横钩');
  
  const testSkeleton = {
    heng_start: { x: 0, y: 0 },
    heng_end: { x: 100, y: 0 },
    gou_start: { x: 100, y: 0 },
    gou_end: { x: 120, y: 20 }
  };
  
  const bones = skeletonToBones_heng_gou(testSkeleton);
  console.log('横钩骨架转骨骼测试成功:', bones.length, '个骨骼段');
  
  // 验证骨骼结构
  if (bones.length > 0) {
    console.log('第一个骨骼:', bones[0]);
    console.log('最后一个骨骼:', bones[bones.length - 1]);
  }
  
} catch (error) {
  console.error('横钩测试失败:', error.message);
}

// 测试竖撇的骨架转骨骼
try {
  const { skeletonToBones_shu_pie } = require('../src/fontEditor/templates/竖撇');
  
  const testSkeleton = {
    shu_start: { x: 0, y: 0 },
    shu_end: { x: 0, y: 100 },
    pie_start: { x: 0, y: 100 },
    pie_bend: { x: -20, y: 120 },
    pie_end: { x: -40, y: 140 }
  };
  
  const bones = skeletonToBones_shu_pie(testSkeleton);
  console.log('竖撇骨架转骨骼测试成功:', bones.length, '个骨骼段');
  
} catch (error) {
  console.error('竖撇测试失败:', error.message);
}

// 测试简单笔画的骨架转骨骼
try {
  const { skeletonToBones_heng } = require('../src/fontEditor/templates/横');
  
  const testSkeleton = {
    start: { x: 0, y: 0 },
    end: { x: 100, y: 0 }
  };
  
  const bones = skeletonToBones_heng(testSkeleton);
  console.log('横骨架转骨骼测试成功:', bones.length, '个骨骼段');
  
} catch (error) {
  console.error('横测试失败:', error.message);
}

console.log('skeletonToBones函数测试完成！');
