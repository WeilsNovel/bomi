# bomi-mobile-shared

bomi 移动端共享逻辑层（Kotlin Multiplatform），供 iOS（SwiftUI）与 Android（Jetpack Compose）原生项目复用。

## 技术栈

- Kotlin Multiplatform（KMP）
- 网络：ktor（commonMain core + 平台 engine）
- 序列化：kotlinx.serialization
- 协程：kotlinx.coroutines
- Android 安全存储：EncryptedSharedPreferences
- iOS 安全存储：Keychain（Stage 1 接入，当前为骨架）

## 目录结构

```
mobile-shared/
├── build.gradle.kts
├── settings.gradle.kts
└── src/
    ├── commonMain/kotlin/com/bomi/shared/
    │   ├── AppConfig.kt            # 全局配置（BaseURL/超时）
    │   ├── Models.kt               # 数据模型（Stage 0.5 手动镜像，后续 proto codegen 替换）
    │   ├── BomiException.kt        # 业务异常 + 错误码
    │   ├── BomiSDK.kt              # SDK 入口，对外暴露 Repository
    │   ├── network/
    │   │   ├── ApiClient.kt        # ktor 封装 + Token 注入 + 响应解包
    │   │   └── Endpoint.kt         # API 路由常量
    │   ├── repository/
    │   │   ├── AuthRepository.kt   # 微信/手机号/Apple 登录 + 短信
    │   │   ├── FoodRepository.kt   # 食物识别 + 饮食打卡
    │   │   └── PlanRepository.kt   # 健康计划生成
    │   └── security/
    │       └── TokenStorage.kt     # expect：令牌存储抽象
    ├── androidMain/kotlin/com/bomi/shared/security/
    │   └── TokenStorage.android.kt # actual：EncryptedSharedPreferences
    └── iosMain/kotlin/com/bomi/shared/security/
        └── TokenStorage.ios.kt     # actual：Keychain（Stage 1）
```

## 集成方式

### Android（Compose 项目）
在 app 的 `build.gradle.kts`：
```kotlin
dependencies {
    implementation(project(":mobile-shared"))
}
```

### iOS（SwiftUI 项目）
通过 CocoaPods 或 Framework 引用，详见 KMP 官方文档。

## 使用示例

```kotlin
// 各端 App 启动时初始化
val sdk = BomiSDK.create(TokenStorage())  // Android 传入 Context 初始化

// 登录
val result = sdk.authRepository.wxLogin(code)
sdk.saveToken(result.token)

// 食物识别
val foods = sdk.foodRepository.recognize(imageUrl)

// 登出
sdk.logout()
```

## 契约来源

所有模型 / 错误码 / 枚举的唯一来源是 `proto/` 目录（仓库根）。
- 当前 `Models.kt` 为手动镜像（Stage 0.5），后续接入 `make proto` 后由 codegen 生成替换。
- 改字段必须先改 proto，禁止只改本文件。

## Stage 进度

- Stage 0.5：骨架搭建（配置 / 网络层 / Repository / Token 抽象）✅
- Stage 1：对接服务端接口 + iOS Keychain + Android EncryptedSharedPreferences 完善
