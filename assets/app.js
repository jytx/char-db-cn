(function () {
"use strict";
var $ = function (s) { return document.querySelector(s); };
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }
function trackEvent(name, params) { try { if (window.track) window.track(name, params); } catch (e) { } }
var searchTimer = null;
function trackSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(function () {
    if (S.q) trackEvent("search", { lib: effSet(), q: S.q.slice(0, 40) });
  }, 800);
}
var ICON_DICE = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none"/></svg>';

var DB = window.CHARDB;
var BASE = DB.base;
var REF_BASE = "https://ai-costume-anime-gallery.pages.dev/";
var SETS = { hair: "发型", outfit: "服装", pose: "姿势", build: "组装" };
var S = { set: "hair", q: "", cat: { hair: "", outfit: "", pose: "", outfit2: "" }, outfitView: "worn" };
var PER_PAGE = 200;   // 一次渲染的卡片上限，超出用「显示更多」追加
var SHOWN = PER_PAGE;
function effSet() { return (S.set === "outfit" && S.outfitView === "ref") ? "outfit2" : S.set; }
var QUALITY = {
  illustrious: "masterpiece, best quality, amazing quality, very aesthetic, absurdres, newest",
  anima: "masterpiece, best quality, score_7, safe",
  novelai: "best quality, amazing quality, very aesthetic, absurdres",
  pony: "score_9, score_8_up, score_7_up, source_anime",
  none: ""
};
var EXPR = [
  ["指定なし", ""], ["笑顔", "smile"], ["微笑み", "light smile"], ["ニカッ", "grin"],
  ["口を閉じる", "closed mouth"], ["口を開ける", "open mouth"], ["赤面", "blush"],
  ["照れ", "embarrassed"], ["無表情", "expressionless"], ["真剣", "serious"],
  ["怒り", "angry"], ["むくれ", "pout"], ["泣き", "crying"], ["驚き", "surprised"],
  ["ジト目でニヤリ", "jitome, smirk"], ["ウインク", "wink"], ["舌出し", "tongue out"],
  ["妖しい笑み", "seductive smile"]
];
var COMPO = [
  ["指定なし", ""], ["全身", "full body"], ["太ももまで", "cowboy shot"], ["上半身", "upper body"],
  ["顔アップ", "portrait"], ["上から", "from above"], ["下から", "from below"], ["横から", "from side"],
  ["後ろから振り返り", "from behind, looking back"], ["斜め", "dutch angle"]
];
var BG = [
  ["指定なし", ""], ["白背景", "white background"], ["グレー背景", "grey background"],
  ["教室", "classroom"], ["寝室", "bedroom"], ["リビング", "living room"], ["街", "city"],
  ["ビーチ", "beach"], ["公園", "park"], ["夜の街", "cityscape, night"], ["カフェ", "cafe"],
  ["浴室", "bathroom"], ["オフィス", "office"], ["神社", "shrine"], ["森", "forest"], ["屋上", "rooftop"]
];
var BG_ZH = { "白背景": "白背景", "グレー背景": "灰背景", "教室": "教室", "寝室": "卧室", "リビング": "客厅", "街": "街道", "ビーチ": "海滩", "公園": "公园", "夜の街": "夜晚街道", "カフェ": "咖啡店", "浴室": "浴室", "オフィス": "办公室", "神社": "神社", "森": "森林", "屋上": "天台", "指定なし": "不指定" };

var SEL = { style: null, bangs: null, color: null, acc: null, eye: null, outfit: null, pose: null };
var OPT = { quality: "illustrious", expr: "笑顔", compo: "全身", bg: "白背景", extra: "", sep: "comma", body: "" };
var FAV = {};
try { FAV = JSON.parse(window.localStorage.getItem("charFav") || "{}"); } catch (e) { FAV = {}; }
function saveFav() { try { window.localStorage.setItem("charFav", JSON.stringify(FAV)); } catch (e) { } }
try {
  var saved = JSON.parse(window.localStorage.getItem("charSel") || "null");
  if (saved) { Object.keys(SEL).forEach(function (k) { if (saved[k]) SEL[k] = saved[k]; }); }
  var so = JSON.parse(window.localStorage.getItem("charOpt") || "null");
  if (so) { Object.keys(OPT).forEach(function (k) { if (so[k] !== undefined) OPT[k] = so[k]; }); }
} catch (e) { }
function saveSel() { try { window.localStorage.setItem("charSel", JSON.stringify(SEL)); window.localStorage.setItem("charOpt", JSON.stringify(OPT)); } catch (e) { } }

// 兼容旧版本：曾把单品图存在 ref 槽
if (SEL.ref) { if (!SEL.outfit) SEL.outfit = SEL.ref; SEL.ref = null; }

var byId = {};
DB.items.forEach(function (i) { byId[i.id] = i; });

function thumbUrl(id) { return "thumbs/" + id + ".webp"; }
/* 本地原图（仅 file:// 打开时生效，站点上自动忽略） */
function localBase(kind) {
  if (location.protocol !== "file:") return null;
  var L = window.LOCAL_ORIGINALS;
  return (L && L[kind]) || null;
}
function hasLocal(kind) { return !!localBase(kind); }
function fullUrl(id) { return BASE + "img/" + id + ".jpg"; }
function lineUrl(id) { return BASE + "line/" + id + ".png"; }

/* ---------- 卡片 ---------- */
function cardHTML(it) {
  if (it.set === "outfit2") {
    var fav2 = FAV[it.id] ? " on" : "";
    var added2 = isAdded(it.id) ? " on" : "";
    return '<article class="card ref" data-id="' + it.id + '">'
      + '<div class="ph sq"><img loading="lazy" decoding="async" src="' + thumbUrl(it.id) + '" alt="' + esc(it.id) + '">'
      + '<div class="badge">' + it.id + '</div><button class="fav' + fav2 + '" data-fav="' + it.id + '" title="收藏"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg></button></div>'
      + '<div class="meta"><h3>' + esc(it.catZh) + '</h3><p class="tg">' + esc(it.tags) + '</p></div>'
      + '<div class="acts2"><button data-copy="' + it.id + '">复制描述</button>'
      + '<button data-add="' + it.id + '" class="' + (added2 ? "on" : "") + '">' + (added2 ? "已加入 ✓" : "加入组装") + '</button></div>'
      + '</article>';
  }
  var isPose = it.set === "pose";
  var vw = it._v || "img";
  var src = isPose && vw === "line" && it.line ? lineUrl(it.id) : thumbUrl(it.id);
  var ratio = isPose ? "p34" : "sq";
  var fav = FAV[it.id] ? " on" : "";
  var added = isAdded(it.id) ? " on" : "";
  var vwHtml = (isPose && it.line)
    ? '<div class="vw"><button data-vw="img" class="' + (vw === "img" ? "on" : "") + '">絵</button><button data-vw="line" class="' + (vw === "line" ? "on" : "") + '">线稿</button></div>'
    : "";
  return '<article class="card" data-id="' + it.id + '">'
    + '<div class="ph ' + ratio + '"><img loading="lazy" decoding="async" src="' + src + '" alt="' + esc(it.zh) + '">'
    + '<div class="badge">' + it.id + '</div><button class="fav' + fav + '" data-fav="' + it.id + '" title="收藏"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg></button>' + vwHtml + '</div>'
    + '<div class="meta"><h3>' + esc(it.zh) + '</h3><p class="jp">' + esc(it.jp) + '</p><p class="tg">' + esc(it.tags) + '</p></div>'
    + '<div class="acts2"><button data-copy="' + it.id + '">复制标签</button>'
    + '<button data-add="' + it.id + '" class="' + (added ? "on" : "") + '">' + (added ? "已加入 ✓" : "加入组装") + '</button></div>'
    + '</article>';
}
function itemTitle(it) {
  return it.set === "outfit2" ? (it.catZh + " · " + it.id) : it.zh;
}
function isAdded(id) { return Object.keys(SEL).some(function (k) { return SEL[k] === id; }); }

/* ---------- 过滤 ---------- */
function match(it) {
  if (it.set !== effSet()) return false;
  if (S.cat[effSet()] && it.catZh !== S.cat[effSet()]) return false;
  if (S.q) {
    var q = S.q.toLowerCase();
    var hay = (it.zh + " " + it.jp + " " + it.tags + " " + it.id + " " + it.catZh).toLowerCase();
    if (hay.indexOf(q) < 0) return false;
  }
  return true;
}

/* ---------- 工具栏 ---------- */
function renderToolbar() {
  if (S.set === "build") { $("#toolbar").innerHTML = ""; return; }
  var set = effSet();
  var seg = "";
  if (S.set === "outfit") {
    seg = '<div class="seg2">'
      + '<button data-view="worn" class="' + (S.outfitView === "worn" ? "on" : "") + '">角色穿着<b>' + DB.counts.outfit + '</b></button>'
      + '<button data-view="ref" class="' + (S.outfitView === "ref" ? "on" : "") + '">单品图<b>' + DB.counts.outfit2 + '</b></button>'
      + "</div>";
  }
  var tabs = '<button class="tab' + (!S.cat[set] ? " on" : "") + '" data-cat="">全部<b>' + DB.counts[set] + "</b></button>";
  DB.cats[set].forEach(function (c) {
    tabs += '<button class="tab' + (S.cat[set] === c.name ? " on" : "") + '" data-cat="' + esc(c.name) + '">' + esc(c.name) + "<b>" + c.n + "</b></button>";
  });
  var placeholder = set === "outfit2"
    ? "搜索：ID / 英文词（denim、frill、ivory）"
    : "搜索：中文 / 日文 / 标签（twintails、serafuku、水手服）";
  $("#toolbar").innerHTML = seg + '<div class="tabs">' + tabs + "</div>"
    + '<div class="row"><input id="q" type="search" placeholder="' + placeholder + '" autocomplete="off">'
    + '<button class="rndbtn" id="rnd2">' + ICON_DICE + ' 随机一张</button><span id="count"></span></div>';
  $("#toolbar").querySelectorAll("[data-cat]").forEach(function (b) {
    b.onclick = function () {
      S.cat[set] = b.dataset.cat;
      trackEvent("filter", { lib: set, type: "cat", value: b.dataset.cat || "all" });
      render();
    };
  });
  $("#toolbar").querySelectorAll("[data-view]").forEach(function (b) {
    b.onclick = function () {
      S.outfitView = b.dataset.view; S.q = "";
      trackEvent("filter", { lib: "outfit", type: "view", value: b.dataset.view });
      render();
    };
  });
  $("#q").value = S.q;
  /* 输入去抖：每次按键全量重建 1700+ 张卡会把 INP 顶到 280ms 以上 */
  var qTimer = null;
  $("#q").oninput = function (e) {
    var v = e.target.value.trim();
    clearTimeout(qTimer);
    qTimer = setTimeout(function () {
      S.q = v;
      SHOWN = PER_PAGE;
      renderGrid();
      trackSearch();
    }, 180);
  };
  $("#rnd2").onclick = function () {
    var list = DB.items.filter(match); if (!list.length) return;
    trackEvent("random", { lib: set });
    openModal(list[Math.floor(Math.random() * list.length)].id);
  };
}

/* 首屏前 n 张图改成 eager，第一张抬到 high 优先级：
   所有缩略图都用 loading="lazy" 会把视口内图片也降级，直接把 LCP 拖到 2.5s 以上 */
function eagerFirst(container, n) {
  if (!container) return;
  var imgs = container.querySelectorAll("img");
  for (var i = 0; i < Math.min(n, imgs.length); i++) {
    imgs[i].loading = "eager";
    imgs[i].decoding = "async";
  }
  if (imgs[0]) imgs[0].setAttribute("fetchpriority", "high");
}

function renderGrid() {
  if (S.set === "build") return;
  var list = DB.items.filter(match);
  var shown = Math.min(SHOWN, list.length);
  $("#grid").className = "grid " + effSet();
  $("#grid").innerHTML = list.slice(0, shown).map(cardHTML).join("");
  $("#count").textContent = "符合条件：" + list.length + " 张" + (shown < list.length ? "（已显示 " + shown + "）" : "");
  document.body.classList.toggle("big-grid", shown > 120);
  eagerFirst($("#grid"), 6);
  if (shown < list.length) {
    var more = document.createElement("button");
    more.className = "more-btn";
    more.textContent = "显示更多（还有 " + (list.length - shown) + " 张）";
    more.onclick = function () { SHOWN += PER_PAGE; renderGrid(); };
    $("#grid").appendChild(more);
  }
  $("#grid").querySelectorAll(".card").forEach(function (c) {
    var id = c.dataset.id;
    /* 整卡可点：只绑图片时，点标题 / 描述 / 卡片边缘都会变成「无效点击」 */
    c.onclick = function (e) {
      if (e.target.closest("[data-fav],[data-copy],[data-add],[data-vw]")) return;
      openModal(id);
    };
    var f = c.querySelector("[data-fav]");
    if (f) f.onclick = function (e) {
      e.stopPropagation();
      var addFav = !FAV[id];
      FAV[id] ? delete FAV[id] : FAV[id] = 1;
      saveFav(); f.classList.toggle("on");
      trackEvent("fav", { lib: effSet(), id: id, action: addFav ? "add" : "remove" });
    };
    var cp = c.querySelector("[data-copy]");
    if (cp) cp.onclick = function (e) { e.stopPropagation(); copyText(tagsOf(byId[id]), cp, "card_copy"); };
    var ad = c.querySelector("[data-add]");
    if (ad) ad.onclick = function (e) { e.stopPropagation(); toggleAdd(byId[id]); };
    c.querySelectorAll("[data-vw]").forEach(function (b) {
      b.onclick = function (e) {
        e.stopPropagation();
        byId[id]._v = b.dataset.vw;
        trackEvent("pose_view", { lib: "pose", value: b.dataset.vw });
        c.outerHTML = cardHTML(byId[id]);
        renderGrid();
      };
    });
  });
}

function render() {
  renderToolbar();
  var isBuild = S.set === "build";
  document.body.classList.toggle("view-build", isBuild);
  if (isBuild) renderBuild();
  else renderGrid();
}

/* ---------- 标签与组装 ---------- */
function colorTag(it) {
  if (it.set !== "hair" || it.sub !== "style_color") return "";
  var map = { black: "black hair", blonde: "blonde hair", pink: "pink hair", silver: "silver hair", brown: "" };
  var k = (it.id.split("-")[1] || "");
  return map[k] || "";
}
function tagsOf(it) {
  var t = it.tags || "";
  var c = colorTag(it);
  return c ? (t + ", " + c) : t;
}

function toggleAdd(it) {
  var k = slotKey(it);
  if (!k) return;
  if (SEL[k] === it.id) { SEL[k] = null; }
  else {
    SEL[k] = it.id;
    if (it.parent) {
      // 颜色变体：替换基础发型
      SEL.style = it.parent;
    }
  }
  saveSel(); render();
  trackEvent("build_add", { lib: it.set, id: it.id, action: SEL[k] === it.id ? "add" : "remove" });
}
function slotKey(it) {
  if (it.set === "outfit2") return "outfit";   // 单品图与角色穿着共用一个「服装」槽
  if (it.set === "outfit") return "outfit";
  if (it.set === "pose") return "pose";
  if (it.sub) return it.sub;   // style / bangs / color / acc / eye
  return null;
}

var QUAL_LABELS = [
  ["illustrious", "Illustrious / Noob 系（二次元）"], ["anima", "Anima 系（二次元）"],
  ["novelai", "NovelAI（二次元）"], ["pony", "SDXL / Pony 系（通用）"], ["none", "不加（自己写）"]
];
function qualOpts() {
  return QUAL_LABELS.map(function (o) {
    return '<option value="' + o[0] + '"' + (OPT.quality === o[0] ? " selected" : "") + ">" + o[1] + "</option>";
  }).join("");
}
var SLOT_LABEL = { style: "发型", bangs: "刘海", color: "发色", acc: "发饰", eye: "眼睛", outfit: "服装", pose: "姿势" };
var EXPR_ZH = {
  "指定なし": "不指定", "笑顔": "笑容", "微笑み": "微笑", "ニカッ": "咧嘴笑",
  "口を閉じる": "闭嘴", "口を開ける": "张嘴", "赤面": "脸红", "照れ": "害羞",
  "無表情": "无表情", "真剣": "认真", "怒り": "生气", "むくれ": "鼓腮",
  "泣き": "哭泣", "驚き": "惊讶", "ジト目でニヤリ": "半眯眼坏笑",
  "ウインク": "眨眼", "舌出し": "吐舌", "妖しい笑み": "妖艳微笑"
};
var COMPO_ZH = {
  "指定なし": "不指定", "全身": "全身", "太ももまで": "大腿以上", "上半身": "上半身",
  "顔アップ": "面部特写", "上から": "俯视", "下から": "仰视", "横から": "侧面",
  "後ろから振り返り": "回眸", "斜め": "斜角"
};

function buildPrompt() {
  var q = QUALITY[OPT.quality] || "";
  var hair = SEL.style ? byId[SEL.style] : null;
  var bangs = SEL.bangs ? byId[SEL.bangs] : null;
  var color = SEL.color ? byId[SEL.color] : null;
  var acc = SEL.acc ? byId[SEL.acc] : null;
  var eye = SEL.eye ? byId[SEL.eye] : null;
  var outfit = SEL.outfit ? byId[SEL.outfit] : null;
  var pose = SEL.pose ? byId[SEL.pose] : null;

  var fixed = [];
  if (hair) fixed.push(hair.tags);
  if (color) fixed.push(color.tags);
  if (bangs) fixed.push(bangs.tags);
  if (acc) fixed.push(acc.tags);
  if (eye) fixed.push(eye.tags);
  if (OPT.body) fixed.push(OPT.body);

  var expr = (EXPR.filter(function (x) { return x[0] === OPT.expr; })[0] || ["", ""])[1];
  var compo = (COMPO.filter(function (x) { return x[0] === OPT.compo; })[0] || ["", ""])[1];
  var bg = (BG.filter(function (x) { return x[0] === OPT.bg; })[0] || ["", ""])[1];

  var base = (pose && /2girls/.test(pose.tags)) ? ["2girls, multiple girls"] : ["1girl, solo"];
  var parts = [];
  if (q) parts.push(q);
  parts = parts.concat(base);
  if (fixed.length) parts.push(fixed.join(", "));
  if (expr) parts.push(expr);
  if (outfit) parts.push(outfit.tags);
  if (pose) parts.push(pose.tags);
  if (compo) parts.push(compo);
  if (bg) parts.push(bg);
  if (OPT.extra) parts.push(OPT.extra);
  var line = parts.join(", ").replace(/,\s*,/g, ", ").replace(/\s+/g, " ").trim();
  if (OPT.sep === "line") line = line.split(",").map(function (s) { return s.trim(); }).filter(Boolean).join(", ");
  return line;
}
var NEG = "lowres, worst quality, low quality, bad anatomy, bad hands, extra fingers, missing fingers, text, watermark, signature, jpeg artifacts, multiple views";

function renderBuild() {
  var slots = "";
  Object.keys(SLOT_LABEL).forEach(function (k) {
    var it = SEL[k] ? byId[SEL[k]] : null;
    slots += '<div class="slot2' + (it ? "" : " empty") + '">'
      + (it ? '<img src="' + thumbUrl(it.id) + '" alt="">' : '<span class="ph0"></span>')
      + '<div class="t"><div class="k">' + SLOT_LABEL[k] + "</div><div class=\"v\">" + (it ? esc(itemTitle(it)) : "未选择") + "</div></div>"
      + (it ? '<button class="x" data-clear="' + k + '">×</button>' : "")
      + "</div>";
  });
  function opts(list, cur, mode) {
    return list.map(function (o) {
      var label = o[0];
      var zh = mode === "expr" ? EXPR_ZH[label] : (mode === "compo" ? COMPO_ZH[label] : BG_ZH[label]);
      var text = mode === "bg" ? (zh || label) : (zh && zh !== label ? label + "（" + zh + "）" : label);
      return '<option value="' + esc(label) + '"' + (cur === label ? " selected" : "") + ">" + esc(text) + "</option>";
    }).join("");
  }
  var html = '<div class="build">'
    + '<div class="box"><h3>① 选中的零件</h3><div class="slots">' + slots + "</div>"
    + '<div class="build-btns"><button id="randAll">' + ICON_DICE + ' 全部随机</button><button id="clearAll">全部清空</button></div>'
    + '<p class="mini-hint">在「发型 / 服装 / 姿势」页点卡片上的「加入组装」即可填入；带颜色标记的发型卡会自动替换基础发型。</p></div>'
    + '<div class="box"><h3>② 生成设置</h3><div class="fields">'
    + "<label>品质前缀</label><select id=\"optQuality\">" + qualOpts() + "</select>"
    + "<label>表情</label><select id=\"optExpr\">" + opts(EXPR, OPT.expr, "expr") + "</select>"
    + "<label>构图</label><select id=\"optCompo\">" + opts(COMPO, OPT.compo, "compo") + "</select>"
    + "<label>背景</label><select id=\"optBg\">" + opts(BG, OPT.bg, "bg") + "</select>"
    + '<label>体型</label><input id="optBody" type="text" placeholder="如 slim, medium breasts（选填，固定行）" value="' + esc(OPT.body) + '">'
    + '<label>追加标签</label><input id="optExtra" type="text" placeholder="如 looking at viewer, sitting" value="' + esc(OPT.extra) + '">'
    + '</div><p class="mini-hint">品质前缀说明：Illustrious / Noob、Anima、NovelAI、SDXL·Pony 各一套，按你用的模型选。</p></div>'
    + '<div class="box" style="grid-column:1/-1"><div class="box-head"><h3>③ 提示词</h3></div>'
    + '<div class="mini-hint pos-head"><span>正向提示词</span>'
    + '<button class="copy-ico sm" id="copyPrompt" type="button" title="复制正向提示词" aria-label="复制正向提示词">'
    + '<svg class="ico i-copy" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>'
    + '<svg class="ico i-done" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7"/></svg>'
    + '</button></div><textarea class="out" id="outPos" readonly></textarea>'
    + '<div class="mini-hint neg-head"><span>负面提示词</span>'
    + '<button class="copy-ico sm" id="copyNeg" type="button" title="复制负向提示词" aria-label="复制负向提示词">'
    + '<svg class="ico i-copy" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>'
    + '<svg class="ico i-done" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7"/></svg>'
    + '</button></div><textarea class="out neg" id="outNeg" readonly></textarea>'
    + '<p class="mini-hint">若希望服装、姿势更贴近，可导出参考图一并发送</p>'
    + '<div class="build-btns">'
    + '<button class="copy-all-btn" id="copyBoth" type="button">'
    + '<svg class="ico i-copy" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="8" width="9" height="12" rx="2"/><rect x="11" y="4" width="9" height="12" rx="2"/></svg>'
    + '<svg class="ico i-done" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7"/></svg>'
    + '<span class="copy-all-label">复制全部提示词</span>'
    + '</button>'
    + '<button id="sheetSave">导出参考图</button><button id="sheetCopy">复制参考图</button>'
    + '</div></div></div>';
  $("#grid").className = "grid";
  $("#grid").innerHTML = html;
  $("#outPos").value = buildPrompt();
  $("#outNeg").value = NEG;
  $("#grid").querySelectorAll("[data-clear]").forEach(function (b) {
    b.onclick = function () { SEL[b.dataset.clear] = null; saveSel(); render(); };
  });
  ["optQuality", "optExpr", "optCompo", "optBg"].forEach(function (id) {
    var el = $("#" + id);
    if (!el) return;
    el.onchange = function () {
      if (id === "optQuality") OPT.quality = el.value;
      if (id === "optExpr") OPT.expr = el.value;
      if (id === "optCompo") OPT.compo = el.value;
      if (id === "optBg") OPT.bg = el.value;
      trackEvent("build_opt", { type: id.replace("opt", "").toLowerCase(), value: el.value });
      saveSel(); $("#outPos").value = buildPrompt();
    };
  });
  $("#optBody").oninput = function (e) { OPT.body = e.target.value.trim(); saveSel(); $("#outPos").value = buildPrompt(); };
  $("#optExtra").oninput = function (e) { OPT.extra = e.target.value.trim(); saveSel(); $("#outPos").value = buildPrompt(); };
  $("#copyPrompt").onclick = function () { copyPrompt($("#outPos").value, this, "copy_pos"); };
  $("#copyNeg").onclick = function () { copyPrompt($("#outNeg").value, this, "copy_neg"); };
  $("#copyBoth").onclick = function () { copyAllPrompts(this); };
  $("#sheetSave").onclick = function () { exportSheet(this, false); };
  $("#sheetCopy").onclick = function () { exportSheet(this, true); };
  $("#randAll").onclick = function () { trackEvent("build_random", { trigger: "all" }); randomFill("all"); render(); };
  $("#clearAll").onclick = function () { Object.keys(SEL).forEach(function (k) { SEL[k] = null; }); saveSel(); render(); };
}

/* mode: "all" 全部重抽；"empty" 只补空槽（首屏用，不自动塞参考图） */
function randomFill(mode) {
  Object.keys(SLOT_LABEL).forEach(function (k) {
    if (mode === "empty" && k === "ref") return;
    if (mode === "empty" && SEL[k] && byId[SEL[k]]) return;
    var pool = DB.items.filter(function (i) { return slotKey(i) === k; });
    if (pool.length) SEL[k] = pool[Math.floor(Math.random() * pool.length)].id;
  });
  saveSel();
}

/* ---------- 复制 ---------- */
function copyAllPrompts(btn) {
  var text = "POSITIVE:\n" + $("#outPos").value + "\n\nNEGATIVE:\n" + $("#outNeg").value;
  trackEvent("copy", { label: "copy_both", lib: effSet() });
  var lab = btn.querySelector(".copy-all-label");
  var done = function () {
    btn.classList.add("copied");
    lab.textContent = "已复制全部";
    setTimeout(function () { btn.classList.remove("copied"); lab.textContent = "复制全部提示词"; }, 1600);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(function () { fallback(text, done); });
  } else fallback(text, done);
}
function copyPrompt(text, btn, label) {
  trackEvent("copy", { label: label, lib: effSet() });
  var done = function () {
    btn.classList.add("copied");
    setTimeout(function () { btn.classList.remove("copied"); }, 1500);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(function () { fallback(text, done); });
  } else fallback(text, done);
}
function copyText(text, btn, tag) {
  trackEvent("copy", { label: tag || "", lib: effSet() });
  var label = btn ? btn.textContent : "";
  var done = function () { if (btn) { btn.textContent = "已复制 ✓"; setTimeout(function () { btn.textContent = label; }, 1500); } };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(function () { fallback(text, done); });
  } else fallback(text, done);
}
function fallback(text, done) {
  var t = document.createElement("textarea");
  t.value = text; t.style.position = "fixed"; t.style.top = "-1000px";
  document.body.appendChild(t); t.select();
  try { document.execCommand("copy"); done(); } catch (e) { }
  t.remove();
}

/* ---------- 参考图合成 ---------- */
function loadImg(url, cors) {
  return new Promise(function (resolve, reject) {
    var im = new Image();
    if (cors) im.crossOrigin = "anonymous";
    im.onload = function () { resolve(im); };
    im.onerror = function () { reject(new Error("load failed")); };
    im.src = url;
  });
}
var SHEET_ORDER = ["style", "bangs", "color", "acc", "eye", "outfit", "pose"];
function sheetSrc(it) {
  if (it.set === "outfit2") return REF_BASE + it.full;
  return fullUrl(it.id);
}
function sheetItems() {
  var out = [];
  SHEET_ORDER.forEach(function (k) {
    if (SEL[k] && byId[SEL[k]]) out.push({ key: k, it: byId[SEL[k]], label: SLOT_LABEL[k] });
  });
  return out;
}
function buildSheet() {
  return new Promise(function (resolve, reject) {
    var list = sheetItems();
    if (!list.length) { reject(new Error("empty")); return; }
    var loaded = [];
    var i = 0;
    function next() {
      if (i >= list.length) { draw(); return; }
      var o = list[i++];
      loadImg(sheetSrc(o.it), true).then(function (im) {
        loaded.push({ img: im, item: o }); next();
      }).catch(function () {
        loadImg(thumbUrl(o.it.id), true).then(function (im) {
          loaded.push({ img: im, item: o }); next();
        }).catch(function () {
          loaded.push({ img: null, item: o }); next();
        });
      });
    }
    function draw() {
      try {
        var cols = loaded.length <= 3 ? Math.max(loaded.length, 1) : 4;
        var CW = 512, CH = 680, GAP = 18, PAD = 36, LAB = 56;
        var ROWH = CH + LAB;
        var rows = Math.ceil(loaded.length / cols);
        var W = PAD * 2 + CW * cols + GAP * (cols - 1);
        var H = PAD * 2 + ROWH * rows + GAP * (rows - 1);
        var c = document.createElement("canvas");
        c.width = W; c.height = H;
        var g = c.getContext("2d");
        g.fillStyle = "#ffffff"; g.fillRect(0, 0, W, H);
        loaded.forEach(function (o, k) {
          var row = Math.floor(k / cols), col = k % cols;
          var x = PAD + col * (CW + GAP);
          var y = PAD + row * (ROWH + GAP);
          g.fillStyle = "#f6f6f8"; g.fillRect(x, y, CW, CH);
          if (o.img) {
            var im = o.img;
            var sc = Math.min((CW - 8) / im.width, (CH - 8) / im.height);
            var w = im.width * sc, h = im.height * sc;
            g.drawImage(im, x + (CW - w) / 2, y + (CH - h) / 2, w, h);
          }
          var mark = "①②③④⑤⑥⑦".charAt(k);
          g.fillStyle = "#1b1b1f";
          g.font = "600 34px -apple-system, 'PingFang SC', sans-serif";
          g.fillText(mark + " " + o.item.label + " · " + itemTitle(o.item.it), x + 4, y + CH + 44);
        });
        c.toBlob(function (b) {
          if (b) resolve(b); else reject(new Error("toBlob"));
        }, "image/png");
      } catch (e) { reject(e); }
    }
    next();
  });
}
function saveBlob(blob, name) {
  var u = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = u; a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 3000);
}
function sheetName() {
  return "chardb_" + sheetItems().map(function (o) { return o.it.id; }).join("_") + ".png";
}
function exportSheet(btn, asCopy) {
  trackEvent("build_export", { action: asCopy ? "copy" : "download" });
  var label = btn.textContent;
  btn.textContent = "生成中…";
  buildSheet().then(function (blob) {
    if (asCopy && navigator.clipboard && window.ClipboardItem) {
      return navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]).then(function () {
        btn.textContent = "已复制图片 ✓";
        setTimeout(function () { btn.textContent = label; }, 1600);
      });
    }
    saveBlob(blob, sheetName());
    btn.textContent = "已下载 ✓";
    setTimeout(function () { btn.textContent = label; }, 1600);
  }).catch(function () {
    btn.textContent = "请先选至少一个零件";
    setTimeout(function () { btn.textContent = label; }, 2200);
  });
}

/* ---------- 弹窗 ---------- */
var curId = null;
function openModal(id) {
  curId = id;
  var it = byId[id];
  trackEvent("item_open", { lib: it.set, id: it.id });
  if (it.set === "outfit2") {
    var ch = hasLocal("ref")
      ? [localBase("ref") + id + ".png", REF_BASE + it.full, thumbUrl(id)]
      : [REF_BASE + it.full, thumbUrl(id)];
    var st = 0;
    $("#mimg").onerror = function () { st++; if (st < ch.length) $("#mimg").src = ch[st]; else $("#mimg").onerror = null; };
    $("#mimg").src = ch[0];
    $("#mtitle").textContent = it.id;
    $("#mfields").innerHTML = "<dt>编号</dt><dd>" + it.id + "</dd><dt>分类</dt><dd>" + esc(it.catZh) + "</dd><dt>类型</dt><dd>单品图 · 无人物</dd>";
    $("#mtags").innerHTML = it.tags.split(",").map(function (t) { return '<span class="chip en">' + esc(t.trim()) + "</span>"; }).join("");
    var f2 = $("#mfull");
    if (hasLocal("ref")) {
      f2.href = localBase("ref") + id + ".png";
      f2.setAttribute("download", id + ".png");
      f2.removeAttribute("target");
      f2.textContent = "下载原图（本地 PNG · 512×768）";
    } else {
      f2.href = REF_BASE + it.orig;
      f2.removeAttribute("download");
      f2.setAttribute("target", "_blank");
      f2.textContent = "打开原尺寸（源站 PNG）↗";
    }
    f2.onclick = function () { trackEvent("original_download", { lib: "outfit2", id: id, kind: "full" }); };
    $("#mline").hidden = true;
    $("#madd").textContent = isAdded(id) ? "已加入 ✓" : "加入组装";
    $("#madd").classList.toggle("on", isAdded(id));
    $("#modal").classList.add("on");
    return;
  }
  var chain = hasLocal("img")
    ? [localBase("img") + id + ".jpg", fullUrl(id), thumbUrl(id)]
    : [fullUrl(id), thumbUrl(id)];
  var step = 0;
  $("#mimg").onerror = function () {
    step++;
    if (step < chain.length) $("#mimg").src = chain[step];
    else $("#mimg").onerror = null;
  };
  $("#mimg").src = chain[0];
  $("#mtitle").textContent = it.zh;
  $("#mfields").innerHTML = "<dt>编号</dt><dd>" + it.id + "</dd><dt>分类</dt><dd>" + esc(it.catZh) + "</dd>"
    + "<dt>日文</dt><dd>" + esc(it.jp) + "</dd>";
  $("#mtags").innerHTML = it.tags.split(",").map(function (t) { return '<span class="chip en">' + esc(t.trim()) + "</span>"; }).join("");
  var full = $("#mfull");
  if (hasLocal("img")) {
    full.href = localBase("img") + id + ".jpg";
    full.setAttribute("download", id + ".jpg");
    full.removeAttribute("target");
    full.textContent = "下载原图（本地 · 1024×1536）";
  } else {
    full.href = fullUrl(id);
    full.removeAttribute("download");
    full.setAttribute("target", "_blank");
    full.textContent = "打开原图（源站）↗";
  }
  full.onclick = function () { trackEvent("original_download", { lib: it.set, id: id, kind: "full" }); };
  var ln = $("#mline");
  if (it.set === "pose" && it.line) {
    ln.hidden = false;
    if (hasLocal("line")) {
      ln.href = localBase("line") + id + ".png";
      ln.setAttribute("download", id + ".png");
      ln.removeAttribute("target");
      ln.textContent = "下载线稿（本地 · PNG）";
    } else {
      ln.href = lineUrl(id);
      ln.removeAttribute("download");
      ln.setAttribute("target", "_blank");
      ln.textContent = "打开线稿（源站）↗";
    }
    ln.onclick = function () { trackEvent("original_download", { lib: "pose", id: id, kind: "line" }); };
  } else { ln.hidden = true; }
  $("#madd").textContent = isAdded(id) ? "已加入 ✓" : "加入组装";
  $("#madd").classList.toggle("on", isAdded(id));
  $("#modal").classList.add("on");
}
function closeModal() { $("#modal").classList.remove("on"); }

$("#mclose").onclick = closeModal;
$("#modal").onclick = function (e) { if (e.target.id === "modal") closeModal(); };
$("#mcopy").onclick = function () { copyText(tagsOf(byId[curId]), this, "modal_copy"); };
$("#madd").onclick = function () { toggleAdd(byId[curId]); this.textContent = isAdded(curId) ? "已加入 ✓" : "加入组装"; this.classList.toggle("on", isAdded(curId)); };
$("#mprev").onclick = function () { stepModal(-1); };
$("#mnext").onclick = function () { stepModal(1); };
function stepModal(d) {
  var list = DB.items.filter(match);
  if (!list.length) return;
  var i = list.findIndex(function (x) { return x.id === curId; });
  i = i < 0 ? 0 : (i + d + list.length) % list.length;
  openModal(list[i].id);
}
document.addEventListener("keydown", function (e) {
  if ($("#modal").classList.contains("on")) {
    if (e.key === "Escape") closeModal();
    else if (e.key === "ArrowLeft") { e.preventDefault(); stepModal(-1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); stepModal(1); }
  }
});

/* ---------- 使用说明 hover ---------- */
(function () {
  var pairs = [["tipsHover", "tipsTrigger"], ["gratHover", "gratTrigger"]];
  var wraps = [];
  pairs.forEach(function (pair) {
    var wrap = document.getElementById(pair[0]);
    var btn = document.getElementById(pair[1]);
    if (!wrap || !btn) return;
    wraps.push(wrap);
    btn.onclick = function (e) {
      e.stopPropagation();
      var open = !wrap.classList.contains("open");
      wraps.forEach(function (w) { w.classList.remove("open"); });
      wrap.classList.toggle("open", open);
    };
  });
  document.addEventListener("click", function (e) {
    if (!wraps.some(function (w) { return w.contains(e.target); })) {
      wraps.forEach(function (w) { w.classList.remove("open"); });
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") wraps.forEach(function (w) { w.classList.remove("open"); });
  });
  // 首次访问：9 秒后自动展开赞赏一次，8 秒后收起
  try {
    var grat = document.getElementById("gratHover");
    if (grat && !window.localStorage.getItem("gratNudge")) {
      window.localStorage.setItem("gratNudge", "1");
      setTimeout(function () {
        if (grat.matches(":hover") || grat.classList.contains("open")) return;
        grat.classList.add("open");
        setTimeout(function () {
          if (!grat.matches(":hover")) grat.classList.remove("open");
        }, 8000);
      }, 9000);
    }
  } catch (e) { }
})();

/* ---------- 网盘入口埋点 ---------- */
document.querySelectorAll(".nav-pan a.dl-btn").forEach(function (a) {
  var href = a.getAttribute("href") || "";
  var src = a.dataset.pan || (href.indexOf("baidu") >= 0 ? "pan_baidu_dl" : (href.indexOf("quark") >= 0 ? "pan_quark_dl" : ""));
  if (src) a.addEventListener("click", function () { trackEvent("ref_click", { source: src }); });
});

/* ---------- 导航 ---------- */
document.querySelectorAll(".nav button").forEach(function (b) {
  b.onclick = function () {
    S.set = b.dataset.set;
    SHOWN = PER_PAGE;
    trackEvent("set_view", { lib: S.set });
    document.querySelectorAll(".nav button").forEach(function (x) { x.classList.toggle("on", x === b); });
    render();
  };
});
// 默认落在「组装」页
S.set = "build";
document.querySelectorAll(".nav button").forEach(function (x) {
  x.classList.toggle("on", x.dataset.set === "build");
});
/* 页面加载即触发的事件单独命名，避免和「用户切页」混在一起统计 */
trackEvent("build_view", { lib: "build" });

/* 移动端底部常驻 CTA：复制提示词（组装页在手机上要滚两屏才看得到提示词） */
(function () {
  var cta = document.getElementById("mCtaCopy");
  if (!cta) return;
  cta.onclick = function () {
    var pos = document.getElementById("outPos");
    if (!pos) return;
    trackEvent("copy", { label: "cta_fixed", lib: "build" });
    var label = cta.textContent;
    var done = function () {
      cta.textContent = "已复制 ✓";
      cta.classList.add("done");
      setTimeout(function () { cta.textContent = label; cta.classList.remove("done"); }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(pos.value).then(done).catch(function () { fallback(pos.value, done); });
    } else fallback(pos.value, done);
  };
})();

randomFill("empty");   // 首次进入 / 刷新后，空着的槽位补一个随机值
render();
})();
