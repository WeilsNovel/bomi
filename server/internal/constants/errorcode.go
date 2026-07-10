package constants

// ErrorCode 业务错误码（对应 proto/bomi/enum/error_code.proto）
// 新增错误码必须先改 proto 定义，再同步此处。
const (
	Success             = 0
	ParamInvalid        = 40001
	Unauthorized        = 40101
	TokenExpired        = 40102
	Forbidden           = 40301
	NotFound            = 40401
	ServerError         = 50001
	RateLimit           = 42901
	ThirdPartyError     = 50002
	WxLoginFailed       = 40111
	SmsCodeInvalid      = 40112
	PhoneAlreadyBound   = 40113
	AppleLoginFailed    = 40114
	AIRecognizeFailed   = 50021
	AIPlanGenerateFailed = 50022
	AITimeout           = 50023
	ImageUploadFailed   = 50031
)

// ErrorMessage 错误码对应文案（前端展示用）
var ErrorMessage = map[int]string{
	Success:              "操作成功",
	ParamInvalid:         "参数错误",
	Unauthorized:         "请先登录",
	TokenExpired:         "登录已过期，请重新登录",
	Forbidden:            "无操作权限",
	NotFound:             "资源不存在",
	ServerError:          "服务器异常，请稍后重试",
	RateLimit:            "操作过于频繁，请稍后再试",
	ThirdPartyError:      "服务暂时不可用，请稍后重试",
	WxLoginFailed:        "微信登录失败，请重试",
	SmsCodeInvalid:       "验证码错误或已过期",
	PhoneAlreadyBound:    "该手机号已被其他账号绑定",
	AppleLoginFailed:     "Apple 登录失败，请重试",
	AIRecognizeFailed:    "识别失败，请重新拍摄清晰的食物照片",
	AIPlanGenerateFailed: "计划生成失败，请稍后重试",
	AITimeout:            "识别超时，请稍后重试",
	ImageUploadFailed:    "图片上传失败，请重试",
}

// GetMessage 获取错误码文案，未命中返回通用错误
func GetMessage(code int) string {
	if msg, ok := ErrorMessage[code]; ok {
		return msg
	}
	return "未知错误"
}
