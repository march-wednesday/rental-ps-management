# ==============================================================================
# RENTAL PS MANAGEMENT SYSTEM - DEPLOYMENT HELPER SCRIPT
# ==============================================================================

param (
    [string]$GithubRepoUrl,
    [string]$SupabaseUrl,
    [string]$SupabaseAnonKey
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  RENTAL PS MANAGEMENT SYSTEM DEPLOYMENT " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Setup Git Remote & Push
if ($GithubRepoUrl) {
    Write-Host "`n[1/3] Menghubungkan remote GitHub..." -ForegroundColor Yellow
    git remote remove origin 2>$null
    git remote add origin $GithubRepoUrl
    git branch -M main
    Write-Host "Mendorong kode ke GitHub ($GithubRepoUrl)..." -ForegroundColor Yellow
    git push -u origin main
    Write-Host "Berhasil di-push ke GitHub!" -ForegroundColor Green
}

# 2. Setup Supabase .env
if ($SupabaseUrl -and $SupabaseAnonKey) {
    Write-Host "`n[2/3] Memperbarui file .env..." -ForegroundColor Yellow
    $envContent = "VITE_SUPABASE_URL=$SupabaseUrl`nVITE_SUPABASE_ANON_KEY=$SupabaseAnonKey`n"
    Set-Content -Path ".env" -Value $envContent
    Write-Host "File .env berhasil diperbarui!" -ForegroundColor Green
}

# 3. Test Production Build
Write-Host "`n[3/3] Menjalankan uji build produksi..." -ForegroundColor Yellow
npm run build
Write-Host "`nBuild produksi siap untuk Vercel!" -ForegroundColor Green
