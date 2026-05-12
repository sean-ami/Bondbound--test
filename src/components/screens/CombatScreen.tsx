import { useState, useEffect, useCallback } from 'react'
import type { CombatState } from '@/types'
import type { NodeType } from '@/types'
import { CardComponent } from '@/components/combat/CardComponent'
import { EnemyCard } from '@/components/combat/EnemyCard'
import { CreaturePanel } from '@/components/combat/CreaturePanel'
import { EnergyDisplay } from '@/components/combat/EnergyDisplay'
import { Button } from '@/components/shared/Button'
import { canAffordCard } from '@/store/selectors'
import { playCard, endPlayerTurn } from '@/engine/combat/CombatEngine'
import { checkEvolution } from '@/engine/bond/evolutionCheck'
import { getCardDef } from '@/data/cards'
import type { RunState } from '@/types'

interface Props {
  combat: CombatState
  runState: RunState
  nodeType: NodeType
  onCombatEnd: (finalCombat: CombatState) => void
  onCombatUpdate: (newCombat: CombatState) => void
}

export function CombatScreen({ combat, runState, onCombatEnd, onCombatUpdate }: Props) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

  const isPlayerTurn = combat.phase === 'player-turn'

  useEffect(() => {
    if (combat.phase === 'victory' || combat.phase === 'defeat') {
      const timer = setTimeout(() => onCombatEnd(combat), 1200)
      return () => clearTimeout(timer)
    }
  }, [combat.phase, combat, onCombatEnd])

  const handleCardClick = useCallback(
    (instanceId: string) => {
      if (!isPlayerTurn) return
      const inst = combat.hand.find((c) => c.instanceId === instanceId)
      if (!inst) return

      if (selectedCardId === instanceId) {
        setSelectedCardId(null)
        return
      }

      const cardDef = getCardDef(inst.definitionId)
      const needsTarget = cardDef?.tags.includes('attack') || cardDef?.tags.includes('aoe')

      if (!needsTarget) {
        const newState = playCard(combat, instanceId, undefined)
        onCombatUpdate(newState)
        setSelectedCardId(null)
      } else {
        setSelectedCardId(instanceId)
      }
    },
    [combat, isPlayerTurn, onCombatUpdate, selectedCardId],
  )

  const handleEnemyClick = useCallback(
    (enemyInstanceId: string) => {
      if (!isPlayerTurn || !selectedCardId) return
      const newState = playCard(combat, selectedCardId, enemyInstanceId)
      onCombatUpdate(newState)
      setSelectedCardId(null)
    },
    [combat, isPlayerTurn, onCombatUpdate, selectedCardId],
  )

  const handleEndTurn = useCallback(() => {
    if (!isPlayerTurn) return
    setSelectedCardId(null)
    const newState = endPlayerTurn(combat)
    onCombatUpdate(newState)
  }, [combat, isPlayerTurn, onCombatUpdate])

  const needsTarget = selectedCardId !== null

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0f0f14',
        padding: 12,
        gap: 8,
      }}
    >
      {/* Enemy row */}
      <div
        style={{
          flex: '0 0 auto',
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          padding: '8px 0',
        }}
      >
        {combat.enemies.map((enemy) => (
          <EnemyCard
            key={enemy.instanceId}
            enemy={enemy}
            targeted={needsTarget && enemy.currentHp > 0}
            onClick={() => handleEnemyClick(enemy.instanceId)}
          />
        ))}
      </div>

      {/* Turn indicator */}
      <div style={{ textAlign: 'center', fontSize: 11, color: '#7a7a9a' }}>
        Turn {combat.turn} ·{' '}
        <span style={{ color: isPlayerTurn ? '#4caf50' : '#f44336' }}>
          {isPlayerTurn
            ? 'Your Turn'
            : combat.phase === 'victory'
              ? '✅ Victory!'
              : combat.phase === 'defeat'
                ? '💀 Defeat'
                : 'Enemy Turn'}
        </span>
        {combat.comboActive && (
          <span style={{ color: '#ffd54f', marginLeft: 8 }}>
            ⚡ Combo! ({combat.cardsPlayedThisTurn} cards)
          </span>
        )}
      </div>

      {/* Creature row */}
      <div
        style={{
          flex: '0 0 auto',
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        {combat.creatures.map((creature) => (
          <CreaturePanel
            key={creature.id}
            creature={creature}
            isEvolutionReady={checkEvolution({
              ...creature,
              bondAccumulated:
                runState.creatures.find((c) => c.id === creature.id)?.bondAccumulated ?? 0,
            })}
          />
        ))}
      </div>

      {/* HUD */}
      <div
        style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
          background: '#161620',
          borderRadius: 8,
          border: '1px solid #2a2a3a',
        }}
      >
        <EnergyDisplay current={combat.energy} max={combat.maxEnergy} />

        <div style={{ fontSize: 11, color: '#7a7a9a' }}>
          Draw: {combat.drawPile.length} · Discard: {combat.discardPile.length}
        </div>

        <Button
          onClick={handleEndTurn}
          disabled={!isPlayerTurn}
          variant="primary"
          style={{ fontSize: 12, padding: '6px 14px' }}
        >
          End Turn →
        </Button>
      </div>

      {/* Hand */}
      <div
        style={{
          flex: '0 0 auto',
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          padding: '4px 8px',
          overflowX: 'auto',
          minHeight: 130,
          alignItems: 'flex-end',
        }}
      >
        {combat.hand.length === 0 && (
          <div style={{ color: '#555', fontSize: 12, alignSelf: 'center' }}>No cards in hand</div>
        )}
        {combat.hand.map((inst) => (
          <CardComponent
            key={inst.instanceId}
            instance={inst}
            selected={selectedCardId === inst.instanceId}
            playable={isPlayerTurn && canAffordCard(combat, inst.instanceId)}
            onClick={() => handleCardClick(inst.instanceId)}
          />
        ))}
      </div>

      {/* Targeting hint */}
      {needsTarget && (
        <div
          style={{
            position: 'fixed',
            bottom: 160,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1a1a2e',
            border: '1px solid #f44336',
            borderRadius: 6,
            padding: '4px 12px',
            fontSize: 12,
            color: '#f44336',
            zIndex: 50,
          }}
        >
          Click an enemy to target · Click card again to cancel
        </div>
      )}

      {/* Victory / defeat overlay */}
      {(combat.phase === 'victory' || combat.phase === 'defeat') && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            fontWeight: 900,
            color: combat.phase === 'victory' ? '#ffd54f' : '#f44336',
            zIndex: 200,
          }}
          className="anim-fade-in"
        >
          {combat.phase === 'victory' ? '✅ Victory!' : '💀 Defeated'}
        </div>
      )}
    </div>
  )
}
