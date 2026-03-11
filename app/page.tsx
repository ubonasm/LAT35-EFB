"use client"

import { useState, useCallback } from 'react'
import { Loader2, Sparkles, RotateCcw, Download, Upload, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { CSVUploader } from '@/components/csv-uploader'
import { AnalysisTable } from '@/components/analysis-table'
import { APISettings } from '@/components/api-settings'
import { CodeSummary } from '@/components/code-summary'
import { CodeDictionaryPanel } from '@/components/code-dictionary'
import { AnalysisResults } from '@/components/analysis-results'
import { useLessonStore } from '@/hooks/use-lesson-store'
import { analyzeWithGemini } from '@/lib/analysis-service'
import type { LessonRecord, CodeRelation } from '@/types/lesson-record'

export default function HomePage() {
  const { toast } = useToast()
  const {
    records,
    extractions,
    analysisResult,
    isAnalyzing,
    loadRecords,
    importData,
    addExtraction,
    updateExtractionCodes,
    removeExtraction,
    getAllExtractions,
    setAnalysisResult,
    setIsAnalyzing,
  } = useLessonStore()

  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gemini-3-flash-preview')
  const [codeRelations, setCodeRelations] = useState<CodeRelation[]>([])

  const handleLoadRecords = useCallback((newRecords: LessonRecord[]) => {
    loadRecords(newRecords)
    toast({
      title: 'CSVを読み込みました',
      description: `${newRecords.length}件の発言を読み込みました`,
    })
  }, [loadRecords, toast])

  const handleAnalyze = useCallback(async () => {
    if (!apiKey) {
      toast({
        title: 'APIキーが必要です',
        description: 'API設定からGemini APIキーを入力してください',
        variant: 'destructive',
      })
      return
    }

    const allExtractions = getAllExtractions()
    if (allExtractions.length === 0) {
      toast({
        title: '抽出がありません',
        description: '分析の前に発言内容から抽出を行ってください',
        variant: 'destructive',
      })
      return
    }

    setIsAnalyzing(true)
    
    try {
      const result = await analyzeWithGemini({
        records,
        extractions: allExtractions,
        apiKey,
        model,
        codeRelations,
      })
      setAnalysisResult(result)
      toast({
        title: '分析完了',
        description: '理論的ストーリーと関係図が生成されました',
      })
    } catch (error) {
      toast({
        title: '分析エラー',
        description: error instanceof Error ? error.message : '分析中にエラーが発生しました',
        variant: 'destructive',
      })
    } finally {
      setIsAnalyzing(false)
    }
  }, [apiKey, model, records, codeRelations, getAllExtractions, setAnalysisResult, setIsAnalyzing, toast])

  const handleReset = useCallback(() => {
    loadRecords([])
    setAnalysisResult(null)
    toast({
      title: 'リセット完了',
      description: 'すべてのデータをクリアしました',
    })
  }, [loadRecords, setAnalysisResult, toast])

  const handleExport = useCallback(() => {
    const allExtractions = getAllExtractions()
    const data = {
      records,
      extractions: allExtractions,
      analysisResult,
      codeRelations,
      exportedAt: new Date().toISOString(),
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lesson-analysis-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: 'エクスポート完了',
      description: 'JSONファイルをダウンロードしました',
    })
  }, [records, getAllExtractions, analysisResult, codeRelations, toast])

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        
        if (!data.records || !Array.isArray(data.records)) {
          throw new Error('無効なファイル形式です')
        }
        
        importData({
          records: data.records,
          extractions: data.extractions || [],
          analysisResult: data.analysisResult || null,
        })
        
        if (data.codeRelations && Array.isArray(data.codeRelations)) {
          setCodeRelations(data.codeRelations)
        }
        
        toast({
          title: 'インポート完了',
          description: `${data.records.length}件の発言、${data.extractions?.length || 0}件の抽出を読み込みました`,
        })
      } catch (error) {
        toast({
          title: 'インポートエラー',
          description: error instanceof Error ? error.message : 'ファイルの読み込みに失敗しました',
          variant: 'destructive',
        })
      }
    }
    input.click()
  }, [importData, setCodeRelations, toast])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">授業記録分析ツール</h1>
              <p className="text-xs text-muted-foreground">質的研究のためのコーディング支援</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <APISettings
              apiKey={apiKey}
              onApiKeyChange={setApiKey}
              model={model}
              onModelChange={setModel}
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleImport}
              className="hidden gap-2 sm:flex"
            >
              <Upload className="h-4 w-4" />
              インポート
            </Button>
            
            {records.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="hidden gap-2 sm:flex"
                >
                  <Download className="h-4 w-4" />
                  エクスポート
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">リセット</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {records.length === 0 ? (
          <div className="mx-auto max-w-2xl">
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">授業記録をアップロード</CardTitle>
                <CardDescription className="text-base">
                  CSV形式の授業記録をアップロードして、質的分析を始めましょう
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CSVUploader onLoad={handleLoadRecords} />
                
                <div className="mt-8 rounded-lg bg-muted/50 p-6">
                  <h3 className="mb-4 font-semibold text-foreground">使い方</h3>
                  <ol className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">1</span>
                      <span>CSVファイルをアップロード（発言番号、発言者、発言内容の3列）</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">2</span>
                      <span>発言内容のテキストを選択して「抽出」ボタンをクリック</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">3</span>
                      <span>抽出した部分にコードを付与（タグアイコンをクリック）</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">4</span>
                      <span>「コード分析」ボタンで総合分析を実行</span>
                    </li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  授業記録の分析
                </h2>
                <p className="text-sm text-muted-foreground">
                  {records.length}件の発言 / {getAllExtractions().length}件の抽出
                </p>
              </div>
              
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                size="lg"
                className="gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    コード分析
                  </>
                )}
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
              <div className="space-y-6">
                <AnalysisTable
                  records={records}
                  extractions={extractions}
                  onAddExtraction={addExtraction}
                  onUpdateCodes={updateExtractionCodes}
                  onRemoveExtraction={removeExtraction}
                />
                
                {analysisResult && (
                  <>
                    <Separator />
                    <AnalysisResults result={analysisResult} />
                  </>
                )}
              </div>

              <aside className="space-y-6">
                <CodeSummary extractions={getAllExtractions()} />
                <CodeDictionaryPanel
                  relations={codeRelations}
                  onRelationsChange={setCodeRelations}
                  availableCodes={[...new Set(getAllExtractions().flatMap(e => e.codes))]}
                />
              </aside>
            </div>
          </div>
        )}
      </main>
      
      <Toaster />
    </div>
  )
}
