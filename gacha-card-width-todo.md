# 彈窗抽卡卡片寬度調整需求

請修改目前「彈窗抽卡卡片」寬度。

目前問題：

- 卡片太寬
- 看起來比較像海報，不像收藏卡
- 圖片雖然大，但整體比例太橫
- 我要卡片變窄、變修長
- 保留目前 S / A / R 科幻 HUD 風格
- 不修改抽卡資料與功能

━━━━━━━━━━━━━━━━━━━━
【一、主卡片寬度縮小】
━━━━━━━━━━━━━━━━━━━━

請找到：

.gacha-flip-stage

目前如果類似：

width:
    min(88vw, calc(88vh * .62), 460px);

請改成：

.gacha-flip-stage {
    position: relative;

    width:
        min(78vw, calc(86vh * .58), 390px);

    aspect-ratio:
        0.58;

    perspective:
        1800px;

    z-index:
        10;
}

重點：

最大寬度從約：

460px

縮小成：

390px

並把：

aspect-ratio: 0.62

改成：

aspect-ratio: 0.58

讓卡片更窄、更修長。

━━━━━━━━━━━━━━━━━━━━
【二、不要單獨壓縮圖片】
━━━━━━━━━━━━━━━━━━━━

這次不要只改：

.gacha-art-frame

的 width。

我要：

整張卡片一起變窄。

也就是：

外框
圖片
徽章
文字
HUD

全部跟著卡片比例縮放。

━━━━━━━━━━━━━━━━━━━━
【三、圖片區左右留白】
━━━━━━━━━━━━━━━━━━━━

因為卡片變窄後，

圖片請使用：

.gacha-art-frame {
    position: absolute;

    top: 64px;

    left: 7%;
    right: 7%;

    height: 60%;

    overflow: hidden;
}

不要使用：

left: 12%;
right: 12%;

否則圖片會變得太窄。

━━━━━━━━━━━━━━━━━━━━
【四、圖片保持正常比例】
━━━━━━━━━━━━━━━━━━━━

請確認：

.gacha-card-image {
    width: 100%;
    height: 100%;

    object-fit: cover;
    object-position: center;

    display: block;

    transform: none;
}

不要：

object-fit: fill;

避免角色被壓扁。

━━━━━━━━━━━━━━━━━━━━
【五、文字區也一起縮】
━━━━━━━━━━━━━━━━━━━━

因為卡片變窄，

請調整：

.gacha-info-panel {
    left: 7%;
    right: 7%;

    bottom: 68px;

    gap: 4px;
}

中文名稱：

.gacha-card-name {
    font-size:
        clamp(21px, 3vw, 27px);

    line-height:
        1.1;
}

英文名稱：

.gacha-card-english {
    font-size:
        14px;

    letter-spacing:
        3px;
}

分類：

.gacha-card-category {
    font-size:
        11px;

    min-height:
        26px;

    padding:
        0 10px;
}

━━━━━━━━━━━━━━━━━━━━
【六、左上角稀有度徽章縮小】
━━━━━━━━━━━━━━━━━━━━

目前卡片變窄後，

S / A / R badge 也不要太大。

請改成：

.gacha-rarity-emblem-frame {
    width: 66px;
    height: 66px;

    top: 14px;
    left: 14px;
}

.gacha-rarity-emblem {
    width: 56px;
    height: 56px;
}

.gacha-rarity-emblem span {
    font-size: 29px;
}

如果有：

RARE

小字：

font-size:
7px;

━━━━━━━━━━━━━━━━━━━━
【七、底部 HUD 縮小】
━━━━━━━━━━━━━━━━━━━━

請改：

.gacha-bottom-hud {
    left: 9%;
    right: 9%;

    bottom: 14px;

    grid-template-columns:
        1fr 44px 1fr;

    gap: 6px;
}

寶石：

.gacha-energy-core {
    width: 32px;
    height: 32px;
}

RARITY / A CLASS：

font-size:
8px;

letter-spacing:
1px;

━━━━━━━━━━━━━━━━━━━━
【八、外框不要因為變窄而太厚】
━━━━━━━━━━━━━━━━━━━━

請把：

外框厚度
內框厚度
光暈

也稍微縮小。

例如：

.gacha-card-front {
    border:
        1.5px solid var(--rarity-main);

    box-shadow:
        0 0 7px var(--rarity-main),
        0 0 20px var(--rarity-glow),
        0 14px 38px rgba(0,0,0,.45);
}

不要使用：

3px～4px 粗框

否則窄卡看起來太重。

━━━━━━━━━━━━━━━━━━━━
【九、桌面最終尺寸】
━━━━━━━━━━━━━━━━━━━━

桌面建議：

最大寬度：

390px

高度：

約 670px 左右

比例：

0.58

這樣視覺比較接近：

正式收藏卡
遊戲卡
角色卡

而不是：

大型海報。

━━━━━━━━━━━━━━━━━━━━
【十、手機版】
━━━━━━━━━━━━━━━━━━━━

請加入：

@media (max-width: 600px) {

    .gacha-flip-stage {
        width:
            min(78vw, calc(80vh * .58));

        aspect-ratio:
            .58;
    }

    .gacha-art-frame {
        top:
            56px;

        left:
            6%;

        right:
            6%;

        height:
            59%;
    }

    .gacha-rarity-emblem-frame {
        width:
            56px;

        height:
            56px;
    }

    .gacha-rarity-emblem {
        width:
            48px;

        height:
            48px;
    }

    .gacha-rarity-emblem span {
        font-size:
            25px;
    }

    .gacha-card-name {
        font-size:
            20px;
    }

    .gacha-card-english {
        font-size:
            13px;
    }

}

━━━━━━━━━━━━━━━━━━━━
【十一、小手機】
━━━━━━━━━━━━━━━━━━━━

@media (max-width: 390px) {

    .gacha-flip-stage {
        width:
            min(82vw, calc(78vh * .58));
    }

}

不要超過：

85vw。

━━━━━━━━━━━━━━━━━━━━
【十二、跳過按鈕】
━━━━━━━━━━━━━━━━━━━━

卡片變窄後，

跳過按鈕也一起縮小：

width:
130px;

height:
40px;

font-size:
13px;

margin-top:
14px;

不要讓跳過按鈕比卡片視覺還重。

━━━━━━━━━━━━━━━━━━━━
【十三、我要的最終比例】
━━━━━━━━━━━━━━━━━━━━

大概是：

        ╭──────────────╮
        │ A            │
        │              │
        │ ╭──────────╮ │
        │ │          │ │
        │ │          │ │
        │ │   圖片   │ │
        │ │          │ │
        │ │          │ │
        │ ╰──────────╯ │
        │              │
        │     伊布     │
        │    EEVEE     │
        │   寶可夢     │
        │              │
        │ RARITY ◆ A   │
        ╰──────────────╯

             跳過

我要：

窄
長
精緻
像收藏卡

不要：

寬
扁
像海報。

━━━━━━━━━━━━━━━━━━━━
【十四、S / A / R 顏色保持】
━━━━━━━━━━━━━━━━━━━━

這次修改後仍然：

S：
金色

A：
藍色

R：
紫色

所有：

外框
光暈
badge
圖片框
寶石
HUD

仍然使用：

var(--rarity-main)
var(--rarity-light)
var(--rarity-glow)

不要寫死成藍色。

━━━━━━━━━━━━━━━━━━━━
【十五、不要修改功能】
━━━━━━━━━━━━━━━━━━━━

不要修改：

- 抽卡機率
- S / A / R
- 卡片資料
- 圖片來源
- 中文名稱
- 英文名稱
- 分類
- 翻卡速度
- 十連抽
- localStorage
- atlas
- 玩家資料

只修改：

- 卡片寬度
- 卡片比例
- 內部元素尺寸
- RWD
- 外觀

━━━━━━━━━━━━━━━━━━━━
【十六、最後測試】
━━━━━━━━━━━━━━━━━━━━

請確認：

✅ 桌面卡片最大寬約390px
✅ 卡片比原本明顯變窄
✅ 卡片更加修長
✅ 圖片沒有被壓扁
✅ 圖片仍占主要視覺
✅ A / S / R badge 不過大
✅ 中文名稱正常
✅ 英文名稱正常
✅ 底部 HUD 正常
✅ 跳過按鈕正常
✅ 翻卡動畫正常
✅ 手機沒有超出畫面
✅ Console 無新增錯誤

完成後請回報：

1. 原本卡片最大寬度
2. 新卡片最大寬度
3. 原本 aspect-ratio
4. 新 aspect-ratio
5. 手機版寬度
6. 是否修改任何抽卡功能

---

這次最關鍵就是把：

```css
max-width: 460px;
aspect-ratio: .62;
```

改成大約：

```css
max-width: 390px;
aspect-ratio: .58;
```

這樣會明顯從「寬卡」變成比較修長的收藏卡。
