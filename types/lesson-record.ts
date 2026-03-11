export interface LessonRecord {
  id: string
  number: number
  speaker: string
  content: string
}

export interface Extraction {
  id: string
  recordId: string
  text: string
  codes: string[]
}

export interface AnalysisResult {
  theoreticalStory: string
  statementRelations: RelationNode[]
  codeRelations: RelationNode[]
  integratedRelations: RelationNode[]
}

export interface RelationNode {
  id: string
  label: string
  type: 'statement' | 'code' | 'category'
  connections: string[]
  x?: number
  y?: number
}

// コード辞書の関係タイプ
export type CodeRelationType = 
  | 'inclusion'      // 包含（AはBを含む）
  | 'superordinate'  // 上位概念（AはBの上位）
  | 'subordinate'    // 下位概念（AはBの下位）
  | 'temporal'       // 時間順序（AはBの前/後）
  | 'equivalent'     // 同等（AとBは同義）
  | 'part'           // 一部（AはBの一部）
  | 'contrast'       // 対比（AとBは対照的）
  | 'causal'         // 因果（AはBの原因/結果）

export interface CodeRelation {
  id: string
  sourceCode: string
  targetCode: string
  relationType: CodeRelationType
  description?: string
}

export interface CodeDictionary {
  relations: CodeRelation[]
  createdAt: string
  updatedAt: string
}
