# 1. 构建项目
Write-Host "正在构建项目..."
cd frontend
npm run build

# 2. 进入构建输出目录
cd dist

# 3. 初始化临时 Git 仓库
git init
git checkout -b gitcode-pages

# 4. 添加所有文件
git add -A
git commit -m "deploy to gitcode"

# 5. 推送到 GitCode
$gitcode_repo = Read-Host "请输入您的 GitCode 仓库地址 (例如 https://gitcode.net/username/project.git)"

if ($gitcode_repo) {
    Write-Host "正在推送到 GitCode..."
    git remote add origin $gitcode_repo
    git push -f origin gitcode-pages
    Write-Host "部署完成！请去 GitCode 仓库设置页面开启 Pages 服务，选择 gitcode-pages 分支。"
} else {
    Write-Host "未输入仓库地址，已取消推送。"
}

# 6. 清理
cd ../..
Write-Host "脚本执行结束。"
