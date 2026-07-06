// KeychainHelper - token 安全存储（Keychain，非 UserDefaults）
// D006 决策: token 必须存 Keychain，禁止 UserDefaults

import Foundation
import Security

/// Keychain 操作工具，专门用于存取 JWT token
enum KeychainHelper {

    /// Keychain 存储的 key
    private static let tokenKey = "com.bomi.app.token"

    /// 存储 token 到 Keychain
    /// - Parameter token: JWT token 字符串
    static func saveToken(_ token: String) {
        let data = Data(token.utf8)
        // 先删除旧值，再存新值
        deleteToken()
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: tokenKey,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock,
        ]
        SecItemAdd(query as CFDictionary, nil)
    }

    /// 从 Keychain 读取 token
    /// - Returns: JWT token，未存或读取失败返回 nil
    static func loadToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: tokenKey,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else {
            return nil
        }
        return String(data: data, encoding: .utf8)
    }

    /// 删除 Keychain 中的 token（登出时调用）
    static func deleteToken() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: tokenKey,
        ]
        SecItemDelete(query as CFDictionary)
    }
}
