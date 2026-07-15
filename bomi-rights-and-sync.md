# Bomi · 权益体系 + 数据同步 + 迁移方案（完整文档）

> 更新日期：2026-07-09
> 本文档涵盖：米花权益规则、会员定价、iOS/Android 云同步方案、跨平台数据迁移方案、风控方案。
> 所有规则适用于 Bomi 全体用户，规范应用内米花获取/消耗/有效期、会员联动、隐私数据同步与迁移。

---

## 一、米花权益体系（D014）

### 1.1 米花定位

米花是 Bomi 专属虚拟权益道具，用户通过消耗米花解锁 AI 美食识别、营养分析、定制食谱等增值功能。

- 无现金价值，不支持提现/转账/跨用户赠予/兑换现金
- **后端统一存储**（PostgreSQL，非隐私数据，不走本地化）
- 所有米花收支由后端 `points_log` 表记录，管理后台可查流水

### 1.2 米花类型与获取规则

三类米花独立计算有效期，互不通用、互不叠加时效。

| 类型 | 获取方式 | 数量 | 有效期 |
|---|---|---|---|
| **Pro 专属米花** | 开通月度 Pro 会员，订阅生效当日一次性领取 | 3000 朵 | 与会员计费周期同步（30天），周期结束未消耗自动失效 |
| **日常收集米花** | 新用户首次入驻 | 80 朵 | 自发放日起 30 个自然日 |
| **日常收集米花** | 每日登录（弹窗提示赠送，只要登录即送） | 10 朵/日 | 自发放日起 30 个自然日 |
| **共创米花** | 邀请从未使用过 Bomi 的新用户完成首次登录，双方各得 | 300 朵 | 自发放日起 180 个自然日 |

**补充规则**：
- Pro 会员续费/重新开通，发放全新 3000 朵礼包，新旧批次有效期独立、互不覆盖
- 日常收集米花面向全体免费+付费用户开放
- 共创米花：同一设备、同一 Apple ID / Google 账号仅可参与一次新人邀请活动，禁止重复刷取

### 1.3 米花消耗标准

统一采用 5 朵、10 朵整数档位。

| 功能模块 | 单次消耗 |
|---|---|
| AI 食物图像智能识别 | 10 朵/次 |
| 月度营养深度分析报告 | 10 朵/份 |
| 定制减脂食谱方案生成 | 10 朵/套 |
| 手动录入单条三餐记录 | 5 朵/条 |
| 每日饮水打卡记录 | 5 朵/次 |

### 1.4 米花智能消耗优先级

系统优先消耗临近过期的米花，固定顺序：

1. 临近过期 · 日常收集米花
2. 临近过期 · 共创米花
3. 临近过期 · Pro 专属米花
4. 剩余有效期更长的全部米花

### 1.5 Pro 会员与米花联动

- 米花仅用于功能解锁，**不支持抵扣/兑换/续费 Pro 会员**（会员仅通过 App Store / Google Play 内购开通）
- 会员周期内关闭自动续费：当期 3000 朵 Pro 专属米花可正常使用至周期结束，不立即清空
- 会员到期后：未过期的日常米花/共创米花可继续消耗；当期 Pro 专属米花随会员到期自动失效
- 换设备登录同一账号：米花数据由后端自动同步（登录即恢复），无需手动迁移

### 1.6 米花数据存储

- **后端 PostgreSQL**：`points_balance`（余额表，按类型分记录）+ `points_log`（流水表，记录每笔收支）
- 管理后台可查询用户米花余额、收支流水、批次过期时间
- 米花不是隐私数据（非饮食记录/照片/体重），存后端无隐私风险

---

## 二、会员定价（D015）

### 2.1 三档定价

| 档位 | 标题 | 描述 | 现价 | 原价 |
|---|---|---|---|---|
| 月度会员 | 「月度会员」 | 短期体验，随心试错 | ¥38 | ¥78 |
| 季度会员 | 「季度会员」 | 适合中长期使用，几杯奶茶的价格 | ¥78 | ¥138 |
| 年度会员 | 「年度会员」 | 适合长期轻健康记录，一顿双人餐的价格 | ¥138 | ¥198 |

### 2.2 开通渠道

- **iOS**：App Store 内购（IAP）
- **Android**：Google Play 内购

### 2.3 会员权益

- 订阅生效当日领取 3000 朵 Pro 专属米花
- 会员周期内可使用所有 AI 增值功能（仍需消耗米花）
- 「恢复购买」功能：换设备后校验 Apple ID / Google 账号，一键恢复会员权益

### 2.4 后端数据模型

```
membership 表：
- user_id
- plan_type (monthly / quarterly / yearly)
- status (active / expired / cancelled)
- started_at
- expired_at
- auto_renew (bool)
- iap_order_id (关联内购订单)
- apple_product_id / google_product_id
```

---

## 三、iOS 云同步方案

### 3.1 同步范围

| 数据类型 | 同步方式 | 说明 |
|---|---|---|
| 饮食打卡明细 | iCloud CloudKit | 食物名称/营养/餐次/时间 |
| 食物照片缓存 | iCloud CloudKit（Asset 字段） | 压缩后上传 |
| 体重记录 | iCloud CloudKit | 时间序列数据 |
| 饮水记录 | iCloud CloudKit | 每日饮水量 |
| 健康档案（本地部分） | iCloud CloudKit | 年龄/性别/身高/活动水平 |
| 米花余额/流水 | **不同步**（走后端 API） | 后端统一管理 |
| 会员状态 | **不同步**（走后端 API） | 后端统一管理 |
| Token | **不同步**（Keychain） | 设备级安全存储 |

### 3.2 CloudKit 配置

```
Container Identifier: iCloud.com.bomi.app
Private Database（用户私有，仅本人可访问）

Record Types:
- DietLogRecord: { id, mealType, foods(JSON), nutritionSummary, loggedAt, photo(Asset) }
- WeightRecord: { id, weight, recordedAt }
- WaterRecord: { id, amount, recordedAt }
- HealthProfileRecord: { age, gender, height, activityLevel, updatedAt }

Zone: com.bomi.app.diet（自定义 Zone，支持增量同步）
```

### 3.3 同步触发时机

1. **应用进入前台**：拉取远端变更，合并本地
2. **写入本地数据后**：立即推送到 CloudKit
3. **后台任务**：`BGAppRefreshTask` 定时同步（每 30 分钟一次）
4. **网络恢复**：监听 `NWPathMonitor` 状态变化，恢复后触发同步

### 3.4 冲突解决

- 以 `loggedAt` 时间戳为准，后写入覆盖先写入
- 照片字段冲突时保留两张，标记 `duplicate: true` 供用户手动清理
- 同步状态用 `CKRecordZonesWithChangesChangedKey` 做增量拉取

### 3.5 iOS actual 实现

```kotlin
// mobile-shared/iosMain/.../CloudSync.ios.kt
class CloudSync : CloudSync {
    override fun syncDietLog(log: DietLog): Boolean {
        // 调用 CloudKit Framework 的 CKContainer / CKRecord
        // 写入 Private Database 的 com.bomi.app.diet Zone
    }
    override fun fetchChanges(since: Long): List<DietLog> {
        // 使用 CKFetchRecordZoneChangesOperation 增量拉取
    }
    override fun syncWeight(record: WeightRecord): Boolean { ... }
    override fun syncWater(record: WaterRecord): Boolean { ... }
}
```

---

## 四、Android 云同步方案

### 4.1 同步范围

| 数据类型 | 同步方式 | 说明 |
|---|---|---|
| 饮食打卡明细 | 坚果云 WebDAV | 同步为加密 JSON 文件 |
| 食物照片缓存 | 坚果云 WebDAV | 压缩后上传为 .jpg |
| 体重记录 | 坚果云 WebDAV | 时间序列数据 |
| 饮水记录 | 坚果云 WebDAV | 每日饮水量 |
| 健康档案（本地部分） | 坚果云 WebDAV | 年龄/性别/身高/活动水平 |
| 米花余额/流水 | **不同步**（走后端 API） | 后端统一管理 |
| 会员状态 | **不同步**（走后端 API） | 后端统一管理 |
| Token | **不同步**（KeyStore） | 设备级安全存储 |

### 4.2 坚果云 WebDAV 配置

```
服务器：https://dav.jianguoyun.com/dav/
目录结构：/Bomi/
  ├── diet_logs/
  │   ├── 2026-07-09_breakfast.json
  │   ├── 2026-07-09_lunch.json
  │   └── ...
  ├── photos/
  │   ├── 2026-07-09_breakfast_001.jpg
  │   └── ...
  ├── weights.json
  ├── waters.json
  └── health_profile.json

凭证存储：Android KeyStore + DataStore（加密存储坚果云账号密码）
```

### 4.3 同步触发时机

1. **应用进入前台**：拉取远端变更
2. **写入本地数据后**：立即推送到坚果云
3. **后台任务**：WorkManager 定时同步（每 30 分钟一次，`PeriodicWorkRequest`）
4. **网络恢复**：监听 `ConnectivityManager`，恢复后触发同步

### 4.4 分片断点续传

- 照片文件 > 500KB 时启用分片上传
- 每片 256KB，记录已上传偏移量到本地 DataStore
- 网络中断后从断点继续

### 4.5 冲突解决

- 以文件名中的时间戳为准，后写入覆盖
- 同名文件冲突时保留新版本，旧版本存入 `/Bomi/_conflicts/` 目录

### 4.6 Android actual 实现

```kotlin
// mobile-shared/androidMain/.../CloudSync.android.kt
class CloudSync(private val context: Context) : CloudSync {
    private val client = OkHttp3WebDAV(context)  // 封装 OkHttp3

    override fun syncDietLog(log: DietLog): Boolean {
        val json = encrypt(jsonEncode(log))
        return client.upload("/Bomi/diet_logs/${log.date}_${log.mealType}.json", json)
    }
    override fun fetchChanges(since: Long): List<DietLog> {
        val files = client.list("/Bomi/diet_logs/", modifiedAfter = since)
        return files.map { decrypt(client.download(it)).let(::jsonDecode) }
    }
}
```

---

## 五、跨平台数据迁移方案（iOS ↔ Android）

### 5.1 背景

iOS 用 iCloud CloudKit，Android 用坚果云 WebDAV，两者不互通。用户从 iOS 换到 Android（或反向）时，需要手动迁移本地数据。

### 5.2 方案：导出加密包 + 导入

#### 导出流程

1. 用户在「设置 - 数据迁移 - 导出数据」点击导出
2. App 设置迁移密码（用户自定义，至少 6 位）
3. App 从本地 SQLDelight 读取全部数据
4. 序列化为 JSON → AES-256-GCM 加密 → 生成 `.bomi` 文件
5. 用户通过系统分享保存文件到任意位置（AirDrop / 微信 / 邮件 / 云盘）

#### 导入流程

1. 用户在新设备/新平台打开 Bomi
2. 在「设置 - 数据迁移 - 导入数据」选择 `.bomi` 文件
3. App 提示输入迁移密码
4. 解密 → 校验完整性 → 导入本地 SQLDelight
5. 导入完成后提示「数据迁移成功」

### 5.3 .bomi 文件格式

```
[魔数 16B]      "BOMI_EXPORT_V1"
[版本 1B]        1
[平台 1B]        0=iOS, 1=Android
[创建时间 8B]    Unix timestamp (ms)
[盐值 16B]       PBKDF2 salt
[IV 12B]         AES-GCM nonce
[密文长度 4B]    uint32
[密文 N B]       AES-256-GCM(JSON payload)
[认证标签 16B]   GCM authentication tag
```

### 5.4 加密方案

- **算法**：AES-256-GCM（认证加密，防篡改）
- **密钥派生**：PBKDF2-SHA256(用户密码, salt, iterations=100000, keyLength=32)
- **完整性校验**：GCM 自带认证标签，解密失败即密码错误或文件损坏

### 5.5 解密后的 JSON Payload

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-07-09T10:00:00Z",
  "sourceDevice": "iPhone 15 Pro",
  "dietLogs": [
    {
      "id": "uuid",
      "mealType": 1,
      "foods": [{"name": "米饭", "weight": 200, "calories": 260, "protein": 5, "carbs": 55, "fat": 1}],
      "nutritionSummary": {"calories": 260, "protein": 5, "carbs": 55, "fat": 1},
      "loggedAt": "2026-07-09T08:30:00Z"
    }
  ],
  "weightRecords": [
    {"id": "uuid", "weight": 65.5, "recordedAt": "2026-07-09T07:00:00Z"}
  ],
  "waterRecords": [
    {"id": "uuid", "amount": 250, "recordedAt": "2026-07-09T09:00:00Z"}
  ],
  "healthProfile": {
    "age": 28,
    "gender": 1,
    "height": 175,
    "activityLevel": 2,
    "updatedAt": "2026-07-09T07:00:00Z"
  },
  "foodPhotos": [
    {"id": "uuid", "base64": "<base64编码的压缩JPEG>", "dietLogId": "uuid", "mealType": 1}
  ]
}
```

### 5.6 导入冲突处理

| 冲突场景 | 处理方式 |
|---|---|
| 同一条记录（相同 id）已存在 | 跳过，保留本地版本 |
| 时间戳冲突（相同 loggedAt 不同内容） | 保留两条，标记 `imported: true` |
| 照片 base64 损坏 | 跳过该照片，保留文字记录 |
| schemaVersion 不兼容 | 提示「文件版本不兼容，请升级 App」 |

### 5.7 迁移限制

- 导出文件大小上限：200MB（含照片 base64）
- 照片导出时强制压缩至单张 ≤ 500KB
- 导入后不自动同步到 iCloud / 坚果云（用户可手动触发同步）
- **米花/会员不迁移**（走后端，登录即恢复）

### 5.8 KMP 共享实现

导出/导入逻辑放在 `mobile-shared/commonMain`（两端共用），加密用平台 actual：

```kotlin
// commonMain
expect class DataMigrator(crypto: CryptoHelper) {
    fun export(password: String, data: ExportPayload): ByteArray
    fun import(password: String, file: ByteArray): ExportPayload
}

// iosMain / androidMain
actual class CryptoHelper {
    actual fun pbkdf2(password: String, salt: ByteArray): ByteArray  // 平台原生 PBKDF2
    actual fun aesGcmEncrypt(key: ByteArray, iv: ByteArray, data: ByteArray): ByteArray
    actual fun aesGcmDecrypt(key: ByteArray, iv: ByteArray, data: ByteArray): ByteArray
}
```

---

## 六、风控方案（防虚假账号刷邀请奖励）

### 6.1 风险场景

- A 邀请 B/C/D 各得 300 米花，B/C/D 也各得 300
- 风险：A 自己注册多个虚假账号 B/C/D，骗取邀请奖励

### 6.2 风控策略（多维度叠加）

#### 策略 1：设备指纹绑定

- 首次登录时采集设备指纹（iOS IDFV / Android ANDROID_ID + 设备型号）
- 一个设备指纹只能作为「被邀请人」绑定一次上家
- 同一设备注册第二个账号，不触发邀请奖励

#### 策略 2：账号标识绑定

- iOS：Apple ID 作为唯一标识（Apple Sign In 拿到 `userIdentifier`）
- Android：Google 账号作为唯一标识（Google Sign In 拿到 `googleId`）
- 一个 Apple ID / Google 账号只能被邀请一次

#### 策略 3：奖励延迟发放

- 邀请成功后，**不立即发放 300 米花**
- 被邀请人需在 3 天内完成至少 1 次三餐打卡（活跃校验）
- 活跃校验通过后，双方各发 300 米花
- 未在 3 天内活跃，邀请失效，不发放奖励

#### 策略 4：邀请人上限保护

- 邀请人 A 可无限邀请 B/C/D（无上限），每次有效邀请各得 300
- 但 A 只能绑定一个上家（即 A 被谁邀请，只能绑定一次，不可更换）
- A 的上家在 A 首次被邀请时绑定，永久不可改

#### 策略 5：频率限制

- 同一邀请人 24 小时内最多发起 10 次邀请
- 超过限制提示「今日邀请次数已达上限，请明日再试」

#### 策略 6：管理后台异常监控

- 管理后台展示邀请关系树
- 标记异常账号（同一设备多账号 / 3 天未活跃 / 批量注册）
- 管理员可手动冻结异常账号的米花

### 6.3 后端数据模型

```
invite_relation 表：
- inviter_id（邀请人 user_id）
- invitee_id（被邀请人 user_id）
- invitee_device_fingerprint
- invitee_apple_id / invitee_google_id
- status (pending / rewarded / expired / frozen)
- invited_at
- rewarded_at（完成活跃校验后写入）
- expire_at（invited_at + 3天）

user 表新增字段：
- bound_inviter_id（绑定的上家 user_id，NULL=无上家，首次绑定后不可改）
- device_fingerprint
- apple_user_identifier / google_id
```

### 6.4 风控流程

```
邀请发起 → 记录 invite_relation(pending)
  ↓
被邀请人 3 天内完成 1 次三餐打卡？
  ├─ 是 → 校验设备指纹/账号标识唯一性
  │   ├─ 通过 → 发放双方各 300 米花，status=rewarded
  │   └─ 不通过（重复设备/账号）→ status=frozen，不发奖
  └─ 否 → status=expired，不发奖
```

---

## 七、后端数据模型汇总（D014/D015 相关）

```
points_balance 表：
- user_id
- type (pro / daily / coCreation)
- amount
- expired_at
- created_at

points_log 表：
- id
- user_id
- type (pro / daily / coCreation)
- change_amount (正=获取, 负=消耗)
- reason (newUser / dailyLogin / proSubscribe / invite / aiRecognize / ...)
- balance_after
- expired_at（本批次过期时间）
- created_at

membership 表：
- user_id
- plan_type (monthly / quarterly / yearly)
- status (active / expired / cancelled)
- started_at
- expired_at
- auto_renew
- iap_order_id

iap_order 表：
- id
- user_id
- platform (ios / android)
- product_id
- receipt_data
- verified (bool)
- amount
- created_at

invite_relation 表：
- inviter_id
- invitee_id
- invitee_device_fingerprint
- invitee_apple_id / invitee_google_id
- status (pending / rewarded / expired / frozen)
- invited_at
- rewarded_at
- expire_at

user 表新增字段：
- bound_inviter_id（绑定的上家，NULL=无，首次绑定不可改）
- device_fingerprint
- apple_user_identifier
- google_id
- last_daily_login_at（上次每日登录送米花时间，防重复）
```

---

## 八、API 接口新增（D014/D015 相关）

### 8.1 米花接口（JWT）

| 接口 | 说明 |
|---|---|
| `GET /api/v1/points/balance` | 查询三类米花余额（pro/daily/coCreation） |
| `GET /api/v1/points/log` | 查询米花收支流水（分页） |
| `POST /api/v1/points/daily-login` | 每日登录领取（后端校验当天是否已领，未领则发 10 朵日常米花） |
| `POST /api/v1/points/consume` | 消耗米花（传 amount + reason，后端按优先级扣减） |

### 8.2 会员接口（JWT）

| 接口 | 说明 |
|---|---|
| `GET /api/v1/membership/status` | 查询当前会员状态（plan_type / expired_at / auto_renew） |
| `POST /api/v1/membership/verify-iap` | iOS 内购凭证校验（传 receipt，后端向 Apple 校验，通过后开通会员 + 发 3000 Pro 米花） |
| `POST /api/v1/membership/verify-google` | Android 内购凭证校验（传 purchaseToken，后端向 Google 校验） |
| `POST /api/v1/membership/restore` | 恢复购买（校验当前账号是否有有效订阅） |

### 8.3 邀请接口（JWT）

| 接口 | 说明 |
|---|---|
| `POST /api/v1/invite/bind` | 绑定上家（传 inviterCode，仅首次绑定，后端校验设备指纹/账号唯一性） |
| `GET /api/v1/invite/inviter-code` | 获取我的邀请码 |
| `GET /api/v1/invite/tree` | 查询我邀请的人列表 + 状态（pending/rewarded/expired） |
| `POST /api/v1/invite/check-active` | 被邀请人完成打卡后触发，后端校验活跃条件，通过则发奖 |

---

## 九、隐私协议补充措辞

### 9.1 米花数据

> 米花积分数据存储于平台后端服务器，用于权益管理与流水记录。米花为虚拟权益道具，非个人隐私数据，不涉及用户饮食/健康/照片等隐私信息。

### 9.2 饮食打卡数据

> 用户饮食打卡明细、食物照片、体重记录、饮水记录等隐私数据，仅存储于设备本地 + 用户私有云（iOS iCloud / Android 坚果云），平台后端不存储、不备份、不获取任何用户隐私数据。

### 9.3 跨平台数据迁移

> 跨平台换机时，用户可通过 App 内置的「数据导出/导入」功能，将本地数据导出为加密文件，由用户自行保管。导出文件采用 AES-256 加密，仅用户本人持有密码可解密。

### 9.4 邀请好友

> 邀请好友功能需采集设备标识与第三方账号标识（Apple ID / Google 账号），用于防止虚假账号刷取邀请奖励。该标识仅用于风控校验，不用于其他用途。

---

## 十、各端实现分工

| 功能模块 | 负责端 | 说明 |
|---|---|---|
| 米花余额/流水/消耗 | 服务端 | 后端 API + PostgreSQL |
| 会员开通/凭证校验/恢复购买 | 服务端 | 后端向 Apple/Google 校验 IAP 凭证 |
| 邀请绑定/风控/奖励发放 | 服务端 | 后端校验设备指纹 + 账号唯一性 |
| 米花余额展示/消耗触发 | iOS / Android | 调后端 API |
| 会员购买 UI | iOS / Android | 调系统内购 SDK |
| 邀请码分享/绑定 UI | iOS / Android | 调后端 API |
| 每日登录弹窗 | iOS / Android | 调 `/api/v1/points/daily-login` |
| 饮食打卡本地存储 | iOS / Android | SQLDelight |
| iCloud 同步 | iOS | CloudKit |
| 坚果云同步 | Android | WebDAV + OkHttp3 |
| 跨平台导出/导入 | iOS + Android | KMP commonMain 共享逻辑 + 平台加密 actual |
| 米花流水查询 | 管理后台 | 调 `/api/v1/admin/points/log` |
| 会员订单管理 | 管理后台 | 调 `/api/v1/admin/membership/*` |
| 邀请关系树 + 异常监控 | 管理后台 | 调 `/api/v1/admin/invite/*` |
