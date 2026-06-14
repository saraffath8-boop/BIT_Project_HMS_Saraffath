# BIT_Project_HMS_Saraffath
Get-NetTCPConnection | Select-LocalAddress, LocalPort, RemoteAddress, RemotePort, State, OwningProcess | Sort-LocalPort

Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
