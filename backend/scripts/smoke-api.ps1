param(
  [string]$BaseUrl = "http://localhost:4000/api/v1"
)

$ErrorActionPreference = "Stop"

function Assert-Step($Name, [scriptblock]$Action) {
  try {
    $res = & $Action
    Write-Host "[PASS] $Name" -ForegroundColor Green
    return $res
  } catch {
    Write-Host "[FAIL] $Name -> $($_.Exception.Message)" -ForegroundColor Red
    exit 1
  }
}

Write-Host "=== CampusFlow Backend Live API Smoke Test ($BaseUrl) ===" -ForegroundColor Cyan

$health = Assert-Step "1. GET /health" {
  Invoke-RestMethod -Uri "$BaseUrl/health" -Method GET
}
if ($health.data.status -ne "healthy") { throw "Health status tidak healthy" }

$demo = Assert-Step "2. POST /auth/demo" {
  Invoke-RestMethod -Uri "$BaseUrl/auth/demo" -Method POST
}
$token = $demo.data.token
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

Assert-Step "3. GET /users/me" {
  Invoke-RestMethod -Uri "$BaseUrl/users/me" -Headers $headers
} | Out-Null

$now = [DateTime]::UtcNow
$todayStr = $now.ToString("yyyy-MM-dd")

Assert-Step "4. POST /sedentary/sessions" {
  $body = @{
    startTime = $now.AddMinutes(-50).ToString("o")
    endTime = $now.ToString("o")
    durationMinutes = 50
    slouchCount = 1
    tooCloseCount = 0
    avgNeckRatio = 0.88
    breakCompleted = $true
    breakDurationMins = 5
    verificationSource = "POSE_CAMERA_AI"
  } | ConvertTo-Json
  Invoke-RestMethod -Uri "$BaseUrl/sedentary/sessions" -Method POST -Headers $headers -Body $body
} | Out-Null

$act = Assert-Step "5. POST /activities (MODERATE 25 mnt -> 100 METs)" {
  $body = @{
    activityDate = $todayStr
    intensityType = "MODERATE"
    durationMinutes = 25
    stepsCount = 2800
    avgCadenceSpm = 112
    source = "WEB_SENSOR_API"
    notes = "Smoke test activity"
  } | ConvertTo-Json
  Invoke-RestMethod -Uri "$BaseUrl/activities" -Method POST -Headers $headers -Body $body
}
if ([double]$act.data.calculatedMets -ne 100) { throw "METs tidak sesuai (harapan 100)" }

$wb = Assert-Step "6. POST /wellbeing/daily (PSS-4 reverse scoring)" {
  $body = @{
    logDate = $todayStr
    sleepHours = 6.0
    sleepQualityScore = 2
    nonAcademicScreenHours = 4.0
    pss4Answers = @(2, 1, 1, 3)
  } | ConvertTo-Json
  Invoke-RestMethod -Uri "$BaseUrl/wellbeing/daily" -Method POST -Headers $headers -Body $body
}
if ($wb.data.pss4TotalScore -ne 11) { throw "Skor PSS-4 tidak sesuai (harapan 11)" }

Assert-Step "7. GET /dashboard/triad?days=14" {
  Invoke-RestMethod -Uri "$BaseUrl/dashboard/triad?days=14" -Headers $headers
} | Out-Null

$ai = Assert-Step "8. POST /ai-coach/generate" {
  Invoke-RestMethod -Uri "$BaseUrl/ai-coach/generate" -Method POST -Headers $headers
}
Write-Host "   -> AI Mediator: $($ai.data.dominantMediator) (Source: $($ai.data.generationSource))" -ForegroundColor Yellow

Assert-Step "9. PATCH /ai-coach/:id/complete" {
  Invoke-RestMethod -Uri "$BaseUrl/ai-coach/$($ai.data.id)/complete" -Method PATCH -Headers $headers
} | Out-Null

Assert-Step "10. GET /assessments" {
  Invoke-RestMethod -Uri "$BaseUrl/assessments" -Headers $headers
} | Out-Null

Write-Host "=== SEMUA 10 SMOKE TEST BACKEND LOLOS ===" -ForegroundColor Green
