import paramiko, sys, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

# Get counts for all transactional arrays
keys = ['orders','plates','usages','dispatches','challans','purchaseOrders',
        'purchaseReceipts','tcRecords','quotations','cncQuotations','ringQuotations',
        'transportBills','logs','cuttingAllocations','cncRateCalculations',
        'jobWorkOutwards','jobWorkInwards','weighbridgeEntries','rejectMaterialReturns','anmsMtcRecords',
        'parties','workers','transports','items','sections','grades']

for key in keys:
    cmd = f"sudo -u postgres psql -d jagdamba_final -t -c \"SELECT jsonb_array_length(data->'{key}') FROM erp_data WHERE id='main';\""
    _, o, _ = c.exec_command(cmd, timeout=30)
    result = o.read().decode('utf-8', errors='replace').strip()
    print(f"{key:30s} = {result}")

c.close()
