using Godot;
using System;
using System.Collections.Generic;
using System.Linq;

namespace BondBound
{
    public partial class CombatManager : Node
    {
        public static CombatManager Singleton { get; private set; } = null!;

        public CombatState State { get; private set; } = new();

        public event Action<bool>? CombatEnded;   // bool = victory
        public event Action?       StateChanged;

        private readonly Random _rng = new();
        private bool _combatOver;
        private string? _lastCardInstanceId;

        public override void _Ready() => Singleton = this;

        // ── Init ──────────────────────────────────────────────────────────────

        public void InitCombat(List<CreatureStats> creatures, List<CardInstance> deck, List<EnemyDefinition> defs)
        {
            _combatOver = false;
            _lastCardInstanceId = null;

            State = new CombatState
            {
                Phase     = CombatPhase.PlayerTurn,
                Turn      = 0,
                MaxEnergy = 3,
                Creatures = creatures
            };

            State.DrawPile = deck.Select(c => new CardInstance(c.InstanceId, c.DefinitionId)).ToList();
            Shuffle(State.DrawPile);

            int idx = 0;
            foreach (var def in defs)
                State.Enemies.Add(EnemyDB.Singleton.CreateInstance(def.Id, $"e{idx++}"));

            StartPlayerTurn();
        }

        // ── Player turn ───────────────────────────────────────────────────────

        private void StartPlayerTurn()
        {
            State.Phase = CombatPhase.PlayerTurn;
            State.Turn++;

            foreach (var c in State.Creatures)
                if (!c.IsKnockedOut) c.Block = 0;

            TickCreatureStatuses();

            State.Energy = State.MaxEnergy
                + (State.MomentumCarryover ? 1 : 0)
                + State.BonusEnergyNextTurn;
            State.MomentumCarryover    = false;
            State.BonusEnergyNextTurn  = 0;
            State.CardsPlayedThisTurn  = 0;
            State.ComboActive          = false;
            State.HeatAuraUsedThisTurn = false;
            State.ArcAuraUsedThisTurn  = false;
            State.LastCardPlayedId     = null;

            DrawCardsFromPile(5);
            EmitStateChanged();
        }

        public void PlayCard(string instanceId, string? targetEnemyId)
        {
            if (State.Phase != CombatPhase.PlayerTurn || _combatOver) return;

            var card = State.Hand.FirstOrDefault(c => c.InstanceId == instanceId);
            if (card == null) return;

            var def = CardDB.Singleton.Get(card.DefinitionId);

            // Determine energy cost
            int cost = def.EnergyCost;
            if (State.NextCardFree)
            {
                cost = 0;
                State.NextCardFree = false;
            }
            else if (IsArcAuraCard())
            {
                cost = 0;
                State.ArcAuraUsedThisTurn = true;
            }

            if (State.Energy < cost) return;

            State.Energy -= cost;
            State.Hand.Remove(card);

            bool shouldRepeat = State.RepeatNextCard;
            State.RepeatNextCard = false;

            CreatureId source = def.Owner ?? InferSource(def);

            // Execute effect
            var ctx = BuildContext(source, targetEnemyId);
            def.Effect(ctx);

            State.CardsPlayedThisTurn++;
            if (State.CardsPlayedThisTurn >= 3) State.ComboActive = true;
            State.LastCardPlayedId = card.DefinitionId;
            _lastCardInstanceId = card.InstanceId;

            if (def.Tags.Contains(CardTag.Block))
                EvalMosscubBlockAura();

            // Mosscub stage-2 Grizzquake passive: block cards grant +1 Thorns
            EvalMosscubThornsAura(def);

            // Exhaust: permanently remove the card from play for this battle
            if (def.Tags.Contains(CardTag.Exhaust))
            {
                State.ExhaustedPile.Add(card);
                Log($"{def.Name} exhausted.");
            }
            else
            {
                State.DiscardPile.Add(card);
            }

            if (shouldRepeat)
            {
                var rctx = BuildContext(source, targetEnemyId);
                def.Effect(rctx);
                State.CardsPlayedThisTurn++;
            }

            CheckEndConditions();
            EmitStateChanged();
        }

        public void EndTurn()
        {
            if (State.Phase != CombatPhase.PlayerTurn || _combatOver) return;

            State.CardsPlayedLastTurn = State.CardsPlayedThisTurn;

            foreach (var c in State.Hand) State.DiscardPile.Add(c);
            State.Hand.Clear();
            State.Phase = CombatPhase.EnemyTurn;
            EmitStateChanged();

            ExecuteEnemyTurn();
        }

        // ── Enemy turn ────────────────────────────────────────────────────────

        private void ExecuteEnemyTurn()
        {
            foreach (var enemy in State.Enemies.ToList())
            {
                if (enemy.CurrentHp <= 0) continue;

                var def    = EnemyDB.Singleton.Get(enemy.DefinitionId);
                var action = def.Pattern[enemy.PatternIndex % def.Pattern.Count];

                switch (action.Type)
                {
                    case EnemyIntentType.Attack:
                    case EnemyIntentType.BigAttack:
                        EnemyHitRandomCreature(action.Value, 1);
                        break;
                    case EnemyIntentType.MultiAttack:
                        EnemyHitRandomCreature(action.Value, action.Hits);
                        break;
                    case EnemyIntentType.Block:
                        enemy.Block += action.Value;
                        break;
                    case EnemyIntentType.Burn:
                        EnemyApplyStatusToAllCreatures(StatusType.Burn, action.StatusStacks);
                        if (action.Value > 0) EnemyHitRandomCreature(action.Value, 1);
                        break;
                    case EnemyIntentType.Shock:
                        EnemyApplyStatusToAllCreatures(StatusType.Shock, action.StatusStacks);
                        if (action.Value > 0) EnemyHitRandomCreature(action.Value, 1);
                        break;
                    case EnemyIntentType.Buff:
                        enemy.CurrentHp = Math.Min(enemy.MaxHp, enemy.CurrentHp + (int)(enemy.MaxHp * 0.1f));
                        break;
                }

                enemy.PatternIndex++;
                enemy.Intent = EnemyDB.Singleton.BuildIntent(def, enemy.PatternIndex % def.Pattern.Count);
            }

            TickEnemyStatuses();
            CheckEndConditions();

            if (!_combatOver)
                StartPlayerTurn();
        }

        private void EnemyHitRandomCreature(int dmg, int hits)
        {
            var alive = State.Creatures.Where(c => !c.IsKnockedOut).ToList();
            if (alive.Count == 0) return;

            var target = alive[_rng.Next(alive.Count)];

            for (int h = 0; h < hits; h++)
            {
                // Thorns reflection (creature has Thorns → attacker takes dmg per stack)
                // Thorns applies once per hit to the enemy — but we don't have a specific attacker
                // So reflect to all enemies instead
                int thornStacks = GetStatus(target.Statuses, StatusType.Thorns);
                if (thornStacks > 0)
                {
                    foreach (var en in State.Enemies.Where(e => e.CurrentHp > 0))
                        ApplyDamageToEnemy(en, thornStacks);
                }

                // Apply Weak modifier
                float mult = 1f;
                if (GetStatus(target.Statuses, StatusType.Vulnerable) > 0) mult *= 1.5f;

                int finalDmg = Math.Max(0, (int)(dmg * mult) - target.Block);
                target.Block = Math.Max(0, target.Block - (int)(dmg * mult));
                target.CurrentHp -= finalDmg;

                if (target.CurrentHp <= 0)
                {
                    target.CurrentHp = 0;
                    target.IsKnockedOut = true;
                    Log($"{target.Name} is knocked out!");
                    SuspendCreatureCards(target.Id);
                }
            }
        }

        private void EnemyApplyStatusToAllCreatures(StatusType type, int stacks)
        {
            foreach (var c in State.Creatures.Where(c => !c.IsKnockedOut))
                AddStatus(c.Statuses, type, stacks);
        }

        // ── CardEffectContext builder ──────────────────────────────────────────

        private CardEffectContext BuildContext(CreatureId source, string? targetEnemyId)
        {
            var ctx = new CardEffectContext
            {
                State               = State,
                Source              = source,
                TargetEnemyId       = targetEnemyId,
                CardsPlayedThisTurn = State.CardsPlayedThisTurn,
                LastCardPlayedId    = State.LastCardPlayedId,
                ComboActive         = State.ComboActive,
            };

            ctx.DealDamage = (tId, amount, isMultiHit, hitIndex) =>
            {
                // Kindlpup Heat Aura: first damage per turn gets +2
                int bonus = 0;
                var kindl = State.Creatures.FirstOrDefault(c => c.Id == CreatureId.Kindlpup && !c.IsKnockedOut);
                if (kindl != null && !State.HeatAuraUsedThisTurn)
                {
                    bonus = 2;
                    State.HeatAuraUsedThisTurn = true;
                }

                // BonusNextAttack: consumed by EvalKindlpupAura (Synergy Pulse trigger)
                if (State.BonusNextAttack > 0)
                {
                    bonus += State.BonusNextAttack;
                    State.BonusNextAttack = 0;
                }

                // Source Weak modifier
                float mult = 1f;
                var srcCreature = State.Creatures.FirstOrDefault(c => c.Id == source);
                if (srcCreature != null && GetStatus(srcCreature.Statuses, StatusType.Weak) > 0)
                    mult *= 0.75f;

                var enemy = State.Enemies.FirstOrDefault(e => e.InstanceId == tId && e.CurrentHp > 0);
                if (enemy == null) return;
                if (GetStatus(enemy.Statuses, StatusType.Vulnerable) > 0) mult *= 1.5f;

                int total = (int)((amount + bonus) * mult);
                ApplyDamageToEnemy(enemy, total);
                Log($"Dealt {total} to {enemy.Name}");
            };

            ctx.DealDamageAllEnemies = (amount) =>
            {
                float mult = 1f;
                var srcCreature = State.Creatures.FirstOrDefault(c => c.Id == source);
                if (srcCreature != null && GetStatus(srcCreature.Statuses, StatusType.Weak) > 0)
                    mult *= 0.75f;

                foreach (var en in State.Enemies.Where(e => e.CurrentHp > 0))
                    ApplyDamageToEnemy(en, (int)(amount * mult));
            };

            ctx.GainBlock = (target, amount) =>
            {
                if (target == "all")
                {
                    foreach (var c in State.Creatures.Where(c => !c.IsKnockedOut))
                        c.Block += amount;
                }
                else
                {
                    if (Enum.TryParse<CreatureId>(target, ignoreCase: true, out var cid))
                    {
                        var c = State.Creatures.FirstOrDefault(x => x.Id == cid && !x.IsKnockedOut);
                        if (c != null) c.Block += amount;
                    }
                }
            };

            ctx.ApplyStatusToEnemy = (enemyId, type, stacks) =>
            {
                var en = State.Enemies.FirstOrDefault(e => e.InstanceId == enemyId && e.CurrentHp > 0);
                if (en != null) AddStatus(en.Statuses, type, stacks);
            };

            ctx.ApplyStatusToAllEnemies = (type, stacks) =>
            {
                foreach (var en in State.Enemies.Where(e => e.CurrentHp > 0))
                    AddStatus(en.Statuses, type, stacks);
            };

            ctx.ApplyStatusToCreature = (cid, type, stacks) =>
            {
                var c = State.Creatures.FirstOrDefault(x => x.Id == cid && !x.IsKnockedOut);
                if (c != null) AddStatus(c.Statuses, type, stacks);
            };

            ctx.DrawCards = (count) => DrawCardsFromPile(count);

            ctx.GainEnergy = (amount) => State.Energy = Math.Min(State.Energy + amount, State.MaxEnergy + 3);

            ctx.GainBonusEnergyNextTurn = (amount) => State.BonusEnergyNextTurn += amount;

            ctx.SetNextCardFree = () => State.NextCardFree = true;

            ctx.SetRepeatNextCard = () => State.RepeatNextCard = true;

            ctx.DetonateAllShock = () =>
            {
                foreach (var en in State.Enemies.Where(e => e.CurrentHp > 0).ToList())
                {
                    int stacks = GetStatus(en.Statuses, StatusType.Shock);
                    if (stacks > 0)
                    {
                        ApplyDamageToEnemy(en, stacks * 3);
                        RemoveStatus(en.Statuses, StatusType.Shock);
                        Log($"Detonated {stacks} Shock on {en.Name} for {stacks * 3} dmg");
                    }
                }
            };

            ctx.TriggerAllPassives = () =>
            {
                EvalKindlpupAura();
                EvalMosscubAura();
                EvalSparkwispAura();
            };

            ctx.HealCreature = (cid, amount) =>
            {
                var c = State.Creatures.FirstOrDefault(x => x.Id == cid);
                if (c != null && !c.IsKnockedOut)
                    c.CurrentHp = Math.Min(c.MaxHp, c.CurrentHp + amount);
            };

            ctx.AddBondMultiplier = (amount) => State.BondMultiplier += amount;

            ctx.RepeatLastCard = (halfValue) =>
            {
                if (State.LastCardPlayedId == null) return;
                var lastDef = CardDB.Singleton.Get(State.LastCardPlayedId);
                var rctx = BuildContext(lastDef.Owner ?? source, targetEnemyId);
                if (halfValue)
                {
                    // Halved: wrap damage delegate
                    var origDmg = rctx.DealDamage;
                    rctx.DealDamage = (t, amt, m, i) => origDmg(t, amt / 2, m, i);
                }
                lastDef.Effect(rctx);
            };

            return ctx;
        }

        // ── Passive auras ──────────────────────────────────────────────────────

        private void EvalKindlpupAura()
        {
            // Re-arm Heat Aura so it fires again this turn, and queue +3 on the next attack.
            var kindl = State.Creatures.FirstOrDefault(c => c.Id == CreatureId.Kindlpup && !c.IsKnockedOut);
            if (kindl == null) return;
            State.HeatAuraUsedThisTurn = false;
            State.BonusNextAttack += 3;
        }

        private void EvalMosscubAura()
        {
            // Manually-triggered version (Synergy Pulse): unconditional +5 Block for all living creatures.
            foreach (var c in State.Creatures.Where(c => !c.IsKnockedOut))
                c.Block += 5;
        }

        private void EvalMosscubBlockAura()
        {
            // Block-card trigger (stage 1+): all living creatures gain +2 Block.
            var mosscub = State.Creatures.FirstOrDefault(c => c.Id == CreatureId.Mosscub && !c.IsKnockedOut);
            if (mosscub != null && mosscub.Stage >= EvolutionStage.Stage1)
            {
                foreach (var c in State.Creatures.Where(c => !c.IsKnockedOut))
                    c.Block += 2;
            }
        }

        private void EvalSparkwispAura()
        {
            // Manually-triggered version (Synergy Pulse): draw 1 card; if combo active, also gain 1 Energy.
            var sparkwisp = State.Creatures.FirstOrDefault(c => c.Id == CreatureId.Sparkwisp && !c.IsKnockedOut);
            if (sparkwisp == null) return;
            DrawCardsFromPile(1);
            if (State.ComboActive)
                State.Energy = Math.Min(State.Energy + 1, State.MaxEnergy + 3);
        }

        private void EvalMosscubThornsAura(CardDefinition def)
        {
            // Grizzquake (stage 2): block cards grant +1 Thorns
            var mosscub = State.Creatures.FirstOrDefault(c => c.Id == CreatureId.Mosscub && !c.IsKnockedOut);
            if (mosscub != null && mosscub.Stage == EvolutionStage.Stage2 && def.Tags.Contains(CardTag.Block))
                AddStatus(mosscub.Statuses, StatusType.Thorns, 1);
        }

        private bool IsArcAuraCard()
        {
            // Sparkwisp Arc Aura (stage 1+): 5th card per turn costs 0
            var sparkwisp = State.Creatures.FirstOrDefault(c => c.Id == CreatureId.Sparkwisp && !c.IsKnockedOut);
            return sparkwisp != null
                && sparkwisp.Stage >= EvolutionStage.Stage1
                && !State.ArcAuraUsedThisTurn
                && State.CardsPlayedThisTurn + 1 >= 5;
        }

        private CreatureId InferSource(CardDefinition def)
        {
            // Generic cards: pick first alive creature
            return State.Creatures.FirstOrDefault(c => !c.IsKnockedOut)?.Id ?? CreatureId.Kindlpup;
        }

        // ── Status tick ───────────────────────────────────────────────────────

        private void TickCreatureStatuses()
        {
            foreach (var c in State.Creatures.Where(x => !x.IsKnockedOut))
            {
                // Burn: deal N dmg, decay -1
                var burn = c.Statuses.FirstOrDefault(s => s.Type == StatusType.Burn);
                if (burn != null)
                {
                    c.CurrentHp -= burn.Stacks;
                    if (c.CurrentHp <= 0)
                    {
                        c.CurrentHp = 0;
                        c.IsKnockedOut = true;
                        Log($"{c.Name} is knocked out by Burn!");
                        SuspendCreatureCards(c.Id);
                    }
                    burn.Stacks--;
                    if (burn.Stacks <= 0) c.Statuses.Remove(burn);
                }

                // Regen: heal N hp, decay -1
                var regen = c.Statuses.FirstOrDefault(s => s.Type == StatusType.Regen);
                if (regen != null)
                {
                    c.CurrentHp = Math.Min(c.MaxHp, c.CurrentHp + regen.Stacks);
                    regen.Stacks--;
                    if (regen.Stacks <= 0) c.Statuses.Remove(regen);
                }
            }
        }

        private void TickEnemyStatuses()
        {
            foreach (var en in State.Enemies.Where(e => e.CurrentHp > 0).ToList())
            {
                // Burn
                var burn = en.Statuses.FirstOrDefault(s => s.Type == StatusType.Burn);
                if (burn != null)
                {
                    ApplyDamageToEnemy(en, burn.Stacks);
                    burn.Stacks--;
                    if (burn.Stacks <= 0) en.Statuses.Remove(burn);
                }
                // Shock stays until detonated — no tick
            }
        }

        // ── Damage helpers ────────────────────────────────────────────────────

        private void ApplyDamageToEnemy(EnemyState enemy, int amount)
        {
            int afterBlock = Math.Max(0, amount - enemy.Block);
            enemy.Block    = Math.Max(0, enemy.Block - amount);
            enemy.CurrentHp -= afterBlock;
            if (enemy.CurrentHp <= 0) enemy.CurrentHp = 0;
        }

        // ── Status helpers ────────────────────────────────────────────────────

        private static void AddStatus(List<StatusStack> statuses, StatusType type, int stacks)
        {
            var existing = statuses.FirstOrDefault(s => s.Type == type);
            if (existing != null) existing.Stacks += stacks;
            else statuses.Add(new StatusStack(type, stacks));
        }

        private static void RemoveStatus(List<StatusStack> statuses, StatusType type) =>
            statuses.RemoveAll(s => s.Type == type);

        private static int GetStatus(List<StatusStack> statuses, StatusType type) =>
            statuses.FirstOrDefault(s => s.Type == type)?.Stacks ?? 0;

        // ── Draw pile ─────────────────────────────────────────────────────────

        private void DrawCardsFromPile(int count)
        {
            for (int i = 0; i < count; i++)
            {
                if (State.DrawPile.Count == 0)
                {
                    if (State.DiscardPile.Count == 0) break;
                    State.DrawPile = State.DiscardPile.ToList();
                    State.DiscardPile.Clear();
                    Shuffle(State.DrawPile);
                }
                var card = State.DrawPile[0];
                State.DrawPile.RemoveAt(0);
                State.Hand.Add(card);
            }
        }

        // ── Victory/defeat check ──────────────────────────────────────────────

        private void CheckEndConditions()
        {
            if (_combatOver) return;

            bool allEnemiesDead = State.Enemies.All(e => e.CurrentHp <= 0);
            bool allCreaturesKO = State.Creatures.All(c => c.IsKnockedOut);

            if (allEnemiesDead)
            {
                _combatOver = true;
                State.Phase = CombatPhase.Victory;
                EmitStateChanged();
                CombatEnded?.Invoke(true);
            }
            else if (allCreaturesKO)
            {
                _combatOver = true;
                State.Phase = CombatPhase.Defeat;
                EmitStateChanged();
                CombatEnded?.Invoke(false);
            }
        }

        // ── KO card suspension ────────────────────────────────────────────────

        private void SuspendCreatureCards(CreatureId id)
        {
            bool IsOwned(CardInstance c)
            {
                var def = CardDB.Singleton.Get(c.DefinitionId);
                return def.Owner == id;
            }

            var fromHand = State.Hand.Where(IsOwned).ToList();
            foreach (var c in fromHand) { State.Hand.Remove(c); State.SuspendedCards.Add(c); }

            var fromDraw = State.DrawPile.Where(IsOwned).ToList();
            foreach (var c in fromDraw) { State.DrawPile.Remove(c); State.SuspendedCards.Add(c); }

            var fromDiscard = State.DiscardPile.Where(IsOwned).ToList();
            foreach (var c in fromDiscard) { State.DiscardPile.Remove(c); State.SuspendedCards.Add(c); }

            Log($"{id}'s signature cards suspended.");
        }

        // ── Utilities ─────────────────────────────────────────────────────────

        private void Shuffle<T>(List<T> list)
        {
            for (int i = list.Count - 1; i > 0; i--)
            {
                int j = _rng.Next(i + 1);
                (list[i], list[j]) = (list[j], list[i]);
            }
        }

        private void Log(string msg) => State.Log.Add(msg);

        private void EmitStateChanged() => StateChanged?.Invoke();
    }
}
