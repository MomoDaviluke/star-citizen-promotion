# 舰船图生成流程

## 规格

- 尺寸：1920×1080（源文件），输出时统一 16:9
- 格式：WebP，质量 90
- 命名：`{slug}.webp`
- 路径：`public/images/ships/`

## 视觉方向：「舞台化产品目录」

每艘舰船像从黑暗中浮出的金属雕塑：

- 背景：纯深空黑 #050508 + 极淡星云
- 主光：一束冷白侧光从左上 45° 照射
- 边缘光：青色 #4a9eff 勾勒轮廓
- 指示灯：琥珀 #ffb300 点缀驾驶舱、引擎
- 阴影：强烈投影增加体积感
- 铭牌：右下角 JetBrains Mono 编号 + 尺寸/船员

## 获取方案

1. **优先方案：Star Citizen 官方/社区渲染图**
   - 来源：Roberts Space Industries 官网、社区 Wiki、粉丝渲染图
   - 需要确认使用权限（战队宣传站通常可主张合理使用）
   - 后期统一调色、加边缘光、合成铭牌

2. **备选方案：AI 生成统一风格图**
   - 工具：Midjourney / Stable Diffusion / 豆包 Seedream
   - Prompt 模板见下方
   - 统一后期处理

## 统一后期处理步骤

1. 背景压暗至 #050508
2. 添加青色边缘光（#4a9eff）
3. 添加琥珀指示灯（#ffb300）
4. 右下角添加铭牌：
   ```
   REG: {MANU}-{MODEL}-{CLASS}     {SIZE} / {CREW}
   ```
5. 导出为 WebP，质量 90

## AI Prompt 模板

```
A cinematic product catalog shot of the Star Citizen spaceship {SHIP_NAME}, 
floating in deep black space. Single cold white key light from upper left, 
cyan (#4a9eff) rim light outlining the hull, amber (#ffb300) cockpit and 
engine indicator lights. Matte metallic surface with subtle wear. Faint 
nebula haze in background, very dark. Shot at 45 degree angle, 16:9 aspect 
ratio, photorealistic, high detail, dramatic lighting, movie poster quality.
```

## 文件清单

- [ ] arrow.webp — Anvil Arrow
- [ ] 400i.webp — Origin 400i
- [ ] avenger-stalker.webp — Aegis Avenger Stalker
- [ ] avenger-titan.webp — Aegis Avenger Titan
- [ ] ballista.webp — Anvil Ballista
- [ ] caterpillar.webp — Drake Caterpillar
- [ ] cutlass-black.webp — Drake Cutlass Black
- [ ] freelancer.webp — MISC Freelancer
- [ ] gladius.webp — Aegis Gladius
- [ ] hawk.webp — Anvil Hawk
- [ ] herald.webp — Drake Herald
- [ ] 350r.webp — Origin 350r

## 当前状态

由于当前执行环境未配置 AI 图像生成 API key，本批舰船图尚未生成。
建议由设计师使用上述流程完成，或配置 `ARK_API_KEY` / `MODEL_IMAGE_API_KEY`
后运行 `scripts/seedream_image_generate.py` 批量生成。
