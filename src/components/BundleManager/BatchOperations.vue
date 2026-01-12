<template>
    <div class="batch-operations">
        <el-dropdown @command="handleExportCommand" @visible-change="handleVisibleChange" :disabled="!hasSelection"
            trigger="click" type="primary" size="large">
            <el-button type="primary" size="large" :disabled="!hasSelection">
                批量导出
                <el-icon :class="{ 'rotate': isDropdownVisible }">
                    <ArrowDown />
                </el-icon>
            </el-button>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item command="sku">SKU导出</el-dropdown-item>
                    <el-dropdown-item command="virtual">虚拟货组导出</el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>
        <el-button type="danger" @click="$emit('batchDelete')" :disabled="!hasSelection" size="large">
            批量删除
        </el-button>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'

defineProps<{
    hasSelection: boolean
}>()

const emit = defineEmits<{
    'batchExportSku': []
    'batchExportVirtual': []
    'batchDelete': []
}>()

const isDropdownVisible = ref(false)

const handleVisibleChange = (visible: boolean) => {
    isDropdownVisible.value = visible
}

const handleExportCommand = (command: string) => {
    if (command === 'sku') {
        emit('batchExportSku')
    } else if (command === 'virtual') {
        emit('batchExportVirtual')
    }
}
</script>

<style scoped>
.batch-operations {
    margin-bottom: 15px;
}

.el-icon {
    margin-left: 5px;
    transition: transform 0.3s ease;
}

.el-icon.rotate {
    transform: rotate(180deg);
}
</style>
