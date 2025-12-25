<template>
    <el-col :span="8" style="height: 100%; position: relative;" v-show="visible">
        <!-- 收缩按钮 -->
        <div class="collapse-btn" @click="$emit('toggle')">
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
                                    <el-input :model-value="bundleName"
                                        @update:model-value="$emit('update:bundleName', $event)" placeholder="请输入货组名称"
                                        size="mid" />
                                </td>
                            </tr>
                            <tr>
                                <td class="label-cell">礼盒</td>
                                <td class="value-cell">
                                    <el-radio-group :model-value="hasGiftBox"
                                        @update:model-value="$emit('update:hasGiftBox', $event)" size="mid">
                                        <el-radio :label="true">有</el-radio>
                                        <el-radio :label="false">无</el-radio>
                                    </el-radio-group>
                                </td>
                            </tr>
                            <tr>
                                <td class="label-cell">用途</td>
                                <td class="value-cell">
                                    <el-radio-group :model-value="usageType"
                                        @update:model-value="$emit('update:usageType', $event)" size="mid">
                                        <el-radio label="cooperation">合作</el-radio>
                                        <el-radio label="self">自营</el-radio>
                                    </el-radio-group>
                                </td>
                            </tr>
                            <tr>
                                <td class="label-cell">分类</td>
                                <td class="value-cell">
                                    <el-select :model-value="selectedCategory"
                                        @update:model-value="$emit('update:selectedCategory', $event)"
                                        placeholder="输入关键字搜索" size="mid" style="width: 100%;" filterable remote
                                        :remote-method="(query: string) => $emit('searchCategory', query)"
                                        :loading="categoryLoading">
                                        <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
                                    </el-select>
                                </td>
                            </tr>
                            <tr>
                                <td class="label-cell">品类</td>
                                <td class="value-cell">
                                    <el-select :model-value="selectedProductType"
                                        @update:model-value="$emit('update:selectedProductType', $event)"
                                        placeholder="输入关键字搜索" size="mid" style="width: 100%;" filterable remote
                                        :remote-method="(query: string) => $emit('searchProductType', query)"
                                        :loading="productTypeLoading">
                                        <el-option v-for="type in productTypes" :key="type" :label="type"
                                            :value="type" />
                                    </el-select>
                                </td>
                            </tr>
                            <tr>
                                <td class="label-cell">By-SKU</td>
                                <td class="value-cell">
                                    <el-select :model-value="selectedBySku"
                                        @update:model-value="$emit('update:selectedBySku', $event)"
                                        placeholder="输入关键字搜索" size="mid" style="width: 100%;" filterable remote
                                        :remote-method="(query: string) => $emit('searchBySku', query)"
                                        :loading="bySkuLoading">
                                        <el-option v-for="sku in bySkuList" :key="sku" :label="sku" :value="sku" />
                                    </el-select>
                                </td>
                            </tr>
                            <tr>
                                <td class="label-cell">香型</td>
                                <td class="value-cell">
                                    <el-select :model-value="selectedFragrance"
                                        @update:model-value="$emit('update:selectedFragrance', $event)"
                                        placeholder="输入关键字搜索" size="mid" style="width: 100%;" filterable remote
                                        :remote-method="(query: string) => $emit('searchFragrance', query)"
                                        :loading="fragranceLoading">
                                        <el-option v-for="frag in fragrances" :key="frag" :label="frag" :value="frag" />
                                    </el-select>
                                </td>
                            </tr>
                            <tr>
                                <td class="label-cell">结束日期</td>
                                <td class="value-cell">
                                    <el-date-picker :model-value="endDate"
                                        @update:model-value="$emit('update:endDate', $event)" type="date"
                                        placeholder="选择结束日期" size="mid" style="width: 93%;" value-format="YYYY-MM-DD" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div style="padding: 15px 0; border-top: 1px solid #eee;">
                    <el-button type="primary" class="w-100" @click="$emit('save')" size="large"
                        :disabled="!bundleName || !selectedCategory || !selectedProductType || !selectedBySku || !selectedFragrance || !endDate">保存货组</el-button>
                </div>
            </div>
        </el-card>
    </el-col>
</template>

<script setup lang="ts">
import { ArrowRight } from '@element-plus/icons-vue'

// Props
defineProps<{
    visible: boolean
    createTime: string
    virtualCode: string
    mainValue: string
    giftValue: string
    totalValue: string
    bundleName: string
    hasGiftBox: boolean
    usageType: string
    selectedCategory: string
    selectedProductType: string
    selectedBySku: string
    selectedFragrance: string
    endDate: string
    categories: string[]
    productTypes: string[]
    bySkuList: string[]
    fragrances: string[]
    categoryLoading: boolean
    productTypeLoading: boolean
    bySkuLoading: boolean
    fragranceLoading: boolean
}>()

// Emits
defineEmits<{
    toggle: []
    save: []
    'update:bundleName': [value: string]
    'update:hasGiftBox': [value: boolean]
    'update:usageType': [value: string]
    'update:selectedCategory': [value: string]
    'update:selectedProductType': [value: string]
    'update:selectedBySku': [value: string]
    'update:selectedFragrance': [value: string]
    'update:endDate': [value: string]
    searchCategory: [query: string]
    searchProductType: [query: string]
    searchBySku: [query: string]
    searchFragrance: [query: string]
}>()
</script>

<style scoped>
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-header>span {
    font-size: 18px;
    font-weight: bold;
}

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

.w-100 {
    width: 100%;
}

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
</style>
