// BomiApp - SwiftUI 应用入口
// 注入 AppConfig，导航根为 LoginView（Stage 1 骨架，后续接入路由）

import SwiftUI

@main
struct BomiApp: App {
    var body: some Scene {
        WindowGroup {
            LoginView()
        }
    }
}
