from app import app

with app.test_client() as client:
    # Test establishments endpoint
    response = client.get('/api/establishments')
    print('Status:', response.status_code)
    data = response.get_json()
    print(f'Found {len(data)} establishments:')
    for est in data:
        print(f'  - {est["name"]} ({est["type"]})')
    
    # Test a single establishment
    print('\nTesting single establishment (ID=1):')
    response = client.get('/api/establishments/1')
    est = response.get_json()
    print(f'  Name: {est["name"]}')
    print(f'  Type: {est["type"]}')
    print(f'  Address: {est["address"]}')
