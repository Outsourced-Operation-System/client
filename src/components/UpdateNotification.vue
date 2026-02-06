<template>
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="420px" :close-on-click-modal="false"
        :close-on-press-escape="!isDownloading" :show-close="!isDownloading" @close="handleDialogClose">
        <!-- 检查中 -->
        <div v-if="updateStatus === 'checking-for-update'" class="update-content">
            <el-icon class="is-loading status-icon">
                <Loading />
            </el-icon>
            <p class="status-text">正在检查更新...</p>
        </div>

        <!-- 发现新版本 -->
        <div v-else-if="updateStatus === 'update-available'" class="update-content">
            <el-icon class="status-icon available-icon">
                <Upload />
            </el-icon>
            <p class="version-text">发现新版本: <strong>{{ updateInfo?.version }}</strong></p>
            <p class="current-version">当前版本: {{ currentVersion }}</p>
        </div>

        <!-- 下载进度 -->
        <div v-else-if="updateStatus === 'download-progress'" class="update-content">
            <p class="status-text">正在下载更新...</p>
            <el-progress :percentage="downloadPercent" :stroke-width="18" style="width: 100%; margin: 12px 0;" />
            <div class="progress-info">
                <span>{{ formatBytes(progressInfo?.transferred) }} / {{ formatBytes(progressInfo?.total) }}</span>
                <span>{{ formatSpeed(progressInfo?.bytesPerSecond) }}</span>
            </div>
        </div>

        <!-- 下载完成 -->
        <div v-else-if="updateStatus === 'update-downloaded'" class="update-content">
            <el-icon class="status-icon success-icon">
                <CircleCheckFilled />
            </el-icon>
            <p class="status-text">新版本已下载完成</p>
            <p class="current-version">重启应用以完成更新</p>
        </div>

        <!-- 已是最新版本 -->
        <div v-else-if="updateStatus === 'update-not-available'" class="update-content">
            <el-result icon="success" title="已是最新版本">
                <template #sub-title>
                    <p>当前版本: {{ currentVersion }}</p>
                </template>
            </el-result>
        </div>

        <!-- 更新错误 -->
        <div v-else-if="updateStatus === 'update-error'" class="update-content">
            <el-result icon="error" title="更新失败">
                <template #sub-title>
                    <p>{{ updateInfo?.message }}</p>
                </template>
            </el-result>
        </div>

        <template #footer>
            <!-- 发现新版本：更新 / 稍后 -->
            <div v-if="updateStatus === 'update-available'" class="dialog-footer">
                <el-button @click="handleLater">稍后</el-button>
                <el-button type="primary" @click="handleStartDownload">
                    <el-icon>
                        <Download />
                    </el-icon>
                    更新
                </el-button>
            </div>
            <!-- 下载中：不可操作 -->
            <div v-else-if="updateStatus === 'download-progress'" class="dialog-footer">
                <el-button disabled>下载中...</el-button>
            </div>
            <!-- 下载完成：立即重启 / 稍后 -->
            <div v-else-if="updateStatus === 'update-downloaded'" class="dialog-footer">
                <!-- <el-button @click="handleLater">稍后</el-button> -->
                <el-button type="primary" @click="handleQuitAndInstall">
                    <el-icon>
                        <RefreshRight />
                    </el-icon>
                    立即重启
                </el-button>
            </div>
            <!-- 其他状态：关闭 -->
            <div v-else-if="showCloseFooter" class="dialog-footer">
                <el-button @click="dialogVisible = false">关闭</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Loading, Upload, CircleCheckFilled, Download, RefreshRight } from '@element-plus/icons-vue'

const dialogVisible = ref(false)
const updateStatus = ref<string>('')
const updateInfo = ref<any>(null)
const progressInfo = ref<any>(null)
const currentVersion = ref('')
const isMockMode = ref(false)
let mockTimer: ReturnType<typeof setInterval> | null = null

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

const showCloseFooter = computed(() => {
    return ['update-not-available', 'update-error', 'checking-for-update'].includes(updateStatus.value)
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

/** 关闭弹窗（X 按钮或 ESC） */
const handleDialogClose = () => {
    handleLater()
}

/** 用户点击"稍后" */
const handleLater = () => {
    dialogVisible.value = false
    cleanupMock()
}

/** 用户点击"更新"，开始下载 */
const handleStartDownload = () => {
    if (isMockMode.value) {
        startMockDownload()
    } else {
        window.electron?.downloadUpdate()
    }
}

/** 下载完成后用户点击"立即重启" */
const handleQuitAndInstall = () => {
    if (isMockMode.value) {
        dialogVisible.value = false
        cleanupMock()
    } else {
        window.electron?.quitAndInstall()
    }
}

// ===================== 真实更新逻辑 =====================

const handleUpdateStatus = (data: any) => {
    if (isMockMode.value) return

    updateStatus.value = data.event

    if (data.event === 'update-available') {
        updateInfo.value = data.data
        dialogVisible.value = true
    } else if (data.event === 'download-progress') {
        progressInfo.value = data.data
        dialogVisible.value = true
    } else if (data.event === 'update-downloaded') {
        updateInfo.value = data.data
        dialogVisible.value = true
    } else if (data.event === 'update-not-available') {
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

// ===================== 模拟更新逻辑 =====================

const cleanupMock = () => {
    if (mockTimer) {
        clearInterval(mockTimer)
        mockTimer = null
    }
    isMockMode.value = false
}

/** 启动模拟更新流程 */
const simulateUpdate = () => {
    isMockMode.value = true
    progressInfo.value = null
    updateInfo.value = null
    dialogVisible.value = true
    updateStatus.value = 'checking-for-update'

    setTimeout(() => {
        if (!isMockMode.value) return
        updateStatus.value = 'update-available'
        updateInfo.value = {
            version: '99.0.0',
            releaseNotes: '这是一个模拟更新版本'
        }
    }, 1500)
}

/** 模拟下载进度 */
const startMockDownload = () => {
    updateStatus.value = 'download-progress'
    const totalSize = 68 * 1024 * 1024
    let transferred = 0

    progressInfo.value = {
        percent: 0,
        transferred: 0,
        total: totalSize,
        bytesPerSecond: 0
    }

    mockTimer = setInterval(() => {
        if (!isMockMode.value) return

        const speed = (2 + Math.random() * 4) * 1024 * 1024
        transferred = Math.min(transferred + speed * 0.1, totalSize)
        const percent = (transferred / totalSize) * 100

        progressInfo.value = {
            percent,
            transferred,
            total: totalSize,
            bytesPerSecond: speed
        }

        if (transferred >= totalSize) {
            if (mockTimer) {
                clearInterval(mockTimer)
                mockTimer = null
            }
            updateStatus.value = 'update-downloaded'
        }
    }, 100)
}

const handleSimulateEvent = () => {
    simulateUpdate()
}

// 暴露方法给父组件调用
defineExpose({
    checkForUpdates,
    simulateUpdate
})

onMounted(() => {
    currentVersion.value = import.meta.env.VITE_APP_VERSION || '0.0.0'

    if (window.electron) {
        window.electron.onUpdateStatus(handleUpdateStatus)
    }

    window.addEventListener('simulate-update', handleSimulateEvent as EventListener)
})

onUnmounted(() => {
    cleanupMock()
    if (window.electron) {
        window.electron.removeUpdateStatusListener()
    }

    window.removeEventListener('simulate-update', handleSimulateEvent as EventListener)
})
</script>

<style scoped>
.update-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 0;
}

.status-icon {
    font-size: 48px;
    margin-bottom: 12px;
}

.available-icon {
    color: #409eff;
}

.success-icon {
    color: #67c23a;
}

.status-text {
    font-size: 15px;
    color: #303133;
    margin: 4px 0;
}

.version-text {
    font-size: 16px;
    color: #303133;
    margin: 4px 0;
}

.current-version {
    font-size: 13px;
    color: #909399;
    margin: 2px 0;
}

.is-loading {
    animation: rotating 2s linear infinite;
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
    width: 100%;
    font-size: 12px;
    color: #909399;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}
</style>
