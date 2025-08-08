# 部署指南 - WASM 去除重叠功能

本指南将帮助您构建和部署带有 WASM 去除重叠功能的字体设计工具。

## 前置要求

### 1. 系统要求
- Node.js 16+ 
- Rust 1.70+
- wasm-pack (用于构建 WASM 模块)

### 2. 安装依赖
```bash
# 安装 Rust (如果还没有安装)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装 wasm-pack
cargo install wasm-pack

# 安装 Node.js 依赖
npm install
```

## 构建步骤

### 1. 构建 WASM 模块
```bash
# 构建 WASM 模块
npm run build-wasm
```

这个命令会：
- 编译 Rust 代码为 WASM
- 生成 JavaScript 绑定
- 将文件复制到 `public/` 目录

### 2. 测试 WASM 模块
```bash
# 测试 WASM 模块是否正常
npm run test-wasm
```

### 3. 开发环境
```bash
# 启动开发服务器
npm run dev
```

### 4. 生产构建
```bash
# 构建生产版本
npm run build
```

## 部署选项

### 选项 1: 静态文件部署

#### 使用 nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    # 处理 WASM 文件
    location ~* \.wasm$ {
        add_header Content-Type application/wasm;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 处理其他静态文件
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 使用 Apache
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/dist

    # 处理 WASM 文件
    <FilesMatch "\.wasm$">
        Header set Content-Type application/wasm
        Header set Cache-Control "public, immutable"
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
    </FilesMatch>

    # 处理 SPA 路由
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ /index.html [QSA,L]
</VirtualHost>
```

### 选项 2: CDN 部署

#### 使用 Cloudflare
1. 上传 `dist/` 目录到 Cloudflare Pages
2. 配置自定义域名
3. 确保 WASM 文件可以正确访问

#### 使用 AWS S3 + CloudFront
```bash
# 上传到 S3
aws s3 sync dist/ s3://your-bucket-name --delete

# 配置 CloudFront 分发
# 确保 MIME 类型包含 application/wasm
```

### 选项 3: Docker 部署

#### Dockerfile
```dockerfile
# 多阶段构建
FROM rust:1.70 as wasm-builder

# 安装 wasm-pack
RUN cargo install wasm-pack

# 复制项目文件
COPY . /app
WORKDIR /app

# 构建 WASM 模块
RUN npm run build-wasm

# Node.js 构建阶段
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建文件
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 添加 WASM MIME 类型
    types {
        application/wasm wasm;
    }

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # 处理 WASM 文件
        location ~* \.wasm$ {
            add_header Content-Type application/wasm;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # 处理其他静态文件
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

## 验证部署

### 1. 检查 WASM 文件
确保以下文件可以正确访问：
- `/overlap_wasm_bg.wasm`
- `/overlap_wasm.js`

### 2. 测试功能
1. 打开应用
2. 创建一个包含重叠的字体
3. 测试"去除重叠"功能
4. 检查浏览器控制台是否有错误

### 3. 性能测试
```bash
# 使用 Lighthouse 测试性能
npx lighthouse https://your-domain.com --output=html --output-path=./lighthouse-report.html
```

## 故障排除

### 常见问题

#### 1. WASM 文件加载失败
**症状**: 浏览器控制台显示 404 错误
**解决方案**:
- 检查文件路径是否正确
- 确认 MIME 类型设置
- 验证文件权限

#### 2. CORS 错误
**症状**: 跨域请求被阻止
**解决方案**:
- 配置正确的 CORS 头
- 确保 WASM 文件在同一域名下

#### 3. 内存错误
**症状**: 处理大字体时崩溃
**解决方案**:
- 增加 WebAssembly 内存限制
- 优化算法处理大数据集

#### 4. 回退到 paper.js
**症状**: 控制台显示回退警告
**解决方案**:
- 检查 WASM 模块是否正确构建
- 验证浏览器是否支持 WebAssembly
- 查看网络请求是否成功

### 调试技巧

#### 1. 浏览器开发者工具
```javascript
// 在控制台中检查 WASM 状态
console.log('WebAssembly available:', typeof WebAssembly !== 'undefined')
```

#### 2. 网络面板
- 检查 WASM 文件是否正确加载
- 查看文件大小和加载时间

#### 3. 性能面板
- 监控 WASM 函数的执行时间
- 比较与 paper.js 的性能差异

## 监控和维护

### 1. 错误监控
```javascript
// 添加错误监控
window.addEventListener('error', (event) => {
  if (event.filename && event.filename.includes('wasm')) {
    // 发送错误报告
    console.error('WASM error:', event.error)
  }
})
```

### 2. 性能监控
```javascript
// 监控 WASM 函数性能
const startTime = performance.now()
const result = await removeOverlapWithWasm(contours)
const endTime = performance.now()
console.log(`WASM processing time: ${endTime - startTime}ms`)
```

### 3. 用户反馈
- 收集用户使用反馈
- 监控功能使用情况
- 跟踪性能指标

## 更新和维护

### 1. 更新 WASM 模块
```bash
# 重新构建 WASM 模块
npm run build-wasm

# 重新部署
npm run build
```

### 2. 版本管理
- 使用语义化版本号
- 记录变更日志
- 测试向后兼容性

### 3. 回滚策略
- 保留旧版本文件
- 配置快速回滚机制
- 监控部署状态 