import csv
import json

input_file = 'clinics-export-2026-02-28_06-15-28.csv'
output_file = 'clinics_cleaned.csv'

# Column intended types (subset for cleaning)
json_cols = ['gmb_data', 'opening_hours', 'photos']
bool_cols = ['seo_visible', 'is_duplicate', 'is_suspended', 'is_featured', 'is_active', 'gmb_connected', 'is_active_listing', 'location_verified', 'location_pending_approval']
numeric_cols = ['average_rating', 'rating']

with open(input_file, 'r') as f_in, open(output_file, 'w', newline='') as f_out:
    reader = csv.reader(f_in, delimiter=';')
    writer = csv.writer(f_out, delimiter=',', quoting=csv.QUOTE_MINIMAL)
    
    header = next(reader)
    writer.writerow(header)
    
    col_map = {col: i for i, col in enumerate(header)}
    
    processed = 0
    for row in reader:
        # 1. Remove tabs from all fields
        row = [f.replace('\t', ' ') for f in row]
        
        # 2. Clean numeric ratings (4.90 -> 4.9)
        for col in numeric_cols:
            if col in col_map:
                idx = col_map[col]
                val = row[idx]
                if val:
                    try:
                        row[idx] = str(round(float(val), 1))
                    except ValueError:
                        pass
        
        # 3. Clean JSON (empty -> NULL string or empty structure)
        # For Supabase CSV import, empty field = NULL if configured.
        # But let's ensure it's either valid JSON or empty.
        # (Already mostly clean)
        
        # 4. Clean booleans (ensure lowercase true/false)
        for col in bool_cols:
            if col in col_map:
                idx = col_map[col]
                val = row[idx].lower()
                if val in ['true', '1']: row[idx] = 'true'
                elif val in ['false', '0']: row[idx] = 'false'
                else: row[idx] = '' # Treat as NULL
        
        writer.writerow(row)
        processed += 1
        
    print(f"Processed {processed} rows.")
