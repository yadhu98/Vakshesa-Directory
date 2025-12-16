import csv
import json
import requests

# Path to your CSV file
csv_file = 'sample_family_bulk.csv'

# Backend API endpoint
url = 'http://localhost:3000/api/bulk/import-families-bulk'  # Change port/path if needed
headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <ADMIN_TOKEN>'  # Replace with your admin JWT token
}

def csv_to_json(csv_path):
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        data = [row for row in reader if not row[reader.fieldnames[0]].startswith('#')]
    return data

def main():
    data = csv_to_json(csv_file)
    print(f'Loaded {len(data)} records from CSV.')
    response = requests.post(url, headers=headers, data=json.dumps(data))
    print('Status:', response.status_code)
    print('Response:', response.json())

if __name__ == '__main__':
    main()
