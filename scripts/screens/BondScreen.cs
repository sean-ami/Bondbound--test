using Godot;
using System;
using System.Linq;

namespace BondBound
{
    public partial class BondScreen : Control
    {
        public override void _Ready()
        {
            UI.MakeBgPanel(this);

            var gs = GameState.Singleton;
            var result = gs.LastBattleResult;

            var center = new CenterContainer();
            UI.FillRect(center);
            AddChild(center);

            var vbox = UI.MakeVBox(16);
            vbox.CustomMinimumSize = new Vector2(500, 0);
            vbox.Alignment = BoxContainer.AlignmentMode.Center;
            center.AddChild(vbox);

            // Title
            var title = UI.MakeLabel("🏅 Bond Summary", 32, UI.AccentGold, true);
            title.HorizontalAlignment = HorizontalAlignment.Center;
            vbox.AddChild(title);

            if (result != null)
            {
                // Breakdown
                var breakdown = UI.MakePanel(UI.BgPanel);
                breakdown.CustomMinimumSize = new Vector2(360, 0);
                var bv = UI.MakeVBox(6);
                bv.SetAnchorsPreset(Control.LayoutPreset.FullRect);
                bv.AddThemeConstantOverride("margin_left",  12);
                bv.AddThemeConstantOverride("margin_right", 12);
                bv.AddThemeConstantOverride("margin_top",   12);
                bv.AddThemeConstantOverride("margin_bottom",12);
                breakdown.AddChild(bv);

                bv.AddChild(BondRow("Base", result.BondBase));
                foreach (var bonus in result.BondBonuses)
                    bv.AddChild(BondRow(bonus.Label, bonus.Amount));
                bv.AddChild(new HSeparator());
                var total = UI.MakeLabel($"Total Bond: +{result.BondTotal}", 18, UI.AccentGold);
                total.HorizontalAlignment = HorizontalAlignment.Center;
                bv.AddChild(total);

                vbox.AddChild(breakdown);
            }

            // Creature selector
            vbox.AddChild(UI.MakeLabel("Allocate Bond to:", 16, UI.TextDim));

            var creatures = UI.MakeHBox(12);
            creatures.Alignment = BoxContainer.AlignmentMode.Center;
            vbox.AddChild(creatures);

            foreach (var creature in gs.Creatures)
            {
                var col = UI.CreatureColor(creature.Id);
                var panel = UI.MakePanel(UI.BgPanel);
                panel.CustomMinimumSize = new Vector2(140, 120);

                var cv = UI.MakeVBox(6);
                cv.SetAnchorsPreset(Control.LayoutPreset.FullRect);
                cv.AddThemeConstantOverride("margin_left",  10);
                cv.AddThemeConstantOverride("margin_right", 10);
                cv.AddThemeConstantOverride("margin_top",   10);
                cv.AddThemeConstantOverride("margin_bottom",10);
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

                var cId = creature.Id;
                var btn = UI.MakeButton("Choose", col);
                btn.CustomMinimumSize = new Vector2(110, 32);
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
