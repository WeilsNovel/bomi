// bomi mobile-shared 独立构建配置
// 可独立 ./gradlew build，也可被 iOS/Android 原生项目以 composite build 引入。
rootProject.name = "bomi-mobile-shared"

dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
    }
    versionCatalogs {
        create("libs") {
            // Kotlin / KMP 插件
            version("kotlin", "2.0.20")
            plugin("kotlinMultiplatform", "org.jetbrains.kotlin.multiplatform").versionRef("kotlin")
            plugin("androidLibrary", "com.android.library").version("8.5.2")

            // 网络 ktor
            library("ktor-client-core", "io.ktor:ktor-client-core:2.3.12")
            library("ktor-client-content-negotiation", "io.ktor:ktor-client-content-negotiation:2.3.12")
            library("ktor-serialization-kotlinx-json", "io.ktor:ktor-serialization-kotlinx-json:2.3.12")
            library("ktor-client-logging", "io.ktor:ktor-client-logging:2.3.12")
            library("ktor-client-okhttp", "io.ktor:ktor-client-okhttp:2.3.12")
            library("ktor-client-darwin", "io.ktor:ktor-client-darwin:2.3.12")

            // 序列化 / 协程 / 日期
            library("kotlinx-serialization-json", "org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
            library("kotlinx-coroutines-core", "org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")
            library("kotlinx-datetime", "org.jetbrains.kotlinx:kotlinx-datetime:0.6.1")

            // Android 安全存储
            library("androidx-security-crypto", "androidx.security:security-crypto:1.1.0-alpha06")

            // 测试
            library("kotlin-test", "org.jetbrains.kotlin:kotlin-test:2.0.20")
        }
    }
}
