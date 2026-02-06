<template>
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="400px" :close-on-click-modal="false"
        :show-close="!isDownloading">
        <div v-if="updateStatus === 'checking-for-update'">
            <el-space direction="vertical" fill>
                <el-icon class="is-loading">
                    <Loading />
                </el-icon>
                <span>正在检查更新...</span>
            </el-space>
        </div>

        <div v-else-if="updateStatus === 'update-available'">
            <el-space direction="vertical" fill>
                <p>发现新版本: {{ updateInfo?.version }}</p>
                <p>当前版本: {{ currentVersion }}</p>
                <p>更新将自动下载...</p>
            </el-space>
        </div>

        <div v-else-if="updateStatus === 'download-progress'">
            <el-space direction="vertical" fill style="width: 100%">
                <p>正在下载更新...</p>
                <el-progress :percentage="downloadPercent" />
                <div class="progress-info">
                    <span>{{ formatBytes(progressInfo?.transferred) }} / {{ formatBytes(progressInfo?.total) }}</span>
                    <span>{{ formatSpeed(progressInfo?.bytesPerSecond) }}</span>
                </div>
            </el-space>
        </div>

        <div v-else-if="updateStatus === 'update-not-available'">
            <el-result icon="success" title="已是最新版本">
                <template #sub-title>
                    <p>当前版本: {{ currentVersion }}</p>
                </template>
            </el-result>
        </div>

        <div v-else-if="updateStatus === 'update-error'">
            <el-result icon="error" title="更新失败">
                <template #sub-title>
                    <p>{{ updateInfo?.message }}</p>
                </template>
            </el-result>
        </div>

        <template #footer v-if="showFooter">
            <el-button @click="dialogVisible = false">关闭</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'

const dialogVisible = ref(false)
const updateStatus = ref<string>('')
const updateInfo = ref<any>(null)
const progressInfo = ref<any>(null)
const currentVersion = ref('')

const dialogTitle = computed(() => {
    switch (updateStatus.value) {
        case 'checking-for-update':
            return '检查更新'
        case 'update-available':
            return '发现新版本'
        case 'download-progress':
            return '下载更新'
        case 'update-downloaded':
            return '更新已下载'
        case 'update-not-available':
            return '检查更新'
        case 'update-error':
            return '更新错误'
        default:
            return '应用更新'
    }
})

const isDownloading = computed(() => {
    return updateStatus.value === 'download-progress'
})

const showFooter = computed(() => {
    return ['update-not-available', 'update-error'].includes(updateStatus.value)
})

const downloadPercent = computed(() => {
    return progressInfo.value ? Math.round(progressInfo.value.percent) : 0
})

// 格式化字节
const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 格式化速度
const formatSpeed = (bytesPerSecond: number) => {
    return formatBytes(bytesPerSecond) + '/s'
}

// 监听更新状态
const handleUpdateStatus = (data: any) => {
    updateStatus.value = data.event

    if (data.event === 'update-available') {
        updateInfo.value = data.data
        dialogVisible.value = true
    } else if (data.event === 'download-progress') {
        progressInfo.value = data.data
        dialogVisible.value = true
    } else if (data.event === 'update-not-available') {
        // 静默处理，不显示"已是最新版本"对话框
        // 只有手动检查更新时才显示
        dialogVisible.value = false
    } else if (data.event === 'update-error') {
        updateInfo.value = data.data
        dialogVisible.value = true
    }
}

// 手动检查更新
const checkForUpdates = () => {
    if (window.electron) {
        window.electron.checkForUpdates()
        dialogVisible.value = true
        updateStatus.value = 'checking-for-update'
    }
}

// 暴露方法给父组件调用
defineExpose({
    checkForUpdates
})

onMounted(() => {
    // 获取当前版本号
    currentVersion.value = import.meta.env.VITE_APP_VERSION || '0.0.0'

    // 监听更新事件
    if (window.electron) {
        window.electron.onUpdateStatus(handleUpdateStatus)
    }
})

onUnmounted(() => {
    // 清理监听
    if (window.electron) {
        window.electron.removeUpdateStatusListener()
    }
})
</script>

<style scoped>
.is-loading {
    animation: rotating 2s linear infinite;
    font-size: 24px;
}

@keyframes rotating {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.progress-info {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #666;
}

:deep(.el-space) {
    align-items: center;
}
</style>
