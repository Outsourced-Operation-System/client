<template>
    <div class="user-management">
        <div class="header">
            <h2>用户管理</h2>
            <el-button type="primary" @click="handleAddUser">添加用户</el-button>
        </div>

        <el-table :data="users" v-loading="loading" style="width: 100%">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="role" label="角色">
                <template #default="scope">
                    <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'success'">
                        {{ scope.row.role === 'admin' ? '管理员' : '普通用户' }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间">
                <template #default="scope">
                    {{ formatDate(scope.row.createdAt) }}
                </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
                <template #default="scope">
                    <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
                    <el-button size="small" type="danger" @click="handleDelete(scope.row)"
                        :disabled="scope.row.username === currentUser?.username">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 添加/编辑用户对话框 -->
        <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '添加用户'" width="500px">
            <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
                <el-form-item label="用户名" prop="username">
                    <el-input v-model="form.username" :disabled="isEdit" />
                </el-form-item>
                <el-form-item label="密码" prop="password" :rules="isEdit ? rules.changePassword : addPasswordRules">
                    <el-input v-model="form.password" type="password" :placeholder="isEdit ? '如果不修改请留空' : '请输入密码'"
                        show-password />
                </el-form-item>
                <el-form-item v-if="form.password || !isEdit" label="确认密码" prop="confirmPassword">
                    <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
                </el-form-item>
                <el-form-item label="角色" prop="role">
                    <el-select v-model="form.role" placeholder="请选择角色">
                        <el-option label="管理员" value="admin" />
                        <el-option label="普通用户" value="user" />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="handleSubmit" :loading="submitting">
                        确定
                    </el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    type UserInfo,
} from "../api/auth";
import { useAuthStore } from "../stores/auth";

const authStore = useAuthStore();
const currentUser = authStore.user;

const users = ref<UserInfo[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
    id: 0,
    username: "",
    password: "",
    confirmPassword: "",
    role: "user",
});

const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
    if (form.password && value !== form.password) {
        callback(new Error('两次输入的密码不一致'));
    } else {
        callback();
    }
};

const rules = reactive<FormRules>({
    username: [
        { required: true, message: "请输入用户名", trigger: "blur" },
        { min: 3, max: 20, message: "长度在 3 到 20 个字符", trigger: "blur" },
    ],
    changePassword: [
        { min: 4, message: "密码长度不能少于 4 位", trigger: "blur" },
    ],
    confirmPassword: [
        { required: true, message: "请确认密码", trigger: "blur" },
        { validator: validateConfirmPassword, trigger: "blur" },
    ],
    role: [{ required: true, message: "请选择角色", trigger: "change" }],
});

const addPasswordRules: FormRules[string] = [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 4, message: "密码长度不能少于 4 位", trigger: "blur" },
];

const fetchUsers = async () => {
    loading.value = true;
    try {
        users.value = await getUsers();
        console.log("Fetched users:", users.value);
    } catch (error: any) {
        ElMessage.error(error.message || "获取用户列表失败");
    } finally {
        loading.value = false;
    }
};

const handleAddUser = () => {
    isEdit.value = false;
    form.id = 0;
    form.username = "";
    form.password = "";
    form.confirmPassword = "";
    form.role = "user";
    dialogVisible.value = true;
};

const handleEdit = (row: UserInfo) => {
    isEdit.value = true;
    form.id = row.id;
    form.username = row.username;
    form.password = ""; // 编辑时不回显密码
    form.confirmPassword = "";
    form.role = row.role;
    dialogVisible.value = true;
};

const handleDelete = (row: UserInfo) => {
    ElMessageBox.confirm(
        `确定要删除用户 "${row.username}" 吗？`,
        "警告",
        {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
        }
    )
        .then(async () => {
            try {
                console.log(row)
                await deleteUser(row.id);
                ElMessage.success("删除成功");
                fetchUsers();
            } catch (error: any) {
                ElMessage.error(error.message || "删除失败");
            }
        })
        .catch(() => { });
};

const handleSubmit = async () => {
    if (!formRef.value) return;
    await formRef.value.validate(async (valid) => {
        if (valid) {
            submitting.value = true;
            try {
                if (isEdit.value) {
                    const data: any = { role: form.role };
                    if (form.password) {
                        data.password = form.password;
                    }
                    if (form.username) {
                        data.username = form.username;
                    }
                    await updateUser(form.id, data);
                    ElMessage.success("更新成功");
                } else {
                    await createUser({
                        username: form.username,
                        password: form.password,
                        role: form.role,
                    });
                    ElMessage.success("创建成功");
                }
                dialogVisible.value = false;
                fetchUsers();
            } catch (error: any) {
                ElMessage.error(error.message || (isEdit.value ? "更新失败" : "创建失败"));
            } finally {
                submitting.value = false;
            }
        }
    });
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
};

onMounted(() => {
    fetchUsers();
});
</script>

<style scoped>
.user-management {
    padding: 20px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}
</style>
