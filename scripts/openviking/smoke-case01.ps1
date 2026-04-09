param(
    [string]$Url = "http://127.0.0.1:1933",
    [int]$Limit = 6
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "start-mcp.ps1")
[void](Test-OpenVikingHealth -Url $Url)

function Invoke-OpenVikingJson {
    param(
        [string]$Uri,
        [string]$Method = "Get",
        [object]$Body = $null
    )

    $payload = if ($null -eq $Body) {
        $null
    } else {
        $Body | ConvertTo-Json -Depth 12 -Compress
    }

    $response = Invoke-WebRequest `
        -UseBasicParsing `
        -Method $Method `
        -Uri $Uri `
        -Headers (Get-OpenVikingRequestHeaders) `
        -TimeoutSec 30 `
        -Body $payload

    return $response.Content | ConvertFrom-Json
}

function Get-OpenVikingMatchCount {
    param([object]$Response)

    $count = 0
    foreach ($bucketName in @("resources", "skills", "memories")) {
        if ($Response.result.PSObject.Properties.Name -contains $bucketName) {
            $bucket = $Response.result.$bucketName
            if ($null -ne $bucket) {
                $count += @($bucket).Count
            }
        }
    }
    return $count
}

$findResponse = Invoke-OpenVikingJson `
    -Method "Post" `
    -Uri "$Url/api/v1/search/find" `
    -Body @{
        query = "Case01 Freiburg convergence warehouse finale bureau trace"
        limit = $Limit
    }

if ((Get-OpenVikingMatchCount -Response $findResponse) -lt 1) {
    throw "Case01 semantic smoke returned zero matches."
}

$aliasResponse = Invoke-OpenVikingJson `
    -Method "Post" `
    -Uri "$Url/api/v1/search/grep" `
    -Body @{
        uri = "viking://resources/"
        pattern = "Lotte Weber|Lotte Fischer|Fritz Muller|Fritz Mueller"
        case_insensitive = $true
        node_limit = $Limit
    }

$aliasMatches = @($aliasResponse.result.matches)
if ($aliasMatches.Count -lt 2) {
    throw "Alias smoke did not surface the expected runtime and design identity matches."
}

$contractResponse = Invoke-OpenVikingJson `
    -Method "Post" `
    -Uri "$Url/api/v1/search/grep" `
    -Body @{
        uri = "viking://resources/"
        pattern = "bureau_trace_found|convergence_route|case01_final_outcome"
        case_insensitive = $false
        node_limit = $Limit
    }

$contractMatches = @($contractResponse.result.matches)
if ($contractMatches.Count -lt 3) {
    throw "Case01 contract smoke did not find the canonical runtime state fields."
}

Write-Host "OpenViking Case01 smoke passed at $Url."
