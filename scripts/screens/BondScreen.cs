using Godot;
using System;
using System.Linq;

namespace BondBound
{
    public partial class BondScreen : Control
    {
        private VBoxContainer _vbox = null!;

        public override void _Ready()
        {
            UI.MakeBgPanel(this);

            var center = new CenterContainer();
            UI.FillRect(center);
            AddChild(center);

            _vbox = UI.MakeVBox(16);
            _vbox.CustomMinimumSize = new Vector2(520, 0);
            _vbox.Alignment = BoxContainer.AlignmentMode.Center;
            center.AddChild(_vbox);

            GameState.Singleton.StateUpdated += BuildUI;
            BuildUI();
        }

        public override void _ExitTree()
        {
            GameState.Singleton.StateUpdated -= BuildUI;
        }

        private void BuildUI()
        {
            foreach (Node child in _vbox.GetChildren())
                child.QueueFree();

            var gs = GameState.Singleton;
            var result = gs.LastBattleResult;

            // Title
            var title = UI.MakeLabel("🏅 Bond Summary", 32, UI.AccentGold, true);
            title.HorizontalAlignment = HorizontalAlignment.Center;
            _vbox.AddChild(title);

            if (result != null)
            {
                // Breakdown panel
                var breakdown = UI.MakePanel(UI.BgPanel);
                breakdown.CustomMinimumSize = new Vector2(380, 0);
                var bv = UI.MakeVBox(6);
                bv.SetAnchorsPreset(Control.LayoutPreset.FullRect);
                bv.AddThemeConstantOverride("margin_left",   12);
                bv.AddThemeConstantOverride("margin_right",  12);
                bv.AddThemeConstantOverride("margin_top",    12);
                bv.AddThemeConstantOverride("margin_bottom", 12);
                breakdown.AddChild(bv);

                bv.AddChild(BondRow("Base", result.BondBase));
                foreach (var bonus in result.BondBonuses)
                    bv.AddChild(BondRow(bonus.Label, bonus.Amount));
                bv.AddChild(new HSeparator());
                var totalLabel = UI.MakeLabel($"Total Bond: +{result.BondTotal}", 18, UI.AccentGold);
                totalLabel.HorizontalAlignment = HorizontalAlignment.Center;
                bv.AddChild(totalLabel);

                // Gold section
                bv.AddChild(new HSeparator());
                var goldRow = UI.MakeHBox(8);
                goldRow.AddChild(UI.MakeLabel("💰 Gold Earned", 13));
                goldRow.AddChild(new Control { SizeFlagsHorizontal = Control.SizeFlags.Expand });
                goldRow.AddChild(UI.MakeLabel($"+{result.GoldEarned}", 13, UI.AccentGold));
                bv.AddChild(goldRow);
                var breakdownLabel = UI.MakeLabel(result.GoldBreakdown, 11, UI.TextDim);
                breakdownLabel.HorizontalAlignment = HorizontalAlignment.Center;
                bv.AddChild(breakdownLabel);

                _vbox.AddChild(breakdown);

                // Revive Shard section — only if we have a shard AND a KO'd creature
                bool hasShard = gs.Items.Any(i => i.DefinitionId == "revive_shard");
                bool anyKO = gs.Creatures.Any(c => c.IsKnockedOut);
                if (hasShard && anyKO)
                {
                    _vbox.AddChild(UI.MakeLabel("💎 Use Revive Shard:", 15, new Color("#aaaaff")));

                    var reviveRow = UI.MakeHBox(10);
                    reviveRow.Alignment = BoxContainer.AlignmentMode.Center;

                    foreach (var creature in gs.Creatures.Where(c => c.IsKnockedOut))
                    {
                        var col = UI.CreatureColor(creature.Id);
                        var cId = creature.Id;
                        var btn = UI.MakeButton($"Revive {creature.Emoji} {creature.Name}", col);
                        btn.CustomMinimumSize = new Vector2(160, 36);
                        btn.Pressed += () => GameState.Singleton.UseReviveShard(cId);
                        reviveRow.AddChild(btn);
                    }

                    _vbox.AddChild(reviveRow);
                }
            }

            // Creature selector
            _vbox.AddChild(UI.MakeLabel("Allocate Bond to:", 16, UI.TextDim));

            var creatures = UI.MakeHBox(12);
            creatures.Alignment = BoxContainer.AlignmentMode.Center;
            _vbox.AddChild(creatures);

            foreach (var creature in gs.Creatures)
            {
                var col = UI.CreatureColor(creature.Id);
                var panel = UI.MakePanel(UI.BgPanel);
                panel.CustomMinimumSize = new Vector2(148, 128);

                var cv = UI.MakeVBox(6);
                cv.SetAnchorsPreset(Control.LayoutPreset.FullRect);
                cv.AddThemeConstantOverride("margin_left",   10);
                cv.AddThemeConstantOverride("margin_right",  10);
                cv.AddThemeConstantOverride("margin_top",    10);
                cv.AddThemeConstantOverride("margin_bottom", 10);
                panel.AddChild(cv);

                cv.AddChild(UI.MakeLabel($"{creature.Emoji} {creature.Name}", 14, col));

                int threshold = creature.Stage == EvolutionStage.Stage0 ? 70 : 135;
                int earned = result?.BondTotal ?? 0;
                int newTotal = creature.BondAccumulated + earned;

                cv.AddChild(UI.MakeLabel($"Bond: {creature.BondAccumulated} → {newTotal}", 11, UI.TextDim));
                cv.AddChild(UI.MakeBar(Math.Min(newTotal, threshold), threshold, col, 8));

                if (newTotal >= threshold && creature.Stage != EvolutionStage.Stage2)
                {
                    var evolveLabel = UI.MakeLabel("✨ Evolves!", 11, UI.AccentGold);
                    evolveLabel.HorizontalAlignment = HorizontalAlignment.Center;
                    cv.AddChild(evolveLabel);
                }

                if (creature.IsKnockedOut)
                {
                    var koLabel = UI.MakeLabel("💀 KO'd", 11, new Color("#cc4444"));
                    koLabel.HorizontalAlignment = HorizontalAlignment.Center;
                    cv.AddChild(koLabel);
                }

                var cId = creature.Id;
                var btn = UI.MakeButton("Choose", col);
                btn.CustomMinimumSize = new Vector2(120, 32);
                btn.Pressed += () => GameState.Singleton.AllocateBond(cId);
                cv.AddChild(btn);

                creatures.AddChild(panel);
            }
        }

        private static HBoxContainer BondRow(string label, int amount)
        {
            var h = UI.MakeHBox(8);
            h.AddChild(UI.MakeLabel(label, 13));
            h.AddChild(new Control { SizeFlagsHorizontal = Control.SizeFlags.Expand });
            h.AddChild(UI.MakeLabel($"+{amount}", 13, UI.AccentGold));
            return h;
        }
    }
}
