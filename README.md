# 字玩FontPlayer
一款开源的字体设计工具。

使用Vue3 + ElementUI + Tauri2开发，支持Web端、MacOS和Windows平台。

官网：https://www.font-player.com

在线体验：https://toysmaker.github.io/fontplayer_demo/

桌面版下载：https://github.com/HiToysMaker/fontplayer/releases

### 运行程序
首先安装依赖：
```
npm run install
```
运行程序：
```
npm run dev
```

### 运行Tauri应用
开发环境下测试：
```
npx tauri dev
```

Tauri应用打包：
```
npx tauri build
```

### 致谢
1. opentypes.js: https://github.com/opentypejs/opentype.js
字玩中字体文件解析生成模块参考了opentype.js的设计，并使用了部分代码

2. fitCurves: https://github.com/volkerp/fitCurves
字玩中拟合贝塞尔曲线模块参照了这个开源项目，改写为ts版

3. 字玩中图像处理部分使用了opencv.js，源码放在lib文件夹下，未做修改，拷贝自opencv官网：https://docs.opencv.org/4.5.0/opencv.js
注：opencv项目使用Apache-2.0 license协议，协议副本包含在lib文件夹中。感谢opencv的开源：https://github.com/opencv/opencv

4. 思源黑体：字玩中默认黑体模板在结构上参考思源黑体。思源黑体开源地址：https://github.com/adobe-fonts/source-han-sans