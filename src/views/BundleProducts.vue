<template>
    <div class="bundle-products">
        <el-card class="full-height-card">
            <template #header>
                <div class="card-header">
                    <div class="header-left">
                        <el-button :icon="ArrowLeft" @click="goBack" circle size="small" />
                        <span class="title">商品编辑 - {{ bundleInfo.name || '加载中...' }}</span>
                        <el-tag type="info" style="margin-left: 10px;">{{ bundleInfo.virtual_code }}</el-tag>
                    </div>
                    <div class="header-right">
                        <span class="value-item">主品货值: <span class="value-number">¥{{ mainValue }}</span></span>
                        <span class="value-item">赠品货值: <span class="value-number">¥{{ giftValue }}</span></span>
                        <span class="value-item">总货值: <span class="value-number total">¥{{ totalValue }}</span></span>
                    </div>
                </div>
            </template>

            <!-- 搜索区域 -->
            <div class="search-section">
                <div class="search-type-radio">
                    <el-radio-group v-model="searchType" size="large">
                        <el-radio label="productName">品名</el-radio>
                        <el-radio label="skuCode">SKU码</el-radio>
                        <el-radio label="articleCode">A码</el-radio>
                    </el-radio-group>
                </div>
                <div class="search-input-row">
                    <el-autocomplete v-model="searchQuery" :fetch-suggestions="querySearch" placeholder="输入搜索内容"
                        class="search-input" clearable size="large" @keyup.enter="handleSearch" @select="handleSelect">
                        <template #append>
                            <el-button :icon="Search" @click="handleSearch" size="large" />
                        </template>
                    </el-autocomplete>
                    <el-checkbox v-model="filterZeroStock" size="large" style="margin-left: 10px;">
                        过滤库存为0
                    </el-checkbox>
                </div>
            </div>

            <!-- 商品表格 -->
            <div class="table-container" v-loading="loading">
                <el-table :data="paginatedItems" border style="width: 100%; flex: 1;" height="100%">
                    <el-table-column label="主品/赠品" width="120" align="center" sortable :sort-method="sortByType">
                        <template #default="scope">
                            <el-select v-model="scope.row.type" size="small" @change="handleTypeChange">
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
                                {{ scope.row.qty_available ?? '-' }}
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
                            <span v-if="scope.row.remaining_months">{{ scope.row.remaining_months }}mo</span>
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
                    <el-table-column prop="shelf_life" label="保质期" width="100" align="center" />
                    <el-table-column prop="product_name_en" label="英文名" min-width="120" show-overflow-tooltip />
                    <el-table-column label="操作" width="100" align="center" fixed="right">
                        <template #default="scope">
                            <el-button type="danger" link size="small"
                                @click="handleRemove(getActualIndex(scope.$index))">移除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <!-- 底部操作区 -->
            <div class="bottom-actions">
                <div class="pagination-wrapper">
                    <span class="total-info">共 {{ bundleItems.length }} 件商品</span>
                    <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                        :page-sizes="[10, 15, 20, 50]" :total="bundleItems.length"
                        layout="sizes, prev, pager, next, jumper" />
                </div>
                <div class="action-buttons">
                    <el-button @click="goBack" size="large">返回</el-button>
                    <el-button type="primary" @click="handleSave" size="large" :loading="saving">保存修改</el-button>
                </div>
            </div>
        </el-card>

        <!-- 搜索结果弹窗 -->
        <el-dialog v-model="showSearchResultDialog" title="搜索结果" width="80%" @keyup.enter="handleDialogEnter">
            <el-table ref="searchDialogTable" :data="searchDialogResults" border max-height="400"
                @selection-change="handleDialogSelectionChange">
                <el-table-column type="selection" width="55" />
                <el-table-column prop="article_code" label="A码" width="120" align="center" />
                <el-table-column prop="tu" label="SKU码" width="100" align="center" />
                <el-table-column prop="product_name_cn" label="品名" min-width="150" show-overflow-tooltip />
                <el-table-column prop="qty_available" label="库存" width="80" align="right" />
                <el-table-column prop="cn_current_price" label="货值" width="100" align="right">
                    <template #default="scope">
                        ¥{{ scope.row.cn_current_price || '0.00' }}
                    </template>
                </el-table-column>
                <el-table-column prop="declared_content" label="规格" width="100" align="center" />
            </el-table>
            <template #footer>
                <el-button @click="showSearchResultDialog = false">取消</el-button>
                <el-button type="primary" @click="handleAddSelected" :disabled="dialogSelectedItems.length === 0">
                    添加选中 ({{ dialogSelectedItems.length }})
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Search } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 货组信息
const bundleInfo = ref<any>({})
const bundleItems = ref<any[]>([])
const originalItems = ref<any[]>([]) // 原始商品列表，用于比较是否有修改
const loading = ref(false)
const saving = ref(false)

// 搜索相关
const searchQuery = ref('')
const searchType = ref('productName')
const filterZeroStock = ref(false)
const showSearchResultDialog = ref(false)
const searchDialogResults = ref<any[]>([])
const dialogSelectedItems = ref<any[]>([])
const searchDialogTable = ref<any>(null)

// A码库存缓存
const articleStockCache = ref<Map<string, number>>(new Map())

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// 分页后的数据
const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return bundleItems.value.slice(start, end)
})

// 获取实际索引
const getActualIndex = (pageIndex: number) => {
    return (currentPage.value - 1) * pageSize.value + pageIndex
}

// 计算货值
const mainValue = computed(() => {
    return bundleItems.value
        .filter(item => item.type === 'main')
        .reduce((sum, item) => sum + (Number(item.cn_current_price) || 0), 0)
        .toFixed(2)
})

const giftValue = computed(() => {
    return bundleItems.value
        .filter(item => item.type === 'gift')
        .reduce((sum, item) => sum + (Number(item.cn_current_price) || 0), 0)
        .toFixed(2)
})

const totalValue = computed(() => {
    return bundleItems.value
        .reduce((sum, item) => sum + (Number(item.cn_current_price) || 0), 0)
        .toFixed(2)
})

// 监听数据变化，自动调整当前页
watch(() => bundleItems.value.length, (newLen) => {
    const maxPage = Math.ceil(newLen / pageSize.value) || 1
    if (currentPage.value > maxPage) {
        currentPage.value = maxPage
    }
})

// 加载货组详情
const loadBundleDetail = async () => {
    const bundleId = route.query.bundleId
    if (!bundleId) {
        ElMessage.error('缺少货组ID')
        router.back()
        return
    }

    loading.value = true
    try {
        const res = await (window as any).electronAPI.getBundleDetail(Number(bundleId))
        if (res.success && res.data) {
            bundleInfo.value = res.data
            bundleItems.value = res.data.items || []
            // 深拷贝保存原始数据用于比较
            originalItems.value = JSON.parse(JSON.stringify(res.data.items || []))

            // 查询所有A码库存
            const articleCodes = new Set(bundleItems.value.map((item: any) => item.article_code).filter(Boolean))
            articleCodes.forEach(code => {
                fetchArticleStockTotal(code as string)
            })
        } else {
            ElMessage.error(res.error || '获取货组详情失败')
            router.back()
        }
    } catch (e) {
        console.error('加载失败:', e)
        ElMessage.error('加载货组详情失败')
        router.back()
    } finally {
        loading.value = false
    }
}

// 获取A码库存
const fetchArticleStockTotal = async (articleCode: string) => {
    if (!articleCode || articleStockCache.value.has(articleCode)) return

    try {
        const res = await (window as any).electronAPI.getArticleStockTotal(articleCode)
        articleStockCache.value.set(articleCode, res?.total || 0)
    } catch (e) {
        console.error('获取A码库存失败:', e)
    }
}

const getArticleStockTotal = (articleCode: string) => {
    return articleStockCache.value.get(articleCode) ?? '-'
}

// 检查是否有未保存的修改
const hasUnsavedChanges = computed(() => {
    if (bundleItems.value.length !== originalItems.value.length) return true

    const currentSkus = bundleItems.value.map(item => `${item.sku || item.tu}-${item.type}`).sort().join(',')
    const originalSkus = originalItems.value.map(item => `${item.sku || item.tu}-${item.type}`).sort().join(',')

    return currentSkus !== originalSkus
})

// 检查新增商品的库存
const checkNewItemsStock = async (): Promise<{ sufficient: boolean; insufficientItems: any[] }> => {
    // 找出新增的商品（在当前列表中但不在原始列表中）
    const originalSkuSet = new Set(originalItems.value.map(item => item.sku || item.tu))
    const newItems = bundleItems.value.filter(item => !originalSkuSet.has(item.sku || item.tu))

    if (newItems.length === 0) {
        return { sufficient: true, insufficientItems: [] }
    }

    try {
        const res = await (window as any).electronAPI.checkStockAvailability(
            newItems.map((item) => ({
                sku: item.sku || item.tu,
                article_code: item.article_code,
                product_name_cn: item.product_name_cn,
            }))
        )
        if (res.success) {
            return {
                sufficient: res.sufficient,
                insufficientItems: res.insufficientItems || [],
            }
        }
        return { sufficient: true, insufficientItems: [] }
    } catch (e) {
        console.error('检查库存失败:', e)
        return { sufficient: true, insufficientItems: [] }
    }
}

// 搜索建议
const querySearch = async (queryString: string, cb: any) => {
    if (!queryString || searchType.value !== 'productName') {
        cb([])
        return
    }

    try {
        const res = await (window as any).electronAPI.searchProductSuggestions(String(queryString))
        const suggestions = res.map((item: any) => ({
            value: item.product_name_cn,
            ...item
        }))
        cb(suggestions)
    } catch (e) {
        console.error(e)
        cb([])
    }
}

// 搜索
const handleSearch = async () => {
    if (!searchQuery.value.trim()) {
        ElMessage.warning('请输入搜索内容')
        return
    }

    try {
        const res = await (window as any).electronAPI.searchProductsByTypes(
            String(searchQuery.value),
            [searchType.value],
            Boolean(filterZeroStock.value)
        )

        if (res && res.length > 0) {
            searchDialogResults.value = res
            showSearchResultDialog.value = true

            if (res.length === 1) {
                setTimeout(() => {
                    if (searchDialogTable.value && res[0]) {
                        searchDialogTable.value.toggleRowSelection(res[0], true)
                    }
                }, 100)
            }
        } else {
            ElMessage.info('未找到匹配的商品')
        }
    } catch (e: any) {
        console.error('搜索错误:', e)
        ElMessage.error(`搜索出错: ${e.message || '未知错误'}`)
    }
}

// 选择搜索建议
const handleSelect = (item: any) => {
    searchQuery.value = item.value
    handleSearch()
}

// 选择变化
const handleDialogSelectionChange = (val: any[]) => {
    dialogSelectedItems.value = val
}

// 弹窗回车确认
const handleDialogEnter = () => {
    if (dialogSelectedItems.value.length > 0) {
        handleAddSelected()
    }
}

// 添加选中的商品
const handleAddSelected = () => {
    if (dialogSelectedItems.value.length === 0) return

    // 检查是否已存在
    const existingSkus = new Set(bundleItems.value.map(item => item.sku || item.tu))

    dialogSelectedItems.value.forEach(item => {
        const sku = item.sku || item.tu
        if (!existingSkus.has(sku)) {
            bundleItems.value.push({
                ...item,
                type: 'main' // 默认为主品
            })
            existingSkus.add(sku)

            // 查询A码库存
            if (item.article_code) {
                fetchArticleStockTotal(item.article_code)
            }
        }
    })

    showSearchResultDialog.value = false
    dialogSelectedItems.value = []
    ElMessage.success('添加成功')
}

// 移除商品
const handleRemove = (index: number) => {
    bundleItems.value.splice(index, 1)
}

// 类型变化
const handleTypeChange = () => {
    // 触发重新计算货值
}

// 排序方法
const sortByType = (a: any, b: any) => {
    if (a.type === b.type) return 0
    return a.type === 'main' ? -1 : 1
}

// 保存
const handleSave = async () => {
    if (bundleItems.value.length === 0) {
        ElMessage.warning('请至少添加一件商品')
        return
    }

    // 验证 bundleId
    if (!bundleInfo.value.id) {
        ElMessage.error('货组ID无效，请返回重试')
        return
    }

    // 检查新增商品的库存
    const stockCheck = await checkNewItemsStock()
    if (!stockCheck.sufficient) {
        const itemNames = stockCheck.insufficientItems
            .slice(0, 5)
            .map(item => `${item.product_name_cn}（库存: ${item.qty_available}）`)
            .join('\n')
        const moreText = stockCheck.insufficientItems.length > 5
            ? `\n... 共 ${stockCheck.insufficientItems.length} 件商品库存不足`
            : ''

        ElMessageBox.alert(
            `以下新增商品库存不足：\n${itemNames}${moreText}`,
            '库存不足',
            { type: 'warning' }
        )
        return
    }

    saving.value = true
    try {
        // 计算新增和删除的商品
        const originalSkuSet = new Set(originalItems.value.map(item => item.sku || item.tu))
        const currentSkuSet = new Set(bundleItems.value.map(item => item.sku || item.tu))

        // 新增的商品 SKU
        const addedSkus = bundleItems.value
            .filter(item => !originalSkuSet.has(item.sku || item.tu))
            .map(item => item.sku || item.tu)

        // 删除的商品 SKU
        const removedSkus = originalItems.value
            .filter(item => !currentSkuSet.has(item.sku || item.tu))
            .map(item => item.sku || item.tu)

        // 准备商品数据，确保每个商品都有 sku 字段
        const itemsToSave = bundleItems.value.map(item => ({
            ...item,
            sku: item.sku || item.tu
        }))

        // 更新货组商品
        const res = await (window as any).electronAPI.updateBundleItems({
            bundleId: bundleInfo.value.id,
            items: itemsToSave,
            totalValue: Number(totalValue.value),
            mainValue: Number(mainValue.value),
            giftValue: Number(giftValue.value),
            addedSkus,
            removedSkus
        })

        if (res.success) {
            // 更新原始数据，防止返回时误判为有修改
            originalItems.value = JSON.parse(JSON.stringify(bundleItems.value))
            ElMessage.success('保存成功')
            router.back()
        } else {
            ElMessage.error(res.error || '保存失败')
        }
    } catch (e: any) {
        console.error('保存失败:', e)
        ElMessage.error(e.message || '保存失败')
    } finally {
        saving.value = false
    }
}

// 返回
const goBack = async () => {
    // 检查是否有未保存的修改
    if (hasUnsavedChanges.value) {
        try {
            await ElMessageBox.confirm(
                '您有未保存的修改，确定要放弃更改吗？',
                '提示',
                {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning',
                }
            )
            router.back()
        } catch {
            // 用户取消，不做任何操作
        }
    } else {
        router.back()
    }
}

onMounted(() => {
    loadBundleDetail()
})
</script>

<style scoped>
.bundle-products {
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

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 10px;
}

.header-left .title {
    font-size: 18px;
    font-weight: bold;
}

.header-right {
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

.search-section {
    padding: 15px;
    background: #f5f7fa;
    border-radius: 4px;
    margin-bottom: 15px;
}

.search-type-radio {
    margin-bottom: 10px;
}

.search-input-row {
    display: flex;
    align-items: center;
}

.search-input {
    flex: 1;
}

.table-container {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.bottom-actions {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
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

.action-buttons {
    display: flex;
    gap: 10px;
}

:deep(.el-table) {
    font-size: 14px;
}
</style>
