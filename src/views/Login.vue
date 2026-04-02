<template>
  <div class="login-container">
    <div class="login-bg">
      <div class="bg-shape bg-shape-1"></div>
      <div class="bg-shape bg-shape-2"></div>
      <div class="bg-shape bg-shape-3"></div>
    </div>
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <FileTextOutlined />
        </div>
        <h1>工单管理系统</h1>
        <p>Work Order Management System</p>
      </div>
      <a-form
        :model="formState"
        @finish="handleLogin"
        class="login-form"
      >
        <a-form-item
          name="username"
          :rules="[{ required: true, message: '请输入用户名' }]"
        >
          <a-input
            v-model:value="formState.username"
            size="large"
            placeholder="用户名"
          >
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item
          name="password"
          :rules="[{ required: true, message: '请输入密码' }]"
        >
          <a-input-password
            v-model:value="formState.password"
            size="large"
            placeholder="密码"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>
        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            size="large"
            :loading="loading"
            class="login-btn"
          >
            登 录
          </a-button>
        </a-form-item>
      </a-form>
      <div class="login-tip">
        <InfoCircleOutlined /> 管理员账号: admin
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 登录页面组件
 * 功能：管理员/普通用户登录认证
 * 权限：admin -> 管理员，其他 -> 普通用户
 */
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { FileTextOutlined, UserOutlined, LockOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'

// 路由实例，用于登录后跳转
const router = useRouter()
// 加载状态，控制登录按钮loading效果
const loading = ref(false)

// 表单数据，包含用户名和密码
const formState = reactive({
  username: '',
  password: ''
})

/**
 * 处理登录逻辑
 * 1. 判断用户名是否为admin，区分管理员和普通用户
 * 2. 将用户角色和用户名存入sessionStorage
 * 3. 跳转到首页
 */
const handleLogin = () => {
  loading.value = true
  setTimeout(() => {
    // 判断是否为管理员：admin为管理员，其他为普通用户
    const isAdmin = formState.username === 'admin'
    // 存储用户角色到sessionStorage
    sessionStorage.setItem('userRole', isAdmin ? 'admin' : 'user')
    sessionStorage.setItem('username', formState.username)
    // 登录成功后跳转到首页
    router.push('/home')
    loading.value = false
  }, 500)
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.bg-shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
}

.bg-shape-1 {
  width: 600px;
  height: 600px;
  background: #fff;
  top: -200px;
  right: -100px;
  animation: float 8s ease-in-out infinite;
}

.bg-shape-2 {
  width: 400px;
  height: 400px;
  background: #fff;
  bottom: -150px;
  left: -100px;
  animation: float 10s ease-in-out infinite reverse;
}

.bg-shape-3 {
  width: 200px;
  height: 200px;
  background: #fff;
  top: 50%;
  left: 20%;
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-30px) rotate(5deg); }
}

.login-card {
  position: relative;
  z-index: 1;
  width: 420px;
  padding: 48px 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(20px);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  width: 72px;
  height: 72px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  font-size: 32px;
  color: #fff;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.login-header h1 {
  font-size: 26px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.login-header p {
  font-size: 14px;
  color: #8c8c8c;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.login-form :deep(.ant-input-affix-wrapper) {
  border-radius: 12px;
  padding: 12px 16px;
  border: 2px solid #e8e8e8;
  transition: all 0.3s;
}

.login-form :deep(.ant-input-affix-wrapper:hover),
.login-form :deep(.ant-input-affix-wrapper:focus),
.login-form :deep(.ant-input-affix-wrapper-focused) {
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.login-form :deep(.ant-input) {
  font-size: 15px;
}

.login-btn {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
}

.login-tip {
  text-align: center;
  margin-top: 20px;
  padding: 12px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 8px;
  font-size: 13px;
  color: #667eea;
}
</style>
