"""
生成统一风格的舰船占位图

由于当前环境缺少 AI 图像生成 API key，本脚本生成舞台化产品目录风格的占位图：
- 1920x1080 WebP
- 深空背景 + HUD 网格
- 舰船名称大字 + 右下角铭牌

后续可替换为真实渲染图，保持文件名不变。
"""
import json
import os
import re
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError as e:
    raise SystemExit("缺少 Pillow，请运行: pip install Pillow") from e

# 项目根目录
ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "public" / "images" / "ships"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# 解析 shipDatabase.js 中的静态数据
DB_FILE = ROOT / "src" / "data" / "shipDatabase.js"
text = DB_FILE.read_text(encoding="utf-8")

# 提取每个舰船的 name / manufacturer / category / role / details 等
ship_blocks = re.findall(r"['\"]?([\w-]+)['\"]?:\s*\{(.*?)\n  \},", text, re.DOTALL)


def extract_field(block: str, field: str) -> str:
    match = re.search(rf"{field}:\s*'([^']+)'", block)
    return match.group(1) if match else ""


def extract_detail(block: str, label: str) -> str:
    match = re.search(rf"{{\s*label:\s*'[^']*{label}[^']*',\s*value:\s*'([^']+)'\s*}}", block)
    return match.group(1) if match else ""


def find_font(size: int):
    """尝试加载系统无衬线字体，失败则回退到默认字体。"""
    candidates = [
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/calibri.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


# 颜色
COLOR_BG = (5, 5, 8)
COLOR_BG2 = (10, 13, 20)
COLOR_GRID = (74, 158, 255, 25)
COLOR_ACCENT = (74, 158, 255)
COLOR_HIGHLIGHT = (255, 179, 0)
COLOR_TEXT = (230, 235, 245)
COLOR_LABEL = (120, 130, 150)

W, H = 1920, 1080


def draw_grid(draw: ImageDraw.Draw):
    """绘制 HUD 网格线，营造科技感。"""
    step = 80
    for x in range(0, W + 1, step):
        draw.line([(x, 0), (x, H)], fill=COLOR_GRID, width=1)
    for y in range(0, H + 1, step):
        draw.line([(0, y), (W, y)], fill=COLOR_GRID, width=1)


def draw_rim_light(draw: ImageDraw.Draw):
    """绘制左上和右下边缘光。"""
    # 左上青色光条
    for i in range(8):
        draw.line([(20 + i, 20), (300 + i, 20)], fill=(*COLOR_ACCENT, 40 - i * 4), width=1)
        draw.line([(20, 20 + i), (20, 200 + i)], fill=(*COLOR_ACCENT, 40 - i * 4), width=1)
    # 右下琥珀光条
    for i in range(8):
        draw.line([(W - 20 - i, H - 20), (W - 300 - i, H - 20)], fill=(*COLOR_HIGHLIGHT, 40 - i * 4), width=1)
        draw.line([(W - 20, H - 20 - i), (W - 20, H - 200 - i)], fill=(*COLOR_HIGHLIGHT, 40 - i * 4), width=1)


def draw_text_centered(draw, text, y, font, fill):
    bbox = draw.textbbox((0, 0), text, font=font)
    x = (W - (bbox[2] - bbox[0])) // 2
    draw.text((x, y), text, font=font, fill=fill)


def generate_ship_image(slug: str, name: str, manufacturer: str, category: str, length: str, crew: str):
    """为单个舰船生成占位图。"""
    img = Image.new("RGB", (W, H), COLOR_BG)
    draw = ImageDraw.Draw(img)

    # 径向渐变背景
    for r in range(max(W, H) // 2, 0, -4):
        alpha = int(255 * (1 - r / (max(W, H) // 2)))
        draw.ellipse(
            [(W // 2 - r, H // 2 - r), (W // 2 + r, H // 2 + r)],
            fill=(COLOR_BG2[0], COLOR_BG2[1], COLOR_BG2[2]),
        )

    draw_grid(draw)
    draw_rim_light(draw)

    # 字体
    font_name = find_font(96)
    font_mfr = find_font(32)
    font_label = find_font(24)
    font_reg = find_font(20)

    # 中央名称
    draw_text_centered(draw, name.upper(), H // 2 - 90, font_name, COLOR_TEXT)

    # 制造商
    draw_text_centered(draw, manufacturer.replace(" · ", " | "), H // 2 + 30, font_mfr, COLOR_LABEL)

    # 左下角分类标签
    draw.text((60, H - 80), category.upper(), font=font_label, fill=COLOR_ACCENT)

    # 右下角铭牌
    reg_text = f"REG: {slug.upper()}     {length} / {crew}"
    bbox = draw.textbbox((0, 0), reg_text, font=font_reg)
    draw.text((W - 60 - (bbox[2] - bbox[0]), H - 80), reg_text, font=font_reg, fill=COLOR_LABEL)

    # 保存
    out_path = OUTPUT_DIR / f"{slug}.webp"
    img.save(out_path, "WEBP", quality=90)
    return out_path


def main():
    generated = []
    for slug, block in ship_blocks:
        name = extract_field(block, "name")
        manufacturer = extract_field(block, "manufacturer")
        category = extract_field(block, "category")
        length = extract_detail(block, "长度")
        crew = extract_detail(block, "船员")

        if not name:
            continue

        path = generate_ship_image(slug, name, manufacturer, category, length, crew)
        generated.append(path.name)
        print(f"Generated: {path}")

    print(f"\n共生成 {len(generated)} 张占位图 -> {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
