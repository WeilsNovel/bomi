package ai

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/WeilsNovel/bomi/server/internal/constants"
)

// RetryConfig 重试配置
type RetryConfig struct {
	MaxRetries int
	Delays     []time.Duration // 每次重试的退避时长，长度应 >= MaxRetries
}

// DefaultRetryConfig 默认重试策略：2 次重试，退避 1s/2s
func DefaultRetryConfig(maxRetries int) RetryConfig {
	if maxRetries < 0 {
		maxRetries = 0
	}
	delays := make([]time.Duration, maxRetries)
	for i := 0; i < maxRetries; i++ {
		delays[i] = time.Duration(1<<uint(i)) * time.Second // 1s, 2s, 4s...
	}
	return RetryConfig{MaxRetries: maxRetries, Delays: delays}
}

// RetryFunc 可重试的函数签名
type RetryFunc func(ctx context.Context) error

// RetryWithBackoff 带退避的重试执行器
// 仅对可重试错误（超时/临时性错误）重试，业务错误直接返回。
func RetryWithBackoff(ctx context.Context, cfg RetryConfig, fn RetryFunc) error {
	var lastErr error
	for attempt := 0; attempt <= cfg.MaxRetries; attempt++ {
		if err := fn(ctx); err != nil {
			lastErr = err
			// 判断是否可重试：超时类错误重试，其他直接返回
			if !isRetryable(err) {
				return err
			}
			if attempt < cfg.MaxRetries && attempt < len(cfg.Delays) {
				select {
				case <-ctx.Done():
					return ctx.Err()
				case <-time.After(cfg.Delays[attempt]):
				}
			}
			continue
		}
		return nil
	}
	return fmt.Errorf("%w: %v", errAIAttemptExhausted, lastErr)
}

// 可重试错误判定（简化版，后续按 openai SDK 错误类型细化）
func isRetryable(err error) bool {
	if err == nil {
		return false
	}
	// context 超时 / 取消视为可重试（对应 AI_TIMEOUT 50023）
	if errors.Is(err, context.DeadlineExceeded) {
		return true
	}
	return false
}

// 业务错误包装，供 handler 映射到错误码
var (
	errAIAttemptExhausted = aiError{code: constants.AIRecognizeFailed, msg: "AI 调用重试耗尽"}
)

type aiError struct {
	code int
	msg  string
}

func (e aiError) Error() string { return e.msg }
func (e aiError) Code() int     { return e.code }

// WrapAIError 将底层错误包装为带错误码的业务错误
func WrapAIError(code int, err error) error {
	return aiError{code: code, msg: err.Error()}
}
