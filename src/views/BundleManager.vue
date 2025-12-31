<template>
    <div class="bundle-manager">
        <el-card class="full-height-card">
            <!-- 筛选区域 -->
            <FilterSection v-model:date-range="filter.dateRange.value" v-model:keyword="filter.keyword.value"
                @search="handleSearch" @reset="handleReset" />

            <!-- 批量操作按钮 -->
            <BatchOperations :has-selection="bundleList.hasSelection.value" @batch-export="handleBatchExport"
                @batch-delete="handleBatchDelete" />

            <!-- 货组表格 -->
            <BundleTable :bundle-list="bundleList.bundleList.value" :loading="bundleList.loading.value"
                :current-page="bundleList.currentPage.value" :page-size="bundleList.pageSize.value"
                :total="bundleList.total.value" @delete="handleDelete" @export="handleExport"
                @selection-change="bundleList.handleSelectionChange" @update:current-page="handlePageChange"
                @update:page-size="handlePageSizeChange" />
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onActivated } from 'vue'
import FilterSection from '@/components/BundleManager/FilterSection.vue'
import BatchOperations from '@/components/BundleManager/BatchOperations.vue'
import BundleTable from '@/components/BundleManager/BundleTable.vue'
import { useBundleFilter, useBundleList, useBundleOperations } from '@/composables/BundleManager'

// 筛选
const filter = useBundleFilter()

// 列表
const bundleList = useBundleList()

// 操作
const operations = useBundleOperations()

// 搜索
const handleSearch = () => {
    bundleList.currentPage.value = 1
    bundleList.fetchBundles(filter.getFilters())
}

// 重置
const handleReset = () => {
    filter.resetFilter()
    bundleList.currentPage.value = 1
    bundleList.fetchBundles()
}

// 翻页
const handlePageChange = (page: number) => {
    bundleList.currentPage.value = page
    bundleList.fetchBundles(filter.getFilters())
}

// 处理每页大小变化
const handlePageSizeChange = (newPageSize: number) => {
    bundleList.pageSize.value = newPageSize
    bundleList.currentPage.value = 1
    bundleList.fetchBundles(filter.getFilters())
}

// 删除单个货组
const handleDelete = (row: any) => {
    operations.handleDelete(row, () => {
        bundleList.fetchBundles(filter.getFilters())
    })
}

// 导出单个货组
const handleExport = (row: any) => {
    operations.handleExport(row)
}

// 批量导出
const handleBatchExport = () => {
    operations.handleBatchExport(bundleList.selectedBundles.value)
}

// 批量删除
const handleBatchDelete = () => {
    operations.handleBatchDelete(bundleList.selectedBundles.value, () => {
        bundleList.fetchBundles(filter.getFilters())
    })
}

onMounted(() => {
    bundleList.fetchBundles()
})

// 页面激活时刷新列表（从其他页面返回时，如从生成页面跳转过来）
onActivated(() => {
    bundleList.fetchBundles(filter.getFilters())
})
</script>

<style scoped>
.bundle-manager {
    height: calc(100vh - 80px);
    padding: 20px;
}

.full-height-card {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.full-height-card :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* 模块标题 */
:deep(.el-card__header) span {
    font-size: 20px;
    font-weight: bold;
}
</style>
