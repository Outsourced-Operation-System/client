<template>
    <el-dialog v-model="visible" title="备份列表" width="600px" :close-on-click-modal="false"
        @update:model-value="handleClose">
        <el-table :data="backupList" style="width: 100%" max-height="400px">
            <el-table-column prop="datetime" label="备份时间" min-width="100" />
            <el-table-column label="恢复数据" width="120">
                <template #default="{ row }">
                    <el-button type="primary" size="small" @click="emit('restore', row)">恢复</el-button>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
                <template #default="{ row }">
                    <el-button type="danger" size="small" @click="emit('deleteBackup', row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>
        <template #footer>
            <el-button @click="handleClose" size="large">关闭</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BackupItem } from '@/composables/DataMaintenance'

interface Props {
    modelValue: boolean
    backupList: BackupItem[]
}

interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'restore', backup: BackupItem): void
    (e: 'deleteBackup', backup: BackupItem): void
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
