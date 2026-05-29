using Godot;
using System;
using System.Collections.Generic;
using System.Linq;

namespace BondBound
{
    public partial class GameState : Node
    {
        public static GameState Singleton { get; private set; } = null!;

        // ── Run state ──────────────────────────────────────────────────────────
        public GamePhase Phase { get; private set; } = GamePhase.MainMenu;
        public List<CreatureStats> Creatures { get; private set; } = new();
        public List<CardInstance> Deck { get; private set; } = new();
        public int Gold { get; private set; }
        public MapState Map { get; private set; } = new();
        public BattleResult? LastBattleResult { get; private set; }
        public List<CreatureId> PendingEvolutions { get; private set; } = new();
        public CreatureId? JustEvolvedCreature { get; private set; }
        public List<ItemInstance> Items { get; private set; } = new();

        // ── Item catalogue ────────────────────────────────────────────────────
        private static readonly Dictionary<string, ItemDefinition> ItemCatalog = new()
        {
            ["revive_shard"] = new ItemDefinition
            {
                Id = "revive_shard", Name = "Revive Shard", Emoji = "💎",
                Description = "Revive one KO'd creature with 25% of their max HP. Used between battles.",
                ShopCost = 70
            }
        };
        public static IReadOnlyDictionary<string, ItemDefinition> ItemDefs => ItemCatalog;

        // ── Events ─────────────────────────────────────────────────────────────
        public event Action<GamePhase>? PhaseChanged;
        public event Action? StateUpdated;

        // ── Random ────────────────────────────────────────────────────────────
        private readonly Random _rng = new();
        private int _instanceCounter;
        private bool _combatConnected;

        public override void _Ready() => Singleton = this;

        // ── Phase transitions ──────────────────────────────────────────────────

        public void StartNewRun()
        {
            _instanceCounter = 0;
            Gold = 100;
            PendingEvolutions.Clear();
            JustEvolvedCreature = null;
            LastBattleResult = null;

            Creatures = new List<CreatureId> { CreatureId.Kindlpup, CreatureId.Mosscub, CreatureId.Sparkwisp }
                .Select(id => CreatureDB.Singleton.CreateFresh(id))
                .ToList();

            // Starting deck: 3 stage-0 signature cards per creature
            Deck = new List<CardInstance>();
            foreach (var creature in Creatures)
            {
                foreach (var cardDef in CardDB.Singleton.GetSignatureCards(creature.Id, EvolutionStage.Stage0))
                    Deck.Add(NewInstance(cardDef.Id));
            }

            Items = new List<ItemInstance>();
            GenerateMap();
            SetPhase(GamePhase.Map);
        }

        public void EnterNode(string nodeId)
        {
            var node = FindNode(nodeId);
            if (node == null || !Map.AvailableNodeIds.Contains(nodeId)) return;

            Map.CurrentNodeId = nodeId;

            switch (node.Type)
            {
                case NodeType.Battle:
                case NodeType.Elite:
                case NodeType.Boss:
                    StartBattle(node);
                    break;
                case NodeType.Shop:
                    SetPhase(GamePhase.Shop);
                    break;
                case NodeType.Rest:
                    SetPhase(GamePhase.Rest);
                    break;
                case NodeType.Event:
                    SetPhase(GamePhase.Event);
                    break;
            }
        }

        private void StartBattle(MapNode node)
        {
            if (!_combatConnected)
            {
                CombatManager.Singleton.CombatEnded += OnCombatEnded;
                _combatConnected = true;
            }

            var enemyDefs = PickEnemiesFor(node);
            CombatManager.Singleton.InitCombat(
                Creatures.Select(c => c.Clone()).ToList(),
                Deck.Select(c => new CardInstance(c.InstanceId, c.DefinitionId)).ToList(),
                enemyDefs
            );
            SetPhase(GamePhase.Combat);
        }

        private void OnCombatEnded(bool victory)
        {
            if (!victory)
            {
                SetPhase(GamePhase.GameOver);
                return;
            }

            // Persist creature HP back from combat
            var combatCreatures = CombatManager.Singleton.State.Creatures;
            foreach (var cc in combatCreatures)
            {
                var gs = Creatures.First(c => c.Id == cc.Id);
                gs.CurrentHp = cc.CurrentHp;
                gs.IsKnockedOut = cc.IsKnockedOut;
                gs.Statuses = cc.Statuses.Select(s => s.Clone()).ToList();
            }

            var node = FindNode(Map.CurrentNodeId!);
            if (node != null) node.Cleared = true;

            // Advance available nodes (may set Victory phase for final boss)
            AdvanceAvailableNodes(node!);
            if (Phase == GamePhase.Victory) return;

            LastBattleResult = BuildBattleResult(node!);
            SetPhase(GamePhase.BondSummary);
        }

        public void AllocateBond(CreatureId target)
        {
            if (LastBattleResult == null) return;

            var creature = Creatures.First(c => c.Id == target);
            int earned = LastBattleResult.BondTotal;
            creature.BondAccumulated += earned;

            PendingEvolutions.Clear();
            if (creature.Stage == EvolutionStage.Stage0 && creature.BondAccumulated >= 70)
                PendingEvolutions.Add(target);
            else if (creature.Stage == EvolutionStage.Stage1 && creature.BondAccumulated >= 135)
                PendingEvolutions.Add(target);

            LastBattleResult = null;

            if (PendingEvolutions.Count > 0)
            {
                var evolveId = PendingEvolutions[0];
                PendingEvolutions.RemoveAt(0);
                ApplyEvolution(evolveId);
                SetPhase(GamePhase.Evolution);
            }
            else
            {
                SetPhase(GamePhase.Draft);
            }
        }

        public void ConfirmEvolution()
        {
            if (PendingEvolutions.Count > 0)
            {
                var evolveId = PendingEvolutions[0];
                PendingEvolutions.RemoveAt(0);
                ApplyEvolution(evolveId);
                // Stay in Evolution phase to show next
                EmitStateUpdated();
            }
            else
            {
                JustEvolvedCreature = null;
                SetPhase(GamePhase.Draft);
            }
        }

        public void AfterDraft(string? cardId)
        {
            if (cardId != null && Deck.Count < 20)
                Deck.Add(NewInstance(cardId));
            SetPhase(GamePhase.Map);
        }

        public void AfterRest(bool heal)
        {
            if (heal)
            {
                foreach (var c in Creatures)
                {
                    int healAmt = (int)(c.MaxHp * 0.30f);
                    c.CurrentHp = Math.Min(c.MaxHp, c.CurrentHp + healAmt);
                }
            }
            else
            {
                // +5 Bond to chosen creature — show picker; here default to first
                // handled by RestScreen calling RestGrantBond(target)
            }
            MarkCurrentCleared();
            SetPhase(GamePhase.Map);
        }

        public void RestGrantBond(CreatureId target)
        {
            var c = Creatures.First(x => x.Id == target);
            c.BondAccumulated += 5;
            MarkCurrentCleared();
            SetPhase(GamePhase.Map);
        }

        public void AfterShop()
        {
            MarkCurrentCleared();
            SetPhase(GamePhase.Map);
        }

        public void AfterEvent()
        {
            MarkCurrentCleared();
            SetPhase(GamePhase.Map);
        }

        public void EventGrantBond(CreatureId target, int amount)
        {
            Creatures.First(c => c.Id == target).BondAccumulated += amount;
        }

        public void EventHealAll(int amount)
        {
            foreach (var c in Creatures)
                c.CurrentHp = Math.Min(c.MaxHp, c.CurrentHp + amount);
        }

        public void BuyCard(string cardId, int cost)
        {
            if (Gold >= cost && Deck.Count < 20)
            {
                Gold -= cost;
                Deck.Add(NewInstance(cardId));
                EmitStateUpdated();
            }
        }

        public void RemoveCard(string instanceId, int cost)
        {
            if (Gold >= cost)
            {
                Gold -= cost;
                Deck.RemoveAll(c => c.InstanceId == instanceId);
                EmitStateUpdated();
            }
        }

        public void GoToMainMenu() => SetPhase(GamePhase.MainMenu);

        public void UseReviveShard(CreatureId target)
        {
            var creature = Creatures.First(c => c.Id == target);
            if (!creature.IsKnockedOut) return;
            var shard = Items.FirstOrDefault(i => i.DefinitionId == "revive_shard");
            if (shard == null) return;
            creature.IsKnockedOut = false;
            creature.CurrentHp = Math.Max(1, (int)(creature.MaxHp * 0.25f));
            Items.Remove(shard);
            EmitStateUpdated();
        }

        public void BuyItem(string itemId)
        {
            var def = ItemCatalog[itemId];
            if (Gold < def.ShopCost || Items.Count >= 6) return;
            Gold -= def.ShopCost;
            Items.Add(new ItemInstance { DefinitionId = itemId });
            EmitStateUpdated();
        }

        // ── Map generation ────────────────────────────────────────────────────

        private void GenerateMap()
        {
            Map = new MapState { CurrentAct = 1 };

            for (int act = 1; act <= 3; act++)
            {
                var actNodes = new List<MapNode>();

                for (int row = 0; row < 10; row++)
                {
                    for (int col = 0; col < 3; col++)
                    {
                        NodeType type = row == 0 ? NodeType.Battle
                                      : row == 9 ? NodeType.Boss
                                      : RollNodeType();
                        actNodes.Add(new MapNode
                        {
                            Id = $"a{act}r{row}c{col}",
                            Act = act, Row = row, Col = col, Type = type
                        });
                    }
                }

                // Build forward connections row by row
                for (int row = 0; row < 9; row++)
                {
                    var rowNodes  = actNodes.Where(n => n.Row == row).ToList();
                    var nextNodes = actNodes.Where(n => n.Row == row + 1).ToList();

                    foreach (var node in rowNodes)
                    {
                        // Always connect to same column in next row
                        node.Connections.Add($"a{act}r{row + 1}c{node.Col}");

                        // 40% chance to also connect to an adjacent column
                        if (_rng.Next(100) < 40)
                        {
                            int adj = node.Col + (_rng.Next(2) == 0 ? -1 : 1);
                            if (adj >= 0 && adj <= 2)
                            {
                                string adjId = $"a{act}r{row + 1}c{adj}";
                                if (!node.Connections.Contains(adjId))
                                    node.Connections.Add(adjId);
                            }
                        }
                    }

                    // Ensure every next-row node has at least one incoming edge
                    foreach (var next in nextNodes)
                    {
                        bool reachable = rowNodes.Any(n => n.Connections.Contains(next.Id));
                        if (!reachable)
                        {
                            // Connect from same or nearest column
                            var src = rowNodes.OrderBy(n => Math.Abs(n.Col - next.Col)).First();
                            if (!src.Connections.Contains(next.Id))
                                src.Connections.Add(next.Id);
                        }
                    }
                }

                Map.Acts.Add(actNodes);
            }

            // Available at start = all row-0 nodes of act 1
            Map.AvailableNodeIds = Map.Acts[0]
                .Where(n => n.Row == 0)
                .Select(n => n.Id)
                .ToList();
        }

        private NodeType RollNodeType()
        {
            int r = _rng.Next(100);
            return r < 45 ? NodeType.Battle
                 : r < 55 ? NodeType.Elite
                 : r < 70 ? NodeType.Shop
                 : r < 85 ? NodeType.Rest
                            : NodeType.Event;
        }

        // ── Helpers ───────────────────────────────────────────────────────────

        private MapNode? FindNode(string id)
        {
            foreach (var act in Map.Acts)
                foreach (var node in act)
                    if (node.Id == id) return node;
            return null;
        }

        private void AdvanceAvailableNodes(MapNode cleared)
        {
            Map.AvailableNodeIds.Clear();
            foreach (var connId in cleared.Connections)
                Map.AvailableNodeIds.Add(connId);

            // If no connections (boss row), check if we advance act
            if (Map.AvailableNodeIds.Count == 0 && cleared.Type == NodeType.Boss)
            {
                int nextAct = cleared.Act + 1;
                if (nextAct <= 3)
                {
                    Map.CurrentAct = nextAct;
                    var nextActNodes = Map.Acts[nextAct - 1];
                    Map.AvailableNodeIds = nextActNodes
                        .Where(n => n.Row == 0)
                        .Select(n => n.Id)
                        .ToList();
                }
                else
                {
                    // All acts cleared → victory
                    SetPhase(GamePhase.Victory);
                }
            }
        }

        private void MarkCurrentCleared()
        {
            if (Map.CurrentNodeId == null) return;
            var node = FindNode(Map.CurrentNodeId);
            if (node != null)
            {
                node.Cleared = true;
                AdvanceAvailableNodes(node);
            }
        }

        private List<EnemyDefinition> PickEnemiesFor(MapNode node)
        {
            bool isElite = node.Type == NodeType.Elite;
            bool isBoss  = node.Type == NodeType.Boss;
            var pool = EnemyDB.Singleton.GetForNode(Map.CurrentAct, isElite, isBoss);
            if (pool.Count == 0) pool = EnemyDB.Singleton.GetForNode(1, isElite, isBoss);
            if (pool.Count == 0) pool = EnemyDB.Singleton.GetForNode(1, false, false);

            // Boss and elite: always solo
            if (isBoss || isElite)
                return new List<EnemyDefinition> { pool[_rng.Next(pool.Count)] };

            // Normal battles: count scales by row
            int count;
            if (node.Row == 0)
                count = 1;                                        // intro fight
            else if (node.Row <= 3)
                count = _rng.Next(2) == 0 ? 1 : 2;              // 50% 1, 50% 2
            else if (node.Row <= 6)
                count = 2;                                        // always 2
            else
                count = _rng.Next(10) < 6 ? 2 : 3;              // 60% 2, 40% 3

            var result = new List<EnemyDefinition>(count);
            for (int i = 0; i < count; i++)
                result.Add(pool[_rng.Next(pool.Count)]);
            return result;
        }

        private BattleResult BuildBattleResult(MapNode node)
        {
            int bondBase = 5;
            var bonuses = new List<BondBonus>();
            float mult = CombatManager.Singleton.State.BondMultiplier;

            bool noKO = Creatures.All(c => !c.IsKnockedOut);
            if (noKO) bonuses.Add(new BondBonus { Label = "No KO", Amount = 1 });

            bool isElite = node.Type == NodeType.Elite;
            bool isBoss  = node.Type == NodeType.Boss;
            if (isElite || isBoss)
                bonuses.Add(new BondBonus { Label = isBoss ? "Boss" : "Elite", Amount = 3 });

            bonuses.Add(new BondBonus { Label = "Ambient", Amount = 1 });

            int total = (int)((bondBase + bonuses.Sum(b => b.Amount)) * mult);

            // Gold reward
            int baseGold  = isBoss ? 40 : isElite ? 26 : 14;
            int parTurns  = isBoss ? 12 : isElite ? 9 : 7;
            int perfBonus = CombatManager.Singleton.State.Turn <= parTurns
                            ? (int)(baseGold * 0.30f) : 0;
            int totalGold = baseGold + perfBonus;
            Gold += totalGold;

            return new BattleResult
            {
                Victory = true,
                BondBase = bondBase,
                BondBonuses = bonuses,
                BondTotal = total,
                NoKO = noKO,
                WasElite = isElite,
                WasBoss  = isBoss,
                BondMultiplier = mult,
                GoldEarned = totalGold,
                GoldBreakdown = perfBonus > 0
                    ? $"Base: {baseGold} + Performance: +{perfBonus}"
                    : $"Base: {baseGold}"
            };
        }

        private void ApplyEvolution(CreatureId id)
        {
            var creature = Creatures.First(c => c.Id == id);
            var oldStage = creature.Stage;
            var newStage = oldStage == EvolutionStage.Stage0 ? EvolutionStage.Stage1 : EvolutionStage.Stage2;

            // Update base stats (HP scales up, keep current fraction)
            var newBase = CreatureDB.Singleton.GetBase(id, newStage);
            float hpFraction = (float)creature.CurrentHp / creature.MaxHp;
            creature.Stage   = newStage;
            creature.Name    = newBase.Name;
            creature.MaxHp   = newBase.MaxHp;
            creature.CurrentHp = Math.Max(1, (int)(newBase.MaxHp * hpFraction));

            // Swap only the evolving creature's signature cards in the deck
            foreach (var card in Deck)
            {
                var def = CardDB.Singleton.Get(card.DefinitionId);
                if (def.Owner != id) continue;
                string upgraded = CardDB.Singleton.GetEvolutionId(card.DefinitionId, newStage);
                if (upgraded != card.DefinitionId)
                    card.DefinitionId = upgraded;
            }

            JustEvolvedCreature = id;
        }

        private CardInstance NewInstance(string definitionId) =>
            new CardInstance($"ci_{_instanceCounter++}", definitionId);

        private void SetPhase(GamePhase p)
        {
            Phase = p;
            PhaseChanged?.Invoke(p);
        }

        private void EmitStateUpdated() => StateUpdated?.Invoke();
    }
}
