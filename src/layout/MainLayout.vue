<template>
    <el-container class="layout-container">
        <el-aside :width="isCollapse ? '64px' : '200px'" class="aside">
            <div class="logo">
                <h2 v-show="!isCollapse">代运营系统</h2>
                <h2 v-show="isCollapse" class="logo-collapsed"></h2>
            </div>
            <el-menu :default-active="activeMenu" class="el-menu-vertical" :collapse="isCollapse"
                background-color="#001529" text-color="#fff" active-text-color="#1890FF" router>
                <el-menu-item index="/workbench">
                    <el-icon>
                        <HomeFilled />
                    </el-icon>
                    <span>工作台</span>
                </el-menu-item>
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
                <el-menu-item index="/execution-orders">
                    <el-icon>
                        <Document />
                    </el-icon>
                    <span>执行单管理</span>
                </el-menu-item>
                <el-menu-item index="/data">
                    <el-icon>
                        <DataLine />
                    </el-icon>
                    <span>数据管理</span>
                </el-menu-item>
                <el-menu-item index="/influencers">
                    <el-icon>
                        <UserFilled />
                    </el-icon>
                    <span>达人管理</span>
                </el-menu-item>
                <el-menu-item v-if="authStore.isAdmin" index="/users">
                    <el-icon>
                        <Avatar />
                    </el-icon>
                    <span>用户管理</span>
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
                <!-- 用户名 -->
                <el-tooltip :content="authStore.user?.username || '用户'" placement="right" :disabled="!isCollapse">
                    <div class="user-row">
                        <el-icon>
                            <User />
                        </el-icon>
                        <span v-if="!isCollapse" class="row-text username">{{ authStore.user?.username || '用户' }}</span>
                    </div>
                </el-tooltip>

                <!-- 修改密码 -->
                <el-tooltip content="修改密码" placement="right" :disabled="!isCollapse">
                    <div class="user-row action-row" @click="handleChangePassword">
                        <el-icon>
                            <Lock />
                        </el-icon>
                        <span v-if="!isCollapse" class="row-text">修改密码</span>
                    </div>
                </el-tooltip>

                <!-- 退出登录 -->
                <el-tooltip content="退出登录" placement="right" :disabled="!isCollapse">
                    <div class="user-row action-row logout-row" @click="handleLogout">
                        <el-icon>
                            <SwitchButton />
                        </el-icon>
                        <span v-if="!isCollapse" class="row-text">退出登录</span>
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
        <ChangePasswordDialog v-model="changePasswordVisible" />
        <UpdateNotification ref="updateNotificationRef" />
    </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Box, List, DataLine, DArrowLeft, DArrowRight, Tools, User, SwitchButton, Lock, Avatar, HomeFilled, Document, UserFilled } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { useProfileChange } from '../composables/useProfileChange'
import ChangePasswordDialog from '../components/ChangePasswordDialog.vue'
import UpdateNotification from '../components/UpdateNotification.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const activeMenu = computed(() => route.path)
const isCollapse = ref(false)

// 密码修改控制
const { changePasswordVisible, openChangePasswordDialog } = useProfileChange()

// 控制开发者菜单显示
// 后续可以在这里添加更多鉴权逻辑
const showDeveloperMenu = computed(() => {
    return authStore.isAdmin
})

const handleChangePassword = () => {
    openChangePasswordDialog()
}

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
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.user-row {
    display: flex;
    align-items: center;
    height: 48px;
    padding: 0 20px;
    color: rgba(255, 255, 255, 0.65);
    font-size: 14px;
    transition: all 0.3s;
    cursor: default;
}

.user-row .el-icon {
    font-size: 18px;
    width: 24px;
    text-align: center;
    flex-shrink: 0;
}

.row-text {
    margin-left: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.action-row {
    cursor: pointer;
}

.action-row:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #fff;
}

.logout-row:hover {
    color: #ff4d4f;
    background-color: rgba(255, 255, 255, 0.1);
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
