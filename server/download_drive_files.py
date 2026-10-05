import json
import os
import re
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

LOG_PATH = r'C:/Users/manis/.gemini/antigravity-ide/brain/86f02d8a-cb40-4b46-bdfe-9069979fc916/.system_generated/tasks/task-345.log'
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MATERIALS_ROOT = os.path.join(BASE_DIR, 'study-materials')
MANIFEST_PATH = os.path.join(BASE_DIR, 'server', 'downloaded_manifest.json')

def slugify(text):
    s = text.strip().lower()
    s = re.sub(r'[\s_]+', '-', s)
    s = re.sub(r'[^\w\-]', '', s)
    s = re.sub(r'\-\-+', '-', s)
    return s.strip('-')

def sanitize_filename(name):
    # Keep alphanumeric, dot, hyphen, underscore
    clean = re.sub(r'[^\w\.\-]', '_', name)
    clean = re.sub(r'_+', '_', clean)
    return clean

def classify_file(item):
    path = item['path'].replace('\\', '/')
    norm = path.lower()
    
    # Exclude records & ppts
    is_record = '/records/' in norm or '/records' in norm or 'records' in norm or 'record' in norm or 'lab manual' in norm
    is_ppt = norm.endswith('.ppt') or norm.endswith('.pptx') or 'presantion' in norm or 'presentation' in norm or 'presenation' in norm
    if is_record or is_ppt:
        return None
    
    filename = path.split('/')[-1]
    fn_lower = filename.lower()
    
    # Year and Semester determination
    if path.startswith('1--first-year/SEM-1/'):
        year_num = 1
        year_slug = 'year-1'
        sem_id = 1
        sem_slug = 'semester-1'
        sem_name = 'Semester 1'
    elif path.startswith('1--first-year/SEM-2/'):
        year_num = 1
        year_slug = 'year-1'
        sem_id = 2
        sem_slug = 'semester-2'
        sem_name = 'Semester 2'
    elif path.startswith('2--second-year/sem-1/'):
        year_num = 2
        year_slug = 'year-2'
        sem_id = 3
        sem_slug = 'semester-3'
        sem_name = 'Semester 3'
    else:
        year_num = 1
        year_slug = 'year-1'
        sem_id = 1
        sem_slug = 'semester-1'
        sem_name = 'Semester 1'
        
    # Semester 1
    if sem_id == 1:
        if 'assignments(1-1)' in norm or 'assignments(1-2)' in norm:
            cat_slug = 'assignments'
            cat_name = 'Assignments'
        elif 'mrv(1sem-1mid)' in norm:
            cat_slug = 'mid-1'
            cat_name = 'MID-1'
        elif 'mrv(1sem-2mid)' in norm:
            cat_slug = 'mid-2'
            cat_name = 'MID-2'
        elif 'sem(1-1)' in norm:
            cat_slug = 'sem-1'
            cat_name = 'SEM-1'
        elif 'syllabus' in fn_lower:
            cat_slug = 'sem-1'
            cat_name = 'SEM-1'
        else:
            cat_slug = 'mid-1'
            cat_name = 'MID-1'
            
        if any(k in fn_lower for k in ['c p ', 'cp ', 'cp_', 'computer programming']):
            sub_name = 'Computer Programming'
            sub_code = 'CS101'
        elif any(k in fn_lower for k in ['fqc', 'phy ', 'physics']):
            sub_name = 'Applied Physics (FQC)'
            sub_code = 'PHY101'
        elif any(k in fn_lower for k in ['mfc', 'mathematics for computing', 'mathematics']):
            sub_name = 'Mathematics for Computing'
            sub_code = 'MATH101'
        elif any(k in fn_lower for k in ['pse', 'ps ', 'english', 'communication']):
            sub_name = 'English & Professional Communication'
            sub_code = 'ENG101'
        elif any(k in fn_lower for k in ['qs', 'q s', 'quantitative skills', 'aptitude']):
            sub_name = 'Quantitative Skills & Aptitude'
            sub_code = 'APT101'
        elif any(k in fn_lower for k in ['wad', 'web application development']):
            sub_name = 'Web Application Development-I'
            sub_code = 'CS102'
        elif 'caeg' in fn_lower:
            sub_name = 'Computer Aided Engineering Graphics'
            sub_code = 'ME101'
        elif 'iks' in fn_lower:
            sub_name = 'Indian Knowledge Systems (IKS)'
            sub_code = 'MC101'
        elif any(k in fn_lower for k in ['timetable', 'time table', 'schedule']):
            sub_name = 'Timetables & Exam Schedules'
            sub_code = 'GEN101'
        elif 'syllabus' in fn_lower:
            sub_name = 'Syllabus & Regulations'
            sub_code = 'SYL101'
        else:
            sub_name = 'General Study Material'
            sub_code = 'GEN100'

    # Semester 2
    elif sem_id == 2:
        if 'assignments(2sem-1mid)' in norm or 'assignments(2sem-2mid)' in norm or 'nptel' in norm:
            cat_slug = 'assignments'
            cat_name = 'Assignments'
        elif 'mrv(2sem-1mid)' in norm:
            cat_slug = 'mid-1'
            cat_name = 'MID-1'
        elif 'mrv(2sem-2mid)' in norm:
            cat_slug = 'mid-2'
            cat_name = 'MID-2'
        elif 'sem(1-2)' in norm:
            cat_slug = 'sem-2'
            cat_name = 'SEM-2'
        elif 'syllabus' in fn_lower:
            cat_slug = 'sem-2'
            cat_name = 'SEM-2'
        else:
            cat_slug = 'sem-2'
            cat_name = 'SEM-2'

        if 'dbms' in fn_lower:
            sub_name = 'Database Management Systems (DBMS)'
            sub_code = 'CS201'
        elif any(k in fn_lower for k in ['data structures', 'ds ', 'ds-', 'dsa']):
            sub_name = 'Data Structures & Algorithms'
            sub_code = 'CS202'
        elif 'mps' in fn_lower:
            sub_name = 'Mathematical & Professional Skills'
            sub_code = 'MATH102'
        elif any(k in fn_lower for k in ['wad-ii', 'wad2', 'wad ']):
            sub_name = 'Web Application Development-II'
            sub_code = 'CS203'
        elif any(k in fn_lower for k in ['caeg', 'cad']):
            sub_name = 'Computer Aided Engineering Graphics & CAD'
            sub_code = 'ME102'
        elif 'uhv' in fn_lower:
            sub_name = 'Universal Human Values (UHV)'
            sub_code = 'MC102'
        elif 'french' in fn_lower or 'fl-' in fn_lower:
            sub_name = 'French Language (FL)'
            sub_code = 'LAN102'
        elif 'nptel' in norm:
            sub_name = 'NPTEL Online Course'
            sub_code = 'NPT102'
        elif 'fqc' in fn_lower:
            sub_name = 'Fundamental Quantum & Classical Physics'
            sub_code = 'PHY102'
        elif any(k in fn_lower for k in ['timetable', 'time table', 'schedule', 'whatsapp image']):
            sub_name = 'Timetables & Exam Schedules'
            sub_code = 'GEN102'
        elif 'syllabus' in fn_lower:
            sub_name = 'Syllabus & Regulations'
            sub_code = 'SYL102'
        else:
            sub_name = 'General Study Material'
            sub_code = 'GEN100'

    # Semester 3
    elif sem_id == 3:
        if '/mid-1' in norm:
            cat_slug = 'mid-1'
            cat_name = 'MID-1'
        elif '/mid-2' in norm:
            cat_slug = 'mid-2'
            cat_name = 'MID-2'
        elif '/sem-1' in norm:
            cat_slug = 'sem-3'
            cat_name = 'SEM-3'
        else:
            cat_slug = 'mid-1'
            cat_name = 'MID-1'

        if 'daa' in fn_lower or '/daa/' in norm:
            sub_name = 'Design and Analysis of Algorithms'
            sub_code = 'CS302'
        elif any(k in fn_lower for k in ['english', 'acs', 'ace']):
            sub_name = 'Advanced Communication Skills'
            sub_code = 'ENG301'
        elif any(k in fn_lower for k in ['p&s', 'probability']):
            sub_name = 'Probability and Statistics'
            sub_code = 'CS301'
        elif any(k in fn_lower for k in ['backend', 'bwt']):
            sub_name = 'Backend Development'
            sub_code = 'CS303'
        elif any(k in fn_lower for k in ['digital electronics', 'de-', 'de_']):
            sub_name = 'Digital Electronics'
            sub_code = 'EC301'
        elif any(k in fn_lower for k in ['logical reasoning', 'logical resoning', 'lras']):
            sub_name = 'Logical Reasoning'
            sub_code = 'APT301'
        else:
            sub_name = 'General Study Material'
            sub_code = 'GEN300'

    sub_slug = slugify(sub_name)
    stored_name = sanitize_filename(filename)

    rel_dir = os.path.join(year_slug, sem_slug, cat_slug, sub_slug).replace('\\', '/')
    rel_path = f"{rel_dir}/{stored_name}"

    return {
        'year_num': year_num,
        'year_slug': year_slug,
        'sem_id': sem_id,
        'sem_slug': sem_slug,
        'sem_name': sem_name,
        'cat_slug': cat_slug,
        'cat_name': cat_name,
        'sub_name': sub_name,
        'sub_code': sub_code,
        'sub_slug': sub_slug,
        'original_name': filename,
        'stored_name': stored_name,
        'rel_dir': rel_dir,
        'rel_path': rel_path,
        'drive_path': path,
        'url': item['url']
    }

def extract_file_id(url):
    m = re.search(r'id=([a-zA-Z0-9_-]+)', url)
    if m:
        return m.group(1)
    return None

def download_file_entry(entry):
    url = entry['url']
    file_id = extract_file_id(url)
    dest_dir = os.path.join(MATERIALS_ROOT, entry['rel_dir'])
    os.makedirs(dest_dir, exist_ok=True)
    dest_file = os.path.join(MATERIALS_ROOT, entry['rel_path'])

    # If already downloaded and size > 100 bytes, return cached
    if os.path.exists(dest_file) and os.path.getsize(dest_file) > 100:
        entry['size'] = os.path.getsize(dest_file)
        entry['status'] = 'cached'
        return entry

    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    
    download_url = f"https://drive.google.com/uc?id={file_id}&export=download"
    res = session.get(download_url, stream=True, timeout=60)
    
    # Handle download warning cookies if present
    for k, v in res.cookies.items():
        if k.startswith('download_warning'):
            confirm_url = f"https://drive.google.com/uc?id={file_id}&export=download&confirm={v}"
            res = session.get(confirm_url, stream=True, timeout=60)
            break
            
    if res.status_code != 200:
        entry['status'] = f'error_{res.status_code}'
        return entry
        
    with open(dest_file, 'wb') as f:
        for chunk in res.iter_content(chunk_size=32768):
            if chunk:
                f.write(chunk)
                
    entry['size'] = os.path.getsize(dest_file)
    entry['status'] = 'downloaded'
    return entry

def main():
    print(f"Reading log from: {LOG_PATH}")
    with open(LOG_PATH, 'r', encoding='utf-8', errors='ignore') as f:
        text = f.read()
    idx = text.find('[')
    items = json.loads(text[idx:])
    
    entries = []
    for it in items:
        c = classify_file(it)
        if c:
            entries.append(c)
            
    print(f"Total files to download (filtered, no records/PPTs): {len(entries)}")
    
    start_time = time.time()
    results = []
    success_count = 0
    cached_count = 0
    fail_count = 0
    
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(download_file_entry, entry): entry for entry in entries}
        for future in as_completed(futures):
            res = future.result()
            results.append(res)
            if res.get('status') == 'downloaded':
                success_count += 1
                print(f"[DOWNLOADED] {res['stored_name']} ({res['size']} bytes)")
            elif res.get('status') == 'cached':
                cached_count += 1
                print(f"[CACHED] {res['stored_name']}")
            else:
                fail_count += 1
                print(f"[FAILED] {res['stored_name']} -> {res.get('status')}")
                
    elapsed = time.time() - start_time
    print(f"\nDownload Summary in {elapsed:.2f}s:")
    print(f"  Downloaded: {success_count}")
    print(f"  Cached:     {cached_count}")
    print(f"  Failed:     {fail_count}")
    
    with open(MANIFEST_PATH, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
        
    print(f"Saved manifest to {MANIFEST_PATH}")

if __name__ == '__main__':
    main()
