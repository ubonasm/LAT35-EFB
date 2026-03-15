'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lightbulb, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { LessonRecord, Extraction } from '@/types/lesson-record'

interface MetaphorSuggestion {
  category: string
  title: string
  description: string
  relevance: string
}

interface MetaphorSuggestionsProps {
  records: LessonRecord[]
  extractions: Extraction[]
  apiKey: string
  model: string
}

export function MetaphorSuggestions({ 
  records, 
  extractions, 
  apiKey, 
  model 
}: MetaphorSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<MetaphorSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<string | null>(null)

  const generateMetaphors = useCallback(async () => {
    if (!apiKey) {
      setError('APIキーを設定してください')
      return
    }

    if (records.length === 0) {
      setError('授業記録を読み込んでください')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const recordsText = records.map(r => 
        `[${r.number}] ${r.speaker}: ${r.content}`
      ).join('\n')

      const extractionsText = extractions.length > 0
        ? extractions.map(e => {
            const record = records.find(r => r.id === e.recordId)
            const codes = e.codes.length > 0 ? e.codes.join(', ') : ''
            return `発言${record?.number}: "${e.text}" ${codes ? `→ コード: ${codes}` : ''}`
          }).join('\n')
        : '(まだ抽出・コード化されていません)'

      const allCodes = [...new Set(extractions.flatMap(e => e.codes))]
      const codesText = allCodes.length > 0 ? allCodes.join(', ') : '(なし)'

      const prompt = `あなたは質的研究の専門家です。以下の授業記録と分析データを読んで、この授業の構造やダイナミクスを説明するのに適したメタファーを提案してください。

メタファーとは、授業の特徴を誰もが理解しやすい物語、映画、小説、歴史的事実、神話、童話、社会現象などに例えることです。

## 授業記録
${recordsText}

## 現在の抽出とコード
${extractionsText}

## 付与されたコード一覧
${codesText}

---

以下の観点からメタファーを5つ提案してください：
1. 物語・童話（例：桃太郎の成長物語、ウサギとカメの競争）
2. 映画・ドラマ（例：12人の怒れる男の議論、ロッキーの挑戦）
3. 歴史的事実・人物（例：ソクラテスの問答法、明治維新の変革）
4. 神話・伝説（例：プロメテウスの火、イカロスの翼）
5. 社会現象・日常（例：雪だるま式の展開、ドミノ倒し）

各メタファーについて、以下のJSON形式で簡潔に出力してください：
[
  {
    "category": "カテゴリ名",
    "title": "メタファーのタイトル",
    "description": "なぜこのメタファーが適切か（40字以内）",
    "relevance": "見えてくる授業の特徴（30字以内）"
  }
]

必ずJSON配列のみを出力し、説明文は短くしてください。`

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 4096,
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      
      console.log('[v0] Gemini response:', text)

      // JSONを抽出（コードブロックも考慮）
      let jsonText = text
      
      // ```json ... ``` を除去
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1]
      }
      
      // 配列部分を抽出
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]) as MetaphorSuggestion[]
          setSuggestions(parsed)
          setLastAnalyzedAt(new Date().toLocaleTimeString('ja-JP'))
        } catch (parseErr) {
          console.log('[v0] JSON parse error:', parseErr)
          throw new Error('JSONの解析に失敗しました')
        }
      } else {
        console.log('[v0] No JSON array found in response')
        throw new Error('メタファーの解析に失敗しました')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }, [apiKey, model, records, extractions])

  const getCategoryColor = (category: string) => {
    if (category.includes('物語') || category.includes('童話')) return 'bg-amber-100 text-amber-800'
    if (category.includes('映画') || category.includes('ドラマ')) return 'bg-blue-100 text-blue-800'
    if (category.includes('歴史')) return 'bg-emerald-100 text-emerald-800'
    if (category.includes('神話') || category.includes('伝説')) return 'bg-purple-100 text-purple-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              メタファー提案
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={generateMetaphors}
                disabled={isLoading || !apiKey || records.length === 0}
                className="gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                {suggestions.length === 0 ? '提案を取得' : '再検討'}
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
          {lastAnalyzedAt && (
            <p className="text-xs text-muted-foreground">
              最終更新: {lastAnalyzedAt}
            </p>
          )}
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="pt-2">
            {error && (
              <p className="text-sm text-destructive mb-2">{error}</p>
            )}
            
            {!apiKey && (
              <p className="text-sm text-muted-foreground">
                APIキーを設定すると、メタファーの提案を受けられます
              </p>
            )}
            
            {apiKey && records.length === 0 && (
              <p className="text-sm text-muted-foreground">
                CSVを読み込むと、メタファーの提案を受けられます
              </p>
            )}
            
            {apiKey && records.length > 0 && suggestions.length === 0 && !isLoading && !error && (
              <p className="text-sm text-muted-foreground">
                「提案を取得」ボタンを押すと、この授業に適したメタファーを提案します
              </p>
            )}
            
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                メタファーを検討中...
              </div>
            )}
            
            {suggestions.length > 0 && (
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={index} 
                    className="rounded-lg border border-border p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(suggestion.category)}`}>
                          {suggestion.category}
                        </span>
                        <span className="font-medium text-sm">{suggestion.title}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground" style={{ wordBreak: 'break-all' }}>
                      {suggestion.description}
                    </p>
                    <p className="text-xs text-primary" style={{ wordBreak: 'break-all' }}>
                      {suggestion.relevance}
                    </p>
                  </div>
                ))}
                
                <p className="text-xs text-muted-foreground pt-2">
                  分析が進んだら「再検討」ボタンで、新しいコードを反映した提案を受けられます
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
