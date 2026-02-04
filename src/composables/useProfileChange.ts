import { ref } from "vue";

export function useProfileChange() {
  const changePasswordVisible = ref(false);

  const openChangePasswordDialog = () => {
    changePasswordVisible.value = true;
  };

  return {
    changePasswordVisible,
    openChangePasswordDialog,
  };
}
