<template>
    <div class="bundle-generator">
        <el-row style="height: calc(100vh - 80px); position: relative;">
            <!-- 左侧列：搜索 + 列表 -->
            <el-col :span="isPreviewVisible ? 16 : 24"
                style="height: 100%; display: flex; flex-direction: column; transition: all 0.3s ease;">
                <!-- 第一部分：搜索条件设置 -->
                <el-card class="box-card" style="margin-bottom: 0; border-bottom: none; border-radius: 4px 4px 0 0;">
                    <template #header>
                        <div class="card-header">
                            <span>商品搜索</span>
                        </div>
                    </template>
                    <div class="search-area">
                        <div class="search-type-radio">
                            <el-radio-group v-model="searchType" size="large">
                                <el-radio label="productName">品名</el-radio>
                                <el-radio label="skuCode">SKU码</el-radio>
                                <el-radio label="articleCode">A码</el-radio>
                            </el-radio-group>
                        </div>
                        <div class="search-input-row">
                            <el-autocomplete v-model="searchQuery" :fetch-suggestions="querySearch" placeholder="输入搜索内容"
                                class="search-input" clearable size="large" @keyup.enter="handleQuickSearch"
                                @select="handleSelect">
                                <template #append>
                                    <el-button :icon="Search" @click="handleQuickSearch" size="large" />
                                </template>
                            </el-autocomplete>
                            <el-checkbox v-model="filterZeroStock" size="large"
                                style="margin-left: 10px;">过滤库存为0</el-checkbox>
                        </div>
                    </div>
                </el-card>

                <!-- 第二部分：已选商品表格 -->
                <el-card class="box-card"
                    style="flex: 1; display: flex; flex-direction: column; overflow: hidden; border-radius: 0 0 4px 4px;"
                    :body-style="{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px' }">
                    <template #header>
                        <div class="card-header">
                            <span>生成货组</span>
                            <div v-show="!isPreviewVisible" class="value-info">
                                <span class="value-item">主品货值: <span class="value-number">¥{{ mainValue }}</span></span>
                                <span class="value-item">赠品货值: <span class="value-number">¥{{ giftValue }}</span></span>
                                <span class="value-item">总货值: <span class="value-number total">¥{{ totalValue
                                }}</span></span>
                            </div>
                        </div>
                    </template>
                    <div style="flex: 1; overflow: hidden;">
                        <el-table :data="bundleItems" border style="width: 100%; height: 100%;" height="100%">
                            <el-table-column label="主品/赠品" width="120" align="center">
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
                                    <span style="font-weight: bold;">{{ scope.row.qty_available || 0 }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column label="A码库存" width="100" align="right">
                                <template #default="scope">
                                    <span style="font-weight: bold;">{{ getArticleStockTotal(scope.row.article_code)
                                    }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column label="SKU效期剩余月数" width="150" align="center">
                                <template #default="scope">
                                    {{ scope.row.tu_shelf_life || '-' }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="declared_content" label="规格" width="100" align="center" />
                            <el-table-column prop="cn_current_price" label="货值" width="100" align="right">
                                <template #default="scope">
                                    ¥{{ scope.row.cn_current_price || '-' }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="shelf_life" label="保质期" width="100" align="center">
                                <template #default="scope">
                                    {{ scope.row.shelf_life || '-' }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="product_name_en" label="英文名" min-width="120" show-overflow-tooltip />
                            <el-table-column label="操作" width="100" align="center" fixed="right">
                                <template #default="scope">
                                    <el-button type="danger" link size="small"
                                        @click="removeFromBundle(scope.$index)">移除</el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                    <div class="bundle-actions" style="display: flex; justify-content: flex-end;">
                        <el-button type="danger" @click="clearAllPreview" size="large"
                            style="width: 200px;">清除全部</el-button>
                        <el-button type="primary" @click="showPreviewAndSave" size="large" v-if="!hasGenerated"
                            style="width: 200px;">新建货组</el-button>
                    </div>
                </el-card>
            </el-col>

            <!-- 第三部分：信息预览（右侧） -->
            <el-col :span="8" style="height: 100%; position: relative;" v-show="isPreviewVisible">
                <!-- 收缩按钮 -->
                <div class="collapse-btn" @click="togglePreview">
                    <el-icon>
                        <ArrowRight />
                    </el-icon>
                </div>
                <el-card class="box-card" style="height: 100%; display: flex; flex-direction: column;"
                    :body-style="{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }">
                    <template #header>
                        <div class="card-header">
                            <span>信息预览</span>
                        </div>
                    </template>
                    <div style="height: 100%; display: flex; flex-direction: column; overflow: hidden;">
                        <div style="flex: 1; overflow: auto;">
                            <table class="info-table">
                                <tbody>
                                    <tr>
                                        <td class="label-cell">创建时间</td>
                                        <td class="value-cell">{{ createTime || '-' }}</td>
                                    </tr>
                                    <tr>
                                        <td class="label-cell">虚拟编码</td>
                                        <td class="value-cell">{{ virtualCode || '-' }}</td>
                                    </tr>
                                    <tr>
                                        <td class="label-cell">主品货值</td>
                                        <td class="value-cell">¥{{ mainValue }}</td>
                                    </tr>
                                    <tr>
                                        <td class="label-cell">赠品货值</td>
                                        <td class="value-cell">¥{{ giftValue }}</td>
                                    </tr>
                                    <tr>
                                        <td class="label-cell">总货值</td>
                                        <td class="value-cell total-value">¥{{ totalValue }}</td>
                                    </tr>
                                    <tr class="empty-row">
                                        <td colspan="2"></td>
                                    </tr>
                                    <tr>
                                        <td class="label-cell">货组名称</td>
                                        <td class="value-cell">
                                            <el-input v-model="bundleName" placeholder="请输入货组名称" size="mid" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="label-cell">礼盒</td>
                                        <td class="value-cell">
                                            <el-radio-group v-model="hasGiftBox" size="mid">
                                                <el-radio :label="true">有</el-radio>
                                                <el-radio :label="false">无</el-radio>
                                            </el-radio-group>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="label-cell">用途</td>
                                        <td class="value-cell">
                                            <el-radio-group v-model="usageType" size="mid">
                                                <el-radio label="cooperation">合作</el-radio>
                                                <el-radio label="self">自营</el-radio>
                                            </el-radio-group>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="label-cell">分类</td>
                                        <td class="value-cell">
                                            <el-select v-model="selectedCategory" placeholder="输入关键字搜索" size="mid"
                                                style="width: 100%;" filterable remote
                                                :remote-method="(query: string) => searchLabels('category', query)"
                                                :loading="categoryLoading">
                                                <el-option v-for="cat in categories" :key="cat" :label="cat"
                                                    :value="cat" />
                                            </el-select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="label-cell">品类</td>
                                        <td class="value-cell">
                                            <el-select v-model="selectedProductType" placeholder="输入关键字搜索" size="mid"
                                                style="width: 100%;" filterable remote
                                                :remote-method="(query: string) => searchLabels('productType', query)"
                                                :loading="productTypeLoading">
                                                <el-option v-for="type in productTypes" :key="type" :label="type"
                                                    :value="type" />
                                            </el-select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="label-cell">By-SKU</td>
                                        <td class="value-cell">
                                            <el-select v-model="selectedBySku" placeholder="输入关键字搜索" size="mid"
                                                style="width: 100%;" filterable remote
                                                :remote-method="(query: string) => searchLabels('bySku', query)"
                                                :loading="bySkuLoading">
                                                <el-option v-for="sku in bySkuList" :key="sku" :label="sku"
                                                    :value="sku" />
                                            </el-select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="label-cell">香型</td>
                                        <td class="value-cell">
                                            <el-select v-model="selectedFragrance" placeholder="输入关键字搜索" size="mid"
                                                style="width: 100%;" filterable remote
                                                :remote-method="(query: string) => searchLabels('fragrance', query)"
                                                :loading="fragranceLoading">
                                                <el-option v-for="frag in fragrances" :key="frag" :label="frag"
                                                    :value="frag" />
                                            </el-select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="label-cell">结束日期</td>
                                        <td class="value-cell">
                                            <el-date-picker v-model="endDate" type="date" placeholder="选择结束日期"
                                                size="mid" style="width: 93%;" value-format="YYYY-MM-DD" />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div style="padding: 15px 0; border-top: 1px solid #eee;">
                            <el-button type="primary" class="w-100" @click="saveBundle" size="large">保存货组</el-button>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 展开按钮 -->
        <div class="expand-btn" @click="togglePreview" v-if="!isPreviewVisible && hasGenerated">
            <el-icon>
                <ArrowLeft />
            </el-icon>
        </div>

        <!-- 关键信息列表弹窗 -->
        <el-dialog v-model="showSearchResultDialog" title="关键信息列表" width="55%" append-to-body
            @keyup.enter="addSelectedToBundl">
            <el-table ref="searchDialogTable" :data="searchDialogResults" border style="width: 100%;" max-height="500"
                @selection-change="handleDialogSelectionChange" @row-click="handleRowClick">
                <el-table-column type="selection" width="55" />
                <el-table-column prop="article_code" label="A码" width="100" align="center" />
                <el-table-column prop="tu" label="SKU码" width="100" align="center" />
                <el-table-column prop="product_name_cn" label="产品名称" min-width="250" show-overflow-tooltip />
                <el-table-column prop="declared_content" label="规格" width="100" align="center" />
                <el-table-column prop="cn_current_price" label="货值" width="100" align="right">
                    <template #default="scope">
                        ¥{{ scope.row.cn_current_price || 0 }}
                    </template>
                </el-table-column>
                <el-table-column prop="qty_available" label="库存数量" width="100" align="center">
                    <template #default="scope">
                        <span style="font-weight: bold;">{{ scope.row.qty_available || 0 }}</span>
                    </template>
                </el-table-column>
            </el-table>
            <template #footer>
                <el-button @click="showSearchResultDialog = false">取消</el-button>
                <el-button type="primary" @click="addSelectedToBundl">确认</el-button>
            </template>
        </el-dialog>
        <el-dialog v-model="confirmClearDialogVisible" title="确认清除" width="30%" append-to-body>
            <div style="padding: 20px 0;">
                <p style="font-size: 16px; margin-bottom: 15px;">确定要清除所有商品和预览信息吗？</p>
                <p style="color: #909399; font-size: 14px;">此操作将清空：</p>
                <ul style="color: #909399; font-size: 14px; padding-left: 20px;">
                    <li>所有已添加的商品（{{ bundleItems.length }} 个）</li>
                    <li>货组名称、日期范围等所有预览信息</li>
                </ul>
                <p style="color: #f56c6c; font-size: 14px; margin-top: 15px;">此操作不可恢复！</p>
            </div>
            <template #footer>
                <el-button @click="confirmClearDialogVisible = false">取消</el-button>
                <el-button type="danger" @click="confirmClearAll">确认清除</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { Search, ArrowRight, ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 持久化存储的 key
const STORAGE_KEY = 'bundle_generator_draft'

// 搜索相关
const isPreviewVisible = ref(false)
const hasGenerated = ref(false)
const searchQuery = ref('')
const searchType = ref('productName')
const filterZeroStock = ref(false)
const showSearchResultDialog = ref(false)
const suggestionUsed = ref(false)
const searchDialogResults = ref<any[]>([])
const dialogSelectedItems = ref<any[]>([])
const searchDialogTable = ref<any>(null)
const confirmClearDialogVisible = ref(false)

// 货组商品列表
const bundleItems = ref<any[]>([])

// A码库存缓存
const articleStockCache = ref<Map<string, number>>(new Map())

// 信息预览相关
const bundleName = ref('')
const endDate = ref('')
const createTime = ref('')
const virtualCode = ref('')
const selectedCategory = ref('')
const selectedProductType = ref('')
const selectedBySku = ref('')
const selectedFragrance = ref('')
const usageType = ref('cooperation')
const hasGiftBox = ref(false)

// 标签数据（从数据库动态加载）
const categories = ref<string[]>([])
const productTypes = ref<string[]>([])
const bySkuList = ref<string[]>([])
const fragrances = ref<string[]>([])

// 标签加载状态
const categoryLoading = ref(false)
const productTypeLoading = ref(false)
const bySkuLoading = ref(false)
const fragranceLoading = ref(false)

// 自动完成搜索建议
const querySearch = async (queryString: string, cb: any) => {

    if (!queryString || searchType.value !== 'productName' || suggestionUsed.value) {
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

// 选中搜索建议
const handleSelect = (item: any) => {
    searchQuery.value = item.value
    handleQuickSearch()
}

// 监听搜索词变化，清除"已使用建议"标志
watch(searchQuery, () => {
    // console.log("搜索词变化，重置 suggestionUsed")
    // console.log(suggestionUsed.value)
    suggestionUsed.value = false
})

// 快速搜索（打开关键信息列表弹窗）
const handleQuickSearch = async () => {
    if (!searchQuery.value.trim()) {
        ElMessage.warning('请输入搜索内容')
        return
    }

    try {
        console.log('搜索参数:', {
            query: searchQuery.value,
            type: searchType.value,
            filterZeroStock: filterZeroStock.value
        })

        const res = await (window as any).electronAPI.searchProductsByTypes(
            String(searchQuery.value),
            [searchType.value],
            Boolean(filterZeroStock.value)
        )

        console.log('搜索结果:', res)

        if (res && res.length > 0) {
            searchDialogResults.value = res
            showSearchResultDialog.value = true

            // 如果只有一个商品，自动勾选
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
        console.error('搜索错误详情:', e)
        ElMessage.error(`搜索出错: ${e.message || '未知错误'}`)
    }
}

// 关键信息列表选择
const handleDialogSelectionChange = (val: any[]) => {
    dialogSelectedItems.value = val
}

// 点击行时切换选中状态
const handleRowClick = (row: any) => {
    if (!searchDialogTable.value) return

    // 切换当前行的选中状态
    searchDialogTable.value.toggleRowSelection(row)
}

// 将选中的商品添加到货组
const addSelectedToBundl = () => {
    if (dialogSelectedItems.value.length === 0) {
        ElMessage.warning('请至少选择一个商品')
        return
    }
    suggestionUsed.value = true
    dialogSelectedItems.value.forEach(item => {
        // 检查是否已存在
        const exists = bundleItems.value.find(b => b.id === item.id)
        if (!exists) {
            bundleItems.value.push({
                ...item,
                type: 'main' // 默认为主品
            })
            // 查询A码库存总数
            if (item.article_code) {
                fetchArticleStockTotal(item.article_code)
            }
        }
    })

    ElMessage.success(`已添加 ${dialogSelectedItems.value.length} 个商品`)
    showSearchResultDialog.value = false
    dialogSelectedItems.value = []
}

// 从货组中移除商品
const removeFromBundle = (index: number) => {
    bundleItems.value.splice(index, 1)
}

// 获取指定A码的库存总数（从数据库查询）
const getArticleStockTotal = (articleCode: string) => {
    if (!articleCode) return 0
    // 从缓存中返回
    return articleStockCache.value.get(articleCode) || 0
}

// 查询A码库存总数
const fetchArticleStockTotal = async (articleCode: string) => {
    if (!articleCode || articleStockCache.value.has(articleCode)) return

    try {
        const res = await (window as any).electronAPI.getArticleStockTotal(articleCode)
        if (res && typeof res.total === 'number') {
            articleStockCache.value.set(articleCode, res.total)
        }
    } catch (e) {
        console.error('查询A码库存失败:', e)
    }
}

const mainValue = computed(() => {
    return bundleItems.value
        .filter(item => item.type === 'main')
        .reduce((sum, item) => sum + (item.cn_current_price || 0), 0)
        .toFixed(2)
})

const giftValue = computed(() => {
    return bundleItems.value
        .filter(item => item.type === 'gift')
        .reduce((sum, item) => sum + (item.cn_current_price || 0), 0)
        .toFixed(2)
})

const totalValue = computed(() => {
    return (parseFloat(mainValue.value) + parseFloat(giftValue.value)).toFixed(2)
})

// 生成虚拟编码
const generateVirtualCode = async () => {
    try {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')

        // 获取今天已有的货组数量
        const res = await (window as any).electronAPI.getTodayBundleCount()
        const sequence = String((res.count || 0) + 1).padStart(4, '0')

        let code = `BD${year}${month}${day}${sequence}`

        // 如果有礼盒，添加后缀
        if (hasGiftBox.value) {
            code = code + 'Gbox_'
        }

        return code
    } catch (e) {
        console.error('生成虚拟编码失败:', e)
        // 降级方案：使用时间戳
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const timestamp = String(now.getTime()).slice(-4)
        let code = `BD${year}${month}${day}${timestamp}`
        if (hasGiftBox.value) {
            code = code + 'Gbox_'

        }
        return code
    }
}

// 监听礼盒选项变化，自动更新虚拟编码
watch(hasGiftBox, async () => {
    if (virtualCode.value) {
        const baseCode = virtualCode.value.replace('Gbox_', '')
        virtualCode.value = hasGiftBox.value ? `Gbox_${baseCode}` : baseCode
    }
})

// 保存草稿到 localStorage
const saveDraft = () => {
    try {
        const draft = {
            bundleItems: bundleItems.value,
            bundleName: bundleName.value,
            endDate: endDate.value,
            createTime: createTime.value,
            virtualCode: virtualCode.value,
            selectedCategory: selectedCategory.value,
            selectedProductType: selectedProductType.value,
            selectedBySku: selectedBySku.value,
            selectedFragrance: selectedFragrance.value,
            usageType: usageType.value,
            hasGiftBox: hasGiftBox.value,
            isPreviewVisible: isPreviewVisible.value,
            hasGenerated: hasGenerated.value,
            articleStockCache: Array.from(articleStockCache.value.entries()),
            timestamp: Date.now()
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    } catch (e) {
        console.error('保存草稿失败:', e)
    }
}

// 从 localStorage 加载草稿
const loadDraft = () => {
    try {
        const draftStr = localStorage.getItem(STORAGE_KEY)
        if (!draftStr) return false

        const draft = JSON.parse(draftStr)

        // 恢复数据
        bundleItems.value = draft.bundleItems || []
        bundleName.value = draft.bundleName || ''
        endDate.value = draft.endDate || ''
        createTime.value = draft.createTime || ''
        virtualCode.value = draft.virtualCode || ''
        selectedCategory.value = draft.selectedCategory || ''
        selectedProductType.value = draft.selectedProductType || ''
        selectedBySku.value = draft.selectedBySku || ''
        selectedFragrance.value = draft.selectedFragrance || ''
        usageType.value = draft.usageType || 'cooperation'
        hasGiftBox.value = draft.hasGiftBox || false
        isPreviewVisible.value = draft.isPreviewVisible || false
        hasGenerated.value = draft.hasGenerated || false

        // 恢复 A码库存缓存
        if (draft.articleStockCache && Array.isArray(draft.articleStockCache)) {
            articleStockCache.value = new Map(draft.articleStockCache)
        }

        // 如果有商品，重新查询可能更新的A码库存
        bundleItems.value.forEach(item => {
            if (item.article_code) {
                fetchArticleStockTotal(item.article_code)
            }
        })
    } catch (e) {
        console.error('加载草稿失败:', e)
    }
}

// 清除草稿
const clearDraft = () => {
    try {
        localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
        console.error('清除草稿失败:', e)
    }
}

// 监听关键数据变化，自动保存草稿
watch([bundleItems, bundleName, endDate, selectedCategory, selectedProductType,
    selectedBySku, selectedFragrance, usageType, hasGiftBox, isPreviewVisible],
    () => {
        saveDraft()
    },
    { deep: true }
)

// 显示预览并准备保存
const showPreviewAndSave = async () => {
    // if (bundleItems.value.length === 0) {
    //     ElMessage.warning('请添加商品到货组')
    //     return
    // }

    // 生成创建时间和虚拟编码
    const now = new Date()
    createTime.value = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`
    virtualCode.value = await generateVirtualCode()
    ElMessage.success('请在右侧填写货组信息并保存')
    isPreviewVisible.value = true
    hasGenerated.value = true
}

const clearAllPreview = () => {
    if (bundleItems.value.length === 0 && !hasGenerated.value) {
        ElMessage.info('当前没有商品可清除')
        return
    }
    confirmClearDialogVisible.value = true
}

const confirmClearAll = () => {
    // 清空货组商品列表
    bundleItems.value = []

    // 清空A码库存缓存
    articleStockCache.value.clear()

    // 重置所有预览信息
    bundleName.value = ''
    endDate.value = ''
    createTime.value = ''
    virtualCode.value = ''
    selectedCategory.value = ''
    selectedProductType.value = ''
    selectedBySku.value = ''
    selectedFragrance.value = ''
    usageType.value = 'cooperation'
    hasGiftBox.value = false

    // 关闭预览面板
    isPreviewVisible.value = false
    hasGenerated.value = false

    // 清除持久化草稿
    clearDraft()

    // 关闭确认对话框
    confirmClearDialogVisible.value = false

    ElMessage.success('已清除所有商品和预览信息')
}

const togglePreview = () => {
    isPreviewVisible.value = !isPreviewVisible.value
}

// 保存货组
const saveBundle = async () => {
    // 验证必填项
    if (!bundleName.value) {
        ElMessage.warning('请输入货组名称')
        return
    }

    if (!endDate.value) {
        ElMessage.warning('请选择结束日期')
        return
    }

    if (!selectedCategory.value) {
        ElMessage.warning('请选择分类')
        return
    }

    if (!selectedProductType.value) {
        ElMessage.warning('请选择品类')
        return
    }

    if (!selectedBySku.value) {
        ElMessage.warning('请选择By-SKU')
        return
    }

    if (!selectedFragrance.value) {
        ElMessage.warning('请选择香型')
        return
    }

    if (bundleItems.value.length === 0) {
        ElMessage.warning('货组中没有商品')
        return
    }

    const bundleData = {
        name: bundleName.value,
        virtualCode: virtualCode.value,
        createTime: createTime.value,
        startDate: createTime.value,
        endDate: endDate.value,
        items: JSON.parse(JSON.stringify(bundleItems.value)),
        mainValue: parseFloat(mainValue.value),
        giftValue: parseFloat(giftValue.value),
        totalValue: parseFloat(totalValue.value),
        category: selectedCategory.value,
        productType: selectedProductType.value,
        bySku: selectedBySku.value,
        fragrance: selectedFragrance.value,
        usageType: usageType.value,
        hasGiftBox: hasGiftBox.value
    }

    try {
        const res = await (window as any).electronAPI.createBundle(bundleData)
        if (res.success) {
            ElMessage.success(`货组保存成功！虚拟编码：${virtualCode.value}`)
            // 重置表单
            bundleName.value = ''
            endDate.value = ''
            bundleItems.value = []
            createTime.value = ''
            virtualCode.value = ''
            selectedCategory.value = ''
            selectedProductType.value = ''
            selectedBySku.value = ''
            selectedFragrance.value = ''
            usageType.value = 'self'
            hasGiftBox.value = false

            // 清除持久化草稿
            clearDraft()
            isPreviewVisible.value = false
            hasGenerated.value = false
        } else {
            ElMessage.error('保存失败: ' + res.error)
        }
    } catch (e) {
        console.error(e)
        ElMessage.error('保存出错')
    }
}

// 搜索标签（远程搜索）- 输入框变动时立即搜索
const searchLabels = async (field: string, query: string) => {
    try {
        // 设置加载状态
        switch (field) {
            case 'category':
                categoryLoading.value = true
                break
            case 'productType':
                productTypeLoading.value = true
                break
            case 'bySku':
                bySkuLoading.value = true
                break
            case 'fragrance':
                fragranceLoading.value = true
                break
        }

        // 无论是否有查询内容，都执行搜索
        // 空查询会返回所有数据（由后端limit控制数量）
        const res = await (window as any).electronAPI.searchLabels(field, query || '')

        if (res.success) {
            // 更新对应的选项列表
            switch (field) {
                case 'category':
                    categories.value = res.data
                    break
                case 'productType':
                    productTypes.value = res.data
                    break
                case 'bySku':
                    bySkuList.value = res.data
                    break
                case 'fragrance':
                    fragrances.value = res.data
                    break
            }
        }
    } catch (e) {
        console.error('搜索标签失败:', e)
    } finally {
        // 清除加载状态
        categoryLoading.value = false
        productTypeLoading.value = false
        bySkuLoading.value = false
        fragranceLoading.value = false
    }
}

onMounted(() => {
    // 加载持久化的草稿数据
    loadDraft()
})

// 组件卸载前保存数据
onBeforeUnmount(() => {
    saveDraft()
})
</script>

<style scoped>
.bundle-generator {
    padding: 20px;
}

.mb-20 {
    margin-bottom: 20px;
}

/* 搜索区域 */
.search-area {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.search-type-radio {
    display: flex;
    align-items: center;
}

.search-input-row {
    display: flex;
    gap: 10px;
    align-items: center;
}

.search-input {
    flex: 1;
}

/* 货组操作区域 */
.bundle-actions {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #eee;
    display: flex;
    align-items: center;
}

/* 卡片标题 */
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-header>span {
    font-size: 18px;
    font-weight: bold;
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

/* 表格字号 */
:deep(.el-table) {
    font-size: 14px;
}

/* 总价值输入框样式 */
.total-value-input :deep(.el-input__inner) {
    font-weight: bold;
    font-size: 16px;
    color: #f56c6c;
}

/* 信息表格样式 */
.info-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.info-table td {
    padding: 10px;
    border-bottom: 1px solid #eee;
}

.info-table .label-cell {
    width: 100px;
    font-weight: 600;
    color: #606266;
    background-color: #fafafa;
    text-align: right;
    padding-right: 15px;
}

.info-table .value-cell {
    color: #303133;
    padding-left: 15px;
}

.info-table .total-value {
    font-weight: bold;
    font-size: 16px;
    color: #f56c6c;
}

.info-table .empty-row td {
    height: 20px;
    padding: 0;
    border-bottom: none;
}

/* 通用样式 */
.w-100 {
    width: 100%;
}

/* 统计数据样式 */
:deep(.el-statistic__content) {
    font-size: 18px;
    font-weight: bold;
}

:deep(.el-statistic__head) {
    font-size: 12px;
    color: #909399;
    margin-bottom: 5px;
}

/* 收缩按钮样式 */
.collapse-btn {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translate(-100%, -50%);
    width: 20px;
    height: 60px;
    background: #fff;
    border: 1px solid #dcdfe6;
    border-right: none;
    border-radius: 4px 0 0 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    box-shadow: -2px 0 4px rgba(0, 0, 0, 0.1);
}

.collapse-btn:hover {
    background-color: #f5f7fa;
    color: #409eff;
}

/* 展开按钮样式 */
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

/* 表单项间距 */
:deep(.el-form-item) {
    margin-bottom: 18px;
}

/* 分割线 */
:deep(.el-divider) {
    margin: 20px 0;
}
</style>
