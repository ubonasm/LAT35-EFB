"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tags, Hash } from 'lucide-react'
import type { Extraction } from '@/types/lesson-record'

interface CodeSummaryProps {
  extractions: Extraction[]
}

export function CodeSummary({ extractions }: CodeSummaryProps) {
  const codeStats = useMemo(() => {
    const stats = new Map<string, number>()
    
    for (const ext of extractions) {
      for (const code of ext.codes) {
        stats.set(code, (stats.get(code) || 0) + 1)
      }
    }
    
    return Array.from(stats.entries())
      .sort((a, b) => b[1] - a[1])
  }, [extractions])

  const totalExtractions = extractions.length
  const totalCodes = codeStats.length
  const totalCodeInstances = codeStats.reduce((sum, [, count]) => sum + count, 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Tags className="h-4 w-4 text-primary" />
          コードサマリー
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-2xl font-bold text-primary">{totalExtractions}</p>
            <p className="text-xs text-muted-foreground">抽出数</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-2xl font-bold text-accent">{totalCodes}</p>
            <p className="text-xs text-muted-foreground">コード種類</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-2xl font-bold text-foreground">{totalCodeInstances}</p>
            <p className="text-xs text-muted-foreground">コード付与数</p>
          </div>
        </div>

        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {codeStats.map(([code, count]) => (
              <div 
                key={code} 
                className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Hash className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{'<'}{code}{'>'}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {count}
                </Badge>
              </div>
            ))}
            {codeStats.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                まだコードがありません
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
