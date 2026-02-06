<template>
    <div class="developer-settings">
        <el-card class="settings-card">
            <template #header>
                <div class="card-header">
                    <el-icon>
                        <Setting />
                    </el-icon>
                    <span>开发者设置</span>
                </div>
            </template>

            <!-- API 配置区域 -->
            <el-form :model="form" label-width="120px" class="config-form">
                <el-form-item label="后端 baseURL">
                    <el-input v-model="form.apiUrl" placeholder="请输入 API baseURL" clearable
                        @keyup.enter="handleSaveConfig">
                        <template #prepend>http://</template>
                    </el-input>
                </el-form-item>

                <el-form-item label="当前配置">
                    <el-tag :type="connectionStatus.type" size="large">{{ currentApiUrl }}</el-tag>
                </el-form-item>

                <!-- <el-form-item label="默认地址">
                    <el-tag type="warning" size="large">{{ DEFAULT_API_URL }}</el-tag>
                </el-form-item> -->

                <el-form-item>
                    <el-space>
                        <el-button type="primary" @click="handleSaveConfig" :loading="saving">
                            <el-icon>
                                <Check />
                            </el-icon>
                            保存并测试连接
                        </el-button>
                        <!-- <el-button @click="handleTestConnection" :loading="testing">
                            <el-icon>
                                <Connection />
                            </el-icon>
                            测试连接
                        </el-button> -->
                        <!-- <el-button @click="handleResetConfig">
                            <el-icon>
                                <RefreshLeft />
                            </el-icon>
                            重置为默认
                        </el-button> -->
                    </el-space>
                </el-form-item>
            </el-form>

            <!-- 连接状态 -->
            <el-divider />
            <div class="connection-status">
                <span class="status-label">连接状态：</span>
                <el-tag :type="connectionStatus.type" v-if="connectionStatus.message">
                    {{ connectionStatus.message }}
                </el-tag>
                <el-tag type="info" v-else>未测试</el-tag>
            </div>
        </el-card>

        <el-card class="settings-card card-spacing">
            <template #header>
                <div class="card-header">
                    <el-icon>
                        <Setting />
                    </el-icon>
                    <span>更新UI测试</span>
                </div>
            </template>

            <div class="mock-update">
                <!-- <div class="mock-update-desc">用于模拟更新流程与弹窗样式展示</div> -->
                <el-button type="primary" @click="handleSimulateUpdate">模拟更新</el-button>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Setting, Check } from '@element-plus/icons-vue'
import { useApiConfig } from '../composables/useApiConfig'

const { apiBaseUrl, setApiBaseUrl, testConnection } = useApiConfig()

const form = reactive({
    apiUrl: ''
})

const currentApiUrl = ref('')
const saving = ref(false)
const testing = ref(false)
const connectionStatus = reactive<{ type: 'success' | 'danger' | 'info' | 'warning'; message: string }>({
    type: 'info',
    message: ''
})

onMounted(() => {
    // 初始化表单值
    const url = apiBaseUrl.value
    // 移除 http:// 前缀用于显示
    form.apiUrl = url.replace(/^https?:\/\//, '')
    currentApiUrl.value = url
})

/**
 * 保存配置
 */
const handleSaveConfig = async () => {
    if (!form.apiUrl.trim()) {
        ElMessage.warning('请输入有效的 API 地址')
        return
    }

    saving.value = true
    try {
        // 确保 URL 格式正确
        let url = form.apiUrl.trim()
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = `http://${url}`
        }

        setApiBaseUrl(url)
        currentApiUrl.value = url
        ElMessage.success('API 地址配置已保存')

        // 保存后自动测试连接
        await handleTestConnection()
    } finally {
        saving.value = false
    }
}

/**
 * 测试连接
 */
const handleTestConnection = async () => {
    testing.value = true
    connectionStatus.message = '正在测试...'
    connectionStatus.type = 'info'

    try {
        let url = form.apiUrl.trim()
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
    } finally {
        testing.value = false
    }
}

/**
 * 模拟更新
 */
const handleSimulateUpdate = () => {
    window.dispatchEvent(new CustomEvent('simulate-update'))
}

/**
 * 重置为默认配置
 */
// const handleResetConfig = () => {
//     resetApiBaseUrl()
//     form.apiUrl = DEFAULT_API_URL.replace(/^https?:\/\//, '')
//     currentApiUrl.value = DEFAULT_API_URL
//     connectionStatus.message = ''
//     ElMessage.info('已重置为默认配置')
// }
</script>

<style scoped>
.developer-settings {
    padding: 20px;
    max-width: 800px;
}

.settings-card {
    border-radius: 8px;
}

.card-spacing {
    margin-top: 16px;
}

.card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
}

.config-form {
    margin-top: 20px;
}

.connection-status {
    display: flex;
    align-items: center;
    gap: 10px;
}

.mock-update {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.mock-update-desc {
    color: #909399;
    font-size: 13px;
}

.status-label {
    font-weight: 500;
    color: #606266;
}

:deep(.el-input-group__prepend) {
    background-color: #f5f7fa;
}
</style>
