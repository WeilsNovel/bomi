package config

// Config 全局配置结构体
type Config struct {
	Server ServerConfig
	DB     DBConfig
	JWT    JWTConfig
	AI     AIConfig
	Redis  RedisConfig
	SMS    SMSConfig
	Wechat WechatConfig
	Apple  AppleConfig
}

// ServerConfig 服务端配置
type ServerConfig struct {
	Port string
	Mode string // debug / release
}

// DBConfig 数据库配置
type DBConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
}

// JWTConfig JWT 配置
type JWTConfig struct {
	Secret      string
	ExpireHours int
}

// AIConfig AI 调用配置（Key 仅从环境变量读取，禁止硬编码）
type AIConfig struct {
	Provider         string
	APIKeyDev        string
	APIKeyProd       string
	BaseURLDev       string
	BaseURLProd      string
	DefaultModelDev  string
	DefaultModelProd string
	// 默认参数（对应 proto AI_DEFAULT_PARAMS）
	Temperature  float64
	MaxTokens    int
	Stream       bool
	RetryCount   int
	TimeoutMs    int
}

// RedisConfig Redis 配置
type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

// SMSConfig 阿里云短信配置
type SMSConfig struct {
	AccessKey   string
	SecretKey   string
	SignName    string
	TemplateCode string
}

// WechatConfig 微信配置
type WechatConfig struct {
	AppID     string
	AppSecret string
}

// AppleConfig Apple Sign In 配置
type AppleConfig struct {
	TeamID           string
	ClientID         string
	KeyID            string
	PrivateKeyPath   string
}
