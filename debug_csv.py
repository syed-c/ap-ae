import csv
import json
import uuid

def is_valid_uuid(val):
    if not val: return True
    try:
        uuid.UUID(val)
        return True
    except ValueError:
        return False

def is_valid_json(val):
    if not val: return True
    try:
        json.loads(val)
        return True
    except ValueError:
        return False

def is_valid_bool(val):
    if not val: return True
    return val.lower() in ['true', 'false', '1', '0']

def is_valid_timestamp(val):
    if not val: return True
    # Simplified check
    return len(val) >= 10 and '-' in val and ':' in val

columns_to_check = {
    'id': is_valid_uuid,
    'city_id': is_valid_uuid,
    'area_id': is_valid_uuid,
    'owner_id': is_valid_uuid,
    'claimed_by': is_valid_uuid,
    'duplicate_group_id': is_valid_uuid,
    'seo_visible': is_valid_bool,
    'is_duplicate': is_valid_bool,
    'is_suspended': is_valid_bool,
    'is_featured': is_valid_bool,
    'is_active': is_valid_bool,
    'gmb_connected': is_valid_bool,
    'is_active_listing': is_valid_bool,
    'location_verified': is_valid_bool,
    'location_pending_approval': is_valid_bool,
    'gmb_data': is_valid_json,
    'opening_hours': is_valid_json,
    'photos': is_valid_json,
    'created_at': is_valid_timestamp,
    'updated_at': is_valid_timestamp,
    'verified_at': is_valid_timestamp,
    'verification_expires_at': is_valid_timestamp,
}

with open('clinics-export-2026-02-28_06-15-28.csv', 'r') as f:
    reader = csv.reader(f, delimiter=';')
    header = next(reader)
    col_map = {col: i for i, col in enumerate(header)}
    
    row_count = 1
    error_count = 0
    try:
        for row in reader:
            row_count += 1
            if len(row) != len(header):
                print(f"Row {row_count}: Column count mismatch ({len(row)} vs {len(header)})")
                error_count += 1
                
            for col, validator in columns_to_check.items():
                if col in col_map:
                    val = row[col_map[col]]
                    if not validator(val):
                        # Skip showing JSON errors if they are just empty
                        if col in ['gmb_data', 'opening_hours', 'photos'] and val == "":
                             continue
                        print(f"Row {row_count}: Invalid {col} value: '{val}'")
                        error_count += 1
            
            if error_count > 50:
                print("Too many errors, stopping.")
                break
    except csv.Error as e:
        print(f"PARSE ERROR at row {row_count}: {e}")

if error_count == 0:
    print("No data type errors found in the file structure.")
else:
    print(f"Total errors found: {error_count}")
