<template>
    <div class="workbench-container">
        <!-- 页面标题 -->
        <div class="page-header" style="display: flex; align-items: center; justify-content: space-between;">
            <div>
                <h2 class="page-title">工作台</h2>
                <p class="page-desc">欢迎回来，这里是您的工作概览</p>
            </div>
            <el-button type="primary" size="large" :icon="Refresh" @click="handleRefresh" :loading="loading"
                style="margin-left: 16px; min-width: 88px;">
                刷新
            </el-button>
        </div>

        <!-- 统计卡片 -->
        <el-row :gutter="24" class="stat-cards" v-loading="loading">
            <el-col :xs="24" :sm="12" :lg="6" v-for="card in statCards" :key="card.label">
                <StatCard :label="card.label" :value="card.value" :icon="card.icon" :color="card.color"
                    :trend="card.trend" />
            </el-col>
        </el-row>

        <!-- 快捷操作 -->
        <div class="section">
            <h3 class="section-title">快捷操作</h3>
            <el-row :gutter="16">
                <el-col :xs="12" :sm="6" v-for="action in quickActions" :key="action.label">
                    <QuickAction :label="action.label" :icon="action.icon" @click="handleQuickAction(action.route)" />
                </el-col>
            </el-row>
        </div>

        <!-- 数据概览 -->
        <div class="section">
            <h3 class="section-title">数据概览</h3>
            <el-row :gutter="24">
                <el-col :xs="24" :lg="16" class="chart-col">
                    <GMVTrendChart />
                </el-col>
                <el-col :xs="24" :lg="8" class="chart-col">
                    <InfluencerDistributionChart />
                </el-col>
            </el-row>
        </div>

        <!-- 最近活动 -->
        <div class="section">
            <el-card>
                <template #header>
                    <div class="card-header">
                        <h3 class="card-title">最近活动</h3>
                        <el-button text type="primary">查看全部</el-button>
                    </div>
                </template>
                <el-timeline>
                    <el-timeline-item v-for="activity in recentActivities" :key="activity.id" :timestamp="activity.time"
                        :type="activity.type">
                        <p>{{ activity.content }}</p>
                    </el-timeline-item>
                    <el-empty v-if="recentActivities.length === 0" description="暂无活动记录" />
                </el-timeline>
            </el-card>
        </div>

        <!-- 待办事项 -->
        <div class="section">
            <el-row :gutter="16">
                <el-col :xs="24" :sm="12">
                    <el-card>
                        <template #header>
                            <h3 class="card-title">今日待办</h3>
                        </template>
                        <el-empty description="暂无待处理执行单" />
                    </el-card>
                </el-col>
                <el-col :xs="24" :sm="12">
                    <el-card>
                        <template #header>
                            <h3 class="card-title">系统提醒</h3>
                        </template>
                        <el-empty description="暂无库存预警" />
                    </el-card>
                </el-col>
            </el-row>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onActivated } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import StatCard from '@/components/Workbench/StatCard.vue';
import QuickAction from '@/components/Workbench/QuickAction.vue';
import GMVTrendChart from '@/components/Workbench/GMVTrendChart.vue';
import InfluencerDistributionChart from '@/components/Workbench/TalentDistributionChart.vue';
import { useWorkbench } from '@/composables/useWorkbench';

const router = useRouter();
const { loading, statCards, loadStats } = useWorkbench();

onActivated(() => {
    loadStats();
});

// 快捷操作
const quickActions = ref([
    { label: '创建货组', icon: 'Plus', route: '/generator' },
    { label: '货组管理', icon: 'Collection', route: '/manager' },
    { label: '创建执行单', icon: 'DocumentAdd', route: '/execution-orders' },
    { label: '达人管理', icon: 'User', route: '/influencers' },
]);

// 最近活动
interface activityDetail {
    id: number;
    content: string;
    time: string;
    type: 'primary' | 'success' | 'info' | 'warning' | 'danger';
}
const recentActivities = ref<activityDetail[]>([]);

// 处理快捷操作
const handleQuickAction = (route: string) => {
    router.push(route);
};

// 刷新按钮处理
const handleRefresh = () => {
    loadStats();
};
</script>

<style scoped>
.workbench-container {
    padding: 24px;
    background: #f5f7fa;
    min-height: calc(100vh - 60px);
    overflow-y: auto;
}

.page-header {
    margin-bottom: 24px;
}

.page-title {
    font-size: 24px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
}

.page-desc {
    color: #666;
    font-size: 14px;
}

.stat-cards {
    margin-bottom: 24px;
}

.section {
    margin-bottom: 24px;
}

.section-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 16px;
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.card-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin: 0;
}

:deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #e8e8e8;
}

:deep(.el-card__body) {
    padding: 20px;
}

:deep(.el-timeline) {
    padding-left: 0;
}

.chart-col {
    margin-bottom: 24px;
}

@media (min-width: 1200px) {
    .chart-col {
        margin-bottom: 0;
    }
}
</style>
