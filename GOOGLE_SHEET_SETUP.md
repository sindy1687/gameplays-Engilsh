# Google Sheet 優惠碼系統設定說明

## 必要的工作表

### 1. coupons 工作表

建立名為 `coupons` 的工作表，並設定以下欄位：

| 欄位名稱 | 說明 | 範例 |
|---------|------|------|
| couponCode | 優惠碼（大寫） | WELCOME100 |
| stars | 兌換星星數量 | 100 |
| maxUses | 最大使用次數 | 9999 |
| usedCount | 已使用次數 | 0 |
| expiresAt | 過期日期（留空表示不過期） | 2024-12-31 |
| isActive | 是否啟用（TRUE/FALSE） | TRUE |
| description | 優惠碼描述 | 新手歡迎禮 100 星星 |
| createdAt | 建立時間 | 2024-01-01 |
| updatedAt | 更新時間 | 2024-01-01 |

#### 範例資料：

```
couponCode    stars    maxUses    usedCount    expiresAt    isActive    description                    createdAt    updatedAt
WELCOME100    100      9999       0                         TRUE        新手歡迎禮 100 星星             2024-01-01  2024-01-01
STAR500       500      9999       0                         TRUE        活動獎勵 500 星星               2024-01-01  2024-01-01
BONUS50       50       100        0            2024-12-31   TRUE        限時優惠 50 星星               2024-01-01  2024-01-01
```

### 2. coupon_redemptions 工作表

建立名為 `coupon_redemptions` 的工作表，並設定以下欄位：

| 欄位名稱 | 說明 | 範例 |
|---------|------|------|
| redeemId | 兌換紀錄ID（自動生成UUID） | 123e4567-e89b-12d3-a456-426614174000 |
| couponCode | 優惠碼 | WELCOME100 |
| playerId | 玩家ID | player_123 |
| playerName | 玩家名稱 | 小明 |
| stars | 兌換星星數量 | 100 |
| createdAt | 兌換時間 | 2024-01-01 10:00:00 |

#### 範例資料：

```
redeemId                              couponCode    playerId    playerName    stars    createdAt
123e4567-e89b-12d3-a456-426614174000  WELCOME100    player_123  小明          100      2024-01-01 10:00:00
```

### 3. players 工作表

如果尚未建立，系統會自動建立 `players` 工作表：

| 欄位名稱 | 說明 | 範例 |
|---------|------|------|
| playerId | 玩家ID | player_123 |
| playerName | 玩家名稱 | 小明 |
| stars | 目前星星數量 | 500 |
| createdAt | 建立時間 | 2024-01-01 |

## 設定步驟

1. 開啟您的 Google Sheet
2. 新增工作表，命名為 `coupons`
3. 在第一行輸入欄位名稱：`couponCode`, `stars`, `maxUses`, `usedCount`, `expiresAt`, `isActive`, `description`, `createdAt`, `updatedAt`
4. 新增範例優惠碼資料
5. 新增工作表，命名為 `coupon_redemptions`
6. 在第一行輸入欄位名稱：`redeemId`, `couponCode`, `playerId`, `playerName`, `stars`, `createdAt`
7. （可選）新增工作表，命名為 `players`，或讓系統自動建立

## 部署 Google Apps Script

1. 開啟 Google Sheet
2. 點選「擴充功能」>「Apps Script」
3. 將 `google_sheets_apps_script.js` 的內容貼上
4. 點選「部署」>「新增部署」
5. 選擇「網頁應用程式」
6. 設定：
   - 說明：優惠碼系統
   - 執行身分：我
   - 存取權限：任何人
7. 點選「部署」
8. 複製網頁應用程式 URL
9. 在遊戲中設定 `localStorage.setItem('googleAppsScriptUrl', 'YOUR_URL_HERE')`

## 測試優惠碼

1. 開啟 shop.html
2. 在優惠碼兌換區塊輸入 `WELCOME100`
3. 點選「兌換星星」
4. 檢查：
   - 顯示「兌換成功，獲得 100 星星」
   - 商城星星數量增加 100
   - Google Sheet `players.stars` 增加 100
   - Google Sheet `coupons.usedCount` 增加 1
   - Google Sheet `coupon_redemptions` 新增紀錄
5. 再次輸入 `WELCOME100`
6. 應顯示「你已經兌換過這組優惠碼」
7. 星星不會重複增加

## 錯誤訊息說明

| 訊息 | 原因 |
|------|------|
| 請先輸入優惠碼 | 輸入框為空 |
| 找不到這組優惠碼 | 優惠碼不存在於 coupons 表 |
| 這組優惠碼已停用 | isActive 欄位不是 TRUE |
| 這組優惠碼已過期 | expiresAt 小於現在時間 |
| 這組優惠碼已兌換完畢 | usedCount >= maxUses |
| 你已經兌換過這組優惠碼 | coupon_redemptions 已有相同 playerId + couponCode |
| 優惠碼星星數量異常 | stars 欄位不是有效數字或 <= 0 |
| Google Sheet 連線失敗，請檢查網路後再試 | 網路或 API 連線問題 |

## 安全性說明

- 星星增加只在後端（Google Apps Script）處理
- 前端無法直接修改星星數量
- 使用 LockService 防止並發問題
- 檢查同一 playerId + couponCode 只能兌換一次
- 更新 coupons.usedCount 防止超額兌換
- 記錄所有兌換紀錄到 coupon_redemptions
- localStorage 只作為顯示快取
