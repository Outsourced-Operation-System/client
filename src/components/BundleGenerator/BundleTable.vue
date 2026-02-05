<template>
    <el-card class="box-card"
        style="flex: 1; display: flex; flex-direction: column; overflow: hidden; border-radius: 0 0 4px 4px;"
        :body-style="{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px' }">
        <template #header>
            <div class="card-header">
                <div class="header-left">
                    <span>生成货组</span>
                    <div class="count-info">
                        <span class="count-item">主品数量: <span class="count-number main">{{ mainCount }}</span></span>
                        <span class="count-item">赠品数量: <span class="count-number gift">{{ giftCount }}</span></span>
                    </div>
                </div>
                <div v-show="!isPreviewVisible" class="value-info">
                    <span class="value-item">主品货值: <span class="value-number">¥{{ mainValue }}</span></span>
                    <span class="value-item">赠品货值: <span class="value-number">¥{{ giftValue }}</span></span>
                    <span class="value-item">总货值: <span class="value-number total">¥{{ totalValue }}</span></span>
                </div>
            </div>
        </template>
        <div style="flex: 1; overflow: hidden; display: flex; flex-direction: column;">
            <el-table :data="paginatedItems" border style="width: 100%; flex: 1;" height="100%">
                <el-table-column label="主品/赠品" width="120" align="center" sortable :sort-method="sortByType">
                    <template #default="scope">
                        <el-select v-model="scope.row.type" size="small">
                            <el-option label="主品" value="main" />
                            <el-option label="赠品" value="gift" />
                        </el-select>
                    </template>
                </el-table-column>
                <el-table-column prop="article_code" label="A码" width="120" align="center" />
                <el-table-column prop="tu" label="SKU码" width="100" align="center" />
                <el-table-column prop="product_name_cn" label="品名" min-width="150" show-overflow-tooltip />
                <el-table-column prop="qty_available" label="库存数量" width="100" align="right">
                    <template #default="scope">
                        <span style="font-weight: bold;">
                            <span v-if="scope.row.qty_available != null">
                                {{ scope.row.qty_available }}
                            </span>
                            <span v-else>-</span>
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="A码库存" width="100" align="right">
                    <template #default="scope">
                        <span style="font-weight: bold;">{{ getArticleStockTotal(scope.row.article_code) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="SKU效期剩余月数" width="150" align="center">
                    <template #default="scope">
                        <!-- {{ scope.row.remaining_months + ' mo' || '-' }} -->
                        <span v-if="scope.row.remaining_months != ''">
                            {{ scope.row.remaining_months + 'mo' }}
                        </span>
                        <span v-else>-</span>
                    </template>
                </el-table-column>
                <el-table-column prop="declared_content" label="规格" width="100" align="center" />
                <el-table-column prop="cn_current_price" label="货值" width="100" align="right">
                    <template #default="scope">
                        <span v-if="scope.row.cn_current_price != null">
                            ¥{{ scope.row.cn_current_price }}
                        </span>
                        <span v-else>-</span>

                    </template>
                </el-table-column>
                <el-table-column prop="shelf_life" label="保质期" width="100" align="center">
                    <template #default="scope">
                        {{ scope.row.shelf_life }}
                    </template>
                </el-table-column>
                <el-table-column prop="product_name_en" label="英文名" min-width="120" show-overflow-tooltip />
                <el-table-column label="操作" width="140" align="center" fixed="right">
                    <template #default="scope">
                        <el-button type="primary" link size="small"
                            @click="handleCopy(getActualIndex(scope.$index))">复制</el-button>
                        <el-button type="danger" link size="small"
                            @click="handleRemove(getActualIndex(scope.$index))">移除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>
        <div class="bundle-actions" style="display: flex; justify-content: space-between; align-items: center;">
            <div class="pagination-wrapper">
                <span class="total-info">共 {{ bundleItems.length }} 条<span v-if="bundleItems.length >= MAX_ITEMS"
                        class="limit-warning">（已达上限）</span></span>
                <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                    :page-sizes="[10, 15, 20, 50]" :total="bundleItems.length" layout="sizes, prev, pager, next, jumper"
                    @size-change="handleSizeChange" @current-change="handleCurrentChange" />
            </div>
            <div class="action-buttons">
                <el-button type="danger" @click="$emit('clear')" size="large" style="width: 200px;"
                    :disabled="bundleItems.length === 0 && !hasGenerated">清除全部</el-button>
                <el-button type="primary" @click="$emit('generate')" size="large" v-if="!hasGenerated"
                    style="width: 200px;">
                    新建货组
                </el-button>
                <el-button type="primary" @click="$emit('generate')" size="large"
                    v-if="hasGenerated && !isPreviewVisible" style="width: 200px;">
                    信息预览
                </el-button>
            </div>
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

// 最大元素数量限制
const MAX_ITEMS = 500

// Props
const props = defineProps<{
    bundleItems: any[]
    isPreviewVisible: boolean
    hasGenerated: boolean
    mainValue: string
    giftValue: string
    totalValue: string
    getArticleStockTotal: (articleCode: string) => number
}>()

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

// 分页后的数据
const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return props.bundleItems.slice(start, end)
})

// 获取实际索引（用于删除操作）
const getActualIndex = (pageIndex: number) => {
    return (currentPage.value - 1) * pageSize.value + pageIndex
}

// 监听数据变化，自动调整当前页
watch(() => props.bundleItems.length, (newLen) => {
    const maxPage = Math.ceil(newLen / pageSize.value) || 1
    if (currentPage.value > maxPage) {
        currentPage.value = maxPage
    }
})

const handleSizeChange = (val: number) => {
    pageSize.value = val
    currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
    currentPage.value = val
}

// 计算主品和赠品数量
const mainCount = computed(() => props.bundleItems.filter(item => item.type === 'main').length)
const giftCount = computed(() => props.bundleItems.filter(item => item.type === 'gift').length)

// 主品/赠品排序方法：主品(main) 排在赠品(gift) 前面为升序
const sortByType = (a: any, b: any) => {
    if (a.type === b.type) return 0
    return a.type === 'main' ? -1 : 1
}

// Emits
const emit = defineEmits<{
    copy: [index: number]
    remove: [index: number]
    clear: []
    generate: []
}>()

const handleCopy = (index: number) => {
    emit('copy', index)
}

const handleRemove = (index: number) => {
    emit('remove', index)
}
</script>

<style scoped>
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 20px;
}

.header-left>span {
    font-size: 18px;
    font-weight: bold;
}

.count-info {
    display: flex;
    gap: 15px;
    align-items: center;
}

.count-item {
    font-size: 14px;
    color: #606266;
}

.count-number {
    font-weight: 600;
}

.count-number.main {
    color: #67c23a;
}

.count-number.gift {
    color: #e6a23c;
}

.value-info {
    display: flex;
    gap: 20px;
    align-items: center;
}

.value-item {
    font-size: 14px;
    color: #606266;
}

.value-number {
    font-weight: 600;
    color: #409eff;
}

.value-number.total {
    color: #f56c6c;
    font-size: 15px;
}

.bundle-actions {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #eee;
    display: flex;
    align-items: center;
}

.action-buttons {
    display: flex;
    gap: 10px;
}

.pagination-wrapper {
    display: flex;
    gap: 20px;
    align-items: center;
}

.total-info {
    font-size: 14px;
    color: #606266;
}

.limit-warning {
    color: #f56c6c;
    font-weight: 500;
}

:deep(.el-table) {
    font-size: 14px;
}
</style>
