"use client"

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Download, 
  Upload,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import type { CodeRelation, CodeRelationType, CodeDictionary } from '@/types/lesson-record'

const RELATION_TYPES: { value: CodeRelationType; label: string; symbol: string; description: string }[] = [
  { value: 'inclusion', label: '包含', symbol: '⊃', description: 'AはBを含む' },
  { value: 'superordinate', label: '上位概念', symbol: '↑', description: 'AはBの上位概念である' },
  { value: 'subordinate', label: '下位概念', symbol: '↓', description: 'AはBの下位概念である' },
  { value: 'temporal', label: '時間順序', symbol: '→', description: 'AはBより先に起こる' },
  { value: 'equivalent', label: '同等', symbol: '=', description: 'AとBは同義である' },
  { value: 'part', label: '一部', symbol: '∈', description: 'AはBの一部である' },
  { value: 'contrast', label: '対比', symbol: '↔', description: 'AとBは対照的である' },
  { value: 'causal', label: '因果', symbol: '∴', description: 'AはBの原因である' },
]

interface CodeDictionaryPanelProps {
  relations: CodeRelation[]
  onRelationsChange: (relations: CodeRelation[]) => void
  availableCodes: string[]
}

export function CodeDictionaryPanel({
  relations,
  onRelationsChange,
  availableCodes,
}: CodeDictionaryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [sourceCode, setSourceCode] = useState('')
  const [targetCode, setTargetCode] = useState('')
  const [relationType, setRelationType] = useState<CodeRelationType>('inclusion')
  const [description, setDescription] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddRelation = () => {
    if (!sourceCode.trim() || !targetCode.trim()) return

    const newRelation: CodeRelation = {
      id: `rel-${Date.now()}`,
      sourceCode: sourceCode.trim(),
      targetCode: targetCode.trim(),
      relationType,
      description: description.trim() || undefined,
    }

    onRelationsChange([...relations, newRelation])
    setSourceCode('')
    setTargetCode('')
    setDescription('')
    setIsDialogOpen(false)
  }

  const handleRemoveRelation = (id: string) => {
    onRelationsChange(relations.filter(r => r.id !== id))
  }

  const handleSaveDictionary = () => {
    const dictionary: CodeDictionary = {
      relations,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(dictionary, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code-dictionary-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleLoadDictionary = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const dictionary = JSON.parse(event.target?.result as string) as CodeDictionary
        if (dictionary.relations && Array.isArray(dictionary.relations)) {
          onRelationsChange(dictionary.relations)
        }
      } catch {
        alert('辞書ファイルの読み込みに失敗しました')
      }
    }
    reader.readAsText(file)
    
    // ファイル入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getRelationLabel = (type: CodeRelationType) => {
    return RELATION_TYPES.find(r => r.value === type)?.label || type
  }

  const getRelationSymbol = (type: CodeRelationType) => {
    return RELATION_TYPES.find(r => r.value === type)?.symbol || '?'
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-primary" />
            コード辞書
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          コード間の関係を定義（{relations.length}件）
        </p>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="mb-3 flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex-1">
                  <Plus className="mr-1 h-3 w-3" />
                  追加
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>コード関係を追加</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* 関係タイプを先に選択 */}
                  <div className="space-y-2">
                    <Label>関係タイプ</Label>
                    <Select value={relationType} onValueChange={(v) => setRelationType(v as CodeRelationType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATION_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <span className="flex items-center gap-2">
                              <span className="font-mono">{type.symbol}</span>
                              <span>{type.label}</span>
                              <span className="text-xs text-muted-foreground">- {type.description}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {RELATION_TYPES.find(t => t.value === relationType)?.description}
                    </p>
                  </div>

                  {/* プレビュー表示 */}
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-center text-sm">
                      <span className="font-medium text-primary">{'<'}A{'>'}</span>
                      <span className="mx-2">は</span>
                      <span className="font-medium text-primary">{'<'}B{'>'}</span>
                      <span className="mx-2">
                        {relationType === 'inclusion' && 'を含む'}
                        {relationType === 'superordinate' && 'の上位概念'}
                        {relationType === 'subordinate' && 'の下位概念'}
                        {relationType === 'temporal' && 'より先に起こる'}
                        {relationType === 'equivalent' && 'と同義'}
                        {relationType === 'part' && 'の一部'}
                        {relationType === 'contrast' && 'と対照的'}
                        {relationType === 'causal' && 'の原因'}
                      </span>
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>コードA（主語）</Label>
                    <Input
                      value={sourceCode}
                      onChange={(e) => setSourceCode(e.target.value)}
                      placeholder="例: 生徒の気づき"
                      list="source-codes"
                    />
                    <datalist id="source-codes">
                      {availableCodes.map(code => (
                        <option key={code} value={code} />
                      ))}
                    </datalist>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>コードB（対象）</Label>
                    <Input
                      value={targetCode}
                      onChange={(e) => setTargetCode(e.target.value)}
                      placeholder="例: 教師の問いかけ"
                      list="target-codes"
                    />
                    <datalist id="target-codes">
                      {availableCodes.map(code => (
                        <option key={code} value={code} />
                      ))}
                    </datalist>
                  </div>

                  {/* 入力後のプレビュー */}
                  {(sourceCode || targetCode) && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <p className="text-center text-sm font-medium">
                        <span className="text-primary">{'<'}{sourceCode || 'A'}{'>'}</span>
                        <span className="mx-1">は</span>
                        <span className="text-primary">{'<'}{targetCode || 'B'}{'>'}</span>
                        <span className="mx-1">
                          {relationType === 'inclusion' && 'を含む'}
                          {relationType === 'superordinate' && 'の上位概念'}
                          {relationType === 'subordinate' && 'の下位概念'}
                          {relationType === 'temporal' && 'より先に起こる'}
                          {relationType === 'equivalent' && 'と同義'}
                          {relationType === 'part' && 'の一部'}
                          {relationType === 'contrast' && 'と対照的'}
                          {relationType === 'causal' && 'の原因'}
                        </span>
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>メモ（任意）</Label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="補足説明があれば"
                    />
                  </div>
                  
                  <Button onClick={handleAddRelation} className="w-full" disabled={!sourceCode.trim() || !targetCode.trim()}>
                    追加
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveDictionary}
              disabled={relations.length === 0}
            >
              <Download className="h-3 w-3" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3 w-3" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleLoadDictionary}
              className="hidden"
            />
          </div>
          
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {relations.map((relation) => (
                <div
                  key={relation.id}
                  className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-1 text-sm">
                      <Badge variant="outline" className="text-xs">
                        {'<'}{relation.sourceCode}{'>'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">は</span>
                      <Badge variant="outline" className="text-xs">
                        {'<'}{relation.targetCode}{'>'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {relation.relationType === 'inclusion' && 'を含む'}
                        {relation.relationType === 'superordinate' && 'の上位概念'}
                        {relation.relationType === 'subordinate' && 'の下位概念'}
                        {relation.relationType === 'temporal' && 'より先'}
                        {relation.relationType === 'equivalent' && 'と同義'}
                        {relation.relationType === 'part' && 'の一部'}
                        {relation.relationType === 'contrast' && 'と対照的'}
                        {relation.relationType === 'causal' && 'の原因'}
                      </span>
                    </div>
                    {relation.description && (
                      <p className="text-xs text-muted-foreground pl-1">
                        {relation.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRelation(relation.id)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {relations.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  コード関係が定義されていません
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  )
}
