<template>
    <el-card class="box-card backup-card mb-20">
        <template #header>
            <div class="card-header">
                <span>数据备份</span>
            </div>
        </template>
        <div class="backup-section">
            <div class="backup-desc">
                定期备份数据，确保数据安全
            </div>
            <div class="backup-status">
                <div class="status-item">
                    <span class="label">最新备份时间：</span>
                    <span class="value">{{ lastBackupTime }}</span>
                </div>
            </div>
            <div class="backup-actions">
                <el-button type="primary" :icon="Download" size="large" class="backup-button" @click="emit('backup')">
                    备份数据
                </el-button>
                <el-button type="info" :icon="FolderOpened" size="large" class="backup-button"
                    @click="emit('showBackupList')">
                    查看备份
                </el-button>
            </div>
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { Download, FolderOpened } from '@element-plus/icons-vue'

interface Props {
    lastBackupTime: string
}

interface Emits {
    (e: 'backup'): void
    (e: 'showBackupList'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<style scoped>
.mb-20 {
    margin-bottom: 20px;
}

.backup-card {
    flex: 3.4;
    display: flex;
    flex-direction: column;
}

.backup-card :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.backup-section {
    padding: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
}

.backup-desc {
    color: #909399;
    font-size: 14px;
    margin-bottom: 20px;
    text-align: left;
}

.backup-status {
    margin-bottom: 20px;
    width: 100%;
    display: flex;
    justify-content: flex-start;
}

.status-item {
    font-size: 14px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
}

.status-item .label {
    color: #909399;
    width: 160px;
    text-align: left;
}

.status-item .value {
    font-weight: bold;
    color: #303133;
    width: 150px;
    text-align: left;
}

.backup-actions {
    display: flex;
    justify-content: flex-start;
    gap: 10px;
    width: 60%;
}

.backup-button {
    min-width: 140px;
    flex: 1;
}

.card-header span {
    font-size: 20px;
    font-weight: bold;
}
</style>
