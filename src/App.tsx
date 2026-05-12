import { useState, useCallback } from 'react'
import type { RunState, CombatState, CreatureId } from './types'
import { MainMenu } from './components/screens/MainMenu'
import { MapScreen } from './components/screens/MapScreen'
import { CombatScreen } from './components/screens/CombatScreen'
import { BondScreen } from './components/screens/BondScreen'
import { EvolutionScreen } from './components/screens/EvolutionScreen'
import { DraftScreen } from './components/screens/DraftScreen'
import { ShopScreen } from './components/screens/ShopScreen'
import { RestScreen } from './components/screens/RestScreen'
import { EventScreen } from './components/screens/EventScreen'
import { GameOverScreen } from './components/screens/GameOverScreen'
import { VictoryScreen } from './components/screens/VictoryScreen'
import {
  startNewRun,
  afterBattle,
  allocateBond,
  triggerEvolution,
  afterDraft,
  enterNode,
  afterRest,
  afterShop,
  afterEvent,
  checkFinalVictory,
} from './engine/run/runManager'
import { initCombat } from './engine/combat/CombatEngine'
import { getNodeById } from './engine/map/mapGenerator'
import { getEnemiesForAct, getBossForAct } from './data/enemies'
import { getCardDef, getDraftableCards } from './data/cards'
import { addCardToDeck, removeCardFromDeck } from './engine/draft/draftSystem'
import { EVENTS } from './data/events'
import type { GameEvent } from './data/events'
import type { NodeType } from './types'

export default function App() {
  const [runState, setRunState] = useState<RunState | null>(null)
  const [combat, setCombat] = useState<CombatState | null>(null)
  const [currentNodeType, setCurrentNodeType] = useState<NodeType>('battle')
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null)

  const handleStart = useCallback(() => {
    setRunState(startNewRun())
  }, [])

  const handleSelectNode = useCallback(
    (nodeId: string) => {
      if (!runState) return

      const node = getNodeById(runState.map, nodeId)
      if (!node) return

      setCurrentNodeType(node.type)

      const newRun = enterNode(runState, nodeId)
      setRunState(newRun)

      if (node.type === 'battle' || node.type === 'elite' || node.type === 'boss') {
        const act = (runState.map.currentAct + 1) as 1 | 2 | 3

        let enemyDefs
        if (node.type === 'boss') {
          enemyDefs = [getBossForAct(act)]
        } else if (node.type === 'elite') {
          const elites = getEnemiesForAct(act, true, false)
          enemyDefs = [elites[Math.floor(Math.random() * Math.max(1, elites.length))]]
        } else {
          const normals = getEnemiesForAct(act, false, false)
          const fallback = getEnemiesForAct(1, false, false)
          const pool = normals.length > 0 ? normals : fallback
          enemyDefs = [pool[Math.floor(Math.random() * pool.length)]]
        }

        const combatState = initCombat(newRun.deck, newRun.creatures, enemyDefs)
        setCombat(combatState)
      } else if (node.type === 'event') {
        setCurrentEvent(EVENTS[Math.floor(Math.random() * EVENTS.length)])
      }
    },
    [runState],
  )

  const handleCombatUpdate = useCallback((newCombat: CombatState) => {
    setCombat(newCombat)
  }, [])

  const handleCombatEnd = useCallback(
    (finalCombat: CombatState) => {
      if (!runState) return
      const newRun = afterBattle(runState, finalCombat, currentNodeType)

      if (finalCombat.phase === 'victory' && checkFinalVictory(newRun)) {
        setRunState({ ...newRun, phase: 'victory' })
      } else {
        setRunState(newRun)
      }
      setCombat(null)
    },
    [runState, currentNodeType],
  )

  const handleAllocateBond = useCallback(
    (creatureId: CreatureId) => {
      if (!runState) return
      setRunState(allocateBond(runState, creatureId))
    },
    [runState],
  )

  const handleEvolutionContinue = useCallback(() => {
    if (!runState) return
    setRunState(triggerEvolution(runState))
  }, [runState])

  const handleDraftPick = useCallback(
    (cardId: string | null) => {
      if (!runState) return
      setRunState(afterDraft(runState, cardId))
    },
    [runState],
  )

  const handleShopBuy = useCallback(
    (cardId: string) => {
      if (!runState) return
      const def = getCardDef(cardId)
      if (!def) return
      const price = ({ common: 40, uncommon: 65, rare: 100 } as Record<string, number>)[def.rarity] ?? 50
      if (runState.gold < price) return
      setRunState(addCardToDeck({ ...runState, gold: runState.gold - price }, cardId))
    },
    [runState],
  )

  const handleShopRemove = useCallback(
    (instanceId: string) => {
      if (!runState || runState.gold < 50) return
      setRunState(removeCardFromDeck({ ...runState, gold: runState.gold - 50 }, instanceId))
    },
    [runState],
  )

  const handleShopLeave = useCallback(() => {
    if (!runState) return
    setRunState(afterShop(runState))
  }, [runState])

  const handleRestChoice = useCallback(
    (choice: 'heal' | 'bond', creatureId?: CreatureId) => {
      if (!runState) return
      setRunState(afterRest(runState, choice, creatureId))
    },
    [runState],
  )

  const handleEventChoice = useCallback(
    (outcome: 'a' | 'b') => {
      if (!runState || !currentEvent) return
      const opt = outcome === 'a' ? currentEvent.options[0] : currentEvent.options[1]
      let newRun = { ...runState }

      switch (opt.effect) {
        case 'gold':
          newRun = { ...newRun, gold: newRun.gold + opt.value }
          break
        case 'hp':
          newRun = {
            ...newRun,
            creatures: newRun.creatures.map((c) => ({
              ...c,
              currentHp: Math.min(c.maxHp, c.currentHp + Math.floor(c.maxHp * (opt.value / 100))),
            })),
          }
          break
        case 'bond':
          newRun = {
            ...newRun,
            creatures: newRun.creatures.map((c) => ({
              ...c,
              bondAccumulated: c.bondAccumulated + Math.floor(opt.value / 3),
            })),
          }
          break
        case 'card': {
          if (newRun.gold >= opt.value) {
            const rareCards = getDraftableCards().filter((c) => c.rarity === 'rare')
            if (rareCards.length > 0) {
              const pick = rareCards[Math.floor(Math.random() * rareCards.length)]
              newRun = { ...addCardToDeck(newRun, pick.id), gold: newRun.gold - opt.value }
            }
          }
          break
        }
        case 'damage':
          newRun = {
            ...newRun,
            creatures: newRun.creatures.map((c) => ({
              ...c,
              currentHp: Math.max(1, c.currentHp - opt.value),
            })),
          }
          break
      }

      setRunState(afterEvent(newRun))
      setCurrentEvent(null)
    },
    [runState, currentEvent],
  )

  const handleRestart = useCallback(() => {
    setRunState(null)
    setCombat(null)
    setCurrentEvent(null)
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!runState) return <MainMenu onStart={handleStart} />

  const { phase } = runState

  if (phase === 'game-over') {
    return <GameOverScreen runState={runState} onRestart={handleRestart} />
  }

  if (phase === 'victory') {
    return <VictoryScreen runState={runState} onRestart={handleRestart} />
  }

  if (phase === 'combat' && combat) {
    return (
      <CombatScreen
        combat={combat}
        runState={runState}
        nodeType={currentNodeType}
        onCombatEnd={handleCombatEnd}
        onCombatUpdate={handleCombatUpdate}
      />
    )
  }

  if (phase === 'bond-summary') {
    return <BondScreen runState={runState} onAllocate={handleAllocateBond} />
  }

  if (phase === 'evolution') {
    const creatureId = runState.pendingEvolutions[0]
    if (creatureId) {
      // Evolution already applied to runState by allocateBond/triggerEvolution
      return (
        <EvolutionScreen
          runState={runState}
          evolvingCreatureId={creatureId}
          onContinue={handleEvolutionContinue}
        />
      )
    }
  }

  if (phase === 'draft') {
    return <DraftScreen runState={runState} onPick={handleDraftPick} />
  }

  if (phase === 'shop') {
    return (
      <ShopScreen
        runState={runState}
        onBuyCard={handleShopBuy}
        onRemoveCard={handleShopRemove}
        onLeave={handleShopLeave}
      />
    )
  }

  if (phase === 'rest') {
    return <RestScreen runState={runState} onChoice={handleRestChoice} />
  }

  if (phase === 'event') {
    return <EventScreen runState={runState} onChoice={handleEventChoice} />
  }

  return <MapScreen runState={runState} onSelectNode={handleSelectNode} />
}
