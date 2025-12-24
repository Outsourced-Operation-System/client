<template>
    <el-dialog v-model="visible" title="关键信息列表" width="55%" append-to-body @keyup.enter="handleConfirm">
        <el-table ref="tableRef" :data="data" border style="width: 100%;" max-height="500"
            @selection-change="handleSelectionChange" @row-click="handleRowClick">
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
            <el-button @click="visible = false">取消</el-button>
            <el-button type="primary" @click="handleConfirm">确认</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// Props
const props = defineProps<{
    modelValue: boolean
    data: any[]
    tableRef?: any
}>()

// Emits
const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'update:tableRef': [ref: any]
    confirm: [items: any[]]
    selectionChange: [items: any[]]
}>()

// 本地状态
const visible = ref(props.modelValue)
const tableRef = ref<any>(null)
const selectedItems = ref<any[]>([])

watch(() => props.modelValue, (val) => {
    visible.value = val
})

watch(visible, (val) => {
    emit('update:modelValue', val)
})

watch(tableRef, (val) => {
    emit('update:tableRef', val)
})

const handleSelectionChange = (val: any[]) => {
    selectedItems.value = val
    emit('selectionChange', val)
}

const handleRowClick = (row: any) => {
    if (!tableRef.value) return
    tableRef.value.toggleRowSelection(row)
}

const handleConfirm = () => {
    emit('confirm', selectedItems.value)
}
</script>
