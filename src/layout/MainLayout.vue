<template>
    <el-container class="layout-container">
        <el-aside :width="isCollapse ? '64px' : '200px'" class="aside">
            <div class="logo">
                <h2 v-show="!isCollapse">货组生成器</h2>
                <h2 v-show="isCollapse" class="logo-collapsed">货</h2>
            </div>
            <el-menu :default-active="activeMenu" class="el-menu-vertical" :collapse="isCollapse"
                background-color="#001529" text-color="#fff" active-text-color="#1890FF" router>
                <el-menu-item index="/generator">
                    <el-icon>
                        <Box />
                    </el-icon>
                    <span>货组生成</span>
                </el-menu-item>
                <el-menu-item index="/manager">
                    <el-icon>
                        <List />
                    </el-icon>
                    <span>货组管理</span>
                </el-menu-item>
                <el-menu-item index="/data">
                    <el-icon>
                        <DataLine />
                    </el-icon>
                    <span>数据管理</span>
                </el-menu-item>
            </el-menu>
            <div class="collapse-btn" @click="toggleCollapse">
                <el-icon>
                    <DArrowLeft v-if="!isCollapse" />
                    <DArrowRight v-if="isCollapse" />
                </el-icon>
            </div>
        </el-aside>
        <el-container>
            <el-main class="main-content">
                <router-view v-slot="{ Component }">
                    <keep-alive>
                        <component :is="Component" />
                    </keep-alive>
                </router-view>
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Box, List, DataLine, DArrowLeft, DArrowRight } from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = computed(() => route.path)
const isCollapse = ref(false)

const toggleCollapse = () => {
    isCollapse.value = !isCollapse.value
}
</script>

<style scoped>
.layout-container {
    height: 100vh;
}

.aside {
    background-color: #001529;
    color: #fff;
    display: flex;
    flex-direction: column;
    transition: width 0.3s ease;
    position: relative;
}

.logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #002140;
}

.logo h2 {
    margin: 0;
    font-size: 18px;
    color: #fff;
}

.logo-collapsed {
    font-size: 24px;
}

.el-menu-vertical {
    border-right: none;
    flex: 1;
}

.el-menu-vertical:not(.el-menu--collapse) .el-menu-item span {
    font-size: 16px;
}

.collapse-btn {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background-color: #002140;
    color: #fff;
    transition: background-color 0.3s;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.collapse-btn:hover {
    background-color: #003a70;
}

.collapse-btn .el-icon {
    font-size: 20px;
}

.main-content {
    background-color: #F0F2F5;
    padding: 20px;
    transition: margin-left 0.3s ease;
}
</style>
