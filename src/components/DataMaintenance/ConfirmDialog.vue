<template>
    <el-dialog v-model="visible" :title="title" width="400px" :close-on-click-modal="false"
        @update:model-value="handleClose">
        <div :class="['confirm-dialog', dialogType]">
            <el-icon class="icon">
                <component :is="iconComponent" />
            </el-icon>
            <p v-for="(line, index) in messages" :key="index" :class="{ 'highlight': line.highlight }">
                {{ line.text }}
            </p>
        </div>
        <template #footer>
            <el-button @click="handleClose" size="large">取消</el-button>
            <el-button :type="confirmType" @click="handleConfirm" size="large">{{ confirmText }}</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { WarningFilled, InfoFilled } from '@element-plus/icons-vue'

type DialogType = 'warning' | 'info'
type ConfirmType = 'danger' | 'primary'

interface MessageLine {
    text: string
    highlight?: boolean
}

interface Props {
    modelValue: boolean
    title: string
    messages: MessageLine[]
    dialogType?: DialogType
    confirmText?: string
    confirmType?: ConfirmType
}

interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'confirm'): void
}

const props = withDefaults(defineProps<Props>(), {
    dialogType: 'warning',
    confirmText: '确认',
    confirmType: 'danger'
})

const emit = defineEmits<Emits>()

const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

const iconComponent = computed(() => {
    return props.dialogType === 'warning' ? WarningFilled : InfoFilled
})

const handleClose = () => {
    emit('update:modelValue', false)
}

const handleConfirm = () => {
    emit('confirm')
}
</script>

<style scoped>
.confirm-dialog {
    text-align: center;
}

.confirm-dialog .icon {
    font-size: 48px;
    margin-bottom: 15px;
}

.confirm-dialog.warning .icon {
    color: #E6A23C;
}

.confirm-dialog.info .icon {
    color: #409EFF;
}

.confirm-dialog p {
    margin: 10px 0;
    color: #606266;
    font-size: 14px;
}

.confirm-dialog p.highlight {
    color: #409EFF;
    font-weight: bold;
}
</style>
