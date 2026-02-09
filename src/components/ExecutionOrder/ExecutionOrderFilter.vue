<template>
    <div class="filter-section">
        <el-input v-model="keyword" placeholder="搜索单号/名称" style="width: 200px" clearable @keyup.enter="handleSearch"
            size="large" />
        <el-select v-model="status" placeholder="状态" clearable size="large" style="width: 150px; margin-left: 10px">
            <el-option v-for="(val, key) in ExecutionOrderStatus" :key="key" :label="val" :value="val" />
        </el-select>
        <el-button type="primary" size="large" style="margin-left: 10px" @click="handleSearch">
            搜索
        </el-button>
        <el-button @click="handleReset" size="large">重置</el-button>
        <el-button type="primary" style="margin-left: auto" @click="$emit('add')" size="large">
            新建执行单
        </el-button>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ExecutionOrderStatus } from '@/api/executionOrder';

interface Props {
    modelValue: {
        keyword: string;
        status: string;
    };
}

interface Emits {
    (e: 'update:modelValue', value: { keyword: string; status: string }): void;
    (e: 'search'): void;
    (e: 'reset'): void;
    (e: 'add'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const keyword = ref(props.modelValue.keyword);
const status = ref(props.modelValue.status);

// 监听变化并同步到父组件
watch([keyword, status], () => {
    emit('update:modelValue', {
        keyword: keyword.value,
        status: status.value
    });
});

// 同步父组件的变化
watch(
    () => props.modelValue,
    (newVal) => {
        keyword.value = newVal.keyword;
        status.value = newVal.status;
    },
    { deep: true }
);

const handleSearch = () => {
    emit('search');
};

const handleReset = () => {
    keyword.value = '';
    status.value = '';
    emit('reset');
};
</script>

<style scoped>
.filter-section {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    flex-shrink: 0;
}
</style>
