# Wrapper for sync-i18n.mjs
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
node (Join-Path $PSScriptRoot "sync-i18n.mjs")
