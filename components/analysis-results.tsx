"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RelationDiagram } from './relation-diagram'
import type { AnalysisResult } from '@/types/lesson-record'
import { FileText, GitBranch, Tags, Layers } from 'lucide-react'

interface AnalysisResultsProps {
  result: AnalysisResult
}

export function AnalysisResults({ result }: AnalysisResultsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            理論的ストーリー
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="prose prose-sm max-w-none text-foreground">
              {result.theoreticalStory.split('\n').map((paragraph, i) => (
                <p key={i} className="mb-3 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Tabs defaultValue="statements" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="statements" className="gap-2">
            <GitBranch className="h-4 w-4" />
            <span className="hidden sm:inline">発言関係図</span>
            <span className="sm:hidden">発言</span>
          </TabsTrigger>
          <TabsTrigger value="codes" className="gap-2">
            <Tags className="h-4 w-4" />
            <span className="hidden sm:inline">コード関係図</span>
            <span className="sm:hidden">コード</span>
          </TabsTrigger>
          <TabsTrigger value="integrated" className="gap-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">統合関係図</span>
            <span className="sm:hidden">統合</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="statements" className="mt-4">
          <RelationDiagram
            title="発言関係図"
            nodes={result.statementRelations}
          />
          <p className="mt-2 text-sm text-muted-foreground">
            発言番号順の時間軸的なつながりと、内容的な関連性を示しています。
          </p>
        </TabsContent>

        <TabsContent value="codes" className="mt-4">
          <RelationDiagram
            title="コード関係図"
            nodes={result.codeRelations}
          />
          <p className="mt-2 text-sm text-muted-foreground">
            コード間の概念的な関係（包含、対比、因果など）を示しています。
          </p>
        </TabsContent>

        <TabsContent value="integrated" className="mt-4">
          <RelationDiagram
            title="統合関係図"
            nodes={result.integratedRelations}
          />
          <p className="mt-2 text-sm text-muted-foreground">
            発言とコードを統合した全体的な関係構造を示しています。
          </p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
