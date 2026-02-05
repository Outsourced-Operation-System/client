<template>
    <div class="login-container">
        <!-- 窗口控制栏（仅 Electron 环境显示） -->
        <div class="window-controls" v-if="isElectron">
            <div class="drag-area"></div>
            <div class="control-buttons">
                <button class="control-btn minimize-btn" @click="minimizeWindow">
                    <el-icon>
                        <Minus />
                    </el-icon>
                </button>
                <button class="control-btn close-btn" @click="closeWindow">
                    <el-icon>
                        <Close />
                    </el-icon>
                </button>
            </div>
        </div>

        <!-- 头部区域：包含 Logo 和 Tabs -->
        <div class="login-header" v-if="!showSettings">
            <div class="logo-area">
                <div class="logo-icon">
                    <el-image :src="logoImage" fit="contain" />
                </div>
                <div class="app-info">
                    <h1 class="app-title">澜斯代运营系统</h1>
                </div>
            </div>
        </div>

        <!-- 表单区域 -->
        <div class="login-body">
            <!-- 登录表单 -->
            <div class="form-container" v-if="!showSettings">
                <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" @submit.prevent="handleLogin"
                    class="custom-form" hide-required-asterisk>
                    <el-form-item prop="username">
                        <el-input v-model="loginForm.username" placeholder="请输入用户名" :prefix-icon="User" size="large" />
                    </el-form-item>
                    <el-form-item prop="password">
                        <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" :prefix-icon="Lock"
                            size="large" show-password @keyup.enter="handleLogin" />
                    </el-form-item>
                    <div class="form-actions">
                        <el-button size="large" :loading="loading" class="submit-btn brand-btn" @click="handleLogin"
                            round>
                            登 录
                        </el-button>

                    </div>
                </el-form>

                <!-- 后端设置入口 -->
                <div class="settings-link" @click="openSettings">
                    网络设置
                </div>
            </div>

            <!-- 后端设置页面 -->
            <div class="settings-container" v-else>
                <div class="settings-header">
                    <el-button link @click="backToLogin" class="back-btn">
                        <el-icon>
                            <ArrowLeft />
                        </el-icon>
                        返回登录
                    </el-button>
                    <span class="settings-title">后端IP设置</span>
                </div>

                <el-form :model="apiForm" class="custom-form api-form">
                    <el-form-item>
                        <el-input v-model="apiForm.apiUrl" placeholder="请输入后端IP地址" clearable
                            @keyup.enter="handleSaveApiConfig">
                            <template #prepend>http://</template>
                        </el-input>
                    </el-form-item>

                    <el-form-item>
                        <el-space :size="12" style="width: 100%">
                            <el-button @click="handleResetConfig" round class="reset-btn">
                                <el-icon>
                                    <RefreshLeft />
                                </el-icon>
                                恢复默认
                            </el-button>
                            <el-button type="primary" @click="handleSaveApiConfig" :loading="saving" round
                                class="save-btn">
                                <el-icon>
                                    <Check />
                                </el-icon>
                                保存并测试
                            </el-button>
                        </el-space>
                    </el-form-item>

                    <el-form-item v-if="connectionStatus.message" class="status-item">
                        <el-tag :type="connectionStatus.type">
                            {{ connectionStatus.message }}
                        </el-tag>
                    </el-form-item>
                </el-form>
            </div>
        </div>

        <!-- 底部信息 -->
        <div class="login-footer">
            v{{ appVersion }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, Close, Minus, ArrowLeft, Check, RefreshLeft } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { login } from '../api/auth'
import { useApiConfig } from '../composables/useApiConfig'
import logoImage from '../assets/lanceec.png'

const DEFAULT_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
const router = useRouter()
const authStore = useAuthStore()
const { apiBaseUrl, setApiBaseUrl, testConnection } = useApiConfig()
const appVersion = __APP_VERSION__

// 检测是否在 Electron 环境
const isElectron = computed(() => !!window.electronAPI)

const loading = ref(false)

// 页面切换：登录 / 后端设置
const showSettings = ref(false)

// 后端设置相关
const apiForm = reactive({
    apiUrl: ''
})
const saving = ref(false)
const connectionStatus = reactive<{ type: 'success' | 'danger' | 'info' | 'warning'; message: string }>({
    type: 'info',
    message: ''
})

// 初始化API配置
const initApiForm = () => {
    const url = apiBaseUrl.value
    apiForm.apiUrl = url.replace(/^https?:\/\//, '')
}

// 打开设置页面
const openSettings = () => {
    initApiForm()
    showSettings.value = true
}

// 返回登录页面
const backToLogin = () => {
    showSettings.value = false
    connectionStatus.message = ''
}

// 保存API配置
const handleSaveApiConfig = async () => {
    if (!apiForm.apiUrl.trim()) {
        ElMessage.warning('请输入有效的 API 地址')
        return
    }

    saving.value = true
    try {
        let url = apiForm.apiUrl.trim()
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = `http://${url}`
        }

        setApiBaseUrl(url)
        ElMessage.success('API 地址配置已保存')

        // 保存后自动测试连接
        await handleTestApiConnection()
    } finally {
        saving.value = false
    }
}

// 测试API连接
const handleTestApiConnection = async () => {
    connectionStatus.message = '正在测试...'
    connectionStatus.type = 'info'

    try {
        let url = apiForm.apiUrl.trim()
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = `http://${url}`
        }

        const result = await testConnection(url)
        connectionStatus.message = result.message
        connectionStatus.type = result.success ? 'success' : 'danger'

        if (result.success) {
            ElMessage.success('连接测试成功')
        } else {
            ElMessage.warning(result.message)
        }
    } catch (error: any) {
        connectionStatus.message = `测试失败: ${error.message}`
        connectionStatus.type = 'danger'
        ElMessage.error('连接测试失败')
    }
}

// 恢复默认设置
const handleResetConfig = () => {
    apiForm.apiUrl = DEFAULT_API_URL
    connectionStatus.message = ''
    ElMessage.info('已恢复为默认配置')
}

// 窗口控制
const minimizeWindow = () => {
    window.electronAPI?.minimizeWindow()
}

const closeWindow = () => {
    window.close()
}

// 登录表单
const loginFormRef = ref<FormInstance>()
const loginForm = reactive({
    username: '',
    password: '',
})

const loginRules: FormRules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
    ],
}

// 处理登录
const handleLogin = async () => {
    if (!loginFormRef.value) return

    await loginFormRef.value.validate(async (valid) => {
        if (!valid) return

        loading.value = true
        try {
            const response = await login({
                username: loginForm.username,
                password: loginForm.password,
            })

            // 保存认证信息
            authStore.setAuth(response)

            ElMessage.success('登录成功')

            // 通知 Electron 主进程登录成功，切换到主窗口
            if (window.electronAPI?.loginSuccess) {
                window.electronAPI.loginSuccess()
            } else {
                // 非 Electron 环境，直接跳转
                router.push('/')
            }
        } catch (error: any) {
            ElMessage.error(error.message || '登录失败')
        } finally {
            loading.value = false
        }
    })
}
</script>

<style scoped>
.login-container {
    height: 100vh;
    width: 100%;
    display: flex;
    flex-direction: column;
    background: #fff;
    overflow: hidden;
    border-radius: 18px;
}

/* 窗口控制栏 */
.window-controls {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 32px;
    display: flex;
    justify-content: space-between;
    -webkit-app-region: drag;
    z-index: 20;
}

.drag-area {
    flex: 1;
}

.control-buttons {
    display: flex;
    -webkit-app-region: no-drag;
}

.control-btn {
    width: 46px;
    height: 32px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.control-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

.close-btn:hover {
    background: #e81123;
}

/* 头部 Header */
/* .login-header {
    height: 214px;
    background: linear-gradient(135deg, #1890ff 0%, #001529 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 10px;
} */
.login-header {
    height: 214px;
    background: linear-gradient(135deg,
            #10406B 0%,
            #6F86A3 55%,
            #9CADC0 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 10px;
}




.logo-area {
    text-align: center;
    color: #fff;
}

.logo-icon {
    width: 90px;
    height: 90px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 12px;
}

.app-title {
    margin: 0;
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.5px;
}

.app-subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    opacity: 0.8;
}

/* 主体区域 */
.login-body {
    flex: 1;
    background: #fff;
    border-radius: 20px 20px 0 0;
    margin-top: -20px;
    padding: 60px 40px 0;
    position: relative;
    z-index: 10;
}

/* 表单样式 */
.custom-form :deep(.el-input__wrapper) {
    background: #f5f7fa;
    border: none;
    box-shadow: none;
    border-radius: 8px;
    padding: 1px 15px;
    transition: all 0.3s;
}

.custom-form :deep(.el-input__wrapper:hover) {
    background: #eef0f4;
}

.custom-form :deep(.el-input__wrapper.is-focus) {
    background: #fff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.custom-form :deep(.el-input__inner) {
    height: 42px;
    color: #303133;
}

.custom-form :deep(.el-form-item) {
    margin-bottom: 24px;
}

.submit-btn {
    width: 100%;
    height: 44px;
    font-size: 16px;
    font-weight: 500;
    letter-spacing: 4px;
    background: #1890ff;
    border: none;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
    margin-top: 8px;
    transition: all 0.3s;
}

.submit-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(24, 144, 255, 0.4);
    background: #40a9ff;
}

.submit-btn:active {
    transform: translateY(0);
}

/* 后端设置入口链接 */
.settings-link {
    text-align: center;
    margin-top: 20px;
    font-size: 12px;
    color: #909399;
    cursor: pointer;
    transition: color 0.3s;
}

.settings-link:hover {
    color: #1890ff;
}

/* 设置页面样式 */
.settings-container {
    padding: 0 10px;
}

.settings-header {
    display: flex;
    align-items: center;
    margin-bottom: 30px;
    position: relative;
}

.back-btn {
    color: #1890ff;
    font-size: 14px;
}

.settings-title {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: 16px;
    font-weight: 500;
    color: #303133;
}

.api-form {
    margin-top: 20px;
}

.api-form :deep(.el-input-group__prepend) {
    background-color: #f5f7fa;
}

.api-form .save-btn {
    flex: 1;
}

.api-form .reset-btn {
    flex: 1;
    background: #f5f5f5;
    color: #606266;
    border: 1px solid #dcdfe6;
}

.api-form .reset-btn:hover {
    background: #e6e6e6;
    border-color: #c0c4cc;
}

.api-form .status-item {
    text-align: center;
}

.login-footer {
    text-align: center;
    padding: 15px;
    font-size: 12px;
    color: #909399;
}

.brand-btn {
    width: 100%;
    height: 44px;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 4px;

    color: #ffffff;
    border: none;

    background: linear-gradient(135deg,
            #10406B 0%,
            #6F86A3 55%,
            #9CADC0 100%);

    box-shadow:
        0 6px 16px rgba(16, 64, 107, 0.35),
        inset 0 1px 0 rgba(255, 255, 255, 0.25);

    transition: all 0.25s ease;
}

.brand-btn:hover {
    transform: translateY(-1px);
    box-shadow:
        0 10px 22px rgba(16, 64, 107, 0.45),
        inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.brand-btn:active {
    transform: translateY(0);
    box-shadow:
        0 4px 10px rgba(16, 64, 107, 0.35),
        inset 0 3px 6px rgba(0, 0, 0, 0.25);
}
</style>
