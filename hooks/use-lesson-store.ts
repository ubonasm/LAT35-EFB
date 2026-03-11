"use client"

import { useCallback, useState } from 'react'
import type { LessonRecord, Extraction, AnalysisResult } from '@/types/lesson-record'

export function useLessonStore() {
  const [records, setRecords] = useState<LessonRecord[]>([])
  const [extractions, setExtractions] = useState<Map<string, Extraction[]>>(new Map())
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const loadRecords = useCallback((newRecords: LessonRecord[]) => {
    setRecords(newRecords)
    setExtractions(new Map())
    setAnalysisResult(null)
  }, [])

  const importData = useCallback((data: {
    records: LessonRecord[]
    extractions: Extraction[]
    analysisResult?: AnalysisResult | null
  }) => {
    setRecords(data.records)
    
    // extractionsをMapに変換
    const extractionMap = new Map<string, Extraction[]>()
    for (const ext of data.extractions) {
      const existing = extractionMap.get(ext.recordId) || []
      extractionMap.set(ext.recordId, [...existing, ext])
    }
    setExtractions(extractionMap)
    
    if (data.analysisResult) {
      setAnalysisResult(data.analysisResult)
    }
  }, [])

  const addExtraction = useCallback((recordId: string, text: string) => {
    setExtractions(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(recordId) || []
      const newExtraction: Extraction = {
        id: `ext-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        recordId,
        text,
        codes: [],
      }
      newMap.set(recordId, [...existing, newExtraction])
      return newMap
    })
  }, [])

  const updateExtractionCodes = useCallback((extractionId: string, codes: string[]) => {
    setExtractions(prev => {
      const newMap = new Map(prev)
      for (const [recordId, exts] of newMap.entries()) {
        const updated = exts.map(ext => 
          ext.id === extractionId ? { ...ext, codes } : ext
        )
        newMap.set(recordId, updated)
      }
      return newMap
    })
  }, [])

  const removeExtraction = useCallback((extractionId: string) => {
    setExtractions(prev => {
      const newMap = new Map(prev)
      for (const [recordId, exts] of newMap.entries()) {
        const filtered = exts.filter(ext => ext.id !== extractionId)
        if (filtered.length === 0) {
          newMap.delete(recordId)
        } else {
          newMap.set(recordId, filtered)
        }
      }
      return newMap
    })
  }, [])

  const getAllExtractions = useCallback((): Extraction[] => {
    const all: Extraction[] = []
    for (const exts of extractions.values()) {
      all.push(...exts)
    }
    return all
  }, [extractions])

  const getAllCodes = useCallback((): string[] => {
    const codes = new Set<string>()
    for (const exts of extractions.values()) {
      for (const ext of exts) {
        for (const code of ext.codes) {
          codes.add(code)
        }
      }
    }
    return Array.from(codes)
  }, [extractions])

  return {
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
    getAllCodes,
    setAnalysisResult,
    setIsAnalyzing,
  }
}
