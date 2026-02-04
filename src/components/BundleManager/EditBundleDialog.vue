<template>
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false"
        @close="handleClose">
        <div class="edit-bundle-content" v-loading="loading">
            <table class="info-table">
                <tbody>
                    <tr>
                        <td class="label-cell">虚拟编码</td>
                        <td class="value-cell">{{ formData.virtual_code || '-' }}</td>
                    </tr>
                    <tr>
                        <td class="label-cell">{{ isChildBundle ? '更新时间' : '创建时间' }}</td>
                        <td class="value-cell">{{ formData.create_date || '-' }}</td>
                    </tr>
                    <tr>
                        <td class="label-cell">主品货值</td>
                        <td class="value-cell">¥{{ formData.main_value?.toFixed(2) || '0.00' }}</td>
                    </tr>
                    <tr>
                        <td class="label-cell">赠品货值</td>
                        <td class="value-cell">¥{{ formData.gift_value?.toFixed(2) || '0.00' }}</td>
                    </tr>
                    <tr>
                        <td class="label-cell">总货值</td>
                        <td class="value-cell total-value">¥{{ formData.total_value?.toFixed(2) || '0.00' }}</td>
                    </tr>
                    <tr class="empty-row">
                        <td colspan="2"></td>
                    </tr>
                    <tr>
                        <td class="label-cell">货组名称</td>
                        <td class="value-cell">
                            <el-input v-model="formData.name" placeholder="请输入货组名称" />
                        </td>
                    </tr>
                    <tr>
                        <td class="label-cell">用途</td>
                        <td class="value-cell">
                            <el-radio-group v-model="formData.usage_type">
                                <el-radio label="cooperation">合作</el-radio>
                                <el-radio label="self">自营</el-radio>
                            </el-radio-group>
                        </td>
                    </tr>
                    <tr>
                        <td class="label-cell">分类</td>
                        <td class="value-cell">
                            <div style="display: flex;">
                                <el-select v-model="formData.category" placeholder="输入关键字搜索" style="flex: 1;" filterable
                                    remote :remote-method="(q: string) => searchLabels('category', q)"
                                    :loading="categoryLoading">
                                    <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
                                </el-select>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td class="label-cell">品类</td>
                        <td class="value-cell">
                            <div style="display: flex;">
                                <el-select v-model="formData.product_type" placeholder="输入关键字搜索" style="flex: 1;"
                                    filterable remote :remote-method="(q: string) => searchLabels('productType', q)"
                                    :loading="productTypeLoading">
                                    <el-option v-for="type in productTypes" :key="type" :label="type" :value="type" />
                                </el-select>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td class="label-cell">By-SKU</td>
                        <td class="value-cell">
                            <div style="display: flex;">
                                <el-select v-model="formData.by_sku" placeholder="输入关键字搜索" style="flex: 1;" filterable
                                    remote :remote-method="(q: string) => searchLabels('bySku', q)"
                                    :loading="bySkuLoading">
                                    <el-option v-for="sku in bySkuList" :key="sku" :label="sku" :value="sku" />
                                </el-select>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td class="label-cell">香型</td>
                        <td class="value-cell">
                            <div style="display: flex;">
                                <el-select v-model="formData.fragrance" placeholder="输入关键字搜索" style="flex: 1;"
                                    filterable remote :remote-method="(q: string) => searchLabels('fragrance', q)"
                                    :loading="fragranceLoading">
                                    <el-option v-for="frag in fragrances" :key="frag" :label="frag" :value="frag" />
                                </el-select>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td class="label-cell">结束日期</td>
                        <td class="value-cell">
                            <el-date-picker v-model="formData.end_date" type="date" placeholder="请选择结束日期"
                                style="width: 100%;" value-format="YYYY-MM-DD" />
                        </td>
                    </tr>
                    <tr>
                        <td class="label-cell">状态</td>
                        <td class="value-cell">
                            <el-radio-group v-model="formData.status">
                                <el-radio label="有效">有效</el-radio>
                                <el-radio label="失效">失效</el-radio>
                            </el-radio-group>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleEditProducts" type="primary" plain>
                    <el-icon style="margin-right: 4px;">
                        <Edit />
                    </el-icon>
                    商品编辑
                </el-button>
                <div>
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
                </div>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'
import type { BundleRecord } from '../../composables/BundleManager'
import { labelApi, bundleApi } from '@/api'

interface BundleDetail extends BundleRecord {
    items?: any[]
    category?: string
    product_type?: string
    by_sku?: string
    fragrance?: string
    parent_id?: number | null
}

const props = defineProps<{
    modelValue: boolean
    bundleData: BundleRecord | null
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'saved': []
}>()

const router = useRouter()

const dialogVisible = ref(false)
const loading = ref(false)
const saving = ref(false)

// 判断是否是子货组
const isChildBundle = computed(() => {
    return !!(props.bundleData as any)?.isChild || !!(formData.parent_id)
})

// 对话框标题
const dialogTitle = computed(() => {
    return isChildBundle.value ? '编辑子货组' : '编辑货组'
})

// 表单数据
const formData = reactive<BundleDetail>({
    id: 0,
    virtual_code: '',
    name: '',
    create_date: '',
    end_date: '',
    usage_type: 'cooperation',
    total_value: 0,
    main_value: 0,
    gift_value: 0,
    category: '',
    product_type: '',
    by_sku: '',
    fragrance: '',
    status: '有效',
    parent_id: null
})

// 标签选项
const categories = ref<string[]>([])
const productTypes = ref<string[]>([])
const bySkuList = ref<string[]>([])
const fragrances = ref<string[]>([])

// 加载状态
const categoryLoading = ref(false)
const productTypeLoading = ref(false)
const bySkuLoading = ref(false)
const fragranceLoading = ref(false)

// 监听 v-model 和 bundleData 变化
watch([() => props.modelValue, () => props.bundleData?.id], ([visible, bundleId], [oldVisible, oldBundleId]) => {
    dialogVisible.value = visible
    // 当对话框打开且 bundleId 存在时加载数据
    // 需要在以下情况加载：1. 对话框刚打开 2. bundleId 发生变化
    if (visible && bundleId && (visible !== oldVisible || bundleId !== oldBundleId)) {
        loadBundleDetail(bundleId)
    }
}, { immediate: true })

watch(dialogVisible, (val) => {
    emit('update:modelValue', val)
})

// 搜索标签
const searchLabels = async (field: string, query: string) => {
    try {
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

        const res = await labelApi.searchLabels(field, query || '')
        console.log(res)
        if (res) {
            switch (field) {
                case 'category':
                    categories.value = res
                    break
                case 'productType':
                    productTypes.value = res
                    break
                case 'bySku':
                    bySkuList.value = res
                    break
                case 'fragrance':
                    fragrances.value = res
                    break
            }
        }
    } catch (e) {
        console.error('搜索标签失败:', e)
    } finally {
        categoryLoading.value = false
        productTypeLoading.value = false
        bySkuLoading.value = false
        fragranceLoading.value = false
    }
}

// 加载货组详情
const loadBundleDetail = async (bundleId: number) => {
    loading.value = true
    try {
        const res = await bundleApi.getBundleDetail(bundleId)
        console.log('货组详情:', res)
        if (res && res.success) {
            const data = res.data
            Object.assign(formData, {
                id: data.id,
                virtual_code: data.virtual_code,
                name: data.name,
                create_date: data.create_date,
                end_date: data.end_date,
                usage_type: data.usage_type,
                total_value: data.total_value,
                main_value: data.main_value,
                gift_value: data.gift_value,
                category: data.category || '',
                product_type: data.product_type || '',
                by_sku: data.by_sku || '',
                fragrance: data.fragrance || '',
                status: data.status,
                items: data.items || [],
                parent_id: data.parent_id || null
            })

            // 初始化标签选项，确保当前值在列表中
            if (formData.category) categories.value = [formData.category]
            if (formData.product_type) productTypes.value = [formData.product_type]
            if (formData.by_sku) bySkuList.value = [formData.by_sku]
            if (formData.fragrance) fragrances.value = [formData.fragrance]
        } else {
            ElMessage.error('获取货组详情失败')
        }
    } catch (e) {
        console.error('加载货组详情失败:', e)
        ElMessage.error('加载货组详情失败')
    } finally {
        loading.value = false
    }
}

// 保存
const handleSave = async () => {
    if (!formData.name?.trim()) {
        ElMessage.warning('请输入货组名称')
        return
    }

    saving.value = true
    try {
        const res = await bundleApi.updateBundle({
            id: formData.id,
            name: formData.name,
            end_date: formData.end_date,
            usage_type: formData.usage_type,
            category: formData.category,
            product_type: formData.product_type,
            by_sku: formData.by_sku,
            fragrance: formData.fragrance,
            status: formData.status
        })

        if (res.success) {
            // 判断是更新父货组还是创建了新的子货组
            if (res.newBundleId) {
                ElMessage.success('已创建新版本货组')
            } else {
                ElMessage.success('保存成功')
            }
            dialogVisible.value = false
            emit('saved')
        } else {
            ElMessage.error(res.error || '保存失败')
        }
    } catch (e) {
        console.error('保存失败:', e)
        ElMessage.error('保存失败')
    } finally {
        saving.value = false
    }
}

// 编辑商品
const handleEditProducts = () => {
    if (formData.id) {
        dialogVisible.value = false
        router.push({
            path: '/bundle-products',
            query: { bundleId: formData.id }
        })
        ElMessage.success('请在此页面编辑商品信息')
    }
}

// 关闭弹窗
const handleClose = () => {
    // 重置表单
    Object.assign(formData, {
        id: 0,
        virtual_code: '',
        name: '',
        create_date: '',
        end_date: '',
        usage_type: 'cooperation',
        total_value: 0,
        main_value: 0,
        gift_value: 0,
        category: '',
        product_type: '',
        by_sku: '',
        fragrance: '',
        status: '有效',
        parent_id: null
    })
}
</script>

<style scoped>
.edit-bundle-content {
    max-height: 60vh;
    overflow-y: auto;
}

.info-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.info-table td {
    padding: 12px;
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
    height: 15px;
    padding: 0;
    border-bottom: none;
}

.dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
</style>
