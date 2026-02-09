<template>
    <div v-loading="loading" class="execution-order-detail">
        <el-descriptions title="基础信息" :column="2" border>
            <el-descriptions-item label="执行单编号">{{ order.code }}</el-descriptions-item>
            <el-descriptions-item label="执行单名称">{{ order.name }}</el-descriptions-item>
            <el-descriptions-item label="合作类型">
                <el-tag :type="order.type === '直播' ? 'warning' : 'success'">{{ order.type }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="关联达人">{{ order.talent?.nickname || '-' }}</el-descriptions-item>
            <el-descriptions-item label="当前状态">
                <el-tag>{{ order.status }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="排期日期">{{ formatDate(order.date) }}</el-descriptions-item>
            <el-descriptions-item label="坑位费">¥{{ order.pitFee }}</el-descriptions-item>
            <el-descriptions-item label="佣金率">{{ order.commissionRate }}%</el-descriptions-item>
            <el-descriptions-item label="创建人">{{ order.creator?.username || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDateTime(order.createdAt) }}</el-descriptions-item>
        </el-descriptions>

        <div class="section-title">货品规划</div>
        <el-table :data="order.bundles" border style="width: 100%; margin-top: 10px">
            <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
            <el-table-column label="货组名称" min-width="200">
                <template #default="{ row }">
                    <div class="bundle-info">
                        <span class="bundle-name">{{ row.bundle?.name }}</span>
                        <span class="bundle-code">{{ row.bundle?.virtual_code }}</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column label="包含商品" min-width="300">
                <template #default="{ row }">
                    <div v-if="row.bundle?.items && row.bundle.items.length">
                        <div v-for="item in row.bundle.items" :key="item.sku" class="product-item">
                            <el-tag size="small" :type="item.type === 'gift' ? 'info' : ''" plain>
                                {{ item.type === 'gift' ? '赠' : '主' }}
                            </el-tag>
                            <span class="product-name">{{ item.product_name_cn }}</span>
                            <span class="product-qty">x{{ item.quantity }}</span>
                        </div>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="mechanism" label="价格机制/备注" min-width="200" />
        </el-table>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { getExecutionOrder, type ExecutionOrder } from '@/api/executionOrder';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';

const props = defineProps<{
    id: number | null;
}>();

const loading = ref(false);
const order = ref<Partial<ExecutionOrder>>({});

const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return dayjs(date).format('YYYY-MM-DD');
};

const formatDateTime = (date: string | undefined) => {
    if (!date) return '-';
    return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

const fetchDetail = async (id: number) => {
    loading.value = true;
    try {
        const res = await getExecutionOrder(id);
        if (res.success) {
            order.value = res.data;
        }
    } catch (error) {
        console.error(error);
        ElMessage.error('获取详情失败');
    } finally {
        loading.value = false;
    }
};

watch(
    () => props.id,
    (newId) => {
        if (newId) {
            fetchDetail(newId);
        } else {
            order.value = {};
        }
    },
    { immediate: true }
);
</script>

<style scoped>
.execution-order-detail {
    padding: 20px;
}

.section-title {
    font-size: 16px;
    font-weight: bold;
    margin-top: 24px;
    margin-bottom: 12px;
    border-left: 4px solid #409eff;
    padding-left: 8px;
}

.bundle-info {
    display: flex;
    flex-direction: column;
}

.bundle-code {
    font-size: 12px;
    color: #909399;
}

.product-item {
    margin-bottom: 4px;
    font-size: 13px;
}

.product-name {
    margin: 0 8px;
}

.product-qty {
    color: #909399;
}
</style>
