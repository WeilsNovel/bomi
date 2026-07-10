package ai

import (
	"github.com/WeilsNovel/bomi/server/internal/config"
)

// ClientConfig AI 客户端运行时配置
// 由 config.AIConfig 转换而来，屏蔽 dev/prod 差异，按当前 mode 选择对应 Key/BaseURL/Model。
type ClientConfig struct {
	Provider    string
	APIKey      string
	BaseURL     string
	Model       string
	Temperature float32
	MaxTokens   int
	Stream      bool
	RetryCount  int
	TimeoutMs   int
}

// ResolveConfig 根据运行模式解析出当前生效的 AI 配置
// mode=debug 用 Dev 配置，否则用 Prod 配置。Key 永不写入日志。
func ResolveConfig(cfg config.AIConfig, mode string) ClientConfig {
	out := ClientConfig{
		Provider:    cfg.Provider,
		Temperature: float32(cfg.Temperature),
		MaxTokens:   cfg.MaxTokens,
		Stream:      cfg.Stream,
		RetryCount:  cfg.RetryCount,
		TimeoutMs:   cfg.TimeoutMs,
	}
	if mode == "debug" {
		out.APIKey = cfg.APIKeyDev
		out.BaseURL = cfg.BaseURLDev
		out.Model = cfg.DefaultModelDev
	} else {
		out.APIKey = cfg.APIKeyProd
		out.BaseURL = cfg.BaseURLProd
		out.Model = cfg.DefaultModelProd
	}
	return out
}
