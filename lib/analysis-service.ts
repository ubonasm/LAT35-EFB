import type { LessonRecord, Extraction, AnalysisResult, RelationNode, CodeRelation, CodeRelationType } from '@/types/lesson-record'

interface AnalysisInput {
  records: LessonRecord[]
  extractions: Extraction[]
  apiKey: string
  model: string
  codeRelations?: CodeRelation[]
}

export async function analyzeWithGemini({
  records,
  extractions,
  apiKey,
  model,
  codeRelations = [],
}: AnalysisInput): Promise<AnalysisResult> {
  const prompt = buildAnalysisPrompt(records, extractions, codeRelations)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'API request failed')
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    throw new Error('No response from API')
  }

  return parseAnalysisResponse(text, records, extractions)
}

const RELATION_TYPE_LABELS: Record<CodeRelationType, string> = {
  inclusion: '包含',
  superordinate: '上位概念',
  subordinate: '下位概念',
  temporal: '時間順序',
  equivalent: '同等',
  part: '一部',
  contrast: '対比',
  causal: '因果',
}

function buildAnalysisPrompt(records: LessonRecord[], extractions: Extraction[], codeRelations: CodeRelation[]): string {
  const recordsText = records.map(r => 
    `[${r.number}] ${r.speaker}: ${r.content}`
  ).join('\n')

  const extractionsText = extractions.map(e => {
    const record = records.find(r => r.id === e.recordId)
    const codes = e.codes.map(c => `<${c}>`).join(' ')
    return `発言${record?.number}: "${e.text}" → ${codes || '(コードなし)'}`
  }).join('\n')

  const allCodes = [...new Set(extractions.flatMap(e => e.codes))]
  const codesText = allCodes.map(c => `<${c}>`).join(', ')

  // コード辞書（関係定義）のテキスト化
  const codeDictionaryText = codeRelations.length > 0
    ? codeRelations.map(r => {
        const label = RELATION_TYPE_LABELS[r.relationType]
        const desc = r.description ? ` (${r.description})` : ''
        return `- <${r.sourceCode}> → [${label}] → <${r.targetCode}>${desc}`
      }).join('\n')
    : '(定義なし)'

  return `あなたは質的研究（グラウンデッド・セオリー・アプローチ等）に精通した教育学・社会学の専門家です。以下の授業記録と分析者のコーディングを、多角的かつ深層的に分析してください。

## 授業記録
${recordsText}

## 分析者による抽出とコーディング
${extractionsText}

## 付与されたコード一覧
${codesText || '(なし)'}

## コード辞書（分析者が定義したコード間の関係）
${codeDictionaryText}

---

## 分析の観点（必ず以下の全てを考慮すること）

### A. 語の共起分析
- 同一発言内、または近接する発言で繰り返し共に出現する語や概念のペアを特定してください
- 共起パターンから、発言者の思考の枠組みや前提を読み取ってください
- コード同士が同じ発言に付与されている場合、その共起の意味を考察してください

### B. 低頻度だが重要な要素の特定
- 出現回数は少なくても、授業全体の文脈において転換点となる発言を特定してください
- 一見目立たないが、後の議論の展開に影響を与えている「種」となる発言を見つけてください
- 沈黙や言い淀み、曖昧な表現が持つ潜在的な意味にも注意してください

### C. 社会・文化的文脈の読み取り
- 発言の背後にある社会的規範、文化的価値観、権力関係を読み解いてください
- 教室という場における「暗黙のルール」や「期待される役割」がどう作用しているか分析してください
- 教師と児童生徒の間の知識の非対称性、ジェンダー、学力差などの社会的要因の影響を考慮してください

### D. 授業の深層構造
- 表面的なやり取りの下に隠れている学習のダイナミクスを明らかにしてください
- 「なぜその発言がそのタイミングで出たのか」という問いを立て、授業の見えない流れを可視化してください
- 教師の意図と児童生徒の理解の「ズレ」や「予想外の展開」に注目してください

---

以下の形式で分析結果を出力してください：

### 1. 理論的ストーリー（約1000字）
【重要】単なる授業の要約や説明ではなく、以下を含む深い解釈を記述してください：
- 表面的な観察からは見えにくい授業の構造的特徴
- 発言の背後にある社会・文化的な意味や価値観
- 語の共起パターンから読み取れる思考の枠組み
- 低頻度だが決定的に重要な発言とその意義
- この授業が教育的に持つ独自の価値や課題
コードを用いながら、研究論文の考察セクションのような深度で記述してください。

### 2. 発言関係分析
重要な発言のつながり（特に共起関係、因果関係、転換点）を以下の形式で出力してください：
STATEMENT_RELATIONS:
id1|ラベル1|type|接続先id（カンマ区切り）
id2|ラベル2|type|接続先id

### 3. コード関係分析
コード間の関係（共起、包含、対比、因果など）を以下の形式で出力してください：
CODE_RELATIONS:
id1|コード名1|type|接続先id
id2|コード名2|type|接続先id

### 4. 統合関係分析
発言とコードの関係を統合した分析を以下の形式で出力してください：
INTEGRATED_RELATIONS:
id1|ラベル1|type|接続先id
id2|ラベル2|type|接続先id

typeは statement, code, category のいずれかです。`
}

function parseAnalysisResponse(
  text: string,
  records: LessonRecord[],
  extractions: Extraction[]
): AnalysisResult {
  // Extract theoretical story
  const storyMatch = text.match(/### 1\. 理論的ストーリー[^\n]*\n([\s\S]*?)(?=### 2\.|$)/)
  const theoreticalStory = storyMatch?.[1]?.trim() || text.split('###')[1] || '分析結果を取得できませんでした。'

  // Parse statement relations
  const statementRelations = parseRelations(text, 'STATEMENT_RELATIONS:', records, extractions)
  
  // Parse code relations
  const codeRelations = parseRelations(text, 'CODE_RELATIONS:', records, extractions)
  
  // Parse integrated relations
  const integratedRelations = parseRelations(text, 'INTEGRATED_RELATIONS:', records, extractions)

  // If parsing failed, create default nodes from existing data
  const result: AnalysisResult = {
    theoreticalStory,
    statementRelations: statementRelations.length > 0 ? statementRelations : createDefaultStatementNodes(records),
    codeRelations: codeRelations.length > 0 ? codeRelations : createDefaultCodeNodes(extractions),
    integratedRelations: integratedRelations.length > 0 ? integratedRelations : createDefaultIntegratedNodes(records, extractions),
  }

  return result
}

function parseRelations(
  text: string,
  marker: string,
  records: LessonRecord[],
  extractions: Extraction[]
): RelationNode[] {
  const nodes: RelationNode[] = []
  const markerIndex = text.indexOf(marker)
  
  if (markerIndex === -1) return nodes

  const section = text.slice(markerIndex + marker.length)
  const endIndex = section.search(/###|\n\n[A-Z]/)
  const content = endIndex > -1 ? section.slice(0, endIndex) : section

  const lines = content.trim().split('\n').filter(line => line.includes('|'))

  for (const line of lines) {
    const parts = line.split('|').map(p => p.trim())
    if (parts.length >= 3) {
      nodes.push({
        id: parts[0] || `node-${nodes.length}`,
        label: parts[1] || '',
        type: (parts[2] as 'statement' | 'code' | 'category') || 'statement',
        connections: parts[3]?.split(',').map(c => c.trim()).filter(Boolean) || [],
      })
    }
  }

  return nodes
}

function createDefaultStatementNodes(records: LessonRecord[]): RelationNode[] {
  return records.slice(0, 10).map((r, i) => ({
    id: `s${r.number}`,
    label: `発言${r.number}: ${r.content.slice(0, 20)}...`,
    type: 'statement' as const,
    connections: i < records.length - 1 ? [`s${records[i + 1]?.number}`] : [],
  }))
}

function createDefaultCodeNodes(extractions: Extraction[]): RelationNode[] {
  const allCodes = [...new Set(extractions.flatMap(e => e.codes))]
  return allCodes.map((code, i) => ({
    id: `c${i}`,
    label: code,
    type: 'code' as const,
    connections: i < allCodes.length - 1 ? [`c${i + 1}`] : [],
  }))
}

function createDefaultIntegratedNodes(
  records: LessonRecord[],
  extractions: Extraction[]
): RelationNode[] {
  const nodes: RelationNode[] = []
  const allCodes = [...new Set(extractions.flatMap(e => e.codes))]

  // Add key statements
  const keyRecords = records.filter(r => 
    extractions.some(e => e.recordId === r.id)
  ).slice(0, 5)

  keyRecords.forEach((r, i) => {
    nodes.push({
      id: `int-s${r.number}`,
      label: `[${r.number}] ${r.content.slice(0, 15)}...`,
      type: 'statement',
      connections: [],
    })
  })

  // Add codes
  allCodes.slice(0, 5).forEach((code, i) => {
    nodes.push({
      id: `int-c${i}`,
      label: code,
      type: 'code',
      connections: [],
    })
  })

  // Create some connections
  for (let i = 0; i < nodes.length; i++) {
    if (i < nodes.length - 1) {
      nodes[i].connections.push(nodes[i + 1].id)
    }
  }

  return nodes
}
