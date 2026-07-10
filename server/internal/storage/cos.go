package storage

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/WeilsNovel/bomi/server/internal/config"
	"github.com/tencentyun/cos-go-sdk-v5"
)

// Client 腾讯云 COS 客户端封装（双桶）
// D013：不接 CDN，使用 COS 原生域名直出
// D010：AI 临时桶 5 分钟生命周期自动清理（在 COS 控制台配置）
type Client struct {
	materialClient *cos.Client // 永久素材桶
	aiTempClient   *cos.Client // AI 临时图片桶
	cfg            config.COSConfig
}

// NewClient 构造 COS 客户端
func NewClient(cfg config.COSConfig) (*Client, error) {
	if cfg.MaterialBucket == "" && cfg.AITempBucket == "" {
		return &Client{cfg: cfg}, nil // 未配置桶时返回空客户端（开发期可跳过）
	}

	c := &Client{cfg: cfg}

	if cfg.MaterialBucket != "" {
		mUrl, _ := url.Parse(fmt.Sprintf("https://%s.cos.%s.myqcloud.com", cfg.MaterialBucket, cfg.Region))
		mc := cos.NewClient(&cos.BaseURL{BucketURL: mUrl}, &http.Client{
			Transport: &cos.AuthorizationTransport{
				SecretID:  cfg.SecretID,
				SecretKey: cfg.SecretKey,
			},
		})
		c.materialClient = mc
	}

	if cfg.AITempBucket != "" {
		aUrl, _ := url.Parse(fmt.Sprintf("https://%s.cos.%s.myqcloud.com", cfg.AITempBucket, cfg.Region))
		ac := cos.NewClient(&cos.BaseURL{BucketURL: aUrl}, &http.Client{
			Transport: &cos.AuthorizationTransport{
				SecretID:  cfg.SecretID,
				SecretKey: cfg.SecretKey,
			},
		})
		c.aiTempClient = ac
	}

	return c, nil
}

// GetAITempImageURL 生成 AI 临时图片的预签名访问 URL
// D010：图片识别期间前端可访问，有效期过后 URL 失效
func (c *Client) GetAITempImageURL(ctx context.Context, key string) (string, error) {
	if c.aiTempClient == nil {
		return "", fmt.Errorf("AI 临时桶未配置")
	}
	presignedURL, err := c.aiTempClient.Object.GetPresignedURL(ctx, http.MethodGet, key,
		c.cfg.SecretID, c.cfg.SecretKey, time.Duration(c.cfg.AITempURLExpireMinutes)*time.Minute, nil)
	if err != nil {
		return "", fmt.Errorf("生成预签名 URL 失败: %w", err)
	}
	return presignedURL.String(), nil
}

// DeleteAITempImage 删除 AI 临时桶中的图片
// D010：用户确认打卡后前端调用，立即删除原图
func (c *Client) DeleteAITempImage(ctx context.Context, key string) error {
	if c.aiTempClient == nil {
		return fmt.Errorf("AI 临时桶未配置")
	}
	_, err := c.aiTempClient.Object.Delete(ctx, key)
	if err != nil {
		return fmt.Errorf("删除临时图片失败: %w", err)
	}
	return nil
}

// IsAITempConfigured AI 临时桶是否已配置
func (c *Client) IsAITempConfigured() bool {
	return c.aiTempClient != nil
}
