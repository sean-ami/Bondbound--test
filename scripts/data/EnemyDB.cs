using Godot;
using System.Collections.Generic;

namespace BondBound
{
    public partial class EnemyDB : Node
    {
        public static EnemyDB Singleton { get; private set; } = null!;

        private readonly Dictionary<string, EnemyDefinition> _defs = new();

        public override void _Ready()
        {
            Singleton = this;
            RegisterAll();
        }

        private void RegisterAll()
        {
            // ── Act 1 ──────────────────────────────────────────────────────────

            Reg(new EnemyDefinition
            {
                Id = "slimeling", Name = "Slimeling", Emoji = "🟢",
                BaseHp = 28, Acts = new() { 1 }, IsElite = false, IsBoss = false,
                Pattern = new()
                {
                    new EnemyAction { Type = EnemyIntentType.Attack, Value = 7 },
                    new EnemyAction { Type = EnemyIntentType.Attack, Value = 7 },
                    new EnemyAction { Type = EnemyIntentType.Block,  Value = 6 },
                }
            });

            Reg(new EnemyDefinition
            {
                Id = "stone_brute", Name = "Stone Brute", Emoji = "🪨",
                BaseHp = 52, Acts = new() { 1 }, IsElite = false, IsBoss = false,
                Pattern = new()
                {
                    new EnemyAction { Type = EnemyIntentType.Block,  Value = 9 },
                    new EnemyAction { Type = EnemyIntentType.Attack, Value = 14 },
                    new EnemyAction { Type = EnemyIntentType.Block,  Value = 9 },
                    new EnemyAction { Type = EnemyIntentType.Attack, Value = 14 },
                }
            });

            Reg(new EnemyDefinition
            {
                Id = "flame_sprite", Name = "Flame Sprite", Emoji = "🔥",
                BaseHp = 36, Acts = new() { 1, 2 }, IsElite = false, IsBoss = false,
                Pattern = new()
                {
                    new EnemyAction { Type = EnemyIntentType.Burn,   Value = 6,  StatusToApply = StatusType.Burn, StatusStacks = 2 },
                    new EnemyAction { Type = EnemyIntentType.Attack, Value = 9 },
                    new EnemyAction { Type = EnemyIntentType.Burn,   Value = 4,  StatusToApply = StatusType.Burn, StatusStacks = 1 },
                    new EnemyAction { Type = EnemyIntentType.Attack, Value = 11 },
                }
            });

            Reg(new EnemyDefinition
            {
                Id = "storm_crow", Name = "Storm Crow", Emoji = "🦅",
                BaseHp = 44, Acts = new() { 2 }, IsElite = false, IsBoss = false,
                Pattern = new()
                {
                    new EnemyAction { Type = EnemyIntentType.Shock,  Value = 8,  StatusToApply = StatusType.Shock, StatusStacks = 2 },
                    new EnemyAction { Type = EnemyIntentType.Attack, Value = 10 },
                    new EnemyAction { Type = EnemyIntentType.MultiAttack, Value = 5, Hits = 2 },
                }
            });

            // ── Act 1-2 Elite ─────────────────────────────────────────────────

            Reg(new EnemyDefinition
            {
                Id = "earth_golem", Name = "Earth Golem", Emoji = "🗿",
                BaseHp = 72, Acts = new() { 1, 2 }, IsElite = true, IsBoss = false,
                Pattern = new()
                {
                    new EnemyAction { Type = EnemyIntentType.Block,      Value = 12 },
                    new EnemyAction { Type = EnemyIntentType.BigAttack,  Value = 18 },
                    new EnemyAction { Type = EnemyIntentType.Block,      Value = 12 },
                    new EnemyAction { Type = EnemyIntentType.BigAttack,  Value = 22 },
                }
            });

            // ── Act 2-3 Elite ─────────────────────────────────────────────────

            Reg(new EnemyDefinition
            {
                Id = "shadow_wraith", Name = "Shadow Wraith", Emoji = "👻",
                BaseHp = 58, Acts = new() { 2, 3 }, IsElite = true, IsBoss = false,
                Pattern = new()
                {
                    new EnemyAction { Type = EnemyIntentType.Shock,  Value = 0,  StatusToApply = StatusType.Shock, StatusStacks = 3 },
                    new EnemyAction { Type = EnemyIntentType.Attack, Value = 12, StatusToApply = StatusType.Shock, StatusStacks = 1 },
                    new EnemyAction { Type = EnemyIntentType.Attack, Value = 14 },
                    new EnemyAction { Type = EnemyIntentType.Block,  Value = 8  },
                }
            });

            // ── Act 2 Boss ────────────────────────────────────────────────────

            Reg(new EnemyDefinition
            {
                Id = "inferno_drake", Name = "Inferno Drake", Emoji = "🐉",
                BaseHp = 120, Acts = new() { 2 }, IsElite = false, IsBoss = true,
                Pattern = new()
                {
                    new EnemyAction { Type = EnemyIntentType.Burn,       Value = 8,  StatusToApply = StatusType.Burn, StatusStacks = 3 },
                    new EnemyAction { Type = EnemyIntentType.BigAttack,  Value = 20 },
                    new EnemyAction { Type = EnemyIntentType.MultiAttack,Value = 8,  Hits = 2 },
                    new EnemyAction { Type = EnemyIntentType.Block,      Value = 10 },
                    new EnemyAction { Type = EnemyIntentType.BigAttack,  Value = 24 },
                }
            });

            // ── Act 3 Boss ────────────────────────────────────────────────────

            Reg(new EnemyDefinition
            {
                Id = "void_architect", Name = "Void Architect", Emoji = "🌀",
                BaseHp = 160, Acts = new() { 3 }, IsElite = false, IsBoss = true,
                Pattern = new()
                {
                    new EnemyAction { Type = EnemyIntentType.Shock,      Value = 0,  StatusToApply = StatusType.Shock, StatusStacks = 4 },
                    new EnemyAction { Type = EnemyIntentType.Attack,     Value = 15 },
                    new EnemyAction { Type = EnemyIntentType.Buff,       Value = 0  },
                    new EnemyAction { Type = EnemyIntentType.BigAttack,  Value = 26 },
                    new EnemyAction { Type = EnemyIntentType.MultiAttack,Value = 10, Hits = 3 },
                    new EnemyAction { Type = EnemyIntentType.Block,      Value = 16 },
                }
            });
        }

        private void Reg(EnemyDefinition def) => _defs[def.Id] = def;

        public EnemyDefinition Get(string id) => _defs[id];

        public List<EnemyDefinition> GetForNode(int act, bool isElite, bool isBoss)
        {
            var result = new List<EnemyDefinition>();
            foreach (var def in _defs.Values)
            {
                if (def.Acts.Contains(act) && def.IsElite == isElite && def.IsBoss == isBoss)
                    result.Add(def);
            }
            return result;
        }

        public EnemyState CreateInstance(string definitionId, string instanceId)
        {
            var def = Get(definitionId);
            var state = new EnemyState
            {
                DefinitionId = definitionId,
                InstanceId   = instanceId,
                Name         = def.Name,
                Emoji        = def.Emoji,
                MaxHp        = def.BaseHp,
                CurrentHp    = def.BaseHp
            };
            state.Intent = BuildIntent(def, 0);
            return state;
        }

        public EnemyIntent BuildIntent(EnemyDefinition def, int patternIndex)
        {
            var action = def.Pattern[patternIndex % def.Pattern.Count];
            string label = action.Type switch
            {
                EnemyIntentType.Attack      => $"⚔️ {action.Value}",
                EnemyIntentType.BigAttack   => $"💥 {action.Value}",
                EnemyIntentType.MultiAttack => $"⚔️×{action.Hits} {action.Value}",
                EnemyIntentType.Block       => $"🛡 {action.Value}",
                EnemyIntentType.Burn        => $"🔥 {action.StatusStacks} Burn",
                EnemyIntentType.Shock       => $"⚡ {action.StatusStacks} Shock",
                EnemyIntentType.Buff        => "✨ Buff",
                _                           => "?"
            };
            return new EnemyIntent
            {
                Type  = action.Type,
                Value = action.Value,
                Hits  = action.Hits,
                Label = label
            };
        }
    }
}
