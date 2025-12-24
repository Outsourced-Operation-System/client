<template>
    <el-card class="box-card"
        style="flex: 1; display: flex; flex-direction: column; overflow: hidden; border-radius: 0 0 4px 4px;"
        :body-style="{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px' }">
        <template #header>
            <div class="card-header">
                <span>生成货组</span>
                <div v-show="!isPreviewVisible" class="value-info">
                    <span class="value-item">主品货值: <span class="value-number">¥{{ mainValue }}</span></span>
                    <span class="value-item">赠品货值: <span class="value-number">¥{{ giftValue }}</span></span>
                    <span class="value-item">总货值: <span class="value-number total">¥{{ totalValue }}</span></span>
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
                        <span style="font-weight: bold;">{{ getArticleStockTotal(scope.row.article_code) }}</span>
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
                        <el-button type="danger" link size="small" @click="handleRemove(scope.$index)">移除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>
        <div class="bundle-actions" style="display: flex; justify-content: flex-end;">
            <el-button type="danger" @click="$emit('clear')" size="large" style="width: 200px;">清除全部</el-button>
            <el-button type="primary" @click="$emit('generate')" size="large" v-if="!hasGenerated"
                style="width: 200px;">
                新建货组
            </el-button>
        </div>
    </el-card>
</template>

<script setup lang="ts">
// Props
defineProps<{
    bundleItems: any[]
    isPreviewVisible: boolean
    hasGenerated: boolean
    mainValue: string
    giftValue: string
    totalValue: string
    getArticleStockTotal: (articleCode: string) => number
}>()

// Emits
const emit = defineEmits<{
    remove: [index: number]
    clear: []
    generate: []
}>()

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

.bundle-actions {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #eee;
    display: flex;
    align-items: center;
}

:deep(.el-table) {
    font-size: 14px;
}
</style>
