<template>
    <el-card class="chart-card">
        <template #header>
            <div class="card-header">
                <h3 class="card-title">GMV 趋势（现在是假的，随机数据）</h3>
                <el-radio-group v-model="timeRange" size="small" @change="handleRangeChange">
                    <el-radio-button label="7days">近7天</el-radio-button>
                    <el-radio-button label="30days">近30天</el-radio-button>
                </el-radio-group>
            </div>
        </template>
        <div ref="chartRef" class="chart-container"></div>
    </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';

const timeRange = ref('7days');
const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const getData = (range: string) => {
    if (range === '7days') {
        return {
            dates: ['2-01', '2-02', '2-03', '2-04', '2-05', '2-06', '2-07'],
            values: [12000, 13500, 11000, 14200, 15800, 13900, 16500]
        };
    } else {
        const dates = [];
        const values = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(`${d.getMonth() + 1}-${d.getDate()}`);
            values.push(Math.floor(Math.random() * 10000) + 10000);
        }
        return { dates, values };
    }
};

const initChart = () => {
    if (chartRef.value) {
        chartInstance = echarts.init(chartRef.value);
        updateChart();
    }
};

const updateChart = () => {
    if (!chartInstance) return;

    const data = getData(timeRange.value);

    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: '{b}<br />GMV: ¥{c}'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: data.dates,
            axisLine: {
                lineStyle: { color: '#ddd' }
            },
            axisLabel: {
                color: '#666'
            }
        },
        yAxis: {
            type: 'value',
            splitLine: {
                lineStyle: { type: 'dashed' }
            }
        },
        series: [
            {
                name: 'GMV',
                type: 'line',
                smooth: true,
                symbol: 'none',
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
                        { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
                    ])
                },
                itemStyle: {
                    color: '#409eff'
                },
                data: data.values
            }
        ]
    };

    chartInstance.setOption(option);
};

const handleRangeChange = () => {
    updateChart();
};

const handleResize = () => {
    chartInstance?.resize();
};

onMounted(() => {
    initChart();
    window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    chartInstance?.dispose();
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

.chart-container {
    width: 100%;
    height: 300px;
}
</style>
