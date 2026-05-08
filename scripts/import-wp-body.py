"""
WordPress XML 본문 추출 → Supabase 업데이트

사용법:
  python scripts/import-wp-body.py <XML_파일_경로>

예시:
  python scripts/import-wp-body.py "C:/Users/SOWON/Downloads/Drivever_WordPress.2026-04-29.xml"
"""

import sys, re, json, urllib.request, urllib.error
import xml.etree.ElementTree as ET

# Windows cp949 터미널에서 UTF-8 출력
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# ── 설정 ────────────────────────────────────────────────────────────
SUPABASE_URL = "https://ucmszptjjwvathygkqzg.supabase.co"
SUPABASE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbXN6cHRqand2YXRoeWdrcXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTI4NDAsImV4cCI6MjA5MjI2ODg0MH0."
    "sVzJGC-rJ3SUie14hiBomXK6-8V7D9BQS3t_08GqTRA"
)

TARGET_IDS = {18, 52, 77, 105, 128, 150, 174, 186, 199, 202,
              219, 244, 275, 292, 300, 323, 347, 353, 365}

WP_NS = {
    'wp':      'http://wordpress.org/export/1.2/',
    'content': 'http://purl.org/rss/1.0/modules/content/',
    'excerpt': 'http://wordpress.org/export/1.0/modules/excerpt/',
    'dc':      'http://purl.org/dc/elements/1.1/',
}

# ── 유틸 ────────────────────────────────────────────────────────────

def strip_wp_comments(html: str) -> str:
    """<!-- wp:... --> / <!-- /wp:... --> 블록 주석 제거"""
    return re.sub(r'<!--\s*/?\s*wp:[^>]*-->', '', html).strip()

def first_text(html: str, max_len: int = 200) -> str:
    """HTML에서 첫 번째 텍스트 단락 추출 (description 용)"""
    text = re.sub(r'<[^>]+>', '', html)
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:max_len].rstrip()

def supabase_patch(post_id: int, payload: dict):
    """Supabase REST PATCH"""
    url = f"{SUPABASE_URL}/rest/v1/posts?id=eq.{post_id}"
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        url, data=data, method='PATCH',
        headers={
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Prefer': 'return=minimal',
        }
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code

# ── 메인 ────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print("사용법: python scripts/import-wp-body.py <XML_파일_경로>")
        sys.exit(1)

    xml_path = sys.argv[1]
    print(f"읽는 중: {xml_path}")

    try:
        tree = ET.parse(xml_path)
    except Exception as e:
        print(f"XML 파싱 오류: {e}")
        sys.exit(1)

    root = tree.getroot()
    channel = root.find('channel')
    if channel is None:
        print("channel 요소를 찾을 수 없습니다.")
        sys.exit(1)

    updated = 0
    for item in channel.findall('item'):
        post_type = item.findtext('wp:post_type', namespaces=WP_NS)
        if post_type != 'post':
            continue

        post_status = item.findtext('wp:status', namespaces=WP_NS)
        if post_status not in ('publish', 'draft'):
            continue

        post_id_str = item.findtext('wp:post_id', namespaces=WP_NS)
        if not post_id_str:
            continue
        post_id = int(post_id_str)
        if post_id not in TARGET_IDS:
            continue

        raw_title       = item.findtext('title') or ''
        raw_content     = item.findtext('content:encoded', namespaces=WP_NS) or ''
        raw_excerpt     = item.findtext('excerpt:encoded', namespaces=WP_NS) or ''

        title       = raw_title.strip()
        body_html   = strip_wp_comments(raw_content)
        description = raw_excerpt.strip() or first_text(body_html)

        print(f"\n[id={post_id}] {title[:60]}")
        print(f"  body_html 길이: {len(body_html)} chars")
        print(f"  description:    {description[:80]}...")

        payload = {
            'title':       title,
            'description': description,
            'body_html':   body_html,
        }
        status = supabase_patch(post_id, payload)
        if status in (200, 204):
            print(f"  [OK] Supabase 업데이트 완료 (HTTP {status})")
            updated += 1
        else:
            print(f"  [FAIL] 업데이트 실패 (HTTP {status})")

    print(f"\n완료: {updated}/{len(TARGET_IDS)}개 포스트 업데이트됨")

if __name__ == '__main__':
    main()
