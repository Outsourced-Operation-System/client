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
                        {{ scope.row.create_date }}
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
            <el-table-column label="操作" width="180" fixed="right" align="center">
                <template #default="scope">
                    <el-button link type="primary" size="small" @click.stop="handleEdit(scope.row)">编辑</el-button>
                    <el-button link :type="compareFirst && compareFirst.id === scope.row.id ? 'warning' : 'primary'"
                        size="small" @click.stop="handleCompare(scope.row)">
                        {{ compareFirst && compareFirst.id === scope.row.id ? '取消' : '比较' }}
                    </el-button>
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

        <!-- 比较悬浮卡片 -->
        <div v-if="compareFirst" ref="cardRef" class="compare-card" :class="{ 'is-dragging': isDragging }"
            :style="hasMoved ? { top: cardPosition.y + 'px', left: cardPosition.x + 'px', right: 'auto' } : {}"
            @mousedown="startDrag">
            <div class="compare-card-content">
                <div class="compare-item">
                    <div class="compare-label">已选:</div>
                    <div class="compare-title" :title="compareFirst.name">{{ compareFirst.name }}</div>
                    <div class="compare-code">{{ compareFirst.virtual_code }}</div>
                </div>
                <div class="compare-vs">VS</div>
                <div class="compare-item empty">
                    <el-icon class="question-icon">
                        <QuestionFilled />
                    </el-icon>
                    <div class="empty-text">请选择对比</div>
                </div>
            </div>
            <el-button class="compare-close" type="danger" circle size="small" @mousedown.stop @click="cancelCompare">
                <el-icon>
                    <Close />
                </el-icon>
            </el-button>
        </div>

        <BundleCompareDialog v-model:visible="showCompareDialog" :first-bundle="compareFirst"
            :second-bundle="compareSecond" @close="handleDialogClose" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ElTable } from 'element-plus'
import { CaretBottom, QuestionFilled, Close } from '@element-plus/icons-vue'
import type { BundleRecord } from '../../composables/BundleManager'
import BundleCompareDialog from './BundleCompareDialog.vue'

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

// 比较功能相关
const compareFirst = ref<BundleRecord | null>(null)
const compareSecond = ref<BundleRecord | null>(null)
const showCompareDialog = ref(false)

// 拖动相关状态
const cardRef = ref<HTMLElement | null>(null)
const cardPosition = ref({ x: 0, y: 120 }) // 初始位置 top: 120px, left: auto (靠css right)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const hasMoved = ref(false) // 标记卡片是否被拖动过，如果是，则使用 fixed left/top 定位

const startDrag = (e: MouseEvent) => {
    // 只有点击卡片本身才触发拖动，点击子元素如按钮不触发（通过 e.target 判断或 stopPropagation）
    if (!cardRef.value) return
    isDragging.value = true

    const rect = cardRef.value.getBoundingClientRect()
    dragOffset.value = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    }

    // 如果是第一次拖动，初始化一下 currentPosition，因为初始定位是靠 right 的
    if (!hasMoved.value) {
        cardPosition.value = {
            x: rect.left,
            y: rect.top
        }
        hasMoved.value = true
    }

    window.addEventListener('mousemove', onDrag)
    window.addEventListener('mouseup', stopDrag)
    // 防止选中文本
    e.preventDefault()
}

const onDrag = (e: MouseEvent) => {
    if (!isDragging.value) return
    cardPosition.value = {
        x: e.clientX - dragOffset.value.x,
        y: e.clientY - dragOffset.value.y
    }
}

const stopDrag = () => {
    isDragging.value = false
    window.removeEventListener('mousemove', onDrag)
    window.removeEventListener('mouseup', stopDrag)
}

const handleCompare = (row: BundleRecord) => {
    if (!compareFirst.value) {
        compareFirst.value = row
        // 重置位置状态，如果需要每次重新打开都归位，则在这里重置 hasMoved = false
    } else if (compareFirst.value.id === row.id) {
        // 取消选中第一个
        compareFirst.value = null
    } else {
        compareSecond.value = row
        showCompareDialog.value = true
    }
}

const cancelCompare = () => {
    compareFirst.value = null
    compareSecond.value = null
}

const handleDialogClose = () => {
    compareSecond.value = null
    // 弹窗关闭后，清空第一个选择，回到初始状态
    compareFirst.value = null
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

/* 比较功能样式 */
.compare-card {
    position: fixed;
    top: 120px;
    right: 20px;
    background-color: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    padding: 15px;
    z-index: 2000;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    animation: slideIn 0.3s ease-out;
    border: 1px solid #ebeef5;
    cursor: move;
    user-select: none;
}

.compare-card.is-dragging {
    opacity: 0.9;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    cursor: grabbing;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.compare-card-content {
    display: flex;
    align-items: center;
    gap: 15px;
}

.compare-item {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 10px;
    width: 160px;
    height: 80px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background-color: #f5f7fa;
}

.compare-item.empty {
    align-items: center;
    border-style: dashed;
    background-color: #fff;
    color: #909399;
}

.compare-label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 5px;
}

.compare-title {
    font-size: 14px;
    font-weight: bold;
    color: #303133;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 2px;
}

.compare-code {
    font-size: 12px;
    color: #606266;
}

.compare-vs {
    font-size: 20px;
    font-weight: bold;
    color: #E6A23C;
    font-style: italic;
}

.question-icon {
    font-size: 24px;
    margin-bottom: 5px;
}

.empty-text {
    font-size: 12px;
}

.compare-close {
    position: absolute;
    top: -10px;
    right: -10px;
}
</style>
