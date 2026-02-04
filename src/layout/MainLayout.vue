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
                <!-- 开发者入口 - 可通过 isDeveloperMode 控制显示 -->
                <el-menu-item v-if="showDeveloperMenu" index="/developer" class="developer-menu-item">
                    <el-icon>
                        <Tools />
                    </el-icon>
                    <span>开发者</span>
                </el-menu-item>
            </el-menu>
            <!-- 用户信息和登出 -->
            <div class="user-section">
                <div class="user-info" v-if="!isCollapse">
                    <el-icon>
                        <User />
                    </el-icon>
                    <span class="username">{{ authStore.user?.username || '用户' }}</span>
                </div>
                <el-tooltip :content="isCollapse ? '退出登录' : ''" placement="right" :disabled="!isCollapse">
                    <div class="logout-btn" @click="handleLogout">
                        <el-icon>
                            <SwitchButton />
                        </el-icon>
                        <span v-if="!isCollapse">退出登录</span>
                    </div>
                </el-tooltip>
            </div>
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
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Box, List, DataLine, DArrowLeft, DArrowRight, Tools, User, SwitchButton } from '@element-plus/icons-vue'
import { useDeveloperMode } from '../composables/useDeveloperMode'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const activeMenu = computed(() => route.path)
const isCollapse = ref(false)

// 开发者模式控制
const { isDeveloperMode } = useDeveloperMode()

// 控制开发者菜单显示
// 后续可以在这里添加更多鉴权逻辑
const showDeveloperMenu = computed(() => {
    // 开发环境始终显示，或者开发者模式开启时显示
    return true
    return import.meta.env.DEV || isDeveloperMode.value
})

const toggleCollapse = () => {
    isCollapse.value = !isCollapse.value
}

// 处理登出
const handleLogout = async () => {
    try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        })

        // 清除认证信息
        authStore.clearAuth()

        // 如果在 Electron 环境，通知主进程
        if (window.electronAPI?.logout) {
            window.electronAPI.logout()
        } else {
            router.push('/login')
        }
    } catch {
        // 用户取消
    }
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
    display: flex;
    flex-direction: column;
}

.el-menu-vertical:not(.el-menu--collapse) .el-menu-item span {
    font-size: 16px;
}

/* 开发者菜单项样式 */
.developer-menu-item {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* 用户信息区域 */
.user-section {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 10px 0;
    margin-top: auto;
}

.user-info {
    display: flex;
    align-items: center;
    padding: 8px 20px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
}

.user-info .el-icon {
    margin-right: 8px;
}

.username {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.logout-btn {
    display: flex;
    align-items: center;
    padding: 10px 20px;
    color: rgba(255, 255, 255, 0.65);
    cursor: pointer;
    transition: all 0.3s;
    font-size: 14px;
}

.logout-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #ff4d4f;
}

.logout-btn .el-icon {
    margin-right: 8px;
    font-size: 18px;
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
    padding: 0;
    /* Remove padding to let child control it */
    transition: margin-left 0.3s ease;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    /* Prevent double scrollbars */
}
</style>
