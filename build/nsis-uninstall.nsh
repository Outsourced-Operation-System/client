!macro customUnInstall
  ; 删除 APPDATA 下的用户数据
  RMDir /r "$APPDATA\bundle"
!macroend
