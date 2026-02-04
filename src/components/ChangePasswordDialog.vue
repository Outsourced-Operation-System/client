<template>
    <el-dialog v-model="visible" title="修改密码" width="400px" :close-on-click-modal="false" @closed="handleClosed"
        append-to-body>
        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="top">
            <el-form-item label="当前密码" prop="oldPassword">
                <el-input v-model="form.oldPassword" type="password" placeholder="请输入当前密码" show-password />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
                <el-input v-model="form.newPassword" type="password" placeholder="请输入新密码" show-password />
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword">
                <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
            </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="visible = false">取消</el-button>
                <el-button type="primary" :loading="loading" @click="handleSubmit">
                    确定
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { changePassword } from '../api/auth'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const props = defineProps<{
    modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const authStore = useAuthStore()
const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val),
})

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
})

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
    if (value !== form.newPassword) {
        callback(new Error('两次输入的密码不一致'))
    } else {
        callback()
    }
}

const rules: FormRules = {
    oldPassword: [
        { required: true, message: '请输入当前密码', trigger: 'blur' },
    ],
    newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 4, message: '密码长度不能少于4位', trigger: 'blur' },
    ],
    confirmPassword: [
        { required: true, message: '请确认新密码', trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' },
    ],
}

const handleClosed = () => {
    if (formRef.value) {
        formRef.value.resetFields()
    }
    form.oldPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
}

const handleSubmit = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true
            try {
                await changePassword({
                    oldPassword: form.oldPassword,
                    newPassword: form.newPassword
                })
                visible.value = false

                // 弹窗提示成功，点击确定后登出
                await ElMessageBox.alert('密码修改成功，请重新登录', '提示', {
                    confirmButtonText: '确定',
                    type: 'success',
                    callback: () => {
                        authStore.clearAuth()
                        if (window.electronAPI?.logout) {
                            window.electronAPI.logout()
                        } else {
                            router.push('/login')
                        }
                    }
                })

            } catch (error: any) {
                ElMessage.error(error.message || '修改失败')
            } finally {
                loading.value = false
            }
        }
    })
}
</script>
