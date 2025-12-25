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
                @delete="handleDelete" @export="handleExport" @selection-change="bundleList.handleSelectionChange" />

            <!-- 分页 -->
            <div class="pagination-container">
                <el-pagination background layout="prev, pager, next, total" :current-page="bundleList.currentPage.value"
                    :page-size="bundleList.pageSize.value" :total="bundleList.total.value"
                    @current-change="handlePageChange" />
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
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
    bundleList.handlePageChange(page)
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

.full-height-card :deep(.el-table) {
    flex: 1;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    flex-shrink: 0;
}

/* 模块标题 */
:deep(.el-card__header) span {
    font-size: 20px;
    font-weight: bold;
}
</style>
