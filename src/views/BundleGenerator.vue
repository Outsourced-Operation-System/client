<template>
    <div class="bundle-generator">
        <el-row :gutter="20" style="height: calc(100vh - 80px);">
            <!-- 左侧列：搜索 + 列表 -->
            <el-col :span="16" style="height: 100%; display: flex; flex-direction: column;">
                <!-- 第一部分：搜索条件设置 -->
                <el-card class="box-card mb-20">
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
                <el-card class="box-card" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;"
                    :body-style="{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px' }">
                    <template #header>
                        <div class="card-header">
                            <span>生成货组</span>
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
                                    ¥{{ scope.row.cn_current_price || 0 }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="shelf_life" label="保质期" width="100" align="center">
                                <template #default="scope">
                                    {{ scope.row.shelf_life || '-' }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="product_name_en" label="英文名" min-width="150" show-overflow-tooltip />
                            <el-table-column label="操作" width="100" align="center" fixed="right">
                                <template #default="scope">
                                    <el-button type="danger" link size="small"
                                        @click="removeFromBundle(scope.$index)">移除</el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                    <div class="bundle-actions" style="display: flex; justify-content: flex-end;">
                        <el-button type="success" @click="showPreviewAndSave" size="large"
                            style="width: 200px;">生成货组</el-button>
                    </div>
                </el-card>
            </el-col>

            <!-- 第三部分：信息预览（右侧） -->
            <el-col :span="8" style="height: 102%">
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
                                        <td class="label-cell">日期范围</td>
                                        <td class="value-cell">
                                            <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
                                                start-placeholder="开始日期" end-placeholder="结束日期" size="mid"
                                                style="width: 93%;" value-format="YYYY-MM-DD" />
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
                                            <el-select v-model="selectedCategory" placeholder="请选择" size="mid"
                                                style="width: 100%;">
                                                <el-option v-for="cat in categories" :key="cat" :label="cat"
                                                    :value="cat" />
                                            </el-select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="label-cell">品类</td>
                                        <td class="value-cell">
                                            <el-select v-model="selectedProductType" placeholder="请选择" size="mid"
                                                style="width: 100%;">
                                                <el-option v-for="type in productTypes" :key="type" :label="type"
                                                    :value="type" />
                                            </el-select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="label-cell">By-SKU</td>
                                        <td class="value-cell">
                                            <el-select v-model="selectedBySku" placeholder="请选择" size="mid"
                                                style="width: 100%;">
                                                <el-option v-for="sku in bySkuList" :key="sku" :label="sku"
                                                    :value="sku" />
                                            </el-select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="label-cell">香型</td>
                                        <td class="value-cell">
                                            <el-select v-model="selectedFragrance" placeholder="请选择" size="mid"
                                                style="width: 100%;">
                                                <el-option v-for="frag in fragrances" :key="frag" :label="frag"
                                                    :value="frag" />
                                            </el-select>
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

        <!-- 关键信息列表弹窗 -->
        <el-dialog v-model="showSearchResultDialog" title="关键信息列表" width="55%" append-to-body>
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
                <el-button type="primary" @click="addSelectedToBundl">结果中搜索</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 搜索相关
const searchQuery = ref('')
const searchType = ref('productName') // 默认选中品名
const filterZeroStock = ref(false)
const showSearchResultDialog = ref(false)
const searchDialogResults = ref<any[]>([])
const dialogSelectedItems = ref<any[]>([])
const searchDialogTable = ref<any>(null)

// 货组商品列表
const bundleItems = ref<any[]>([])

// A码库存缓存
const articleStockCache = ref<Map<string, number>>(new Map())

// 信息预览相关
const bundleName = ref('')
const dateRange = ref<[string, string] | ''>('')
const createTime = ref('')
const virtualCode = ref('')
const selectedCategory = ref('')
const selectedProductType = ref('')
const selectedBySku = ref('')
const selectedFragrance = ref('')
const usageType = ref('self')
const hasGiftBox = ref(false)

// 标签数据（从label.md获取）
const categories = ref(['车载香氛', '身体护理', '家居香薰', '彩妆香水', '礼品'])
const productTypes = ref(['车载香氛', '发泡沐浴露', '护手霜', '磨砂膏', '沐浴油', '干爽护理油', '润肤乳', '香皂', '身体慕斯', '身体乳', '身体乳精华', '藤条香薰', '香氛喷雾', '香体喷雾', '香薰蜡烛', '官方礼盒', '自组套组混合品类', '非正装', '非卖品', '润手乳', '香水', '洗手液', '面霜', '洗洁精'])
const bySkuList = ref(['车载香氛', '车载香氛补充装', '发泡沐浴露', '发泡沐浴露*2', '发泡沐浴露*3', '护手霜', '护手霜*3', '磨砂膏', '磨砂膏*2', '沐浴油', '沐浴油*2', '沐浴油*3', '干爽护理油', '润肤乳', '香皂', '身体慕斯', '身体乳', '身体乳精华', '藤条香薰', '香氛喷雾', '香体喷雾', '香薰蜡烛', '自组套组单一品类', '自组套组混合品类', '非正装', '非卖品', '润手乳', '香水', '洗手液', '官方礼盒', '面霜', '洗洁精'])
const fragrances = ref(['阿姆斯特丹', '梵心', '赋能', '琥珀', '静', '夜樱', '樱花', '予善', '珍藏', '男士', '运动', '其它', '混合香气', '非卖品'])

// 自动完成搜索建议
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

// 选中搜索建议
const handleSelect = (item: any) => {
    searchQuery.value = item.value
    handleQuickSearch()
}

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
            code += '(_box)'
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
            code += '(_box)'
        }
        return code
    }
}

// 监听礼盒选项变化，自动更新虚拟编码
watch(hasGiftBox, async () => {
    if (virtualCode.value) {
        // 移除旧的(_box)后缀
        const baseCode = virtualCode.value.replace('(_box)', '')
        // 根据当前礼盒状态添加或不添加后缀
        virtualCode.value = hasGiftBox.value ? `${baseCode}(_box)` : baseCode
    }
})

// 显示预览并准备保存
const showPreviewAndSave = async () => {
    if (bundleItems.value.length === 0) {
        ElMessage.warning('请添加商品到货组')
        return
    }

    // 生成创建时间和虚拟编码
    const now = new Date()
    createTime.value = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`
    virtualCode.value = await generateVirtualCode()

    ElMessage.success('货组信息已更新，请在右侧预览并保存')
}

// 保存货组
const saveBundle = async () => {
    // 验证必填项
    if (!bundleName.value) {
        ElMessage.warning('请输入货组名称')
        return
    }

    if (!dateRange.value || dateRange.value.length !== 2) {
        ElMessage.warning('请选择日期范围')
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
        startDate: dateRange.value ? dateRange.value[0] : '',
        endDate: dateRange.value ? dateRange.value[1] : '',
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
            dateRange.value = ''
            bundleItems.value = []
            createTime.value = ''
            virtualCode.value = ''
            selectedCategory.value = ''
            selectedProductType.value = ''
            selectedBySku.value = ''
            selectedFragrance.value = ''
            usageType.value = 'self'
            hasGiftBox.value = false
        } else {
            ElMessage.error('保存失败: ' + res.error)
        }
    } catch (e) {
        console.error(e)
        ElMessage.error('保存出错')
    }
}

onMounted(() => {
    // 初始化
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
.card-header span {
    font-size: 18px;
    font-weight: bold;
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

/* 表单项间距 */
:deep(.el-form-item) {
    margin-bottom: 18px;
}

/* 分割线 */
:deep(.el-divider) {
    margin: 20px 0;
}
</style>
