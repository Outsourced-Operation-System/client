<template>
    <div style="flex: 1; overflow: hidden; display: flex; flex-direction: column;">
        <el-table ref="tableRef" :data="bundleList" style="width: 100%; flex: 1;" height="100%" border stripe
            v-loading="loading" @selection-change="$emit('selectionChange', $event)" @row-click="handleRowClick">
            <el-table-column type="selection" width="55" />
            <el-table-column prop="virtual_code" label="虚拟编码" width="150" align="center" />
            <el-table-column prop="name" label="货组名称" min-width="160" align="center" />
            <el-table-column prop="create_date" label="创建时间" width="120" align="center" sortable>
                <!-- <template #default="scope">
                    {{ scope.row.create_date.split(' ')[0] }}
                </template> -->
            </el-table-column>
            <el-table-column prop="end_date" label="结束日期" width="120" align="center" sortable />
            <el-table-column prop="usage_type" label="用途" width="60" align="center">
                <template #default="scope">
                    {{ scope.row.usage_type == 'cooperation' ? '合作' : '自营' }}
                </template>
            </el-table-column>
            <el-table-column prop="total_value" label="总货值" width="100" align="right" sortable>
                <template #default="scope">
                    ¥{{ scope.row.total_value?.toFixed(2) || '0.00' }}
                </template>
            </el-table-column>
            <el-table-column prop="main_value" label="主品货值" width="105" align="right" sortable>
                <template #default="scope">
                    ¥{{ scope.row.main_value?.toFixed(2) || '0.00' }}
                </template>
            </el-table-column>
            <el-table-column prop="gift_value" label="赠品货值" width="105" align="right" sortable>
                <template #default="scope">
                    ¥{{ scope.row.gift_value?.toFixed(2) || '0.00' }}
                </template>
            </el-table-column>
            <el-table-column prop="category" label="分类" width="100" align="center" />
            <el-table-column prop="product_type" label="品类" width="100" align="center" />
            <el-table-column prop="by_sku" label="By-sku" width="100" align="center" />
            <el-table-column prop="fragrance" label="香型" width="100" align="center" />
            <el-table-column prop="status" label="状态" width="100" align="center">
                <template #default="scope">
                    <el-tag :type="scope.row.status === '有效' ? 'success' : 'info'">
                        {{ scope.row.status }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right" align="center">
                <template #default="scope">
                    <el-button link type="primary" size="small" @click.stop="handleEdit(scope.row)">编辑</el-button>
                    <el-button link type="danger" size="small" @click.stop="$emit('delete', scope.row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>
        <div class="pagination-wrapper">
            <span class="total-info">共 {{ total }} 条</span>
            <el-pagination v-model:current-page="currentPageModel" v-model:page-size="pageSizeModel"
                :page-sizes="[10, 15, 20, 50]" :total="total" layout="sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange" @current-change="handleCurrentChange" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { ElTable } from 'element-plus'
import type { BundleRecord } from '../../composables/BundleManager'

const props = defineProps<{
    bundleList: BundleRecord[]
    loading: boolean
    currentPage: number
    pageSize: number
    total: number
}>()

const emit = defineEmits<{
    'delete': [row: BundleRecord]
    'selectionChange': [selection: BundleRecord[]]
    'update:currentPage': [page: number]
    'update:pageSize': [size: number]
}>()

const tableRef = ref<InstanceType<typeof ElTable>>()

const currentPageModel = computed({
    get: () => props.currentPage,
    set: (val) => emit('update:currentPage', val)
})

const pageSizeModel = computed({
    get: () => props.pageSize,
    set: (val) => emit('update:pageSize', val)
})

const handleSizeChange = (val: number) => {
    emit('update:pageSize', val)
}

const handleCurrentChange = (val: number) => {
    emit('update:currentPage', val)
}

const handleRowClick = (row: BundleRecord) => {
    tableRef.value?.toggleRowSelection(row)
}

const handleEdit = (row: BundleRecord) => {
    ElMessage.info('开发中')
}
</script>

<style scoped>
/* 表格内容字号 */
:deep(.el-table) {
    font-size: 14px;
}

.pagination-wrapper {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #eee;
    display: flex;
    gap: 20px;
    align-items: center;
    justify-content: flex-start;
}

.total-info {
    font-size: 14px;
    color: #606266;
}
</style>
