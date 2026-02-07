<template>
    <div class="stat-card" :class="color">
        <div class="stat-card-header">
            <div class="stat-card-icon" :class="color">
                <el-icon :size="24">
                    <component :is="icon" />
                </el-icon>
            </div>
        </div>
        <div class="stat-card-body">
            <div class="stat-card-value">{{ displayValue }}</div>
            <div class="stat-card-label">{{ label }}</div>
            <div v-if="trend" class="stat-card-trend" :class="trend.type">
                <el-icon :size="12">
                    <ArrowUp v-if="trend.type === 'up'" />
                    <ArrowDown v-else />
                </el-icon>
                {{ trend.value }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue';

interface Props {
    label: string;
    value: number | string;
    icon: string;
    color: 'blue' | 'green' | 'orange' | 'red';
    trend?: {
        value: string;
        type: 'up' | 'down';
    };
}

const props = defineProps<Props>();

const displayValue = computed(() => {
    if (typeof props.value === 'number') {
        return props.value.toLocaleString();
    }
    return props.value;
});
</script>

<style scoped>
.stat-card {
    background: white;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
}

.stat-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
}

.stat-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.stat-card-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
}

.stat-card-icon.blue {
    background: rgba(24, 144, 255, 0.1);
    color: #1890FF;
}

.stat-card-icon.green {
    background: rgba(82, 196, 26, 0.1);
    color: #52C41A;
}

.stat-card-icon.orange {
    background: rgba(250, 173, 20, 0.1);
    color: #FAAD14;
}

.stat-card-icon.red {
    background: rgba(255, 77, 79, 0.1);
    color: #FF4D4F;
}

.stat-card-body {
    text-align: left;
}

.stat-card-value {
    font-size: 30px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
}

.stat-card-label {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
}

.stat-card-trend {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
}

.stat-card-trend.up {
    color: #52C41A;
}

.stat-card-trend.down {
    color: #FF4D4F;
}
</style>
