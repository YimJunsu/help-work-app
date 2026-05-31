# 유니백과 (UniPedia) - API 및 벡터 DB 설계 문서

> 작성일: 2026-05-31  
> 상태: 설계 단계 (백엔드 별도 개발 예정)  
> 담당: 프론트엔드 — Help Work App / 백엔드 — 별도 서버

---

## 1. 개요 (Concept)

고객사 운영 업무 중 자주 발생하거나 반복되는 **오류 사례를 벡터 DB에 축적**하고,  
사용자가 챗봇처럼 오류 내용을 입력하면 **의미 기반 유사도 검색(Semantic Search)**으로  
관련 해결책을 찾아 반환하는 인텔리전트 지식베이스 시스템.

```
사용자 입력 (오류 내용)
        ↓
   텍스트 임베딩 (Embedding)
        ↓
   벡터 DB 유사도 검색 (Cosine Similarity)
        ↓
   상위 N개 결과 반환
        ↓
   LLM 요약 or 원본 내용 직접 응답
```

---

## 2. 벡터 DB 스키마 설계

### 2-1. 기본 컬렉션명
```
collection: unipedia_errors
```

### 2-2. 필드 정의

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| `id` | string (UUID) | ✅ | 고유 식별자 |
| `title` | string | ✅ | 오류 제목 (짧고 명확하게) |
| `error_content` | string | ✅ | 오류 내용 전문 (임베딩 대상) |
| `part_type` | enum | ✅ | 해당 파트: `SAP` \| `WEB` |
| `solution` | string | ✅ | 해결 방법 / 조치 내용 |
| `tags` | string[] | ⬜ | 검색 보조 태그 (예: `["로그인", "타임아웃"]`) |
| `severity` | enum | ⬜ | 심각도: `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL` |
| `occurrence_count` | number | ⬜ | 발생 빈도 (정렬 가중치용) |
| `created_at` | datetime | ✅ | 등록일 |
| `updated_at` | datetime | ✅ | 최종 수정일 |
| `created_by` | string | ⬜ | 등록자 |
| `embedding` | float[] | ✅ | 벡터값 (자동 생성, 직접 입력 불필요) |

### 2-3. 예시 데이터

```json
{
  "id": "uuid-001",
  "title": "SAP 로그인 후 권한 오류",
  "error_content": "SAP 시스템 로그인 후 특정 메뉴 접근 시 '권한이 없습니다' 오류가 발생하며 화면이 빈 상태로 표시됩니다. 주로 신규 계정 또는 역할 변경 후 나타납니다.",
  "part_type": "SAP",
  "solution": "1. SAP 관리자에게 역할(Role) 재할당 요청\n2. SU01 트랜잭션에서 사용자 잠금 해제 확인\n3. 캐시 클리어 후 재로그인",
  "tags": ["권한", "로그인", "역할", "SU01"],
  "severity": "HIGH",
  "occurrence_count": 47,
  "created_at": "2026-01-15T09:00:00Z",
  "updated_at": "2026-05-20T14:30:00Z"
}
```

---

## 3. 벡터 DB 선택 옵션

| DB | 특징 | 추천 상황 |
|----|------|-----------|
| **Qdrant** | 경량, Self-hosted, REST API | 소규모 사내 서버 운영 시 ✅ 추천 |
| **Pinecone** | 완전 관리형 SaaS | 빠른 프로토타이핑, 관리 부담 없을 때 |
| **Weaviate** | 그래프 기반, 멀티모달 | 연관 관계가 복잡할 때 |
| **pgvector** | PostgreSQL 확장 | 기존 PostgreSQL 사용 중일 때 |
| **ChromaDB** | Python 친화적, 로컬 | 소규모 PoC, 개발 환경 |

> **권장**: Qdrant (Self-hosted) — 사내 데이터 보안 + REST API 명확 + 무료

---

## 4. 임베딩 모델 선택

| 모델 | 언어 지원 | 비용 | 추천도 |
|------|-----------|------|--------|
| `text-embedding-3-small` (OpenAI) | 다국어 | 유료 (저렴) | ⭐⭐⭐⭐ |
| `text-embedding-ada-002` (OpenAI) | 다국어 | 유료 | ⭐⭐⭐ |
| `jhgan/ko-sroberta-multitask` | 한국어 특화 | 무료 (Self-hosted) | ⭐⭐⭐⭐⭐ |
| `BAAI/bge-m3` | 다국어 | 무료 (Self-hosted) | ⭐⭐⭐⭐ |

> **권장**: `jhgan/ko-sroberta-multitask` (한국어 업무 용어 최적화) 또는 OpenAI `text-embedding-3-small`

---

## 5. API 설계

### 5-1. 기본 URL 구조
```
BASE_URL: https://api.unipedia.internal  (예시)
VERSION:  /v1
```

### 5-2. 엔드포인트 목록

#### 🔍 검색 (핵심 기능)
```http
POST /v1/search
Content-Type: application/json
Authorization: Bearer {API_KEY}

Request Body:
{
  "query": "SAP 로그인 후 권한 오류 메시지",
  "part_type": "SAP",          // optional: 파트 필터
  "top_k": 3,                  // optional: 반환 개수 (기본 3)
  "min_score": 0.7             // optional: 최소 유사도 (기본 0.7)
}

Response 200:
{
  "results": [
    {
      "id": "uuid-001",
      "title": "SAP 로그인 후 권한 오류",
      "part_type": "SAP",
      "solution": "1. SAP 관리자에게 역할(Role) 재할당...",
      "tags": ["권한", "로그인"],
      "severity": "HIGH",
      "score": 0.94             // 유사도 점수 (0~1)
    }
  ],
  "total": 1,
  "query_time_ms": 42
}

Response 200 (결과 없음):
{
  "results": [],
  "total": 0,
  "query_time_ms": 30
}
```

#### 📝 오류 등록
```http
POST /v1/errors
Content-Type: application/json
Authorization: Bearer {ADMIN_API_KEY}

Request Body:
{
  "title": "오류 제목",
  "error_content": "상세 오류 내용",
  "part_type": "SAP",          // "SAP" | "WEB"
  "solution": "해결 방법",
  "tags": ["태그1", "태그2"],  // optional
  "severity": "HIGH"           // optional
}

Response 201:
{
  "id": "uuid-xxx",
  "message": "등록 완료"
}
```

#### ✏️ 오류 수정
```http
PUT /v1/errors/{id}
```

#### 🗑️ 오류 삭제
```http
DELETE /v1/errors/{id}
```

#### 📋 목록 조회 (관리용)
```http
GET /v1/errors?part_type=SAP&page=1&limit=20
```

#### ❤️ 헬스체크
```http
GET /v1/health

Response 200:
{ "status": "ok", "version": "1.0.0" }

Response 503:
{ "status": "error", "message": "Vector DB connection failed" }
```

---

## 6. 프론트엔드 연동 흐름 (Help Work App)

```
[사용자 입력]
     ↓
IPC: unipedia:search (query, partType?)
     ↓
[Main Process]
  → HTTP POST {UNIPEDIA_API_URL}/v1/search
     ↓
성공 + 결과 있음  → 결과 반환
성공 + 결과 없음  → { results: [] }
연결 실패         → throw Error("ECONNREFUSED")
     ↓
[Renderer]
  결과 있음  → 결과 메시지 버블 표시
  결과 없음  → "관련 오류 사례를 찾지 못했습니다."
  연결 실패  → "서버에 연결할 수 없습니다. 관리자에게 문의하세요."
```

### IPC 핸들러 추가 위치
`src/main/ipcHandlers.ts` → `registerUniPediaHandlers()` 함수 추가

```typescript
// 예시 구조 (실제 구현 시 참고)
ipcMain.handle('unipedia:search', async (_event, query: string, partType?: string) => {
  const UNIPEDIA_URL = process.env.UNIPEDIA_API_URL || 'http://localhost:8080'
  try {
    const response = await fetch(`${UNIPEDIA_URL}/v1/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify({ query, part_type: partType, top_k: 3, min_score: 0.65 }),
      signal: AbortSignal.timeout(5000)  // 5초 타임아웃
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return { success: true, data: await response.json() }
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.code === 'ECONNREFUSED') {
      return { success: false, error: 'CONNECTION_FAILED' }
    }
    return { success: false, error: 'UNKNOWN' }
  }
})
```

---

## 7. 환경 변수 설계

```env
# .env (Main Process)
UNIPEDIA_API_URL=https://api.unipedia.internal
UNIPEDIA_API_KEY=your-secret-key
UNIPEDIA_TIMEOUT_MS=5000
```

---

## 8. 향후 개선 방향

| 단계 | 내용 |
|------|------|
| **Phase 1** | 벡터 DB 구축 + 기본 검색 API |
| **Phase 2** | LLM 연동으로 검색 결과 기반 자연어 답변 생성 |
| **Phase 3** | 오류 등록 관리 UI (Help Work App 내 관리자 화면) |
| **Phase 4** | 발생 빈도 통계 대시보드 + 자동 유사 오류 병합 제안 |

---

## 9. 체크리스트 (개발 시작 전)

- [ ] 벡터 DB 인프라 환경 결정 (Qdrant / Pinecone 등)
- [ ] 임베딩 모델 선택 및 테스트 (한국어 품질 확인)
- [ ] API 서버 기술 스택 결정 (FastAPI / Node.js 등)
- [ ] API Key 관리 방식 결정 (환경 변수 / Vault)
- [ ] 초기 오류 데이터 수집 및 정제
- [ ] 최소 유사도 임계값 튜닝 (0.65~0.80 범위 실험)
- [ ] 프론트엔드 IPC 핸들러 구현 (`src/main/ipcHandlers.ts`)
- [ ] 연결 실패 / 결과 없음 UX 처리 완료 ✅ (현재 구현됨)
