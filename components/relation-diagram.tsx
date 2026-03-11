"use client"

import { useEffect, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RelationNode } from '@/types/lesson-record'

interface RelationDiagramProps {
  title: string
  nodes: RelationNode[]
  className?: string
}

interface PositionedNode extends RelationNode {
  x: number
  y: number
}

export function RelationDiagram({ title, nodes, className }: RelationDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const positionedNodes = useMemo(() => {
    if (nodes.length === 0) return []

    const positioned: PositionedNode[] = []
    const width = 600
    const height = 400
    const padding = 60
    const nodeRadius = 40

    // Group nodes by type
    const statements = nodes.filter(n => n.type === 'statement')
    const codes = nodes.filter(n => n.type === 'code')
    const categories = nodes.filter(n => n.type === 'category')

    // Position statements on the left
    statements.forEach((node, i) => {
      const y = padding + (i / Math.max(statements.length - 1, 1)) * (height - padding * 2)
      positioned.push({
        ...node,
        x: padding + nodeRadius,
        y: statements.length === 1 ? height / 2 : y,
      })
    })

    // Position codes in the middle
    codes.forEach((node, i) => {
      const y = padding + (i / Math.max(codes.length - 1, 1)) * (height - padding * 2)
      positioned.push({
        ...node,
        x: width / 2,
        y: codes.length === 1 ? height / 2 : y,
      })
    })

    // Position categories on the right
    categories.forEach((node, i) => {
      const y = padding + (i / Math.max(categories.length - 1, 1)) * (height - padding * 2)
      positioned.push({
        ...node,
        x: width - padding - nodeRadius,
        y: categories.length === 1 ? height / 2 : y,
      })
    })

    // If all same type, arrange in a circle
    if (statements.length === nodes.length || codes.length === nodes.length) {
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) / 2 - padding

      positioned.length = 0
      nodes.forEach((node, i) => {
        const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2
        positioned.push({
          ...node,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        })
      })
    }

    return positioned
  }, [nodes])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (positionedNodes.length === 0) {
      ctx.fillStyle = '#666'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('データがありません', canvas.width / 2, canvas.height / 2)
      return
    }

    // Create node lookup map
    const nodeMap = new Map(positionedNodes.map(n => [n.id, n]))

    // Draw connections
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 1.5
    
    for (const node of positionedNodes) {
      for (const connId of node.connections) {
        const target = nodeMap.get(connId)
        if (target) {
          ctx.beginPath()
          ctx.moveTo(node.x, node.y)
          ctx.lineTo(target.x, target.y)
          ctx.stroke()

          // Draw arrow
          const angle = Math.atan2(target.y - node.y, target.x - node.x)
          const arrowSize = 8
          const arrowX = target.x - 25 * Math.cos(angle)
          const arrowY = target.y - 25 * Math.sin(angle)
          
          ctx.beginPath()
          ctx.moveTo(arrowX, arrowY)
          ctx.lineTo(
            arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
            arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
          )
          ctx.lineTo(
            arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
            arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
          )
          ctx.closePath()
          ctx.fillStyle = '#94a3b8'
          ctx.fill()
        }
      }
    }

    // Draw nodes
    for (const node of positionedNodes) {
      // Node background
      ctx.beginPath()
      ctx.arc(node.x, node.y, 25, 0, 2 * Math.PI)
      
      switch (node.type) {
        case 'statement':
          ctx.fillStyle = '#3b82f6'
          break
        case 'code':
          ctx.fillStyle = '#10b981'
          break
        case 'category':
          ctx.fillStyle = '#f59e0b'
          break
      }
      ctx.fill()

      // Node border
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Node label
      ctx.fillStyle = '#1e293b'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      
      const label = node.label.length > 15 ? node.label.slice(0, 15) + '...' : node.label
      ctx.fillText(label, node.x, node.y + 30)
    }

    // Draw legend
    const legendY = canvas.height - 25
    const legendItems = [
      { label: '発言', color: '#3b82f6' },
      { label: 'コード', color: '#10b981' },
      { label: 'カテゴリ', color: '#f59e0b' },
    ]

    ctx.font = '11px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'

    let legendX = 20
    for (const item of legendItems) {
      ctx.beginPath()
      ctx.arc(legendX, legendY, 6, 0, 2 * Math.PI)
      ctx.fillStyle = item.color
      ctx.fill()

      ctx.fillStyle = '#64748b'
      ctx.fillText(item.label, legendX + 12, legendY)
      legendX += 70
    }
  }, [positionedNodes])

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="w-full rounded-lg bg-muted/30"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </CardContent>
    </Card>
  )
}
