<template>
    <el-dialog v-model="visible" title="选择上传模式" width="400px" :close-on-click-modal="false"
        @update:model-value="handleClose">
        <div class="upload-mode-dialog">
            <p>请选择数据上传模式：</p>
            <p class="file-info">文件：{{ fileName }}</p>
        </div>
        <template #footer>
            <el-button @click="handleClose" size="large">取消</el-button>
            <el-button type="primary" @click="emit('confirm', 'update')" size="large">更新数据</el-button>
            <el-button type="warning" @click="emit('confirmOverwrite')" size="large">覆盖数据</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    modelValue: boolean
    fileName?: string
}

interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'confirm', mode: 'update' | 'overwrite'): void
    (e: 'confirmOverwrite'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

const handleClose = () => {
    emit('update:modelValue', false)
}
</script>

<style scoped>
.upload-mode-dialog {
    text-align: center;
}

.upload-mode-dialog p {
    margin: 10px 0;
    font-size: 14px;
}

.upload-mode-dialog .file-info {
    color: #909399;
    font-size: 12px;
}
</style>
