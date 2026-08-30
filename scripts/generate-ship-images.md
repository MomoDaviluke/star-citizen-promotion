# 舰船图生成流程

> 说明：本文档记录舰队展厅 12 艘舰船统一风格渲染图的生产规范与流程，确保 `public/images/ships/` 下图风格一致、命名正确、无 404。

## 规格

- **尺寸**：1920×1080（16:9），最小不低于 1280×720
- **格式**：WebP
- **质量**：90（平衡画质与体积）
- **命名**：`{slug}.webp`，必须与 `src/data/shipDatabase.js` 中 `image` 字段完全一致

## 视觉方向

舞台化产品目录风格：

- 深空黑底（#050508）
- 单束侧光（冷白/淡蓝）
- 青色边缘光（#4a9eff）
- 琥珀指示灯（#ffb300）
- 右下角铭牌信息

## 获取方案

1. **优先**：从 Star Citizen 官方截图、社区渲染图或 RSI 舰船库获取基础素材
2. **备选**：使用 AI 图像生成工具按本规范统一生成缺失舰船图
3. **统一后期处理**：
   - 背景压暗至 #050508
   - 添加青色边缘光（#4a9eff）
   - 添加琥珀指示灯（#ffb300）
   - 右下角添加铭牌：`REG: {MANU}-{MODEL}-{CLASS} / {SIZE} / {CREW}`
   - 导出 WebP

## 当前文件清单

以下文件与 `src/data/shipDatabase.js` 中的 12 艘舰船一一对应：

- `arrow.webp`
- `325a.webp`
- `avenger-stalker.webp`
- `avenger-titan.webp`
- `400i.webp`
- `315p.webp`
- `300i.webp`
- `aurora-es.webp`
- `aurora-mk2.webp`
- `350r.webp`
- `100i.webp`
- `ballista.webp`

## 新增舰船流程

1. 在 `src/data/shipDatabase.js` 中添加舰船数据，并设置 `image` 字段
2. 按本规范生成对应 `{slug}.webp`
3. 放入 `public/images/ships/`
4. 运行 `npm run build && npm run preview` 验证无 404
