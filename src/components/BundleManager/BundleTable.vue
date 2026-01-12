<template>
    <div style="flex: 1; overflow: hidden; display: flex; flex-direction: column;">
        <el-table ref="tableRef" :data="bundleList" style="width: 100%; flex: 1;" height="100%" border stripe
            v-loading="loading" @selection-change="handleSelectionChange" @row-click="handleRowClick"
            @cell-dblclick="handleCellDblClick" :row-class-name="getRowClassName">
            <el-table-column type="selection" width="55" :selectable="canSelect" />
            <el-table-column prop="virtual_code" label="虚拟编码" min-width="150" align="center">
                <template #default="scope">
                    <div class="expand-cell" :class="{ 'child-cell-right': scope.row.isChild }">
                        <!-- 展开/折叠按钮 -->
                        <span v-if="!scope.row.isChild && scope.row.children_count > 0" class="expand-btn"
                            @click.stop="$emit('toggleExpand', scope.row)">
                            <el-icon :class="{ 'is-expanded': scope.row.expanded }">
                                <CaretBottom />
                            </el-icon>
                        </span>
                        <span>{{ scope.row.virtual_code }}</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="name" label="货组名称" min-width="160" align="center" />
            <el-table-column label="更新时间" width="170" align="center" sortable>
                <template #default="scope">
                    <!-- 子货组显示更新时间 -->
                    <template v-if="scope.row.isChild">
                        {{ scope.row.update_time }}
                    </template>
                    <!-- 父货组：展开时显示创建时间，收起时显示最后更新时间 -->
                    <template v-else>
                        {{ scope.row.expanded ? scope.row.create_date : (scope.row.last_update_time ||
                            scope.row.create_date) }}
                    </template>
                </template>
            </el-table-column>
            <el-table-column prop="end_date" label="结束日期" width="120" align="center" sortable />
            <el-table-column prop="usage_type" label="用途" width="80" align="center">
                <template #default="scope">
                    {{ scope.row.usage_type == 'cooperation' ? '合作' : '自营' }}
                </template>
            </el-table-column>
            <el-table-column prop="total_value" label="总货值" min-width="100" align="right" sortable>
                <template #default="scope">
                    ¥{{ scope.row.total_value?.toFixed(2) || '0.00' }}
                </template>
            </el-table-column>
            <el-table-column prop="main_value" label="主品货值" min-width="105" align="right" sortable>
                <template #default="scope">
                    ¥{{ scope.row.main_value?.toFixed(2) || '0.00' }}
                </template>
            </el-table-column>
            <el-table-column prop="gift_value" label="赠品货值" min-width="105" align="right" sortable>
                <template #default="scope">
                    ¥{{ scope.row.gift_value?.toFixed(2) || '0.00' }}
                </template>
            </el-table-column>
            <el-table-column prop="category" label="分类" min-width="100" align="center" />
            <el-table-column prop="product_type" label="品类" min-width="100" align="center" />
            <el-table-column prop="by_sku" label="By-sku" min-width="100" align="center" />
            <el-table-column prop="fragrance" label="香型" min-width="100" align="center" />
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
import type { ElTable } from 'element-plus'
import { CaretBottom } from '@element-plus/icons-vue'
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
    'edit': [row: BundleRecord]
    'selectionChange': [selection: BundleRecord[]]
    'update:currentPage': [page: number]
    'update:pageSize': [size: number]
    'toggleExpand': [row: BundleRecord]
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

// 获取行类名
const getRowClassName = ({ row }: { row: BundleRecord }) => {
    if (row.isChild) {
        return 'child-row'
    }
    return ''
}

// 判断行是否可选择（子货组也可以选择）
const canSelect = (_row: BundleRecord) => {
    return true
}

const handleSizeChange = (val: number) => {
    emit('update:pageSize', val)
}

const handleCurrentChange = (val: number) => {
    emit('update:currentPage', val)
}

const handleRowClick = (row: BundleRecord) => {
    tableRef.value?.toggleRowSelection(row)
}

// 双击单元格处理，排除勾选列和虚拟编码列
const handleCellDblClick = (row: BundleRecord, column: any) => {
    // 勾选列没有property，虚拟编码列property为virtual_code，这两列双击不进入编辑模式
    if (!column.property || column.property === 'virtual_code') {
        return
    }
    emit('edit', row)
}

const handleEdit = (row: BundleRecord) => {
    emit('edit', row)
}

// 选择变化时过滤掉子货组（如果需要的话，可以保留）
const handleSelectionChange = (selection: BundleRecord[]) => {
    emit('selectionChange', selection)
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

/* 展开单元格样式 */
.expand-cell {
    display: flex;
    align-items: center;
    gap: 4px;
}

.expand-btn {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    color: #409eff;
    transition: transform 0.2s;
}

.expand-btn .el-icon {
    transition: transform 0.2s;
}

.expand-btn .el-icon.is-expanded {
    transform: rotate(0deg);
}

.expand-btn .el-icon:not(.is-expanded) {
    transform: rotate(-90deg);
}

.child-indent {
    color: #909399;
    margin-right: 4px;
}

/* 子货组单元格右对齐 */
.child-cell-right {
    justify-content: flex-end;
    padding-right: 10px;
}

/* 子货组行样式 */
:deep(.child-row) {
    background-color: #f5f7fa !important;
}

:deep(.child-row:hover > td) {
    background-color: #ecf5ff !important;
}
</style>
