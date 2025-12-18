<template>
    <div class="bundle-generator">
        <!-- 第一部分：搜索条件设置 -->
        <el-card class="box-card mb-20">
            <template #header>
                <div class="card-header">
                    <span>商品搜索</span>
                </div>
            </template>
            <div class="search-area">
                <el-checkbox-group v-model="searchTypes" class="search-type-group">
                    <el-checkbox label="productName">品名</el-checkbox>
                    <el-checkbox label="skuCode">SKU码</el-checkbox>
                    <el-checkbox label="articleCode">A码</el-checkbox>
                </el-checkbox-group>
                <div class="search-input-row">
                    <el-autocomplete v-model="searchQuery" :fetch-suggestions="querySearch"
                        placeholder="输入搜索内容（支持组合搜索：* 表示AND，+ 表示OR，- 表示NOT）" class="search-input" clearable size="large"
                        @keyup.enter="handleQuickSearch" @select="handleSelect">
                        <template #append>
                            <el-button :icon="Search" @click="handleQuickSearch" size="large" />
                        </template>
                    </el-autocomplete>
                    <el-checkbox v-model="filterZeroStock" size="large">过滤库存为0</el-checkbox>
                </div>
            </div>
        </el-card>

        <el-row :gutter="20">
            <!-- 第二部分：已选商品表格（左侧） -->
            <el-col :span="16">
                <el-card class="box-card" style="height: calc(100vh - 280px);"
                    :body-style="{ height: 'calc(100% - 56px)', display: 'flex', flexDirection: 'column' }">
                    <template #header>
                        <div class="card-header"
                            style="display: flex; justify-content: space-between; align-items: center;">
                            <span>生成货组</span>
                            <div>
                                <el-statistic title="SKU总数" :value="totalSkuCount"
                                    style="margin-right: 20px; display: inline-block;" />
                                <el-statistic title="A码库存总数" :value="totalArticleStock"
                                    style="display: inline-block;" />
                            </div>
                        </div>
                    </template>
                    <div style="flex: 1; overflow: auto;">
                        <el-table :data="bundleItems" border style="width: 100%;" max-height="calc(100vh - 420px)">
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
                            <el-table-column prop="product_name_cn" label="品名" min-width="200" show-overflow-tooltip />
                            <el-table-column prop="declared_content" label="规格" width="100" align="center" />
                            <el-table-column prop="cn_current_price" label="货值" width="100" align="right">
                                <template #default="scope">
                                    ¥{{ scope.row.cn_current_price || 0 }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="qty_available" label="库存" width="90" align="right">
                                <template #default="scope">
                                    <span style="font-weight: bold;">{{ scope.row.qty_available || 0 }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="100" align="center" fixed="right">
                                <template #default="scope">
                                    <el-button type="danger" link size="small"
                                        @click="removeFromBundle(scope.$index)">移除</el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                    <div class="bundle-actions">
                        <el-input-number v-model="newRowCount" :min="1" :max="50" size="large"
                            style="margin-right: 10px;" />
                        <el-button type="primary" @click="addEmptyRows" size="large">确定新增</el-button>
                        <el-button type="success" @click="showPreviewAndSave" size="large"
                            style="margin-left: 10px;">生成货组</el-button>
                    </div>
                </el-card>
            </el-col>

            <!-- 第三部分：信息预览（右侧） -->
            <el-col :span="8">
                <el-card class="box-card" style="height: calc(100vh - 280px); overflow: auto;">
                    <template #header>
                        <div class="card-header">
                            <span>信息预览</span>
                        </div>
                    </template>
                    <el-form label-position="top">
                        <el-form-item label="创建时间">
                            <el-input v-model="createTime" disabled size="large" />
                        </el-form-item>
                        <el-form-item label="虚拟编码">
                            <el-input v-model="virtualCode" disabled size="large" />
                        </el-form-item>
                        <el-form-item label="货组名称">
                            <el-input v-model="bundleName" placeholder="请输入货组名称" size="large" />
                        </el-form-item>
                        <el-form-item label="使用时间">
                            <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
                                start-placeholder="开始日期" end-placeholder="结束日期" style="width: 100%"
                                value-format="YYYY-MM-DD" size="large" />
                        </el-form-item>

                        <el-divider />

                        <el-form-item label="主品货值">
                            <el-input v-model="mainValue" disabled size="large">
                                <template #prepend>¥</template>
                            </el-input>
                        </el-form-item>
                        <el-form-item label="赠品货值">
                            <el-input v-model="giftValue" disabled size="large">
                                <template #prepend>¥</template>
                            </el-input>
                        </el-form-item>
                        <el-form-item label="总价值">
                            <el-input v-model="totalValue" disabled size="large" class="total-value-input">
                                <template #prepend>¥</template>
                            </el-input>
                        </el-form-item>

                        <el-divider />

                        <el-form-item label="标签分类">
                            <el-select v-model="selectedCategory" placeholder="请选择分类" size="large" style="width: 100%;">
                                <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="香型">
                            <el-select v-model="selectedFragrance" placeholder="请选择香型" size="large"
                                style="width: 100%;">
                                <el-option v-for="frag in fragrances" :key="frag" :label="frag" :value="frag" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="用途性质">
                            <el-radio-group v-model="usageType" size="large">
                                <el-radio label="cooperation">合作</el-radio>
                                <el-radio label="self">自营</el-radio>
                            </el-radio-group>
                        </el-form-item>
                        <el-form-item label="礼盒">
                            <el-radio-group v-model="hasGiftBox" size="large">
                                <el-radio :label="true">有</el-radio>
                                <el-radio :label="false">无</el-radio>
                            </el-radio-group>
                        </el-form-item>

                        <el-form-item>
                            <el-button type="primary" class="w-100" @click="saveBundle" size="large">保存货组</el-button>
                        </el-form-item>
                    </el-form>
                </el-card>
            </el-col>
        </el-row>

        <!-- 关键信息列表弹窗 -->
        <el-dialog v-model="showSearchResultDialog" title="关键信息列表" width="70%" append-to-body>
            <el-table :data="searchDialogResults" border style="width: 100%;" max-height="500"
                @selection-change="handleDialogSelectionChange">
                <el-table-column type="selection" width="55" />
                <el-table-column prop="product_name_cn" label="产品名称" min-width="200" show-overflow-tooltip />
                <el-table-column prop="article_code" label="A码" width="120" align="center" />
                <el-table-column prop="tu" label="SKU码" width="100" align="center" />
                <el-table-column prop="qty_available" label="库存数量" width="120" align="center">
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
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 搜索相关
const searchQuery = ref('')
const searchTypes = ref(['productName']) // 默认选中品名
const filterZeroStock = ref(false)
const showSearchResultDialog = ref(false)
const searchDialogResults = ref<any[]>([])
const dialogSelectedItems = ref<any[]>([])

// 货组商品列表
const bundleItems = ref<any[]>([])
const newRowCount = ref(1)

// 信息预览相关
const bundleName = ref('')
const dateRange = ref<[string, string] | ''>('')
const createTime = ref('')
const virtualCode = ref('')
const selectedCategory = ref('')
const selectedFragrance = ref('')
const usageType = ref('cooperation')
const hasGiftBox = ref(false)

// 标签数据（后续可从后端获取）
const categories = ref(['护肤', '彩妆', '香水', '个护', '其他'])
const fragrances = ref(['花香', '果香', '木质', '清新', '无香'])

// 自动完成搜索建议
const querySearch = async (queryString: string, cb: any) => {
    if (!queryString || !searchTypes.value.includes('productName')) {
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

    if (searchTypes.value.length === 0) {
        ElMessage.warning('请至少选择一种搜索类型')
        return
    }

    try {
        console.log('搜索参数:', {
            query: searchQuery.value,
            types: searchTypes.value,
            filterZeroStock: filterZeroStock.value
        })

        // 将响应式对象转换为普通对象，避免 IPC 克隆错误
        const res = await (window as any).electronAPI.searchProductsByTypes(
            String(searchQuery.value),
            JSON.parse(JSON.stringify(searchTypes.value)),
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

// 添加空行
const addEmptyRows = () => {
    for (let i = 0; i < newRowCount.value; i++) {
        bundleItems.value.push({
            id: `temp_${Date.now()}_${i}`,
            type: 'main',
            article_code: '',
            tu: '',
            product_name_cn: '',
            declared_content: '',
            cn_current_price: 0,
            qty_available: 0
        })
    }
    ElMessage.success(`已添加 ${newRowCount.value} 行`)
}

// 计算统计数据
const totalSkuCount = computed(() => bundleItems.value.length)
const totalArticleStock = computed(() => {
    const articleMap = new Map()
    bundleItems.value.forEach(item => {
        if (item.article_code) {
            const current = articleMap.get(item.article_code) || 0
            articleMap.set(item.article_code, current + (item.qty_available || 0))
        }
    })
    return Array.from(articleMap.values()).reduce((sum, val) => sum + val, 0)
})

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
const generateVirtualCode = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `BDL${year}${month}${day}${random}`
}

// 显示预览并准备保存
const showPreviewAndSave = () => {
    if (bundleItems.value.length === 0) {
        ElMessage.warning('请添加商品到货组')
        return
    }

    // 生成创建时间和虚拟编码
    const now = new Date()
    createTime.value = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`
    virtualCode.value = generateVirtualCode()

    ElMessage.success('货组信息已更新，请在右侧预览并保存')
}

// 保存货组
const saveBundle = async () => {
    if (!bundleName.value) {
        ElMessage.warning('请输入货组名称')
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
            selectedFragrance.value = ''
            usageType.value = 'cooperation'
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

.search-type-group {
    display: flex;
    gap: 20px;
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
