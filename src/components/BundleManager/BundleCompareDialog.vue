<template>
    <el-dialog :model-value="visible" title="货组比较" width="900px" destroy-on-close :before-close="handleClose" top="5vh">
        <div v-loading="loading" class="compare-container">
            <!-- Header -->
            <div class="compare-header">
                <div class="bundle-col">
                    <div class="bundle-title" :title="firstBundle?.name">{{ firstBundle?.name }}</div>
                    <div class="bundle-code">{{ firstBundle?.virtual_code }}</div>
                    <div class="bundle-meta">
                        货值: ¥{{ bundle1Detail?.total_value?.toFixed(2) || '-' }}
                    </div>
                </div>
                <div class="vs-col">VS</div>
                <div class="bundle-col">
                    <div class="bundle-title" :title="secondBundle?.name">{{ secondBundle?.name }}</div>
                    <div class="bundle-code">{{ secondBundle?.virtual_code }}</div>
                    <div class="bundle-meta">
                        货值: ¥{{ bundle2Detail?.total_value?.toFixed(2) || '-' }}
                    </div>
                </div>
            </div>

            <div class="scroll-content" v-if="!loading">
                <!-- Attributes Comparison -->
                <div class="section-title">
                    <span>基本信息</span>
                </div>
                <div class="compare-table info-table">
                    <div v-for="field in fields" :key="field.key" class="compare-row">
                        <div class="info-cell left-cell text-right" :class="{ 'matched': isFieldMatched(field) }">
                            {{ formatValue(bundle1Detail, field) }}
                        </div>
                        <div class="info-label-cell">
                            {{ field.label }}
                        </div>
                        <div class="info-cell right-cell" :class="{ 'matched': isFieldMatched(field) }">
                            {{ formatValue(bundle2Detail, field) }}
                        </div>
                    </div>
                </div>

                <!-- Main Products -->
                <div class="section-title">
                    <span>主品</span>
                    <span class="count-badge">({{ mainRows.length }})</span>
                </div>
                <div class="compare-table">
                    <div v-for="(row, index) in mainRows" :key="'main-' + index" class="compare-row">
                        <div class="product-cell left-cell" :class="{ 'empty': !row.left, 'matched': row.matched }">
                            <template v-if="row.left">
                                <div class="product-sku-row">
                                    <span class="sku">{{ row.left.sku }}</span>
                                    <!-- <span class="qty">x{{ row.left.quantity }}</span> -->
                                </div>
                                <div class="product-name" :title="row.left.product_name_cn">
                                    {{ row.left.product_name_cn }}
                                </div>
                            </template>
                        </div>
                        <div class="row-divider"></div>
                        <div class="product-cell right-cell" :class="{ 'empty': !row.right, 'matched': row.matched }">
                            <template v-if="row.right">
                                <div class="product-sku-row">
                                    <span class="sku">{{ row.right.sku }}</span>
                                    <!-- <span class="qty">x{{ row.right.quantity }}</span> -->
                                </div>
                                <div class="product-name" :title="row.right.product_name_cn">
                                    {{ row.right.product_name_cn }}
                                </div>
                            </template>
                        </div>
                    </div>
                    <div v-if="mainRows.length === 0" class="no-data">无主品</div>
                </div>

                <!-- Gifts -->
                <div class="section-title">
                    <span>赠品</span>
                    <span class="count-badge">({{ giftRows.length }})</span>
                </div>
                <div class="compare-table">
                    <div v-for="(row, index) in giftRows" :key="'gift-' + index" class="compare-row">
                        <div class="product-cell left-cell" :class="{ 'empty': !row.left, 'matched': row.matched }">
                            <template v-if="row.left">
                                <div class="product-sku-row">
                                    <span class="sku">{{ row.left.sku }}</span>
                                    <!-- <span class="qty">x{{ row.left.quantity }}</span> -->
                                </div>
                                <div class="product-name" :title="row.left.product_name_cn">
                                    {{ row.left.product_name_cn }}
                                </div>
                            </template>
                        </div>
                        <div class="row-divider"></div>
                        <div class="product-cell right-cell" :class="{ 'empty': !row.right, 'matched': row.matched }">
                            <template v-if="row.right">
                                <div class="product-sku-row">
                                    <span class="sku">{{ row.right.sku }}</span>
                                    <!-- <span class="qty">x{{ row.right.quantity }}</span> -->
                                </div>
                                <div class="product-name" :title="row.right.product_name_cn">
                                    {{ row.right.product_name_cn }}
                                </div>
                            </template>
                        </div>
                    </div>
                    <div v-if="giftRows.length === 0" class="no-data">无赠品</div>
                </div>
            </div>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { bundleApi, type BundleItem } from '../../api/bundle'

// Define a simpler interface for props to avoid type conflicts between API and Composable definitions
interface SimpleBundle {
    id: number
    name: string
    virtual_code: string
    [key: string]: any
}

// Internal detailed record from API
interface BundleDetailRecord extends SimpleBundle {
    items?: BundleItem[]
    total_value: number
}

const props = defineProps<{
    visible: boolean
    firstBundle: SimpleBundle | null
    secondBundle: SimpleBundle | null
}>()

const emit = defineEmits<{
    'update:visible': [value: boolean]
    'close': []
}>()

const loading = ref(false)
const bundle1Detail = ref<BundleDetailRecord | null>(null)
const bundle2Detail = ref<BundleDetailRecord | null>(null)

// Comparison fields configuration
const fields = [
    { label: '分类', key: 'category' },
    { label: '品类', key: 'product_type' },
    { label: 'By-sku', key: 'by_sku' },
    { label: '香型', key: 'fragrance' },
    {
        label: '用途',
        key: 'usage_type',
        formatter: (val: any) => val === 'cooperation' ? '合作' : (val === 'self' ? '自营' : val)
    },
    { label: '结束日期', key: 'end_date' },
    {
        label: '主品货值',
        key: 'main_value',
        formatter: (val: any) => typeof val === 'number' ? `¥${val.toFixed(2)}` : val
    },
    {
        label: '赠品货值',
        key: 'gift_value',
        formatter: (val: any) => typeof val === 'number' ? `¥${val.toFixed(2)}` : val
    },
    {
        label: '总货值',
        key: 'total_value',
        formatter: (val: any) => typeof val === 'number' ? `¥${val.toFixed(2)}` : val
    },
]

const formatValue = (bundle: any, field: any) => {
    if (!bundle) return '-'
    let val = bundle[field.key]

    if (val === undefined || val === null || val === '') return '-'

    if (field.formatter) {
        return field.formatter(val)
    }
    return val
}

const isFieldMatched = (field: any) => {
    if (!bundle1Detail.value || !bundle2Detail.value) return false
    const val1 = formatValue(bundle1Detail.value, field)
    const val2 = formatValue(bundle2Detail.value, field)
    return val1 !== '-' && val2 !== '-' && val1 === val2
}

const handleClose = () => {
    emit('update:visible', false)
    emit('close')
}

// Fetch details when dialog opens
watch(() => props.visible, async (val) => {
    if (val && props.firstBundle && props.secondBundle) {
        loading.value = true
        try {
            const [res1, res2] = await Promise.all([
                bundleApi.getBundleDetail(props.firstBundle.id),
                bundleApi.getBundleDetail(props.secondBundle.id)
            ])
            if (res1.success) bundle1Detail.value = res1.data
            if (res2.success) bundle2Detail.value = res2.data
        } catch (error) {
            console.error('Failed to fetch bundle details:', error)
        } finally {
            loading.value = false
        }
    } else {
        bundle1Detail.value = null
        bundle2Detail.value = null
    }
})

// Helper specific to formatting rows
interface CompareRow {
    left: BundleItem | undefined
    right: BundleItem | undefined
    matched?: boolean  // 标记两边是否相同
}

const buildRows = (type: 'main' | 'gift'): CompareRow[] => {
    let list1 = bundle1Detail.value?.items?.filter(item => item.type === type) || []
    let list2 = bundle2Detail.value?.items?.filter(item => item.type === type) || []

    // 先按 sku 排序
    list1 = [...list1].sort((a, b) => a.sku.localeCompare(b.sku))
    list2 = [...list2].sort((a, b) => a.sku.localeCompare(b.sku))

    const rows: CompareRow[] = []
    const used1 = new Set<number>()  // 追踪已使用的list1索引
    const used2 = new Set<number>()  // 追踪已使用的list2索引

    // 第一步：找出相同的SKU，放在同一行并置顶
    list1.forEach((item1, idx1) => {
        const idx2 = list2.findIndex((item2, i) => !used2.has(i) && item2.sku === item1.sku)
        if (idx2 !== -1) {
            rows.push({
                left: item1,
                right: list2[idx2],
                matched: true
            })
            used1.add(idx1)
            used2.add(idx2)
        }
    })

    // 第二步：添加未匹配的商品
    const unmatchedLeft = list1.filter((_, idx) => !used1.has(idx))
    const unmatchedRight = list2.filter((_, idx) => !used2.has(idx))

    const maxUnmatched = Math.max(unmatchedLeft.length, unmatchedRight.length)
    for (let i = 0; i < maxUnmatched; i++) {
        rows.push({
            left: unmatchedLeft[i],
            right: unmatchedRight[i],
            matched: false
        })
    }

    return rows
}

const mainRows = computed(() => buildRows('main'))
const giftRows = computed(() => buildRows('gift'))

</script>

<style scoped>
.compare-container {
    min-height: 400px;
    display: flex;
    flex-direction: column;
}

.compare-header {
    display: flex;
    align-items: center;
    padding-bottom: 20px;
    border-bottom: 1px solid #dcdfe6;
    margin-bottom: 20px;
}

.bundle-col {
    flex: 1;
    text-align: center;
    overflow: hidden;
}

.bundle-title {
    font-size: 16px;
    font-weight: bold;
    color: #303133;
    margin-bottom: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.bundle-code {
    font-size: 14px;
    color: #909399;
}

.bundle-meta {
    font-size: 13px;
    color: #409EFF;
    margin-top: 5px;
}

.vs-col {
    width: 60px;
    text-align: center;
    font-size: 24px;
    font-weight: bold;
    color: #E6A23C;
    font-style: italic;
}

.scroll-content {
    flex: 1;
    overflow-y: auto;
    padding-right: 5px;
}

.section-title {
    font-size: 15px;
    font-weight: bold;
    color: #606266;
    margin: 15px 0 10px;
    padding-left: 10px;
    border-left: 3px solid #409EFF;
    display: flex;
    align-items: center;
    gap: 5px;
}

.count-badge {
    color: #909399;
    font-weight: normal;
    font-size: 13px;
}

.compare-table {
    border: 1px solid #ebeef5;
    border-radius: 4px;
}

.compare-table.info-table {
    margin-bottom: 20px;
}

.compare-row {
    display: flex;
    border-bottom: 1px solid #ebeef5;
}

.compare-row:last-child {
    border-bottom: none;
}

.info-cell {
    flex: 1;
    padding: 8px 10px;
    font-size: 13px;
    color: #303133;
}

.info-cell.text-right {
    text-align: right;
}

.info-cell.matched {
    background-color: #f0f9f4;
}

.info-label-cell {
    width: 100px;
    background-color: #f5f7fa;
    color: #606266;
    font-weight: bold;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border-left: 1px solid #ebeef5;
    border-right: 1px solid #ebeef5;
}

.product-cell {
    flex: 1;
    padding: 10px;
    overflow: hidden;
}

.product-cell.empty {
    background-color: #fafafa;
}

.product-cell.left-cell {
    background-color: #fff;
}

.product-cell.right-cell {
    background-color: #fff;
}

/* 相同商品的绿色背景 */
.product-cell.matched {
    background-color: #f0f9f4;
}

.row-divider {
    width: 1px;
    background-color: #ebeef5;
}

.product-sku-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
    font-family: monospace;
}

.sku {
    color: #303133;
    font-weight: 600;
}

.qty {
    color: #67C23A;
    font-weight: bold;
}

.product-name {
    font-size: 12px;
    color: #606266;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
}

.no-data {
    text-align: center;
    color: #909399;
    padding: 20px;
    font-size: 13px;
}
</style>
