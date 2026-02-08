<template>
    <el-card class="chart-card">
        <template #header>
            <div class="card-header">
                <h3 class="card-title">达人分布</h3>
            </div>
        </template>
        <div class="chart-content">
            <div ref="chartRef" class="chart-container"></div>

            <div class="stats-footer">
                <div class="stat-item" v-for="item in chartData" :key="item.name">
                    <span class="dot" :style="{ backgroundColor: item.color }"></span>
                    <span class="label">{{ item.name }}</span>
                    <span class="value">{{ item.value }}人</span>
                </div>
            </div>
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, onActivated } from 'vue';
import { workbenchApi } from '@/api/workbench';
import * as echarts from 'echarts';

const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const chartData = ref([
    { value: 0, name: '直播达人', color: '#409EFF', key: 'live' },
    { value: 0, name: '短视频达人', color: '#67C23A', key: 'video' },
    { value: 0, name: '图文达人', color: '#E6A23C', key: 'image' }
]);

const totalTalent = computed(() => chartData.value.reduce((prev, curr) => prev + curr.value, 0));

const updateChart = () => {
    if (!chartInstance) return;

    const option = {
        tooltip: {
            trigger: 'item'
        },
        legend: {
            show: false
        },
        series: [
            {
                name: '达人类型',
                type: 'pie',
                radius: ['50%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: true,
                    position: 'center',
                    formatter: `{total|${totalTalent.value}}\n{text|达人总数}`,
                    rich: {
                        total: {
                            fontSize: 24,
                            fontWeight: 'bold',
                            color: '#333'
                        },
                        text: {
                            fontSize: 12,
                            color: '#999',
                            paddingTop: 4
                        }
                    }
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 20,
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: false
                },
                data: chartData.value.map(item => ({
                    value: item.value,
                    name: item.name,
                    itemStyle: { color: item.color }
                }))
            }
        ]
    };

    chartInstance.setOption(option);
};

const initChart = () => {
    if (chartRef.value) {
        chartInstance = echarts.init(chartRef.value);
        updateChart();
    }
};

const fetchData = async () => {
    try {
        const res = await workbenchApi.getTalentTypes();
        if (res && res.data) {
            chartData.value = chartData.value.map(item => {
                const key = item.key as keyof typeof res.data;
                return {
                    ...item,
                    value: res.data[key] || 0
                };
            });
            updateChart();
        }
    } catch (error) {
        console.error('Failed to fetch talent distribution data:', error);
    }
};

const handleResize = () => {
    chartInstance?.resize();
};

onMounted(() => {
    initChart();
    fetchData();
    window.addEventListener('resize', handleResize);
});

onActivated(() => {
    fetchData();
    // 确保图表尺寸正确，以防在后台时尺寸发生变化 
    // Ensure chart size is correct in case it changed while in background
    if (chartInstance) {
        chartInstance.resize();
    }
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    chartInstance?.dispose();
    chartInstance = null;
});
</script>

<style scoped>
.chart-card {
    height: 100%;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin: 0;
}

.chart-content {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.chart-container {
    width: 100%;
    height: 220px;
}

.stats-footer {
    width: 100%;
    display: flex;
    justify-content: space-around;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-bottom: 4px;
}

.label {
    font-size: 12px;
    color: #666;
    margin-bottom: 2px;
}

.value {
    font-size: 14px;
    font-weight: 600;
    color: #333;
}
</style>
