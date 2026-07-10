package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/WeilsNovel/bomi/server/internal/constants"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// JWTAuth JWT 鉴权中间件
// 从 Authorization: Bearer <token> 提取并校验，通过后将 userId / openid 注入 context。
func JWTAuth(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if auth == "" {
			FailWithHTTP(c, http.StatusUnauthorized, constants.Unauthorized)
			c.Abort()
			return
		}
		parts := strings.SplitN(auth, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || parts[1] == "" {
			FailWithHTTP(c, http.StatusUnauthorized, constants.Unauthorized)
			c.Abort()
			return
		}

		tokenStr := parts[1]
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrTokenSignatureInvalid
			}
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			FailWithHTTP(c, http.StatusUnauthorized, constants.TokenExpired, "登录已过期，请重新登录")
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			FailWithHTTP(c, http.StatusUnauthorized, constants.TokenExpired)
			c.Abort()
			return
		}

		// 注入用户标识到 context，下游 handler 通过 c.Get 即可读取
		if uid, ok := claims["userId"].(float64); ok {
			c.Set("userId", int64(uid))
		}
		if openid, ok := claims["openid"].(string); ok {
			c.Set("openid", openid)
		}
		c.Next()
	}
}

// GenerateToken 生成 JWT（Stage 1 骨架，后续 auth handler 调用）
func GenerateToken(secret string, userId int64, openid string, expireHours int) (string, error) {
	claims := jwt.MapClaims{
		"userId": userId,
		"openid": openid,
		"exp":    time.Now().Add(time.Duration(expireHours) * time.Hour).Unix(),
		"iat":    time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}
