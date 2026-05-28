using System;
using System.Collections.Generic;

namespace BondBound
{
    // ── Enums ─────────────────────────────────────────────────────────────────

    public enum CreatureId { Kindlpup, Mosscub, Sparkwisp }
    public enum EvolutionStage { Stage0, Stage1, Stage2 }
    public enum Rarity { Common, Uncommon, Rare, Signature }
    public enum StatusType { Burn, Shock, Thorns, Regen, Weak, Vulnerable }
    public enum NodeType { Battle, Elite, Shop, Rest, Event, Boss }
    public enum CardTag { Attack, Block, Draw, MultiHit, Aoe, EnergyGen, Utility }
    public enum GamePhase
    {
        MainMenu, Map, Combat, BondSummary, Evolution, Draft, Shop, Rest, Event, Victory, GameOver
    }
    public enum CombatPhase { PlayerTurn, EnemyTurn, Victory, Defeat }
    public enum EnemyIntentType { Attack, Block, Buff, MultiAttack, Burn, Shock, BigAttack }

    // ── Status ────────────────────────────────────────────────────────────────

    public class StatusStack
    {
        public StatusType Type;
        public int Stacks;
        public StatusStack(StatusType type, int stacks) { Type = type; Stacks = stacks; }
        public StatusStack Clone() => new StatusStack(Type, Stacks);
    }

    // ── Cards ─────────────────────────────────────────────────────────────────

    public delegate void CardEffectFn(CardEffectContext ctx);

    public class CardDefinition
    {
        public string Id = "";
        public string Name = "";
        public CreatureId? Owner; // null = generic
        public EvolutionStage? Stage; // null = generic
        public int EnergyCost;
        public Rarity Rarity;
        public string Description = "";
        public List<CardTag> Tags = new();
        public CardEffectFn Effect = _ => { };
    }

    public class CardInstance
    {
        public string InstanceId;
        public string DefinitionId;
        public CardInstance(string instanceId, string definitionId)
        {
            InstanceId = instanceId;
            DefinitionId = definitionId;
        }
    }

    // ── Creatures ─────────────────────────────────────────────────────────────

    public class CreatureStats
    {
        public CreatureId Id;
        public string Name = "";
        public string Emoji = "";
        public string Color = "#ffffff";
        public EvolutionStage Stage;
        public int MaxHp;
        public int CurrentHp;
        public int Block;
        public List<StatusStack> Statuses = new();
        public int BondAccumulated;
        public bool IsKnockedOut;

        public CreatureStats Clone()
        {
            var c = new CreatureStats
            {
                Id = Id, Name = Name, Emoji = Emoji, Color = Color, Stage = Stage,
                MaxHp = MaxHp, CurrentHp = CurrentHp, Block = Block,
                BondAccumulated = BondAccumulated, IsKnockedOut = IsKnockedOut
            };
            foreach (var s in Statuses) c.Statuses.Add(s.Clone());
            return c;
        }
    }

    // ── Enemies ───────────────────────────────────────────────────────────────

    public class EnemyAction
    {
        public EnemyIntentType Type;
        public int Value;
        public int Hits = 1;
        public StatusType? StatusToApply;
        public int StatusStacks;
    }

    public class EnemyDefinition
    {
        public string Id = "";
        public string Name = "";
        public string Emoji = "";
        public int BaseHp;
        public List<int> Acts = new(); // 1, 2, or 3
        public bool IsElite;
        public bool IsBoss;
        public List<EnemyAction> Pattern = new(); // cycles
    }

    public class EnemyIntent
    {
        public EnemyIntentType Type;
        public int Value;
        public int Hits;
        public string Label = "";
    }

    public class EnemyState
    {
        public string DefinitionId = "";
        public string InstanceId = "";
        public string Name = "";
        public string Emoji = "";
        public int MaxHp;
        public int CurrentHp;
        public int Block;
        public List<StatusStack> Statuses = new();
        public EnemyIntent Intent = new();
        public int PatternIndex;

        public EnemyState Clone()
        {
            var e = new EnemyState
            {
                DefinitionId = DefinitionId, InstanceId = InstanceId, Name = Name, Emoji = Emoji,
                MaxHp = MaxHp, CurrentHp = CurrentHp, Block = Block, PatternIndex = PatternIndex,
                Intent = new EnemyIntent { Type = Intent.Type, Value = Intent.Value, Hits = Intent.Hits, Label = Intent.Label }
            };
            foreach (var s in Statuses) e.Statuses.Add(s.Clone());
            return e;
        }
    }

    // ── Map ───────────────────────────────────────────────────────────────────

    public class MapNode
    {
        public string Id = "";
        public int Act;
        public int Row;
        public int Col;
        public NodeType Type;
        public List<string> Connections = new();
        public bool Cleared;
    }

    public class MapState
    {
        public List<List<MapNode>> Acts = new();
        public int CurrentAct;
        public string? CurrentNodeId;
        public List<string> AvailableNodeIds = new();
    }

    // ── Combat ────────────────────────────────────────────────────────────────

    public class CombatState
    {
        public CombatPhase Phase = CombatPhase.PlayerTurn;
        public int Turn = 1;
        public int Energy = 3;
        public int MaxEnergy = 3;
        public int BonusEnergyNextTurn;
        public List<CardInstance> Hand = new();
        public List<CardInstance> DrawPile = new();
        public List<CardInstance> DiscardPile = new();
        public List<EnemyState> Enemies = new();
        public List<CreatureStats> Creatures = new();
        public int CardsPlayedThisTurn;
        public int CardsPlayedLastTurn;
        public bool ComboActive;
        public string? LastCardPlayedId;
        public bool NextCardFree;
        public bool RepeatNextCard;
        public bool HeatAuraUsedThisTurn;
        public bool MomentumCarryover;
        public bool ArcAuraUsedThisTurn;
        public float BondMultiplier = 1f;
        public List<string> Log = new();
    }

    // ── Run ───────────────────────────────────────────────────────────────────

    public class BondBonus
    {
        public string Label = "";
        public int Amount;
    }

    public class BattleResult
    {
        public bool Victory;
        public int BondBase;
        public List<BondBonus> BondBonuses = new();
        public int BondTotal;
        public bool NoKO;
        public bool WasElite;
        public bool WasBoss;
        public float BondMultiplier = 1f;
    }

    // ── Card Effect Context ────────────────────────────────────────────────────

    public class CardEffectContext
    {
        public CombatState State = null!;
        public CreatureId Source;
        public string? TargetEnemyId;
        public int CardsPlayedThisTurn;
        public string? LastCardPlayedId;
        public bool ComboActive;

        // Mutators set by CombatManager at call time
        public Action<string, int, bool, int> DealDamage = null!;        // targetId, amount, isMultiHit, hitIndex
        public Action<int> DealDamageAllEnemies = null!;
        public Action<string, int> GainBlock = null!;                    // "all" or creatureId name
        public Action<string, StatusType, int> ApplyStatusToEnemy = null!;
        public Action<StatusType, int> ApplyStatusToAllEnemies = null!;
        public Action<CreatureId, StatusType, int> ApplyStatusToCreature = null!;
        public Action<int> DrawCards = null!;
        public Action<int> GainEnergy = null!;
        public Action<int> GainBonusEnergyNextTurn = null!;
        public Action SetNextCardFree = null!;
        public Action SetRepeatNextCard = null!;
        public Action DetonateAllShock = null!;
        public Action TriggerAllPassives = null!;
        public Action<CreatureId, int> HealCreature = null!;
        public Action<float> AddBondMultiplier = null!;
        public Action<bool> RepeatLastCard = null!;  // bool = halfValue
    }
}
