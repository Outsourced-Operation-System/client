<template>
    <el-dialog v-model="visible" title="确认清除" width="30%" append-to-body>
        <div style="padding: 20px 0;">
            <p style="font-size: 16px; margin-bottom: 15px;">确定要清除所有商品和预览信息吗？</p>
            <p style="color: #909399; font-size: 14px;">此操作将清空：</p>
            <ul style="color: #909399; font-size: 14px; padding-left: 20px;">
                <li>所有已添加的商品（{{ itemCount }} 个）</li>
                <li>货组名称、日期范围等所有预览信息</li>
            </ul>
            <p style="color: #f56c6c; font-size: 14px; margin-top: 15px;">此操作不可恢复！</p>
        </div>
        <template #footer>
            <el-button @click="visible = false">取消</el-button>
            <el-button type="danger" @click="handleConfirm">确认清除</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// Props
const props = defineProps<{
    modelValue: boolean
    itemCount: number
}>()

// Emits
const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    confirm: []
}>()

// 本地状态
const visible = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
    visible.value = val
})

watch(visible, (val) => {
    emit('update:modelValue', val)
})

const handleConfirm = () => {
    emit('confirm')
    visible.value = false
}
</script>
