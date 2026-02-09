<template>
    <div class="table-section">
        <el-table v-loading="loading" :data="data" border style="width: 100%" height="100%">
            <el-table-column prop="code" label="执行单编号" width="180" fixed align="center" />
            <el-table-column prop="name" label="执行单名称" min-width="150" show-overflow-tooltip align="center" />
            <el-table-column label="关联达人" min-width="120" align="center">
                <template #default="{ row }">
                    {{ row.talent?.nickname || '-' }}
                </template>
            </el-table-column>
            <el-table-column prop="type" label="类型" width="100" align="center">
                <template #default="{ row }">
                    <el-tag :type="row.type === '直播' ? 'warning' : 'success'" size="small" align="center">{{ row.type
                        }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column label="排期日期" width="120" align="center">
                <template #default="{ row }">
                    {{ formatDate(row.date) }}
                </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
                <template #default="{ row }">
                    <el-tag size="small">{{ row.status }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right" align="center">
                <template #default="{ row }">
                    <el-button type="primary" link size="small" @click="$emit('detail', row)">详情</el-button>
                    <el-button type="primary" link size="small" @click="$emit('edit', row)">编辑</el-button>
                    <el-button type="danger" link size="small" @click="$emit('delete', row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50, 100]" :total="total" layout="total, sizes, prev, pager, next, jumper"
                @size-change="handlePageChange" @current-change="handlePageChange" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import dayjs from 'dayjs';
import type { ExecutionOrder } from '@/api/executionOrder';

interface Props {
    loading: boolean;
    data: ExecutionOrder[];
    total: number;
    page: number;
    pageSize: number;
}

interface Emits {
    (e: 'update:page', value: number): void;
    (e: 'update:pageSize', value: number): void;
    (e: 'pageChange'): void;
    (e: 'detail', row: ExecutionOrder): void;
    (e: 'edit', row: ExecutionOrder): void;
    (e: 'delete', row: ExecutionOrder): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const currentPage = computed({
    get: () => props.page,
    set: (val) => emit('update:page', val)
});

const pageSize = computed({
    get: () => props.pageSize,
    set: (val) => emit('update:pageSize', val)
});

const handlePageChange = () => {
    emit('pageChange');
};

const formatDate = (date: string) => {
    return date ? dayjs(date).format('YYYY-MM-DD') : '-';
};
</script>

<style scoped>
.table-section {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    flex-shrink: 0;
}


:deep(.el-table .el-table__body-wrapper .cell) {
    padding: 13px 0;
}

:deep(.el-table .el-table__header-wrapper .cell) {
    padding: 1px 0;
    font-size: 14px;
}
</style>
