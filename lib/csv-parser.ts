import type { LessonRecord } from '@/types/lesson-record'

export function parseCSV(csvText: string): LessonRecord[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const records: LessonRecord[] = []
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Handle quoted fields properly
    const fields = parseCSVLine(line)
    
    if (fields.length >= 3) {
      const number = parseInt(fields[1], 10)
      if (!isNaN(number)) {
        records.push({
          id: `record-${i}`,
          number,
          speaker: fields[0].trim(),
          content: fields[2].trim(),
        })
      }
    }
  }

  return records
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  fields.push(current)
  return fields
}

export function generateSampleCSV(): string {
  return `発言者,発言番号,発言内容
教師,1,今日は三角形の面積について学びます
児童A,2,底辺と高さを使うんですよね
教師,3,そうですね。では、どうやって計算しますか？
児童B,4,底辺×高さ÷2です
教師,5,正解です。なぜ2で割るのでしょう？
児童A,6,長方形の半分だからです
教師,7,素晴らしい！よく考えましたね
児童C,8,平行四辺形でも同じですか？
教師,9,いい質問です。平行四辺形は底辺×高さになります
児童B,10,2で割らないんですね`
}
