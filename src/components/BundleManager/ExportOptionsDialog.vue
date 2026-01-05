<template>
    <el-dialog v-model="visible" title="选择导出内容" width="400px" :before-close="handleClose">
        <div class="export-options">
            <el-checkbox v-model="options.exportSku" label="SKU" size="large" />
            <el-checkbox v-model="options.exportVirtual" label="虚拟组套" size="large" />
        </div>
        <template #footer>
            <el-button @click="handleCancel">取消</el-button>
            <el-button type="primary" @click="handleConfirm">导出</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const visible = ref(false)
const options = ref({
    exportSku: true,
    exportVirtual: true,
})

const emit = defineEmits<{
    confirm: [options: { exportSku: boolean; exportVirtual: boolean }]
    cancel: []
}>()

const open = () => {
    visible.value = true
    options.value = {
        exportSku: true,
        exportVirtual: true,
    }
}

const handleClose = () => {
    visible.value = false
    emit('cancel')
}

const handleCancel = () => {
    visible.value = false
    emit('cancel')
}

const handleConfirm = () => {
    if (!options.value.exportSku && !options.value.exportVirtual) {
        ElMessage.warning('请至少选择一个导出选项')
        return
    }
    visible.value = false
    emit('confirm', options.value)
}

defineExpose({
    open,
})
</script>

<style scoped>
.export-options {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 20px 0;
}
</style>
