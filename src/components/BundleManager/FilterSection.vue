<template>
    <div class="filter-area">
        <div class="filter-item">
            <span class="label">时间筛选：</span>
            <el-date-picker :model-value="dateRange" @update:model-value="$emit('update:dateRange', $event)"
                type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" size="large" />
        </div>
        <div class="filter-item">
            <span class="label">关键词：</span>
            <el-input :model-value="keyword" @update:model-value="$emit('update:keyword', $event)" placeholder="请输入关键词"
                style="width: 200px" size="large" clearable />
        </div>
        <div class="filter-actions">
            <el-button type="primary" :icon="Search" @click="$emit('search')" size="large">搜索</el-button>
            <el-button @click="$emit('reset')" size="large">重置</el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'

defineProps<{
    dateRange: any
    keyword: string
}>()

defineEmits<{
    'update:dateRange': [value: any]
    'update:keyword': [value: string]
    'search': []
    'reset': []
}>()
</script>

<style scoped>
.filter-area {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.filter-item {
    display: flex;
    align-items: center;
}

.filter-item .label {
    margin-right: 10px;
    font-size: 14px;
    color: #606266;
    white-space: nowrap;
}
</style>
