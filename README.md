# 二次元角色换装库 · 中文版（发型 / 服装 / 姿势 / 组装）

<img width="2424" height="1856" alt="Image" src="https://github.com/user-attachments/assets/3c2857cd-9380-4f13-bbea-b6462aa49ca5" />

原站：<https://charadb-2fi.pages.dev/>（作者 たき AI / [@taki_auto](https://x.com/taki_auto)，2026-11-01 发布）
这里是它的**中文检索界面**：1,027 张全部保留，名称与分类译成中文，标签保持 Danbooru 原文。

**在线访问**：<https://sleepyzone.online/char-db-cn/>

[新服装支持](https://x.com/giaaibusi/status/2116801951283450032)：

<img width="2434" height="1854" alt="Image" src="https://github.com/user-attachments/assets/3440aeec-ec23-40ff-8d38-a7ad21100e18" />

## 打开方式

也可以本地双击 **index.html**（需要和 thumbs/ 在同一目录）。

- 网格与筛选：图片走本地缩略图，离线可用
- 点开大图 / 下载原图 / 线稿：跳转作者源站

### 本地原图（可选）

如果本地另有一份原图（默认放在同级目录 `../二次元换装库/originals/`，结构为 `img/<id>.jpg`、`line/<id>.png`、`costume-ref/<id>.png`），
双击打开时会自动优先读本地文件，弹窗按钮变成「下载原图（本地 · 1024×1536）」「下载线稿（本地 · PNG）」「下载原图（本地 PNG · 512×768）」，完全离线可用。

路径在 **config.js** 里改：

```js
window.LOCAL_ORIGINALS = {
  img: "../二次元换装库/originals/img/",
  line: "../二次元换装库/originals/line/",
  ref: "../二次元换装库/originals/costume-ref/"
};
```

用 http/https 打开时（包括线上站点）会自动忽略这个配置，仍走源站链接——所以仓库里不需要放原图。

## 原图下载

顶部有打包下载条，两个网盘任选：

- 百度网盘：<https://pan.baidu.com/s/1HOBVBkWRRPVW1rKmrWt7Fw?pwd=5NR1>
- 夸克网盘：<https://pan.quark.cn/s/b18c3791645b>

内容：1,027 张原图 JPEG（1024×1536）+ 281 张姿势线稿 PNG，共 191 MB。

单品图（新增服装库，1,320 张）另有一份打包：

- 百度网盘：<https://pan.baidu.com/s/1X0o-TJZzFrNoist6a8qqXg?pwd=Px22>
- 夸克网盘：<https://pan.quark.cn/s/adb9f57434be>

导航栏（发型 / 服装 / 姿势 / 组装 那一行）右侧常驻这两组入口：「📦 原图包」和「单品图包 · 新增」，鼠标悬停包名可看包含内容说明。

## 能做什么

- **四个标签页**：发型 306（发型 230 / 发色 20 / 瞳色 19 / 发饰 16 / 刘海 12 / 瞳型 9）、服装 1,760、姿势 281（8 类）、组装
- **服装页两个视图**：「角色穿着 440」（带标签）与「单品图 1,320」（只有衣服、无人物），分类随视图切换；两种来源共用组装页里的同一个「服装」槽
- **中/日/标签三语搜索**：输入「双马尾」「ツインテール」「twintails」都能命中
- **收藏**：卡片左下角 ★ 可标记喜欢的条目
- **复制标签**：一键复制该条的 Danbooru 标签
- **加入组装**：把发型 / 刘海 / 发色 / 发饰 / 眼睛 / 服装 / 姿势分别放进 7 个槽位
- **组装页**：选品质前缀（Illustrious、Anima、NovelAI、SDXL/Pony）、表情、构图、背景、比例（默认 3:4）、体型、追加标签，实时生成正向 + 负向提示词，正向 / 负向各带复制 icon，底部按钮可一键复制全部；比例只用于出图工具，不写入提示词
- **导出参考图**：把选中的零件用 canvas 拼成一张带编号的对照图（① 发型 ② 服装 ③ 姿势…），可下载或复制到剪贴板，配合提示词一起发
- **线稿**：有线稿的姿势卡右上角可切「絵 / 线稿」，线稿是 PNG，可直接喂 ControlNet

## 提示词是怎么拼的

按作者在推文里给的模板：

    品质前缀 → 1girl, solo → 固定行（发型 / 发色 / 刘海 / 发饰 / 眼睛 / 体型）
    → 表情 → 服装 → 姿势 → 构图 → 背景 → 追加标签

- **固定行**：同一角色 300 页里一个字都不改
- **可变行**：每张图最多改 3 个（服装、姿势、表情）
- 姿势标签里出现 2girls 时，会自动把 1girl, solo 换成 2girls, multiple girls

## 埋点

**本站当前已开启：Microsoft Clarity `r1wmvdsf4a`。**

两个站都在 `https://sleepyzone.online` 下，共用同一个 Clarity 项目；Clarity 报表里按 URL 过滤（包含 `char-db-cn`）即可只看本站，热图本来就是按 URL 分开的。

上报事件：`lib_view` / `search` / `filter` / `item_open` / `copy` / `fav` / `random` / `pose_view` / `build_add` / `build_opt` / `build_random` / `build_export` / `original_download` / `ref_click`。

开关在 **config.js** 的 `window.ANALYTICS`，清空 `providers` 即完全关闭；控制台执行 `window.__trackDebug = true` 后刷新可看实时事件，`window.__trackLog` 保留最近 200 条。

## 授权（沿用原站）

- ✅ 免费使用，作品制作中的商用、修改、参考都 OK；无需署名
- ❌ 禁止再分发 / 转载 / 转售图片本体（含原尺寸与加工后）
- ❌ 禁止用于表现真实人物、未成年人
- 内衣 / 性感类服装、激进姿势、原图批量下载属于作者的「特典版」，不在本仓库内

> 本仓库只含缩略图用于检索，原图与线稿一律跳源站，请不要批量抓取后再分发。

## 头像与鸣谢

素材版权归 たき AI 所有。本仓库仅为个人使用的中文检索界面，按原样提供、无担保。
