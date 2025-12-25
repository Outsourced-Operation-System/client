<template>
    <div class="batch-operations">
        <el-button type="primary" @click="$emit('batchExport')" :disabled="!hasSelection" size="large">
            批量导出
        </el-button>
        <el-button type="danger" @click="$emit('batchDelete')" :disabled="!hasSelection" size="large">
            批量删除
        </el-button>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    hasSelection: boolean
}>()

defineEmits<{
    'batchExport': []
    'batchDelete': []
}>()
</script>

<style scoped>
.batch-operations {
    margin-bottom: 15px;
}
</style>
