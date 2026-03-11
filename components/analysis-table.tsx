"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import { Plus, X, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { LessonRecord, Extraction } from '@/types/lesson-record'

interface AnalysisTableProps {
  records: LessonRecord[]
  extractions: Map<string, Extraction[]>
  onAddExtraction: (recordId: string, text: string) => void
  onUpdateCodes: (extractionId: string, codes: string[]) => void
  onRemoveExtraction: (extractionId: string) => void
}

export function AnalysisTable({
  records,
  extractions,
  onAddExtraction,
  onUpdateCodes,
  onRemoveExtraction,
}: AnalysisTableProps) {
  const [selection, setSelection] = useState<{ recordId: string; text: string; rect: DOMRect } | null>(null)
  const [codeInput, setCodeInput] = useState<{ extractionId: string; value: string } | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // グローバルなmouseupイベントでテキスト選択を検出
  useEffect(() => {
    const handleSelectionChange = () => {
      const selected = window.getSelection()
      if (!selected || selected.rangeCount === 0) {
        return
      }

      const text = selected.toString().trim()
      if (text.length === 0) {
        return
      }

      // 選択範囲がテーブル内にあるか確認
      const range = selected.getRangeAt(0)
      const container = range.commonAncestorContainer
      const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element
      
      // data-record-idを持つ要素を探す
      const contentCell = element?.closest('[data-record-id]')
      if (contentCell) {
        const recordId = contentCell.getAttribute('data-record-id')
        if (recordId) {
          const rect = range.getBoundingClientRect()
          setSelection({ recordId, text, rect })
        }
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      // ボタンクリック時は無視
      if (buttonRef.current?.contains(e.target as Node)) {
        return
      }

      // 少し遅延を入れて選択状態を確認
      setTimeout(handleSelectionChange, 10)
    }

    // クリックで選択解除（テーブル外）
    const handleClick = (e: MouseEvent) => {
      if (!tableRef.current?.contains(e.target as Node) && 
          !buttonRef.current?.contains(e.target as Node)) {
        setTimeout(() => {
          const currentSelection = window.getSelection()?.toString().trim()
          if (!currentSelection) {
            setSelection(null)
          }
        }, 50)
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('click', handleClick)
    document.addEventListener('selectionchange', handleSelectionChange)
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('click', handleClick)
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [])

  const handleExtract = useCallback(() => {
    if (selection) {
      onAddExtraction(selection.recordId, selection.text)
      setSelection(null)
      window.getSelection()?.removeAllRanges()
    }
  }, [selection, onAddExtraction])

  const handleAddCode = useCallback((extractionId: string, currentCodes: string[], newCode: string) => {
    const trimmed = newCode.trim()
    if (trimmed && !currentCodes.includes(trimmed)) {
      onUpdateCodes(extractionId, [...currentCodes, trimmed])
    }
    setCodeInput(null)
  }, [onUpdateCodes])

  const handleRemoveCode = useCallback((extractionId: string, currentCodes: string[], codeToRemove: string) => {
    onUpdateCodes(extractionId, currentCodes.filter(c => c !== codeToRemove))
  }, [onUpdateCodes])

  const getSpeakerStyle = (speaker: string) => {
    if (speaker.includes('教師') || speaker.includes('先生') || speaker === 'T' || speaker.toLowerCase() === 'teacher') {
      return 'bg-primary/10 text-primary'
    }
    return 'bg-accent/10 text-accent'
  }

  return (
    <div ref={tableRef} className="relative">
      {/* フローティング抽出ボタン */}
      {selection && (
        <div 
          className="fixed z-50"
          style={{
            left: `${selection.rect.left + selection.rect.width / 2}px`,
            top: `${selection.rect.bottom + 8}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <Button 
            ref={buttonRef}
            size="sm" 
            onClick={handleExtract}
            className="gap-1 text-xs shadow-lg"
          >
            <Plus className="h-3 w-3" />
            抽出
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <div className="min-w-[480px]" style={{ width: 'max(100%, 1060px)' }}>
          <Table className="table-fixed w-full">
            <colgroup>
              <col style={{ width: '50px' }} />
              <col style={{ width: '50px' }} />
              <col style={{ width: '480px' }} />
              <col style={{ width: '240px' }} />
              <col style={{ width: '240px' }} />
            </colgroup>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-center font-semibold">番号</TableHead>
                <TableHead className="font-semibold">発言者</TableHead>
                <TableHead className="font-semibold">発言内容</TableHead>
                <TableHead className="font-semibold">抽出</TableHead>
                <TableHead className="font-semibold">コード</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {records.map((record) => {
              const recordExtractions = extractions.get(record.id) || []
              const maxRows = Math.max(1, recordExtractions.length)

              return Array.from({ length: maxRows }).map((_, rowIndex) => {
                const extraction = recordExtractions[rowIndex]
                const isFirstRow = rowIndex === 0

                return (
                  <TableRow 
                    key={`${record.id}-${rowIndex}`}
                    className={rowIndex > 0 ? 'border-t border-border/30' : ''}
                  >
                    {isFirstRow && (
                      <>
                        <TableCell 
                          className="text-center font-mono text-sm"
                          rowSpan={maxRows}
                        >
                          {record.number}
                        </TableCell>
                        <TableCell rowSpan={maxRows}>
                          <Badge 
                            variant="secondary" 
                            className={getSpeakerStyle(record.speaker)}
                          >
                            {record.speaker}
                          </Badge>
                        </TableCell>
                        <TableCell 
                          rowSpan={maxRows}
                          className="relative select-text"
                          data-record-id={record.id}
                        >
                          <div className="whitespace-pre-wrap text-sm leading-relaxed cursor-text">
                            {record.content}
                          </div>
                        </TableCell>
                      </>
                    )}

                    <TableCell className="align-top p-2">
                      <div style={{ width: '220px', maxWidth: '220px', overflow: 'hidden' }}>
                      {extraction ? (
                        <div className="group relative">
                          <div 
                            className="rounded bg-muted px-2 py-1 pr-7 text-sm"
                            style={{ wordBreak: 'break-all', overflowWrap: 'break-word', whiteSpace: 'pre-wrap', width: '100%' }}
                          >
                            {extraction.text}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={() => onRemoveExtraction(extraction.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        isFirstRow && recordExtractions.length === 0 && (
                          <span className="text-xs text-muted-foreground">
                            テキストを選択して抽出
                          </span>
                        )
                      )}
                      </div>
                    </TableCell>

                    <TableCell className="align-top p-2">
                      <div style={{ width: '220px', maxWidth: '220px', overflow: 'hidden', display: 'block' }}>
                      {extraction && (
                        <>
                          {extraction.codes.map((code) => (
                            <div 
                              key={code} 
                              className="group relative rounded border border-border bg-primary/5 px-2 py-1 pr-6 text-xs mb-1"
                            >
                              <div style={{ wordBreak: 'break-all', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{code}</div>
                              <button
                                onClick={() => handleRemoveCode(extraction.id, extraction.codes, code)}
                                className="absolute right-1 top-1 opacity-0 group-hover:opacity-100"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          
                          <Popover
                            open={codeInput?.extractionId === extraction.id}
                            onOpenChange={(open) => {
                              if (open) {
                                setCodeInput({ extractionId: extraction.id, value: '' })
                              } else {
                                setCodeInput(null)
                              }
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                              >
                                <Tag className="h-3 w-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-2">
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault()
                                  if (codeInput) {
                                    handleAddCode(extraction.id, extraction.codes, codeInput.value)
                                  }
                                }}
                              >
                                <Input
                                  placeholder="コードを入力..."
                                  value={codeInput?.value || ''}
                                  onChange={(e) => setCodeInput(prev => 
                                    prev ? { ...prev, value: e.target.value } : null
                                  )}
                                  className="h-8 text-sm"
                                  autoFocus
                                />
                                <Button 
                                  type="submit" 
                                  size="sm" 
                                  className="mt-2 w-full"
                                >
                                  追加
                                </Button>
                              </form>
                            </PopoverContent>
                          </Popover>
                        </>
                      )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            })}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  )
}
