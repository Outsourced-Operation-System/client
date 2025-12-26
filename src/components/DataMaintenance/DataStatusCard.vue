<template>
    <el-card class="box-card status-card mb-20">
        <template #header>
            <div class="card-header">
                <span>数据状态</span>
            </div>
        </template>
        <div class="data-status">
            <div class="status-item">
                <span class="label">当前商品数量：</span>
                <span class="value">{{ stats.count }} 个</span>
            </div>
            <div class="status-item">
                <span class="label">货品最后更新时间：</span>
                <span class="value">{{ stats.goodsLastUpdate }}</span>
            </div>
            <div class="status-item">
                <span class="label">库存最后更新时间：</span>
                <span class="value">{{ stats.inventoryLastUpdate }}</span>
            </div>
            <div class="status-item">
                <span class="label">标签最后更新时间：</span>
                <span class="value">{{ stats.labelLastUpdate }}</span>
            </div>
            <div class="actions mt-20">
                <div class="button-row">
                    <el-button type="primary" :icon="Download" @click="emit('exportProducts')" size="large"
                        class="action-button">导出货品表</el-button>
                    <el-button type="primary" :icon="Download" @click="emit('exportInventory')" size="large"
                        class="action-button">导出库存表</el-button>
                </div>
                <div class="button-row">
                    <el-button type="danger" @click="emit('clearProducts')" size="large"
                        class="action-button">删除货品数据</el-button>
                    <el-button type="danger" @click="emit('clearInventory')" size="large"
                        class="action-button">删除库存数据</el-button>
                </div>
            </div>
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { Download } from '@element-plus/icons-vue'
import type { DataStats } from '@/composables/DataMaintenance'

interface Props {
    stats: DataStats
}

interface Emits {
    (e: 'exportProducts'): void
    (e: 'exportInventory'): void
    (e: 'clearProducts'): void
    (e: 'clearInventory'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<style scoped>
.mb-20 {
    margin-bottom: 20px;
}

.mt-20 {
    margin-top: 20px;
}

.data-status {
    padding: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.status-item {
    margin-bottom: 15px;
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

.actions {
    display: flex;
    flex-direction: column;
    width: 60%;
    gap: 15px;
    margin: 20px 0 0;
}

.button-row {
    display: flex;
    justify-content: flex-start;
    gap: 10px;
}

.action-button {
    flex: 1;
    min-width: 100px;
}

.status-card {
    flex: 5;
    display: flex;
    flex-direction: column;
}

.status-card :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.card-header span {
    font-size: 20px;
    font-weight: bold;
}
</style>
