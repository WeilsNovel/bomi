<!--
  管理员登录页
  - 表单：用户名 + 密码
  - 提交：调用 userStore.login，成功后跳转 redirect 或仪表盘
  - 失败：ElMessage 提示（文案来自 ERROR_MESSAGE_MAP，已在 request 抛出）
-->
<template>
  <div class="login-page">
    <el-card class="login-card" shadow="always">
      <template #header>
        <div class="login-card__title">{{ ENV_CONFIG.appTitle }}</div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <el-form-item :label="USERNAME_LABEL" prop="username">
          <el-input
            v-model="form.username"
            :placeholder="USERNAME_PLACEHOLDER"
            clearable
          />
        </el-form-item>
        <el-form-item :label="PASSWORD_LABEL" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            :placeholder="PASSWORD_PLACEHOLDER"
            show-password
            @keyup.enter="handleSubmit"
          />
        </el-form-item>
        <el-button
          type="primary"
          :loading="loading"
          class="login-card__submit"
          @click="handleSubmit"
        >
          {{ DEFAULT_TEXT_CONFIG.LOGIN_TEXT }}
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { useUserStore } from '@/store/user';
import { ENV_CONFIG } from '@/config/env';
import { DEFAULT_TEXT_CONFIG, ROUTE_PATH_CONFIG } from '@/config/constants';
import { BizError } from '@/core/request';

/** 页面私有文案参数（避免硬编码） */
const USERNAME_LABEL = '账号';
const USERNAME_PLACEHOLDER = '请输入管理员账号';
const PASSWORD_LABEL = '密码';
const PASSWORD_PLACEHOLDER = '请输入密码';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({
  username: '',
  password: '',
});

const rules: FormRules = {
  username: [{ required: true, message: USERNAME_PLACEHOLDER, trigger: 'blur' }],
  password: [{ required: true, message: PASSWORD_PLACEHOLDER, trigger: 'blur' }],
};

/** 提交登录 */
async function handleSubmit(): Promise<void> {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    // 校验未通过，el-form 已回显错误
    return;
  }

  loading.value = true;
  try {
    await userStore.login({ username: form.username, password: form.password });
    const redirect = (route.query.redirect as string) ?? ROUTE_PATH_CONFIG.DASHBOARD;
    router.push(redirect);
  } catch (error) {
    // BizError 已携带 ERROR_MESSAGE_MAP 文案；其他异常给兜底提示
    const message = error instanceof BizError ? error.message : '登录失败，请重试';
    ElMessage.error(message);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: var(--el-bg-color-page);
}

.login-card {
  width: 400px;
}

.login-card__title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}

.login-card__submit {
  width: 100%;
}
</style>
