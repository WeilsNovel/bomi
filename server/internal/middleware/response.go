package middleware

import (
	"net/http"
	"time"

	"github.com/WeilsNovel/bomi/server/internal/constants"
	"github.com/gin-gonic/gin"
)

// BaseApiResponse 统一响应结构（对应 proto/bomi/model/api.proto BaseApiResponse）
// 所有 handler 必须通过 OK / Fail 返回，禁止直接 c.JSON 裸数据。
type BaseApiResponse struct {
	Code      int         `json:"code"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data,omitempty"`
	TraceID   string      `json:"traceId,omitempty"`
	Timestamp int64       `json:"timestamp,omitempty"`
}

// OK 成功响应
func OK(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, BaseApiResponse{
		Code:      constants.Success,
		Message:   constants.GetMessage(constants.Success),
		Data:      data,
		TraceID:   c.GetString("traceId"),
		Timestamp: time.Now().UnixMilli(),
	})
}

// Fail 失败响应（业务码非 0）
func Fail(c *gin.Context, code int, msgs ...string) {
	msg := constants.GetMessage(code)
	if len(msgs) > 0 && msgs[0] != "" {
		msg = msgs[0]
	}
	c.JSON(http.StatusOK, BaseApiResponse{
		Code:      code,
		Message:   msg,
		TraceID:   c.GetString("traceId"),
		Timestamp: time.Now().UnixMilli(),
	})
}

// FailWithHTTP 失败响应同时指定 HTTP 状态码（用于鉴权类错误）
func FailWithHTTP(c *gin.Context, httpCode, bizCode int, msgs ...string) {
	msg := constants.GetMessage(bizCode)
	if len(msgs) > 0 && msgs[0] != "" {
		msg = msgs[0]
	}
	c.JSON(httpCode, BaseApiResponse{
		Code:      bizCode,
		Message:   msg,
		TraceID:   c.GetString("traceId"),
		Timestamp: time.Now().UnixMilli(),
	})
}
