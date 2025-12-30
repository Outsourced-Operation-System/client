<template>
    <div class="bundle-generator">
        <el-row style="height: calc(100vh - 80px); position: relative;">
            <!-- 左侧列：搜索 + 列表 -->
            <el-col :span="preview.isPreviewVisible.value ? 16 : 24"
                style="height: 100%; display: flex; flex-direction: column; transition: all 0.3s ease;">
                <!-- 搜索区 -->
                <SearchSection v-model:search-query="search.searchQuery.value"
                    v-model:search-type="search.searchType.value"
                    v-model:filter-zero-stock="search.filterZeroStock.value" :query-search="search.querySearch"
                    @search="handleSearch" @select="handleSelect" />

                <!-- 商品表格区 -->
                <BundleTable :bundle-items="items.bundleItems.value"
                    :is-preview-visible="preview.isPreviewVisible.value" :has-generated="preview.hasGenerated.value"
                    :main-value="items.mainValue.value" :gift-value="items.giftValue.value"
                    :total-value="items.totalValue.value" :get-article-stock-total="stock.getArticleStockTotal"
                    @remove="items.removeItem" @clear="handleClearAll" @generate="handleGenerate" />
            </el-col>

            <!-- 右侧预览面板 -->
            <PreviewPanel :visible="preview.isPreviewVisible.value" :create-time="preview.createTime.value"
                :virtual-code="preview.virtualCode.value" :main-value="items.mainValue.value"
                :gift-value="items.giftValue.value" :total-value="items.totalValue.value"
                v-model:bundle-name="preview.bundleName.value" v-model:has-gift-box="preview.hasGiftBox.value"
                v-model:usage-type="preview.usageType.value" v-model:selected-category="preview.selectedCategory.value"
                v-model:selected-product-type="preview.selectedProductType.value"
                v-model:selected-by-sku="preview.selectedBySku.value"
                v-model:selected-fragrance="preview.selectedFragrance.value" v-model:end-date="preview.endDate.value"
                :categories="labels.categories.value" :product-types="labels.productTypes.value"
                :by-sku-list="labels.bySkuList.value" :fragrances="labels.fragrances.value"
                :category-loading="labels.categoryLoading.value" :product-type-loading="labels.productTypeLoading.value"
                :by-sku-loading="labels.bySkuLoading.value" :fragrance-loading="labels.fragranceLoading.value"
                @toggle="preview.togglePreview" @save="handleSave"
                @search-category="(q: string) => labels.searchLabels('category', q)"
                @search-product-type="(q: string) => labels.searchLabels('productType', q)"
                @search-by-sku="(q: string) => labels.searchLabels('bySku', q)"
                @search-fragrance="(q: string) => labels.searchLabels('fragrance', q)" />
        </el-row>

        <!-- 展开按钮 -->
        <div class="expand-btn" @click="preview.togglePreview"
            v-if="!preview.isPreviewVisible.value && preview.hasGenerated.value">
            <el-icon>
                <ArrowLeft />
            </el-icon>
        </div>

        <!-- 搜索结果弹窗 -->
        <SearchResultDialog v-model="search.showSearchResultDialog.value" :data="search.searchDialogResults.value"
            v-model:table-ref="search.searchDialogTable.value" @confirm="handleAddSelected"
            @selection-change="search.handleDialogSelectionChange" />

        <!-- 清除确认弹窗 -->
        <ConfirmClearDialog v-model="showConfirmClearDialog" :item-count="items.bundleItems.value.length"
            @confirm="handleConfirmClear" />

        <!-- 库存不足弹窗 -->
        <el-dialog v-model="showStockDialog" title="库存不足" width="500px" :close-on-click-modal="false">
            <div class="stock-dialog-content">
                <p style="margin-bottom: 15px; color: #E6A23C;">以下所选商品库存不足：</p>
                <el-table :data="insufficientItemsDisplay" border max-height="300">
                    <el-table-column prop="article_code" label="A码" width="120" />
                    <el-table-column prop="product_name_cn" label="品名" show-overflow-tooltip />
                    <el-table-column prop="qty_available" label="当前库存" width="100" align="center" />
                </el-table>
                <p v-if="insufficientItems.length > 5" style="margin-top: 10px; color: #909399; font-size: 12px;">
                    共 {{ insufficientItems.length }} 件商品库存不足，仅显示前 5 条
                </p>
            </div>
            <template #footer>
                <el-button type="warning" @click="handleClearInsufficientItems">清除所有库存不足商品</el-button>
                <el-button type="primary" @click="showStockDialog = false">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, onActivated, ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import SearchSection from '@/components/BundleGenerator/SearchSection.vue'
import BundleTable from '@/components/BundleGenerator/BundleTable.vue'
import PreviewPanel from '@/components/BundleGenerator/PreviewPanel.vue'
import SearchResultDialog from '@/components/BundleGenerator/SearchResultDialog.vue'
import ConfirmClearDialog from '@/components/BundleGenerator/ConfirmClearDialog.vue'

// Composables
import { useBundleItems } from '@/composables/BundleGenerator'
import { useProductSearch } from '@/composables/BundleGenerator'
import { useLabelSearch } from '@/composables/BundleGenerator'
import { useBundlePreview, type InsufficientItem } from '@/composables/BundleGenerator'
import { useArticleStock } from '@/composables/BundleGenerator'
import { useBundleDraft } from '@/composables/BundleGenerator'

// Router
const router = useRouter()

// 初始化 composables
const items = useBundleItems()
const search = useProductSearch()
const labels = useLabelSearch()
const preview = useBundlePreview()
const stock = useArticleStock()
const draft = useBundleDraft()

// 刷新所有库存数据
const refreshAllStock = async () => {
    if (items.bundleItems.value.length > 0) {
        // 刷新商品列表中的库存数量
        await items.refreshItemsStock()
        // 刷新 A码 库存缓存
        await stock.refreshAllArticleStock()
    }
}

// 监听货品列表变化，实时更新虚拟编码
watch(
    () => items.bundleItems.value,
    (newItems) => {
        preview.updateVirtualCode(newItems)
    },
    { deep: true }
)

// 本地状态
const showConfirmClearDialog = ref(false)
const showStockDialog = ref(false)
const insufficientItems = ref<InsufficientItem[]>([])

// 只显示前5条库存不足商品
const insufficientItemsDisplay = computed(() => {
    return insufficientItems.value.slice(0, 5)
})

// 清除所有库存不足的商品
const handleClearInsufficientItems = () => {
    const insufficientSkus = new Set(insufficientItems.value.map(item => item.sku))
    items.bundleItems.value = items.bundleItems.value.filter(
        item => !insufficientSkus.has(item.tu)
    )
    showStockDialog.value = false
    insufficientItems.value = []
}

//处理搜索
const handleSearch = () => {
    search.handleQuickSearch()
}

//处理选中搜索建议
const handleSelect = (item: any) => {
    search.handleSelect(item, handleSearch)
}

//添加选中的商品到货组
const handleAddSelected = () => {
    const selectedItems = search.getSelectedItems()
    if (selectedItems) {
        items.addItems(selectedItems)
        // 批量查询A码库存
        selectedItems.forEach((item: any) => {
            if (item.article_code) {
                stock.fetchArticleStockTotal(item.article_code)
            }
        })
    }
}

//显示清除确认弹窗
const handleClearAll = () => {
    if (items.bundleItems.value.length === 0 && !preview.hasGenerated.value) {
        return
    }
    showConfirmClearDialog.value = true
}

//确认清除所有数据
const handleConfirmClear = () => {
    items.clearAll()
    stock.clearStockCache()
    preview.resetPreview()
    draft.clearDraft()
}

//生成货组（显示预览面板）
const handleGenerate = () => {
    preview.showPreviewAndSave(items.bundleItems.value)
}

//保存货组
const handleSave = async () => {
    const result = await preview.saveBundle(
        items.bundleItems.value,
        items.mainValue.value,
        items.giftValue.value,
        items.totalValue.value
    )

    if (result.success) {
        items.clearAll()
        stock.clearStockCache()
        preview.resetPreview()
        draft.clearDraft()
        // 跳转到货组管理页面
        router.push('/manager')
    } else if (result.reason === 'stock' && result.insufficientItems) {
        // 显示库存不足弹窗
        insufficientItems.value = result.insufficientItems
        showStockDialog.value = true
    }
}

//加载草稿
const loadDraftData = () => {
    const draftData = draft.loadDraft()
    if (!draftData) return

    // 恢复商品列表
    items.bundleItems.value = draftData.bundleItems || []

    // 恢复预览信息
    preview.bundleName.value = draftData.bundleName || ''
    preview.endDate.value = draftData.endDate || ''
    preview.createTime.value = draftData.createTime || ''
    preview.virtualCode.value = draftData.virtualCode || ''
    preview.selectedCategory.value = draftData.selectedCategory || ''
    preview.selectedProductType.value = draftData.selectedProductType || ''
    preview.selectedBySku.value = draftData.selectedBySku || ''
    preview.selectedFragrance.value = draftData.selectedFragrance || ''
    preview.usageType.value = draftData.usageType || 'cooperation'
    preview.hasGiftBox.value = draftData.hasGiftBox || false
    preview.isPreviewVisible.value = draftData.isPreviewVisible || false
    preview.hasGenerated.value = draftData.hasGenerated || false

    // 恢复A码库存缓存
    if (draftData.articleStockCache && Array.isArray(draftData.articleStockCache)) {
        stock.articleStockCache.value = new Map(draftData.articleStockCache)
    }

    // 重新查询可能更新的A码库存
    items.bundleItems.value.forEach((item: any) => {
        if (item.article_code) {
            stock.fetchArticleStockTotal(item.article_code)
        }
    })
}

//保存草稿
const saveDraftData = () => {
    draft.saveDraft({
        bundleItems: items.bundleItems.value,
        bundleName: preview.bundleName.value,
        endDate: preview.endDate.value,
        createTime: preview.createTime.value,
        virtualCode: preview.virtualCode.value,
        selectedCategory: preview.selectedCategory.value,
        selectedProductType: preview.selectedProductType.value,
        selectedBySku: preview.selectedBySku.value,
        selectedFragrance: preview.selectedFragrance.value,
        usageType: preview.usageType.value,
        hasGiftBox: preview.hasGiftBox.value,
        isPreviewVisible: preview.isPreviewVisible.value,
        hasGenerated: preview.hasGenerated.value,
        articleStockCache: Array.from(stock.articleStockCache.value.entries())
    })
}

//设置自动保存
draft.setupAutoSave(
    [
        items.bundleItems,
        preview.bundleName,
        preview.endDate,
        preview.selectedCategory,
        preview.selectedProductType,
        preview.selectedBySku,
        preview.selectedFragrance,
        preview.usageType,
        preview.hasGiftBox,
        preview.isPreviewVisible
    ],
    () => ({
        bundleItems: items.bundleItems.value,
        bundleName: preview.bundleName.value,
        endDate: preview.endDate.value,
        createTime: preview.createTime.value,
        virtualCode: preview.virtualCode.value,
        selectedCategory: preview.selectedCategory.value,
        selectedProductType: preview.selectedProductType.value,
        selectedBySku: preview.selectedBySku.value,
        selectedFragrance: preview.selectedFragrance.value,
        usageType: preview.usageType.value,
        hasGiftBox: preview.hasGiftBox.value,
        isPreviewVisible: preview.isPreviewVisible.value,
        hasGenerated: preview.hasGenerated.value,
        articleStockCache: Array.from(stock.articleStockCache.value.entries())
    })
)

// 生命周期
onMounted(() => {
    loadDraftData()
})

// 页面激活时刷新库存（从其他页面返回时）
onActivated(() => {
    refreshAllStock()
})

onBeforeUnmount(() => {
    saveDraftData()
})
</script>

<style scoped>
.bundle-generator {
    padding: 20px;
}

.expand-btn {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 60px;
    background: #fff;
    border: 1px solid #dcdfe6;
    border-left: none;
    border-radius: 0 4px 4px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
}

.expand-btn:hover {
    background-color: #f5f7fa;
    color: #409eff;
}

.stock-dialog-content {
    padding: 10px 0;
}
</style>
