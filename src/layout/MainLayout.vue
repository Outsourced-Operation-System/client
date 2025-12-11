<template>
    <el-container class="layout-container">
        <el-aside width="200px" class="aside">
            <div class="logo">
                <h2>货组生成器</h2>
            </div>
            <el-menu :default-active="activeMenu" class="el-menu-vertical" background-color="#001529" text-color="#fff"
                active-text-color="#1890FF" router>
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
        </el-aside>
        <el-container>
            <el-main class="main-content">
                <router-view />
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Box, List, DataLine } from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = computed(() => route.path)
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

.el-menu-vertical {
    border-right: none;
}

.el-menu-vertical .el-menu-item span {
    font-size: 16px;
}

.main-content {
    background-color: #F0F2F5;
    padding: 20px;
}
</style>
