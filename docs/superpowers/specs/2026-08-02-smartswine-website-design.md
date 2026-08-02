# Smart Swine 公司官网 · 设计 Spec

2026-08-02 · 已经用户批准（4 项基础决策 + 12 区块方案）

## 目标

基于 `SPM-01_Product_Brochure.pdf`（13 页）建一个英文单页长滚动公司官网，
突出动画与科技感，配色与手册品牌一致。纯静态（HTML + CSS + 原生 JS +
本地 vendor 的 GSAP/ScrollTrigger），可直接推 GitHub Pages。

## 设计令牌

- 色：`#0d0d10/#131316/#1a1a1f` 炭黑层级、`#f4f4f6` 主文、`#9b9ba4` 次文、
  珊瑚红 `#f2545f`（警报/CTA）、薄荷绿 `#35d0b0`（正向）、
  密封蓝 `#2a5fb4`（亮化 `#4a7fe8` 用于线条）——全部取自手册与产品密封件。
- 字：Helvetica Neue 展示体（tight tracking）+ ui-monospace 眉标/数据标签
  （工程规格单语感）。零外部字体请求。
- 签名元素：**密封线**——左缘垂直密封蓝进度线随滚动充填 + 发光端点，
  呼应产品的蓝色周边密封圈；hero 转盘外圈蓝弧随旋转绘制。

## 区块（对应手册页）

1. Hero：400vh 钉住滚动，96 帧透明底转盘序列帧 canvas 随滚动 360° 旋转，
   三段标题淡入淡出；电路网格 + 低密度粒子背景。（p1）
2. Problem：$1.05B / 1 in 7 / ~3 s / 72% 计数动画 + 压死/死胎红绿双卡。（p2）
3. Two axes：前向深度（teal）/下向 RGB+IR（coral）+ heads 渲染图 + 扫描线。（p3）
4. Inside：无标注爆炸图 + 8 个 HTML 标注（锚点来自 annotate_explode.py
   LABELS ÷ 2560×1440，+155px DY）滚动逐个飞入；移动端退化为列表。（p4）
5. Washdown：湿身渲染全幅视差 + IP69K design target / 80–100 bar / 拆装数据条。（p5）
6. Mounting：install 全景 + 四安装方式卡片 hover 3D 倾斜。（p6-7）
7. Connected：天线特写 + Wi-Fi/BT、~0.2 s、M.2 三项。（p8）
8. App：CSS 重建 iPhone 样机（app_feed 裁剪 + 检测框 + LIVE 呼吸 + 柱状图）。（p9）
9. Survey：89/58/69/9 计数 + 洗消刚需/价格窗口双卡。（p10）
10. Pricing：买/租双卡 + 终身质保横幅。（p11）
11. Validation：99.15/98.4/96/86/~0.2s 数据条 + 8 家机构 logo 墙。（p12）
12. CTA + Footer：pilot CTA、LinkedIn、邮箱、合规小字。（p13）

## 合规口径（手册交接文档 §7，不可放宽）

- 全部渲染图标注 concept industrial design；不写 deployed。
- IP69K 一律 "design target"。
- ~$1M 写 non-dilutive NSF / USDA-NIFA support，不写 raised。
- CC BY 4.0 署名：Sow/piglet 几何 "Some Pig" by Austin Beaulier。
- 调研页保留 concept test / n≈16–19 脚注。

## 降级与质量线

- `prefers-reduced-motion` / 移动端 / 加载失败 → 静态 hero 图，页面无 JS 也完整可读。
- 键盘焦点可见；语义化标题层级；序列帧仅桌面懒加载（~7 MB 上限）。

## 渲染管线

`源码/ss_turntable.py`：hero 棚拍布光 + 相机绕设备中心公转（避开旋转坑
#13/#14），96 帧 1440×1440 @48spp 透明底，OpenImageDenoise。输出 →
PIL 转 WebP q80 → `assets/seq/turn_###.webp`。
