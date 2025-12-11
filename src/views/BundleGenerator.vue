<template>
    <div class="bundle-generator">
        <el-row :gutter="20">
            <el-col :span="18">
                <el-card class="box-card mb-20"
                    style="height: calc(100vh - 100px); display: flex; flex-direction: column;"
                    :body-style="{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }">
                    <template #header>
                        <div class="card-header">
                            <span>商品搜索</span>
                        </div>
                    </template>
                    <div class="search-area">
                        <el-input v-model="searchQuery" placeholder="输入商品名称、编码或TU" class="search-input" clearable
                            size="large" @keyup.enter="handleSearch">
                            <template #append>
                                <el-button :icon="Search" @click="handleSearch" size="large" />
                            </template>
                        </el-input>
                        <el-button @click="resetSearch" size="large">重置</el-button>
                        <el-checkbox v-model="filterZeroStock" @change="handleSearch"
                            size="large">过滤库存为0的商品</el-checkbox>
                        <!-- <el-checkbox v-model="filterNoInfo" @change="handleSearch" size="large">过滤无产品信息的商品</el-checkbox> -->
                    </div>

                    <!-- <el-table :data="searchResults" style="width: 100%; margin-top: 20px; flex: 1" border
                        @selection-change="handleSelectionChange" height="100%"> -->
                    <div class="table-wrapper"
                        :class="{ 'show-left-fade': showLeftFade, 'show-right-fade': showRightFade, 'show-top-fade': showTopFade, 'show-bottom-fade': showBottomFade }">
                        <el-table ref="tableRef" :data="searchResults" style="width: 100%;" border
                            @selection-change="handleSelectionChange" @sort-change="handleSortChange"
                            :default-sort="{ prop: sortProp, order: sortOrder }" max-height="calc(100vh - 360px)"
                            row-key="id">
                            <el-table-column type="selection" width="55" :reserve-selection="true" />
                            <el-table-column label="主品/赠品" width="100" align="center">
                                <template #default="scope">
                                    <el-select v-model="scope.row.type" placeholder="选择类型" size="small"
                                        @change="updateSelectedType(scope.row)">
                                        <el-option label="主品" value="main" />
                                        <el-option label="赠品" value="gift" />
                                    </el-select>
                                </template>
                            </el-table-column>
                            <el-table-column prop="article_code" label="A码" width="110" align="center"
                                sortable="custom" />
                            <el-table-column prop="tu" label="TU" width="90" align="center" sortable="custom" />
                            <el-table-column prop="product_name_cn" label="品名" min-width="250" show-overflow-tooltip
                                align="center" sortable="custom" />
                            <el-table-column prop="declared_content" label="规格" width="100" align="center"
                                sortable="custom" />
                            <el-table-column prop="cn_current_price" label="货值" width="90" align="right"
                                sortable="custom">
                                <template #default="scope">
                                    ¥{{ scope.row.cn_current_price || 0 }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="qty_available" label="库存" width="90" align="right" sortable>
                                <template #default="scope">
                                    <span style="font-weight: bold;">
                                        {{ scope.row.qty_available || 0 }}
                                    </span>
                                </template>
                            </el-table-column>
                            <el-table-column prop="category" label="类别" min-width="120" show-overflow-tooltip
                                align="center" sortable />
                            <el-table-column prop="product_name_en" label="商品英文名称" min-width="180" show-overflow-tooltip
                                sortable />
                            <el-table-column prop="shelf_life" label="保质期" width="95" sortable />
                            <el-table-column prop="net_weight" label="净重" width="90" sortable />
                            <el-table-column prop="item_size" label="尺寸" width="130" show-overflow-tooltip sortable />
                            <el-table-column prop="country_of_origin" label="原产国" width="95" sortable />
                        </el-table>
                    </div>
                    <div class="pagination-container">
                        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                            :page-sizes="[10, 15, 20, 50, 100]" :total="total" background
                            layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
                            @current-change="handleCurrentChange" />
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card class="box-card mb-20">
                    <template #header>
                        <div class="card-header"
                            style="display: flex; justify-content: space-between; align-items: center;">
                            <span>已选商品</span>
                            <el-button type="primary" link @click="showSelectedDialog = true">查看已选</el-button>
                        </div>
                    </template>
                    <div class="selected-summary">
                        <div class="summary-item">
                            <span>主品：</span>
                            <span class="value">{{ mainCount }}个</span>
                        </div>
                        <div class="summary-item">
                            <span>赠品：</span>
                            <span class="value">{{ giftCount }}个</span>
                        </div>
                        <div class="summary-item total">
                            <span>总货值：</span>
                            <span class="value price">¥{{ totalValue }}</span>
                        </div>
                    </div>
                </el-card>

                <el-card class="box-card">
                    <template #header>
                        <div class="card-header">
                            <span>生成设置</span>
                        </div>
                    </template>
                    <el-form label-position="top">
                        <el-form-item label="货组名称">
                            <el-input v-model="bundleName" placeholder="请输入货组名称" size="large" />
                        </el-form-item>
                        <el-form-item label="使用时间">
                            <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
                                start-placeholder="开始日期" end-placeholder="结束日期" style="width: 100%"
                                value-format="YYYY-MM-DD" size="large" />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" class="w-100" @click="generateBundle"
                                size="large">生成货组</el-button>
                        </el-form-item>
                    </el-form>
                </el-card>
            </el-col>
        </el-row>

        <el-dialog v-model="showSelectedDialog" title="已选商品明细" width="50%" append-to-body>
            <h3>主品 ({{ mainCount }})</h3>
            <div class="table-wrapper"
                :class="{ 'show-left-fade': showMainLeftFade, 'show-right-fade': showMainRightFade, 'show-top-fade': showMainTopFade, 'show-bottom-fade': showMainBottomFade }">
                <el-table ref="mainTableRef" :data="selectedMainList" border style="width: 100%; margin-bottom: 20px"
                    max-height="300">
                    <el-table-column prop="article_code" label="A码" min-width="120" align="center" />
                    <el-table-column prop="tu" label="TU" min-width="80" align="center" />
                    <el-table-column prop="product_name_cn" label="品名" min-width="200" align="center"
                        show-overflow-tooltip />
                    <el-table-column prop="qty_available" label="库存" min-width="80" align="center" />
                    <el-table-column label="类型" min-width="100" align="center">
                        <template #default="scope">
                            <el-button type="primary" link size="small" @click="toggleType(scope.row)">
                                转为赠品
                            </el-button>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" min-width="80" align="center">
                        <template #default="scope">
                            <el-button type="danger" link @click="removeSelectedItem(scope.row)">移除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <h3>赠品 ({{ giftCount }})</h3>
            <div class="table-wrapper"
                :class="{ 'show-left-fade': showGiftLeftFade, 'show-right-fade': showGiftRightFade, 'show-top-fade': showGiftTopFade, 'show-bottom-fade': showGiftBottomFade }">
                <el-table ref="giftTableRef" :data="selectedGiftList" border style="width: 100%" max-height="300">
                    <el-table-column prop="article_code" label="A码" min-width="120" align="center" />
                    <el-table-column prop="tu" label="TU" min-width="80" align="center" />
                    <el-table-column prop="product_name_cn" label="品名" min-width="200" align="center"
                        show-overflow-tooltip />
                    <el-table-column prop="qty_available" label="库存" min-width="80" align="center" />
                    <el-table-column label="类型" min-width="100" align="center">
                        <template #default="scope">
                            <el-button type="primary" link size="small" @click="toggleType(scope.row)">
                                转为主品
                            </el-button>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" min-width="80" align="center">
                        <template #default="scope">
                            <el-button type="danger" link @click="removeSelectedItem(scope.row)">移除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const searchQuery = ref('')
const bundleName = ref('')
const dateRange = ref('')
const searchResults = ref<any[]>([])
const selectedItems = ref<any[]>([])
const tableRef = ref()
const mainTableRef = ref()
const giftTableRef = ref()
const showSelectedDialog = ref(false)

const filterZeroStock = ref(false)
// const filterNoInfo = ref(false)

// 主表格渐隐状态
const showLeftFade = ref(false)
const showRightFade = ref(true)
const showTopFade = ref(false)
const showBottomFade = ref(true)

// 弹窗主品表格渐隐状态
const showMainLeftFade = ref(false)
const showMainRightFade = ref(false)
const showMainTopFade = ref(false)
const showMainBottomFade = ref(false)

// 弹窗赠品表格渐隐状态
const showGiftLeftFade = ref(false)
const showGiftRightFade = ref(false)
const showGiftTopFade = ref(false)
const showGiftBottomFade = ref(false)

const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const sortProp = ref('')
const sortOrder = ref('')

const handleSearch = async () => {
    try {
        const res = await (window as any).electronAPI.searchProducts(
            searchQuery.value,
            currentPage.value,
            pageSize.value,
            sortProp.value,
            sortOrder.value,
            filterZeroStock.value,
            // filterNoInfo.value
        )

        const processList = (list: any[]) => {
            return list.map((item: any) => {
                const selected = selectedItems.value.find(s => s.id === item.id)
                return {
                    ...item,
                    type: selected ? selected.type : 'main'
                }
            })
        }

        if (res && res.list) {
            searchResults.value = processList(res.list)
            total.value = res.total
        } else if (Array.isArray(res)) {
            // Fallback just in case
            searchResults.value = processList(res)
            total.value = res.length
        }
    } catch (e) {
        console.error(e)
    }
}

const updateSelectedType = (row: any) => {
    const item = selectedItems.value.find(i => i.id === row.id)
    if (item) {
        item.type = row.type
    }
}

const handleSizeChange = (val: number) => {
    pageSize.value = val
    handleSearch()
}

const handleCurrentChange = (val: number) => {
    currentPage.value = val
    handleSearch()
}

const resetSearch = () => {
    searchQuery.value = ''
    currentPage.value = 1
    handleSearch()
}

const handleSortChange = ({ prop, order }: { prop: string, order: string | null }) => {
    sortProp.value = prop || ''
    sortOrder.value = order || ''
    currentPage.value = 1  // 排序时重置到第一页
    handleSearch()
}

const checkTableScroll = () => {
    nextTick(() => {
        const tableEl = tableRef.value?.$el
        if (!tableEl) return
        const scrollWrapper = tableEl.querySelector('.el-scrollbar__wrap')
        if (!scrollWrapper) return

        const { scrollLeft, scrollWidth, clientWidth, scrollTop, scrollHeight, clientHeight } = scrollWrapper
        showLeftFade.value = scrollLeft > 0
        showRightFade.value = scrollLeft + clientWidth < scrollWidth - 1
        showTopFade.value = scrollTop > 0
        showBottomFade.value = scrollTop + clientHeight < scrollHeight - 1
    })
}

const checkMainTableScroll = () => {
    nextTick(() => {
        const tableEl = mainTableRef.value?.$el
        if (!tableEl) return
        const scrollWrapper = tableEl.querySelector('.el-scrollbar__wrap')
        if (!scrollWrapper) return

        const { scrollLeft, scrollWidth, clientWidth, scrollTop, scrollHeight, clientHeight } = scrollWrapper
        showMainLeftFade.value = scrollLeft > 0
        showMainRightFade.value = scrollLeft + clientWidth < scrollWidth - 1
        showMainTopFade.value = scrollTop > 0
        showMainBottomFade.value = scrollTop + clientHeight < scrollHeight - 1
    })
}

const checkGiftTableScroll = () => {
    nextTick(() => {
        const tableEl = giftTableRef.value?.$el
        if (!tableEl) return
        const scrollWrapper = tableEl.querySelector('.el-scrollbar__wrap')
        if (!scrollWrapper) return

        const { scrollLeft, scrollWidth, clientWidth, scrollTop, scrollHeight, clientHeight } = scrollWrapper
        showGiftLeftFade.value = scrollLeft > 0
        showGiftRightFade.value = scrollLeft + clientWidth < scrollWidth - 1
        showGiftTopFade.value = scrollTop > 0
        showGiftBottomFade.value = scrollTop + clientHeight < scrollHeight - 1
    })
}

const setupTableScrollListener = () => {
    nextTick(() => {
        const tableEl = tableRef.value?.$el
        if (!tableEl) return
        const scrollWrapper = tableEl.querySelector('.el-scrollbar__wrap')
        if (!scrollWrapper) return

        scrollWrapper.addEventListener('scroll', checkTableScroll)
        checkTableScroll()
    })
}

const setupDialogTableScrollListeners = () => {
    nextTick(() => {
        // 设置主品表格监听
        const mainTableEl = mainTableRef.value?.$el
        if (mainTableEl) {
            const mainScrollWrapper = mainTableEl.querySelector('.el-scrollbar__wrap')
            if (mainScrollWrapper) {
                mainScrollWrapper.addEventListener('scroll', checkMainTableScroll)
                checkMainTableScroll()
            }
        }

        // 设置赠品表格监听
        const giftTableEl = giftTableRef.value?.$el
        if (giftTableEl) {
            const giftScrollWrapper = giftTableEl.querySelector('.el-scrollbar__wrap')
            if (giftScrollWrapper) {
                giftScrollWrapper.addEventListener('scroll', checkGiftTableScroll)
                checkGiftTableScroll()
            }
        }
    })
}

onMounted(() => {
    handleSearch()
    setupTableScrollListener()
})

watch(searchResults, () => {
    checkTableScroll()
})

watch(showSelectedDialog, (val) => {
    if (val) {
        setupDialogTableScrollListeners()
    }
})

const handleSelectionChange = (val: any[]) => {
    selectedItems.value = val
}


const mainCount = computed(() => selectedItems.value.filter((i: any) => i.type === 'main').length)
const giftCount = computed(() => selectedItems.value.filter((i: any) => i.type === 'gift').length)
const totalValue = computed(() => selectedItems.value.reduce((sum: number, i: any) => sum + (i.cn_current_price || 0), 0))

const selectedMainList = computed(() => selectedItems.value.filter(i => i.type === 'main'))
const selectedGiftList = computed(() => selectedItems.value.filter(i => i.type === 'gift'))

watch([selectedMainList, selectedGiftList], () => {
    if (showSelectedDialog.value) {
        checkMainTableScroll()
        checkGiftTableScroll()
    }
})

const toggleType = (row: any) => {
    row.type = row.type === 'main' ? 'gift' : 'main'
    handleDialogTypeChange(row)
}

const handleDialogTypeChange = (row: any) => {
    const inSearch = searchResults.value.find(r => r.id === row.id)
    if (inSearch) {
        inSearch.type = row.type
    }
}

const removeSelectedItem = (row: any) => {
    if (tableRef.value) {
        const inSearch = searchResults.value.find(r => r.id === row.id)
        if (inSearch) {
            tableRef.value.toggleRowSelection(inSearch, false)
        } else {
            tableRef.value.toggleRowSelection(row, false)
        }
    }
}

const generateBundle = async () => {
    if (!bundleName.value) {
        ElMessage.warning('请输入货组名称')
        return
    }
    if (selectedItems.value.length === 0) {
        ElMessage.warning('请选择商品')
        return
    }

    const bundleData = {
        name: bundleName.value,
        startDate: dateRange.value ? dateRange.value[0] : '',
        endDate: dateRange.value ? dateRange.value[1] : '',
        items: JSON.parse(JSON.stringify(selectedItems.value)), // Deep copy to avoid proxy issues
        totalValue: totalValue.value
    }

    try {
        const res = await (window as any).electronAPI.createBundle(bundleData)
        if (res.success) {
            ElMessage.success(`货组生成成功，虚拟编码：${res.virtualCode}`)
            bundleName.value = ''
            dateRange.value = ''
            selectedItems.value = []
            // searchResults.value = [] // Keep search results
        } else {
            ElMessage.error('生成失败: ' + res.error)
        }
    } catch (e) {
        ElMessage.error('生成出错')
    }
}
</script>

<style scoped>
.mb-20 {
    margin-bottom: 20px;
}

.search-area {
    display: flex;
    gap: 10px;
    align-items: center;
}

.search-input {
    width: 300px;
}

.selected-summary {
    padding: 10px 0;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 14px;
}

.summary-item.total {
    margin-top: 20px;
    font-weight: bold;
    font-size: 16px;
    border-top: 1px solid #eee;
    padding-top: 10px;
}

.price {
    color: #f56c6c;
}

.w-100 {
    width: 100%;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

/* 模块标题 */
.card-header span {
    font-size: 20px;
    font-weight: bold;
}

/* 表格内容字号 */
:deep(.el-table) {
    font-size: 14px;
}

/* 辅助说明字号 */
:deep(.el-upload__tip) {
    font-size: 12px;
}

.col-bold {
    font-weight: bold;
}

/* 表格渐隐效果 */
.table-wrapper {
    position: relative;
    margin-top: 20px;
}

/* 左右渐隐 */
.table-wrapper::before,
.table-wrapper::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 12px;
    width: 40px;
    pointer-events: none;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.table-wrapper::before {
    left: 0;
    background: linear-gradient(to right, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0));
}

.table-wrapper::after {
    right: 0;
    background: linear-gradient(to left, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0));
}

.table-wrapper.show-left-fade::before {
    opacity: 1;
}

.table-wrapper.show-right-fade::after {
    opacity: 1;
}

.table-wrapper :deep(.el-table__body-wrapper)::before,
.table-wrapper :deep(.el-table__body-wrapper)::after {
    content: '';
    position: absolute;
    left: 0;
    right: 12px;
    height: 30px;
    pointer-events: none;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.table-wrapper :deep(.el-table__body-wrapper)::before {
    top: 0;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0));
}

.table-wrapper :deep(.el-table__body-wrapper)::after {
    bottom: 0;
    background: linear-gradient(to top, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0));
}

.table-wrapper.show-top-fade :deep(.el-table__body-wrapper)::before {
    opacity: 1;
}

.table-wrapper.show-bottom-fade :deep(.el-table__body-wrapper)::after {
    opacity: 1;
}
</style>
