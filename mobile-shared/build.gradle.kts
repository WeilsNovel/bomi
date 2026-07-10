// bomi mobile-shared KMP 模块构建脚本
// 共享业务逻辑层：网络/仓储/模型/鉴权存储
// iOS / Android 各自的原生 UI 项目引用本模块。
plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.androidLibrary)
}

kotlin {
    // 目标平台：Android + iOS
    androidTarget {
        compilations.all {
            kotlinOptions {
                jvmTarget = "17"
            }
        }
    }
    iosX64()
    iosArm64()
    iosSimulatorArm64()

    // iOS 框架导出（供 SwiftUI 项目通过 CocoaPods 或 Framework 引用）
    applyDefaultHierarchyTemplate()

    sourceSets {
        commonMain.dependencies {
            // 网络：ktor（KMP 标准HTTP客户端）
            implementation(libs.ktor.client.core)
            implementation(libs.ktor.client.content.negotiation)
            implementation(libs.ktor.serialization.kotlinx.json)
            implementation(libs.ktor.client.logging)
            // 序列化
            implementation(libs.kotlinx.serialization.json)
            // 协程
            implementation(libs.kotlinx.coroutines.core)
            // 日期时间
            implementation(libs.kotlinx.datetime)
        }
        androidMain.dependencies {
            implementation(libs.ktor.client.okhttp)
            implementation(libs.androidx.security.crypto)
        }
        iosMain.dependencies {
            implementation(libs.ktor.client.darwin)
        }
        commonTest.dependencies {
            implementation(libs.kotlin.test)
        }
    }
}

android {
    namespace = "com.bomi.mobileshared"
    compileSdk = 34
    defaultConfig {
        minSdk = 26
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
