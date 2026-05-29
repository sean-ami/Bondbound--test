using Godot;
using System.Collections.Generic;
using System.Linq;

namespace BondBound
{
    public partial class BattleScreen : Control
    {
        private VBoxContainer _root = null!;
        private string? _selectedCardId;

        public override void _Ready()
        {
            UI.MakeBgPanel(this);

            _root = UI.MakeVBox(4);
            _root.SetAnchorsPreset(Control.LayoutPreset.FullRect);
            _root.AddThemeConstantOverride("margin_left", 8);
            _root.AddThemeConstantOverride("margin_right", 8);
            _root.AddThemeConstantOverride("margin_top", 8);
            _root.AddThemeConstantOverride("margin_bottom", 8);
            AddChild(_root);

            CombatManager.Singleton.StateChanged += Rebuild;
            Rebuild();
        }

        public override void _ExitTree()
        {
            CombatManager.Singleton.StateChanged -= Rebuild;
        }

        private void Rebuild()
        {
            foreach (Node child in _root.GetChildren())
                child.QueueFree();

            var state = CombatManager.Singleton.State;

            BuildEnemyRow(state);
            _root.AddChild(new HSeparator());
            BuildCreatureRow(state);
            _root.AddChild(new HSeparator());
            BuildHud(state);
            _root.AddChild(new HSeparator());
            BuildHand(state);
            _root.AddChild(new HSeparator());
            BuildLog(state);

            if (state.Phase == CombatPhase.Victory)
                BuildOverlay("⚔️ Victory!", UI.AccentGold);
            else if (state.Phase == CombatPhase.Defeat)
                BuildOverlay("💀 Defeat", new Color("#cc0000"));
        }

        // ── Enemy row ──────────────────────────────────────────────────────────

        private void BuildEnemyRow(CombatState state)
        {
            var hbox = UI.MakeHBox(12);
            hbox.SizeFlagsVertical = Control.SizeFlags.Expand | Control.SizeFlags.Fill;
            _root.AddChild(hbox);

            // spacer left
            hbox.AddChild(new Control { SizeFlagsHorizontal = Control.SizeFlags.Expand });

            foreach (var enemy in state.Enemies)
            {
                var panel = EnemyPanel(enemy, state);
                hbox.AddChild(panel);
            }

            hbox.AddChild(new Control { SizeFlagsHorizontal = Control.SizeFlags.Expand });
        }

        private Control EnemyPanel(EnemyState enemy, CombatState state)
        {
            bool dead = enemy.CurrentHp <= 0;
            var panel = UI.MakePanel(dead ? new Color("#111122") : UI.BgPanel);
            panel.CustomMinimumSize = new Vector2(160, 150);
            panel.SizeFlagsHorizontal = Control.SizeFlags.ShrinkCenter;

            var vbox = UI.MakeVBox(4);
            vbox.SetAnchorsPreset(Control.LayoutPreset.FullRect);
            vbox.AddThemeConstantOverride("margin_left",  8);
            vbox.AddThemeConstantOverride("margin_right", 8);
            vbox.AddThemeConstantOverride("margin_top",   8);
            vbox.AddThemeConstantOverride("margin_bottom",8);
            panel.AddChild(vbox);

            // Name + emoji
            var nameLabel = UI.MakeLabel($"{enemy.Emoji} {enemy.Name}", 15, dead ? UI.TextDim : UI.TextLight);
            nameLabel.HorizontalAlignment = HorizontalAlignment.Center;
            vbox.AddChild(nameLabel);

            if (dead)
            {
                vbox.AddChild(UI.MakeLabel("Defeated", 12, UI.TextDim));
            }
            else
            {
                // HP bar
                vbox.AddChild(UI.MakeBar(enemy.CurrentHp, enemy.MaxHp, UI.HpRed, 8));
                var hpLabel = UI.MakeLabel($"{enemy.CurrentHp}/{enemy.MaxHp} HP", 11, UI.TextDim);
                hpLabel.HorizontalAlignment = HorizontalAlignment.Center;
                vbox.AddChild(hpLabel);

                // Block
                if (enemy.Block > 0)
                {
                    var blk = UI.MakeLabel($"🛡 {enemy.Block}", 12, UI.BlockBlue);
                    blk.HorizontalAlignment = HorizontalAlignment.Center;
                    vbox.AddChild(blk);
                }

                // Intent
                var intent = UI.MakeLabel(enemy.Intent.Label, 12, UI.AccentGold);
                intent.HorizontalAlignment = HorizontalAlignment.Center;
                intent.AutowrapMode = TextServer.AutowrapMode.Word;
                vbox.AddChild(intent);

                // Statuses
                if (enemy.Statuses.Count > 0)
                    vbox.AddChild(StatusRow(enemy.Statuses));

                // Click to target
                if (_selectedCardId != null && IsAttackCard(_selectedCardId))
                {
                    var highlightStyle = new StyleBoxFlat { BgColor = new Color("#1a3a1a") };
                    highlightStyle.SetBorderWidthAll(2);
                    highlightStyle.BorderColor = new Color("#00ff66");
                    highlightStyle.SetCornerRadiusAll(8);
                    panel.AddThemeStyleboxOverride("panel", highlightStyle);

                    var eId = enemy.InstanceId;
                    var cardId = _selectedCardId!;
                    panel.GuiInput += (evt) =>
                    {
                        if (evt is InputEventMouseButton mb && mb.ButtonIndex == MouseButton.Left && mb.Pressed)
                        {
                            CombatManager.Singleton.PlayCard(cardId, eId);
                            _selectedCardId = null;
                        }
                    };
                    panel.MouseDefaultCursorShape = Control.CursorShape.PointingHand;
                }
            }

            return panel;
        }

        // ── Creature row ───────────────────────────────────────────────────────

        private void BuildCreatureRow(CombatState state)
        {
            var hbox = UI.MakeHBox(12);
            hbox.SizeFlagsVertical = Control.SizeFlags.Expand | Control.SizeFlags.Fill;
            _root.AddChild(hbox);

            hbox.AddChild(new Control { SizeFlagsHorizontal = Control.SizeFlags.Expand });

            foreach (var c in state.Creatures)
                hbox.AddChild(CreaturePanel(c));

            hbox.AddChild(new Control { SizeFlagsHorizontal = Control.SizeFlags.Expand });
        }

        private Control CreaturePanel(CreatureStats c)
        {
            var col = UI.CreatureColor(c.Id);
            var bgColor = c.IsKnockedOut ? new Color("#111122") : UI.BgPanel;
            var panel = UI.MakePanel(bgColor);
            panel.CustomMinimumSize = new Vector2(180, 130);

            // Accent top border
            var border = new StyleBoxFlat { BgColor = bgColor };
            border.BorderColor = col;
            border.SetBorderWidthAll(0);
            border.BorderWidthTop = 3;
            border.SetCornerRadiusAll(8);
            panel.AddThemeStyleboxOverride("panel", border);

            var vbox = UI.MakeVBox(4);
            vbox.SetAnchorsPreset(Control.LayoutPreset.FullRect);
            vbox.AddThemeConstantOverride("margin_left",  8);
            vbox.AddThemeConstantOverride("margin_right", 8);
            vbox.AddThemeConstantOverride("margin_top",   8);
            vbox.AddThemeConstantOverride("margin_bottom",8);
            panel.AddChild(vbox);

            // Name
            var nameRow = UI.MakeHBox(6);
            nameRow.AddChild(UI.MakeLabel(c.Emoji, 18));
            nameRow.AddChild(UI.MakeLabel(c.Name, 14, col));
            if (c.IsKnockedOut)
                nameRow.AddChild(UI.MakeLabel("KO", 12, new Color("#cc0000")));
            vbox.AddChild(nameRow);

            // HP bar + text
            vbox.AddChild(UI.MakeBar(c.CurrentHp, c.MaxHp, UI.HpGreen, 8));
            var hpLabel = UI.MakeLabel($"HP {c.CurrentHp}/{c.MaxHp}", 11, UI.TextDim);
            vbox.AddChild(hpLabel);

            // Block + Bond meter
            var bottomRow = UI.MakeHBox(8);
            if (c.Block > 0)
                bottomRow.AddChild(UI.MakeLabel($"🛡 {c.Block}", 12, UI.BlockBlue));

            int bondThreshold = c.Stage == EvolutionStage.Stage0 ? 70 : 135;
            var bondBar = UI.MakeBar(c.BondAccumulated, bondThreshold, col, 6);
            bondBar.SizeFlagsHorizontal = Control.SizeFlags.Expand | Control.SizeFlags.Fill;
            bondBar.TooltipText = $"Bond {c.BondAccumulated}/{bondThreshold}";
            bottomRow.AddChild(bondBar);
            vbox.AddChild(bottomRow);

            // Statuses
            if (c.Statuses.Count > 0)
                vbox.AddChild(StatusRow(c.Statuses));

            return panel;
        }

        // ── HUD row ────────────────────────────────────────────────────────────

        private void BuildHud(CombatState state)
        {
            var hbox = UI.MakeHBox(12);
            hbox.CustomMinimumSize = new Vector2(0, 48);
            _root.AddChild(hbox);

            // Energy pips
            var energyRow = UI.MakeHBox(4);
            for (int i = 0; i < state.MaxEnergy; i++)
            {
                var pip = UI.MakeLabel(i < state.Energy ? "⬡" : "⬢", 20,
                    i < state.Energy ? UI.AccentGold : UI.TextDim);
                energyRow.AddChild(pip);
            }
            hbox.AddChild(energyRow);

            hbox.AddChild(UI.MakeLabel($"Energy: {state.Energy}/{state.MaxEnergy}", 14));

            // Combo counter
            string comboText = $"Cards: {state.CardsPlayedThisTurn}";
            Color comboColor = UI.TextDim;
            if (state.ComboActive)
            {
                comboText += " ⚡ COMBO";
                comboColor = UI.AccentGold;
            }
            hbox.AddChild(UI.MakeLabel(comboText, 13, comboColor));

            hbox.AddChild(new Control { SizeFlagsHorizontal = Control.SizeFlags.Expand });

            // Deck / discard
            hbox.AddChild(UI.MakeLabel($"Draw: {state.DrawPile.Count}", 13, UI.TextDim));
            hbox.AddChild(UI.MakeLabel($"Disc: {state.DiscardPile.Count}", 13, UI.TextDim));

            hbox.AddChild(new Control { SizeFlagsHorizontal = Control.SizeFlags.Expand });

            // Turn label
            hbox.AddChild(UI.MakeLabel($"Turn {state.Turn}", 13, UI.TextDim));

            // End turn button
            var endTurnBtn = UI.MakeButton("End Turn ▶", state.Phase == CombatPhase.PlayerTurn ? UI.AccentFire : UI.TextDim);
            endTurnBtn.CustomMinimumSize = new Vector2(110, 40);
            endTurnBtn.Disabled = state.Phase != CombatPhase.PlayerTurn;
            endTurnBtn.Pressed += () =>
            {
                _selectedCardId = null;
                CombatManager.Singleton.EndTurn();
            };
            hbox.AddChild(endTurnBtn);
        }

        // ── Hand ───────────────────────────────────────────────────────────────

        private void BuildHand(CombatState state)
        {
            var scroll = new ScrollContainer();
            scroll.SizeFlagsVertical = Control.SizeFlags.Expand | Control.SizeFlags.Fill;
            _root.AddChild(scroll);

            var hbox = UI.MakeHBox(8);
            hbox.SizeFlagsVertical = Control.SizeFlags.ShrinkCenter;
            hbox.Alignment = BoxContainer.AlignmentMode.Center;
            scroll.AddChild(hbox);

            foreach (var card in state.Hand)
            {
                var def = CardDB.Singleton.Get(card.DefinitionId);
                hbox.AddChild(CardView(card, def, state));
            }
        }

        private Control CardView(CardInstance card, CardDefinition def, CombatState state)
        {
            bool isSelected = _selectedCardId == card.InstanceId;
            bool canPlay    = state.Phase == CombatPhase.PlayerTurn && state.Energy >= def.EnergyCost;

            var cardColor = def.Owner.HasValue ? UI.CreatureColor(def.Owner.Value) : UI.BgCard;
            var bgColor   = isSelected ? cardColor.Lightened(0.3f) : UI.BgCard;
            var panel     = UI.MakePanel(bgColor);
            panel.CustomMinimumSize = new Vector2(110, 150);

            if (isSelected)
            {
                var selStyle = new StyleBoxFlat { BgColor = bgColor };
                selStyle.SetBorderWidthAll(2);
                selStyle.BorderColor = UI.AccentGold;
                selStyle.SetCornerRadiusAll(8);
                panel.AddThemeStyleboxOverride("panel", selStyle);
            }

            var vbox = UI.MakeVBox(4);
            vbox.SetAnchorsPreset(Control.LayoutPreset.FullRect);
            vbox.AddThemeConstantOverride("margin_left",  6);
            vbox.AddThemeConstantOverride("margin_right", 6);
            vbox.AddThemeConstantOverride("margin_top",   6);
            vbox.AddThemeConstantOverride("margin_bottom",6);
            panel.AddChild(vbox);

            // Cost pip
            var costRow = UI.MakeHBox(4);
            var costPip = UI.MakePanel(canPlay ? UI.AccentGold : new Color("#555555"), 12);
            costPip.CustomMinimumSize = new Vector2(22, 22);
            var costLabel = UI.MakeLabel(def.EnergyCost.ToString(), 13, UI.BgDark);
            costLabel.SetAnchorsPreset(Control.LayoutPreset.FullRect);
            costLabel.HorizontalAlignment = HorizontalAlignment.Center;
            costLabel.VerticalAlignment   = VerticalAlignment.Center;
            costPip.AddChild(costLabel);
            costRow.AddChild(costPip);

            if (def.Owner.HasValue)
                costRow.AddChild(UI.MakeLabel(def.Owner.Value.ToString()[0].ToString(), 12, cardColor));
            vbox.AddChild(costRow);

            // Card name
            var nameLabel = UI.MakeLabel(def.Name, 12, UI.TextLight);
            nameLabel.AutowrapMode = TextServer.AutowrapMode.Word;
            nameLabel.HorizontalAlignment = HorizontalAlignment.Center;
            vbox.AddChild(nameLabel);

            // Description
            var descLabel = UI.MakeLabel(def.Description, 10, UI.TextDim);
            descLabel.AutowrapMode = TextServer.AutowrapMode.Word;
            descLabel.SizeFlagsVertical = Control.SizeFlags.Expand | Control.SizeFlags.Fill;
            vbox.AddChild(descLabel);

            // Rarity dot
            var rarityColor = def.Rarity switch
            {
                Rarity.Common    => new Color("#aaaaaa"),
                Rarity.Uncommon  => new Color("#4da6ff"),
                Rarity.Rare      => new Color("#cc44ff"),
                Rarity.Signature => UI.AccentGold,
                _                => UI.TextDim
            };
            var rarity = UI.MakeLabel("●", 10, rarityColor);
            rarity.HorizontalAlignment = HorizontalAlignment.Center;
            vbox.AddChild(rarity);

            if (!canPlay)
            {
                panel.Modulate = new Color(1, 1, 1, 0.5f);
            }
            else
            {
                panel.MouseDefaultCursorShape = Control.CursorShape.PointingHand;
                var cardInst = card;
                panel.GuiInput += (evt) =>
                {
                    if (evt is InputEventMouseButton mb && mb.ButtonIndex == MouseButton.Left && mb.Pressed)
                        OnCardClick(cardInst, def);
                };
            }

            return panel;
        }

        private void OnCardClick(CardInstance card, CardDefinition def)
        {
            if (def.Tags.Contains(CardTag.Attack))
            {
                // Need a target — select card and wait for enemy click
                _selectedCardId = _selectedCardId == card.InstanceId ? null : card.InstanceId;
                Rebuild();
            }
            else
            {
                // No target needed
                _selectedCardId = null;
                CombatManager.Singleton.PlayCard(card.InstanceId, null);
            }
        }

        // ── Helpers ───────────────────────────────────────────────────────────

        private static HBoxContainer StatusRow(System.Collections.Generic.List<StatusStack> statuses)
        {
            var row = UI.MakeHBox(4);
            foreach (var s in statuses)
            {
                string emoji = s.Type switch
                {
                    StatusType.Burn       => "🔥",
                    StatusType.Shock      => "⚡",
                    StatusType.Thorns     => "🌵",
                    StatusType.Regen      => "💚",
                    StatusType.Weak       => "💀",
                    StatusType.Vulnerable => "🎯",
                    _                     => "?"
                };
                string tooltip = s.Type switch
                {
                    StatusType.Burn       => $"Burn: deals {s.Stacks} damage at the start of your turn, then decreases by 1",
                    StatusType.Shock      => $"Shock: held until detonated by Wraith Pulse (3 dmg/stack)",
                    StatusType.Thorns     => $"Thorns: reflects {s.Stacks} damage to attackers on each hit",
                    StatusType.Regen      => $"Regen: restores {s.Stacks} HP at the start of your turn, then decreases by 1",
                    StatusType.Weak       => "Weak: this unit deals 25% less damage",
                    StatusType.Vulnerable => "Vulnerable: this unit takes 50% more damage",
                    _                     => ""
                };
                var label = UI.MakeLabel($"{emoji}{s.Stacks}", 11, UI.TextDim);
                label.TooltipText = tooltip;
                row.AddChild(label);
            }
            return row;
        }

        private static bool IsAttackCard(string instanceId)
        {
            // Look up definition by instance ID from the current hand
            var state = CombatManager.Singleton.State;
            var card = state.Hand.FirstOrDefault(c => c.InstanceId == instanceId);
            if (card == null) return false;
            var def = CardDB.Singleton.Get(card.DefinitionId);
            return def.Tags.Contains(CardTag.Attack);
        }

        private void BuildLog(CombatState state)
        {
            var logBox = UI.MakeVBox(2);
            logBox.CustomMinimumSize = new Vector2(0, 60);
            _root.AddChild(logBox);

            var recent = state.Log.TakeLast(4).ToList();
            foreach (var entry in recent)
            {
                var line = UI.MakeLabel(entry, 10, UI.TextDim);
                line.AutowrapMode = TextServer.AutowrapMode.Word;
                logBox.AddChild(line);
            }
        }

        private void BuildOverlay(string text, Color color)
        {
            var overlay = new Panel();
            UI.FillRect(overlay);
            var style = new StyleBoxFlat { BgColor = new Color(0, 0, 0, 0.7f) };
            overlay.AddThemeStyleboxOverride("panel", style);
            AddChild(overlay);

            var center = new CenterContainer();
            UI.FillRect(center);
            overlay.AddChild(center);

            var label = UI.MakeLabel(text, 56, color, true);
            label.HorizontalAlignment = HorizontalAlignment.Center;
            center.AddChild(label);
        }
    }
}
