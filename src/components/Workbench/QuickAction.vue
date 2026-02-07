<template>
    <div class="quick-action" @click="handleClick">
        <div class="quick-action-icon" :class="color">
            <el-icon :size="28">
                <component :is="icon" />
            </el-icon>
        </div>
        <div class="quick-action-label">{{ label }}</div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    label: string;
    icon: string;
    color?: string;
    to?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    click: [];
}>();

const handleClick = () => {
    emit('click');
};
</script>

<style scoped>
.quick-action {
    background: white;
    border-radius: 8px;
    padding: 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.quick-action:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.quick-action-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(24, 144, 255, 0.1);
    color: #1890FF;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    transition: all 0.3s ease;
}

.quick-action:hover .quick-action-icon {
    transform: scale(1.1);
}

.quick-action-label {
    font-size: 15px;
    font-weight: 500;
    color: #333;
}
</style>
