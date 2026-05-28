using Godot;
using System;
using System.Collections.Generic;
using System.Linq;

namespace BondBound
{
    /// <summary>
    /// Autoload singleton. Holds all card definitions and provides lookup.
    /// </summary>
    public partial class CardDB : Node
    {
        public static CardDB Singleton { get; private set; } = null!;

        private Dictionary<string, CardDefinition> _cards = new();

        public override void _Ready()
        {
            Singleton = this;
            RegisterAll();
        }

        public CardDefinition Get(string id) => _cards[id];

        public List<CardDefinition> GetSignatureCards(CreatureId creature, EvolutionStage stage)
        {
            var stageSuffix = (int)stage;
            return _cards.Values
                .Where(c => c.Owner == creature && c.Stage == stage)
                .ToList();
        }

        public List<CardDefinition> GetGenericCards() =>
            _cards.Values.Where(c => c.Owner == null).ToList();

        public string GetEvolutionId(string baseId, EvolutionStage newStage)
        {
            // e.g. "primal_pounce_0" -> "primal_pounce_2"
            var lastUnderscore = baseId.LastIndexOf('_');
            if (lastUnderscore < 0) return baseId;
            var suffix = baseId[(lastUnderscore + 1)..];
            if (suffix != "0" && suffix != "1" && suffix != "2") return baseId;
            return baseId[..lastUnderscore] + "_" + (int)newStage;
        }

        private void Register(CardDefinition c) => _cards[c.Id] = c;

        private void RegisterAll()
        {
            RegisterKindlpup();
            RegisterMosscub();
            RegisterSparkwisp();
            RegisterGeneric();
        }

        // ── Kindlpup ──────────────────────────────────────────────────────────

        private void RegisterKindlpup()
        {
            Register(new CardDefinition
            {
                Id = "primal_pounce_0", Name = "Primal Pounce",
                Owner = CreatureId.Kindlpup, Stage = EvolutionStage.Stage0,
                EnergyCost = 1, Rarity = Rarity.Signature,
                Description = "Deal 8 damage. If first card this turn, deal 3 more.",
                Tags = new() { CardTag.Attack },
                Effect = ctx =>
                {
                    int bonus = ctx.CardsPlayedThisTurn == 0 ? 3 : 0;
                    ctx.DealDamage(ctx.TargetEnemyId!, 8 + bonus, false, 0);
                }
            });
            Register(new CardDefinition
            {
                Id = "ember_guard_0", Name = "Ember Guard",
                Owner = CreatureId.Kindlpup, Stage = EvolutionStage.Stage0,
                EnergyCost = 1, Rarity = Rarity.Signature,
                Description = "Gain 8 Block. Apply 2 Burn to self.",
                Tags = new() { CardTag.Block },
                Effect = ctx =>
                {
                    ctx.GainBlock("kindlpup", 8);
                    ctx.ApplyStatusToCreature(CreatureId.Kindlpup, StatusType.Burn, 2);
                }
            });
            Register(new CardDefinition
            {
                Id = "instinct_howl_0", Name = "Instinct Howl",
                Owner = CreatureId.Kindlpup, Stage = EvolutionStage.Stage0,
                EnergyCost = 1, Rarity = Rarity.Signature,
                Description = "Draw 2. If 3+ cards played this turn, gain 1 Energy.",
                Tags = new() { CardTag.Draw, CardTag.EnergyGen },
                Effect = ctx =>
                {
                    ctx.DrawCards(2);
                    if (ctx.CardsPlayedThisTurn >= 3) ctx.GainEnergy(1);
                }
            });
            // Stage 1
            Register(new CardDefinition
            {
                Id = "primal_pounce_1", Name = "Ember Pounce",
                Owner = CreatureId.Kindlpup, Stage = EvolutionStage.Stage1,
                EnergyCost = 1, Rarity = Rarity.Signature,
                Description = "Deal 8 damage. Apply 2 Burn.",
                Tags = new() { CardTag.Attack },
                Effect = ctx =>
                {
                    ctx.DealDamage(ctx.TargetEnemyId!, 8, false, 0);
                    ctx.ApplyStatusToEnemy(ctx.TargetEnemyId!, StatusType.Burn, 2);
                }
            });
            Register(new CardDefinition
            {
                Id = "ember_guard_1", Name = "Flamehide",
                Owner = CreatureId.Kindlpup, Stage = EvolutionStage.Stage1,
                EnergyCost = 1, Rarity = Rarity.Signature,
                Description = "Gain 8 Block. Refund 1 Energy.",
                Tags = new() { CardTag.Block, CardTag.EnergyGen },
                Effect = ctx =>
                {
                    ctx.GainBlock("kindlpup", 8);
                    ctx.GainEnergy(1);
                }
            });
            Register(new CardDefinition
            {
                Id = "instinct_howl_1", Name = "Ember Howl",
                Owner = CreatureId.Kindlpup, Stage = EvolutionStage.Stage1,
                EnergyCost = 1, Rarity = Rarity.Signature,
                Description = "Draw 2. Apply 2 Vulnerable to target.",
                Tags = new() { CardTag.Draw, CardTag.Utility },
                Effect = ctx =>
                {
                    ctx.DrawCards(2);
                    if (ctx.TargetEnemyId != null)
                        ctx.ApplyStatusToEnemy(ctx.TargetEnemyId, StatusType.Vulnerable, 2);
                }
            });
            // Stage 2
            Register(new CardDefinition
            {
                Id = "primal_pounce_2", Name = "Dire Pounce",
                Owner = CreatureId.Kindlpup, Stage = EvolutionStage.Stage2,
                EnergyCost = 1, Rarity = Rarity.Signature,
                Description = "Deal 8 damage twice.",
                Tags = new() { CardTag.Attack, CardTag.MultiHit },
                Effect = ctx =>
                {
                    ctx.DealDamage(ctx.TargetEnemyId!, 8, true, 0);
                    ctx.DealDamage(ctx.TargetEnemyId!, 8, true, 1);
                }
            });
            Register(new CardDefinition
            {
                Id = "ember_guard_2", Name = "Infernohide",
                Owner = CreatureId.Kindlpup, Stage = EvolutionStage.Stage2,
                EnergyCost = 1, Rarity = Rarity.Signature,
                Description = "Gain 8 Block. Apply 2 Burn to all enemies.",
                Tags = new() { CardTag.Block },
                Effect = ctx =>
                {
                    ctx.GainBlock("kindlpup", 8);
                    ctx.ApplyStatusToAllEnemies(StatusType.Burn, 2);
                }
            });
            Register(new CardDefinition
            {
                Id = "instinct_howl_2", Name = "Storm Howl",
                Owner = CreatureId.Kindlpup, Stage = EvolutionStage.Stage2,
                EnergyCost = 1, Rarity = Rarity.Signature,
                Description = "Draw 2. Automatically repeat the next card played this turn.",
                Tags = new() { CardTag.Draw, CardTag.Utility },
                Effect = ctx =>
                {
                    ctx.DrawCards(2);
                    ctx.SetRepeatNextCard();
                }
            });
        }

        // ── Mosscub ───────────────────────────────────────────────────────────

        private void RegisterMosscub()
        {
            Register(new CardDefinition
            {
                Id = "bramble_bash_0", Name = "Bramble Bash",
                Owner = CreatureId.Mosscub, Stage = EvolutionStage.Stage0,
                EnergyCost = 1, Rarity = Rarity.Signature,
                Description = "Deal 7 damage. Gain 2 Thorns.",
                Tags = new() { CardTag.Attack },
                Effect = ctx =>
                {
                    ctx.DealDamage(ctx.TargetEnemyId!, 7, false, 0);
                    ctx.ApplyStatusToCreature(CreatureId.Mosscub, StatusType.Thorns, 2);
                }
            });
            Register(new CardDefinition
            {
                Id = "moss_hide_0", Name = "Moss Hide",
                Owner = CreatureId.Mosscub, Stage = EvolutionStage.Stage0,
                EnergyCost = 1, Rarity = Rarity.Signature,
                Description = "Gain 10 Block and 2 Regen.",
                Tags = new() { CardTag.Block },
                Effect = ctx =>
                {
                    ctx.GainBlock("mosscub", 10);
                    ctx.ApplyStatusToCreature(CreatureId.Mosscub, StatusType.Regen, 2);
                }
            });
            Register(new CardDefinition
            {
                Id = "guardians_call_0", Name = "Guardian's Call",
                Owner = CreatureId.Mosscub, Stage = EvolutionStage.Stage0,
                EnergyCost = 1, Rarity = Rarity.Signature,
                Description = "All creatures gain 5 Block.",
                Tags = new() { CardTag.Block, CardTag.Utility },
                Effect = ctx => ctx.GainBlock("all", 5)
            });
            // Stage 1
            Register(new CardDefinition
            {
                Id = "bramble_bash_1", Name = "Thorn Bash",
                Owner = CreatureId.Mosscub, Stage = EvolutionStage.Stage1,
                EnergyCost = 1, Rarity = Rarity.Signature,
                Description = "Deal 7 damage. Deal 3 more if you have Block.",
                Tags = new() { CardTag.Attack },
                Effect = ctx =>
                {
                    var mc = ctx.State.Creatures.Find(c => c.Id == CreatureId.Mosscub);
                    int bonus = (mc != null && mc.Block > 0) ? 3 : 0;
                    ctx.DealDamage(ctx.TargetEnemyId!, 7 + bonus, false, 0);
                }
            });
            Register(new CardDefinition
            {
                Id = "moss_hide_1", Name = "Bramblehide",
                Owner = CreatureId.Mosscub, Stage = EvolutionStage.Stage1,
                EnergyCost = 1, Rarity = Rarity.Signature,
                Description = "Gain 10 Block. Double current Regen stacks.",
                Tags = new() { CardTag.Block },
                Effect = ctx =>
                {
                    ctx.GainBlock("mosscub", 10);
                    var mc = ctx.State.Creatures.Find(c => c.Id == CreatureId.Mosscub);
                    var regen = mc?.Statuses.Find(s => s.Type == StatusType.Regen);
                    if (regen != null && regen.Stacks > 0)
                        ctx.ApplyStatusToCreature(CreatureId.Mosscub, StatusType.Regen, regen.Stacks);
                }
            });
            Register(new CardDefinition
            {
                Id = "guardians_call_1", Name = "Guardian's Roar",
                Owner = CreatureId.Mosscub, Stage = EvolutionStage.Stage1,
                EnergyCost = 1, Rarity = Rarity.Signature,
                Description = "All creatures gain 5 Block. Apply 2 Weak to all enemies.",
                Tags = new() { CardTag.Block, CardTag.Utility },
                Effect = ctx =>
                {
                    ctx.GainBlock("all", 5);
                    ctx.ApplyStatusToAllEnemies(StatusType.Weak, 2);
                }
            });
            // Stage 2
            Register(new CardDefinition
            {
                Id = "bramble_bash_2", Name = "Quake Bash",
                Owner = CreatureId.Mosscub, Stage = EvolutionStage.Stage2,
                EnergyCost = 2, Rarity = Rarity.Signature,
                Description = "Deal damage to ALL enemies equal to your Thorns count.",
                Tags = new() { CardTag.Attack, CardTag.Aoe },
                Effect = ctx =>
                {
                    var mc = ctx.State.Creatures.Find(c => c.Id == CreatureId.Mosscub);
                    int thorns = mc?.Statuses.Find(s => s.Type == StatusType.Thorns)?.Stacks ?? 0;
                    ctx.DealDamageAllEnemies(thorns);
                }
            });
            Register(new CardDefinition
            {
                Id = "moss_hide_2", Name = "Earthheart Hide",
                Owner = CreatureId.Mosscub, Stage = EvolutionStage.Stage2,
                EnergyCost = 2, Rarity = Rarity.Signature,
                Description = "Gain 10 Block. Convert 50% of Block to max HP (max +20).",
                Tags = new() { CardTag.Block },
                Effect = ctx =>
                {
                    ctx.GainBlock("mosscub", 10);
                    var mc = ctx.State.Creatures.Find(c => c.Id == CreatureId.Mosscub);
                    if (mc != null)
                    {
                        int gain = Math.Min((int)(mc.Block * 0.5f), 20);
                        mc.MaxHp += gain;
                        mc.CurrentHp = Math.Min(mc.CurrentHp + gain, mc.MaxHp);
                    }
                }
            });
            Register(new CardDefinition
            {
                Id = "guardians_call_2", Name = "Earthshatter Call",
                Owner = CreatureId.Mosscub, Stage = EvolutionStage.Stage2,
                EnergyCost = 2, Rarity = Rarity.Signature,
                Description = "All creatures gain 5 Block. Apply 2 Weak + 2 Vulnerable to all enemies.",
                Tags = new() { CardTag.Block, CardTag.Utility, CardTag.Aoe },
                Effect = ctx =>
                {
                    ctx.GainBlock("all", 5);
                    ctx.ApplyStatusToAllEnemies(StatusType.Weak, 2);
                    ctx.ApplyStatusToAllEnemies(StatusType.Vulnerable, 2);
                }
            });
        }

        // ── Sparkwisp ─────────────────────────────────────────────────────────

        private void RegisterSparkwisp()
        {
            Register(new CardDefinition
            {
                Id = "zap_flicker_0", Name = "Zap Flicker",
                Owner = CreatureId.Sparkwisp, Stage = EvolutionStage.Stage0,
                EnergyCost = 0, Rarity = Rarity.Signature,
                Description = "Deal 4 damage.",
                Tags = new() { CardTag.Attack },
                Effect = ctx => ctx.DealDamage(ctx.TargetEnemyId!, 4, false, 0)
            });
            Register(new CardDefinition
            {
                Id = "spark_battery_0", Name = "Spark Battery",
                Owner = CreatureId.Sparkwisp, Stage = EvolutionStage.Stage0,
                EnergyCost = 1, Rarity = Rarity.Signature,
                Description = "Gain +1 Energy next turn. Draw 1.",
                Tags = new() { CardTag.EnergyGen, CardTag.Draw },
                Effect = ctx => { ctx.GainBonusEnergyNextTurn(1); ctx.DrawCards(1); }
            });
            Register(new CardDefinition
            {
                Id = "chain_pulse_0", Name = "Chain Pulse",
                Owner = CreatureId.Sparkwisp, Stage = EvolutionStage.Stage0,
                EnergyCost = 2, Rarity = Rarity.Signature,
                Description = "If 4+ cards played this turn, repeat last card.",
                Tags = new() { CardTag.Utility },
                Effect = ctx => { if (ctx.CardsPlayedThisTurn >= 4) ctx.RepeatLastCard(false); }
            });
            // Stage 1
            Register(new CardDefinition
            {
                Id = "zap_flicker_1", Name = "Arc Flicker",
                Owner = CreatureId.Sparkwisp, Stage = EvolutionStage.Stage1,
                EnergyCost = 0, Rarity = Rarity.Signature,
                Description = "Deal 4 damage. If 5th+ card this turn, gain 1 Energy.",
                Tags = new() { CardTag.Attack, CardTag.EnergyGen },
                Effect = ctx =>
                {
                    ctx.DealDamage(ctx.TargetEnemyId!, 4, false, 0);
                    if (ctx.CardsPlayedThisTurn + 1 >= 5) ctx.GainEnergy(1);
                }
            });
            Register(new CardDefinition
            {
                Id = "spark_battery_1", Name = "Arc Battery",
                Owner = CreatureId.Sparkwisp, Stage = EvolutionStage.Stage1,
                EnergyCost = 1, Rarity = Rarity.Signature,
                Description = "Gain +1 Energy next turn. Draw 1. If combo active, gain 1 Energy now.",
                Tags = new() { CardTag.EnergyGen, CardTag.Draw },
                Effect = ctx =>
                {
                    ctx.GainBonusEnergyNextTurn(1);
                    ctx.DrawCards(1);
                    if (ctx.ComboActive) ctx.GainEnergy(1);
                }
            });
            Register(new CardDefinition
            {
                Id = "chain_pulse_1", Name = "Arc Pulse",
                Owner = CreatureId.Sparkwisp, Stage = EvolutionStage.Stage1,
                EnergyCost = 2, Rarity = Rarity.Signature,
                Description = "If 4+ cards played this turn, repeat last card and apply 2 Shock.",
                Tags = new() { CardTag.Utility },
                Effect = ctx =>
                {
                    if (ctx.CardsPlayedThisTurn >= 4)
                    {
                        ctx.RepeatLastCard(false);
                        if (ctx.TargetEnemyId != null)
                            ctx.ApplyStatusToEnemy(ctx.TargetEnemyId, StatusType.Shock, 2);
                    }
                }
            });
            // Stage 2
            Register(new CardDefinition
            {
                Id = "zap_flicker_2", Name = "Wraith Flicker",
                Owner = CreatureId.Sparkwisp, Stage = EvolutionStage.Stage2,
                EnergyCost = 0, Rarity = Rarity.Signature,
                Description = "Deal 4 damage. If 5th+ card, also hit a random enemy for 4.",
                Tags = new() { CardTag.Attack },
                Effect = ctx =>
                {
                    ctx.DealDamage(ctx.TargetEnemyId!, 4, false, 0);
                    if (ctx.CardsPlayedThisTurn + 1 >= 5)
                    {
                        var live = ctx.State.Enemies.FindAll(e => e.CurrentHp > 0);
                        if (live.Count > 0)
                        {
                            var rng = new Random();
                            ctx.DealDamage(live[rng.Next(live.Count)].InstanceId, 4, false, 0);
                        }
                    }
                }
            });
            Register(new CardDefinition
            {
                Id = "spark_battery_2", Name = "Storm Battery",
                Owner = CreatureId.Sparkwisp, Stage = EvolutionStage.Stage2,
                EnergyCost = 1, Rarity = Rarity.Signature,
                Description = "Gain +1 Energy next turn. Draw 1. If combo, gain 1 Energy and Shock all enemies.",
                Tags = new() { CardTag.EnergyGen, CardTag.Aoe },
                Effect = ctx =>
                {
                    ctx.GainBonusEnergyNextTurn(1);
                    ctx.DrawCards(1);
                    if (ctx.ComboActive) { ctx.GainEnergy(1); ctx.ApplyStatusToAllEnemies(StatusType.Shock, 2); }
                }
            });
            Register(new CardDefinition
            {
                Id = "chain_pulse_2", Name = "Wraith Pulse",
                Owner = CreatureId.Sparkwisp, Stage = EvolutionStage.Stage2,
                EnergyCost = 2, Rarity = Rarity.Signature,
                Description = "If 4+ cards played, detonate ALL Shock stacks (3 dmg/stack).",
                Tags = new() { CardTag.Attack, CardTag.Aoe },
                Effect = ctx => { if (ctx.CardsPlayedThisTurn >= 4) ctx.DetonateAllShock(); }
            });
        }

        // ── Generic ───────────────────────────────────────────────────────────

        private void RegisterGeneric()
        {
            Register(new CardDefinition
            {
                Id = "quick_block", Name = "Quick Block", EnergyCost = 1, Rarity = Rarity.Common,
                Description = "Gain 5 Block.", Tags = new() { CardTag.Block },
                Effect = ctx => ctx.GainBlock("all", 5)
            });
            Register(new CardDefinition
            {
                Id = "strike_plus", Name = "Strike+", EnergyCost = 1, Rarity = Rarity.Common,
                Description = "Deal 7 damage.", Tags = new() { CardTag.Attack },
                Effect = ctx => ctx.DealDamage(ctx.TargetEnemyId!, 7, false, 0)
            });
            Register(new CardDefinition
            {
                Id = "focus", Name = "Focus", EnergyCost = 1, Rarity = Rarity.Common,
                Description = "Draw 2 cards.", Tags = new() { CardTag.Draw },
                Effect = ctx => ctx.DrawCards(2)
            });
            Register(new CardDefinition
            {
                Id = "energy_spark", Name = "Energy Spark", EnergyCost = 0, Rarity = Rarity.Common,
                Description = "Gain +1 Energy this turn.", Tags = new() { CardTag.EnergyGen },
                Effect = ctx => ctx.GainEnergy(1)
            });
            Register(new CardDefinition
            {
                Id = "guard_shift", Name = "Guard Shift", EnergyCost = 1, Rarity = Rarity.Common,
                Description = "All creatures gain 3 Block.", Tags = new() { CardTag.Block, CardTag.Utility },
                Effect = ctx => ctx.GainBlock("all", 3)
            });
            Register(new CardDefinition
            {
                Id = "combo_step", Name = "Combo Step", EnergyCost = 1, Rarity = Rarity.Uncommon,
                Description = "Next card costs 0 if combo active.", Tags = new() { CardTag.Utility },
                Effect = ctx => { if (ctx.ComboActive) ctx.SetNextCardFree(); }
            });
            Register(new CardDefinition
            {
                Id = "rooted_stance", Name = "Rooted Stance", EnergyCost = 1, Rarity = Rarity.Uncommon,
                Description = "Gain 8 Block and 2 Thorns.", Tags = new() { CardTag.Block },
                Effect = ctx =>
                {
                    ctx.GainBlock("mosscub", 8);
                    ctx.ApplyStatusToCreature(CreatureId.Mosscub, StatusType.Thorns, 2);
                }
            });
            Register(new CardDefinition
            {
                Id = "ignition", Name = "Ignition", EnergyCost = 1, Rarity = Rarity.Uncommon,
                Description = "Apply 3 Burn to target.", Tags = new() { CardTag.Utility },
                Effect = ctx => { if (ctx.TargetEnemyId != null) ctx.ApplyStatusToEnemy(ctx.TargetEnemyId, StatusType.Burn, 3); }
            });
            Register(new CardDefinition
            {
                Id = "static_echo", Name = "Static Echo", EnergyCost = 2, Rarity = Rarity.Uncommon,
                Description = "Repeat the last card played at half value.", Tags = new() { CardTag.Utility },
                Effect = ctx => ctx.RepeatLastCard(true)
            });
            Register(new CardDefinition
            {
                Id = "team_guard", Name = "Team Guard", EnergyCost = 2, Rarity = Rarity.Uncommon,
                Description = "All creatures gain 4 Block.", Tags = new() { CardTag.Block, CardTag.Utility },
                Effect = ctx => ctx.GainBlock("all", 4)
            });
            Register(new CardDefinition
            {
                Id = "synergy_pulse", Name = "Synergy Pulse", EnergyCost = 2, Rarity = Rarity.Rare,
                Description = "Trigger all three passive auras simultaneously.", Tags = new() { CardTag.Utility },
                Effect = ctx => ctx.TriggerAllPassives()
            });
            Register(new CardDefinition
            {
                Id = "elemental_burst", Name = "Elemental Burst", EnergyCost = 2, Rarity = Rarity.Rare,
                Description = "Deal damage to all enemies equal to unique status types on them ×3.",
                Tags = new() { CardTag.Attack, CardTag.Aoe },
                Effect = ctx =>
                {
                    foreach (var e in ctx.State.Enemies)
                    {
                        if (e.CurrentHp <= 0) continue;
                        var unique = new HashSet<StatusType>(e.Statuses.ConvertAll(s => s.Type)).Count;
                        if (unique > 0) ctx.DealDamage(e.InstanceId, unique * 3, false, 0);
                    }
                }
            });
            Register(new CardDefinition
            {
                Id = "bond_echo", Name = "Bond Echo", EnergyCost = 0, Rarity = Rarity.Rare,
                Description = "Double Bond earned from this battle.", Tags = new() { CardTag.Utility },
                Effect = ctx => ctx.AddBondMultiplier(2f)
            });
            Register(new CardDefinition
            {
                Id = "momentum_surge", Name = "Momentum Surge", EnergyCost = 2, Rarity = Rarity.Rare,
                Description = "Gain +2 Energy. Draw 2. Next turn starts with +1 Energy.",
                Tags = new() { CardTag.EnergyGen, CardTag.Draw },
                Effect = ctx => { ctx.GainEnergy(2); ctx.DrawCards(2); ctx.GainBonusEnergyNextTurn(1); }
            });
            Register(new CardDefinition
            {
                Id = "natures_blessing", Name = "Nature's Blessing", EnergyCost = 0, Rarity = Rarity.Rare,
                Description = "Fully restore the lowest-HP creature's HP.",
                Tags = new() { CardTag.Utility },
                Effect = ctx =>
                {
                    var lowest = ctx.State.Creatures
                        .FindAll(c => !c.IsKnockedOut)
                        .MinBy(c => c.CurrentHp);
                    if (lowest != null) ctx.HealCreature(lowest.Id, lowest.MaxHp);
                }
            });
        }
    }
}
