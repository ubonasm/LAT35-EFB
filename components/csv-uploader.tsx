"use client"

import { useCallback, useRef } from 'react'
import { Upload, FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { parseCSV, generateSampleCSV } from '@/lib/csv-parser'
import type { LessonRecord } from '@/types/lesson-record'

interface CSVUploaderProps {
  onLoad: (records: LessonRecord[]) => void
}

export function CSVUploader({ onLoad }: CSVUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const records = parseCSV(text)
      onLoad(records)
    }
    reader.readAsText(file, 'UTF-8')
  }, [onLoad])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.name.endsWith('.csv')) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const records = parseCSV(text)
      onLoad(records)
    }
    reader.readAsText(file, 'UTF-8')
  }, [onLoad])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const loadSampleData = useCallback(() => {
    const sampleCSV = generateSampleCSV()
    const records = parseCSV(sampleCSV)
    onLoad(records)
  }, [onLoad])

  const downloadSampleCSV = useCallback(() => {
    const sampleCSV = generateSampleCSV()
    const blob = new Blob(['\uFEFF' + sampleCSV], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_lesson_record.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  return (
    <Card className="border-2 border-dashed border-border bg-card">
      <CardContent className="p-8">
        <div
          className="flex flex-col items-center justify-center gap-4"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">
              CSVファイルをドラッグ＆ドロップ
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              またはファイルを選択してください
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              形式: 発言者, 発言番号, 発言内容
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              ファイルを選択
            </Button>
            
            <Button
              variant="outline"
              onClick={loadSampleData}
              className="gap-2"
            >
              サンプルデータを読み込む
            </Button>

            <Button
              variant="ghost"
              onClick={downloadSampleCSV}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              サンプルCSV
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  )
}
