package ai

import (
	"context"
	"errors"

	openai "github.com/sashabaranov/go-openai"
)

// Client 封装 AI 调用客户端
// 屏蔽 openai SDK 细节，对外暴露 Chat / Recognize 等业务方法。
// 真实 API Key 仅存在于 ClientConfig，禁止打印到日志。
type Client struct {
	cfg    ClientConfig
	client *openai.Client
}

// NewClient 构造 AI 客户端
func NewClient(cfg ClientConfig) *Client {
	ocCfg := openai.DefaultConfig(cfg.APIKey)
	if cfg.BaseURL != "" {
		ocCfg.BaseURL = cfg.BaseURL
	}
	return &Client{
		cfg:    cfg,
		client: openai.NewClientWithConfig(ocCfg),
	}
}

// Chat 文本对话（非流式）
// Stage 1 骨架，后续接入 proto 定义的 AiRequest/AiResponse。
func (c *Client) Chat(ctx context.Context, prompt string) (string, error) {
	resp, err := c.client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model:       c.cfg.Model,
		Temperature: c.cfg.Temperature,
		MaxTokens:   c.cfg.MaxTokens,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: prompt},
		},
	})
	if err != nil {
		return "", err
	}
	if len(resp.Choices) == 0 {
		return "", errors.New("AI 返回空结果")
	}
	return resp.Choices[0].Message.Content, nil
}

// RecognizeFood 食物识别（视觉模型，Stage 1 骨架）
// 后续接入 proto FoodRecognizeRequest，图片以 base64 / URL 形式传入 VLM。
func (c *Client) RecognizeFood(ctx context.Context, imageURL string, prompt string) (string, error) {
	resp, err := c.client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model:       c.cfg.Model,
		Temperature: c.cfg.Temperature,
		MaxTokens:   c.cfg.MaxTokens,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleUser, Content: prompt},
			{Role: openai.ChatMessageRoleUser, Content: imageURL},
		},
	})
	if err != nil {
		return "", err
	}
	if len(resp.Choices) == 0 {
		return "", errors.New("AI 识别返回空结果")
	}
	return resp.Choices[0].Message.Content, nil
}
