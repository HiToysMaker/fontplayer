# 字玩FontPlayer
一款开源的字体设计工具。

官网：www.font-player.com

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

### 运行electron端应用
首先进行代码打包：
```
npm run build:electron
```

然后启动electron应用：
```
npm run electron:start
```

### 致谢
1. opentypes.js: https://github.com/opentypejs/opentype.js
字玩中字体文件解析生成模块参考了opentype.js的设计，并使用了部分代码

2. fitCurves: https://github.com/volkerp/fitCurves
字玩中拟合贝塞尔曲线模块主要参考了这个开源项目