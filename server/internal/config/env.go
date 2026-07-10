package config

import (
	"fmt"
	"strconv"

	"github.com/spf13/viper"
)

// Load 从环境变量 / .env 加载配置
func Load() (*Config, error) {
	// 读取 .env 文件（若存在）
	viper.SetConfigFile(".env")
	viper.AutomaticEnv()
	_ = viper.ReadInConfig() // 忽略文件不存在错误

	cfg := &Config{
		Server: ServerConfig{
			Port: getEnv("SERVER_PORT", "8080"),
			Mode: getEnv("SERVER_MODE", "debug"),
		},
		DB: DBConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"), // D009: PostgreSQL 默认端口
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", ""),
			DBName:   getEnv("DB_NAME", "bomi"),
		},
		JWT: JWTConfig{
			Secret:      getEnv("JWT_SECRET", ""),
			ExpireHours: getIntEnv("JWT_EXPIRE_HOURS", 168),
		},
		AI: AIConfig{
			Provider:         getEnv("AI_PROVIDER", "qwen"),
			APIKeyDev:        getEnv("AI_API_KEY_DEV", ""),
			APIKeyProd:       getEnv("AI_API_KEY_PROD", ""),
			BaseURLDev:       getEnv("AI_BASE_URL_DEV", "https://dashscope.aliyuncs.com/compatible-mode/v1"),
			BaseURLProd:      getEnv("AI_BASE_URL_PROD", "https://dashscope.aliyuncs.com/compatible-mode/v1"),
			DefaultModelDev:  getEnv("AI_DEFAULT_MODEL_DEV", "qwen-vl-max"),
			DefaultModelProd: getEnv("AI_DEFAULT_MODEL_PROD", "qwen-vl-max"),
			Temperature:      getFloatEnv("AI_TEMPERATURE", 0.3),
			MaxTokens:        getIntEnv("AI_MAX_TOKENS", 2000),
			Stream:           getBoolEnv("AI_STREAM", false),
			RetryCount:       getIntEnv("AI_RETRY_COUNT", 2),
			TimeoutMs:        getIntEnv("AI_TIMEOUT_MS", 30000),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getIntEnv("REDIS_DB", 0),
		},
		SMS: SMSConfig{
			AccessKey:    getEnv("SMS_ACCESS_KEY", ""),
			SecretKey:    getEnv("SMS_SECRET_KEY", ""),
			SignName:     getEnv("SMS_SIGN_NAME", "bomi"),
			TemplateCode: getEnv("SMS_TEMPLATE_CODE", ""),
		},
		Wechat: WechatConfig{
			AppID:     getEnv("WECHAT_APP_ID", ""),
			AppSecret: getEnv("WECHAT_APP_SECRET", ""),
		},
		Apple: AppleConfig{
			TeamID:         getEnv("APPLE_TEAM_ID", ""),
			ClientID:       getEnv("APPLE_CLIENT_ID", ""),
			KeyID:          getEnv("APPLE_KEY_ID", ""),
			PrivateKeyPath: getEnv("APPLE_PRIVATE_KEY_PATH", ""),
		},
		COS: COSConfig{
			SecretID:              getEnv("COS_SECRET_ID", ""),
			SecretKey:             getEnv("COS_SECRET_KEY", ""),
			Region:                getEnv("COS_REGION", "ap-guangzhou"),
			MaterialBucket:        getEnv("COS_MATERIAL_BUCKET", ""),
			AITempBucket:          getEnv("COS_AI_TEMP_BUCKET", ""),
			AITempURLExpireMinutes: getIntEnv("COS_AI_TEMP_URL_EXPIRE_MINUTES", 10),
		},
	}

	// 关键配置校验
	if cfg.JWT.Secret == "" {
		return nil, fmt.Errorf("JWT_SECRET 未设置")
	}

	return cfg, nil
}

// getEnv 读取字符串环境变量，带默认值
func getEnv(key, defaultVal string) string {
	if val := viper.GetString(key); val != "" {
		return val
	}
	return defaultVal
}

// getIntEnv 读取整型环境变量
func getIntEnv(key string, defaultVal int) int {
	if val := viper.GetString(key); val != "" {
		if n, err := strconv.Atoi(val); err == nil {
			return n
		}
	}
	return defaultVal
}

// getFloatEnv 读取浮点型环境变量
func getFloatEnv(key string, defaultVal float64) float64 {
	if val := viper.GetString(key); val != "" {
		if f, err := strconv.ParseFloat(val, 64); err == nil {
			return f
		}
	}
	return defaultVal
}

// getBoolEnv 读取布尔型环境变量
func getBoolEnv(key string, defaultVal bool) bool {
	if val := viper.GetString(key); val != "" {
		if b, err := strconv.ParseBool(val); err == nil {
			return b
		}
	}
	return defaultVal
}
