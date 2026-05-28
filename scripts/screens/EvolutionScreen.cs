using Godot;

namespace BondBound
{
    public partial class EvolutionScreen : Control
    {
        public override void _Ready()
        {
            UI.MakeBgPanel(this);

            var gs = GameState.Singleton;
            var creatureId = gs.JustEvolvedCreature ?? CreatureId.Kindlpup;
            var creature = null as CreatureStats;
            foreach (var c in gs.Creatures)
                if (c.Id == creatureId) creature = c;

            var center = new CenterContainer();
            UI.FillRect(center);
            AddChild(center);

            var vbox = UI.MakeVBox(24);
            vbox.CustomMinimumSize = new Vector2(500, 0);
            vbox.Alignment = BoxContainer.AlignmentMode.Center;
            center.AddChild(vbox);

            // Burst label
            var burst = UI.MakeLabel("✨", 72);
            burst.HorizontalAlignment = HorizontalAlignment.Center;
            vbox.AddChild(burst);

            var evoTitle = UI.MakeLabel("Evolution!", 40, UI.AccentGold, true);
            evoTitle.HorizontalAlignment = HorizontalAlignment.Center;
            vbox.AddChild(evoTitle);

            if (creature != null)
            {
                var col = UI.CreatureColor(creature.Id);

                var nameLabel = UI.MakeLabel($"{creature.Emoji} {creature.Name}", 32, col);
                nameLabel.HorizontalAlignment = HorizontalAlignment.Center;
                vbox.AddChild(nameLabel);

                var stageLabel = UI.MakeLabel($"Stage {(int)creature.Stage} achieved!", 18, UI.TextDim);
                stageLabel.HorizontalAlignment = HorizontalAlignment.Center;
                vbox.AddChild(stageLabel);

                // Show new signature cards
                var newCards = CardDB.Singleton.GetSignatureCards(creature.Id, creature.Stage);
                if (newCards.Count > 0)
                {
                    vbox.AddChild(UI.MakeLabel("Upgraded signature cards:", 14, UI.TextDim));
                    var cardRow = UI.MakeHBox(8);
                    cardRow.Alignment = BoxContainer.AlignmentMode.Center;
                    foreach (var def in newCards)
                    {
                        var cp = UI.MakePanel(UI.BgCard);
                        cp.CustomMinimumSize = new Vector2(130, 80);
                        var cv = UI.MakeVBox(4);
                        cv.SetAnchorsPreset(Control.LayoutPreset.FullRect);
                        cv.AddThemeConstantOverride("margin_left", 8);
                        cv.AddThemeConstantOverride("margin_right", 8);
                        cv.AddThemeConstantOverride("margin_top", 8);
                        cv.AddThemeConstantOverride("margin_bottom", 8);
                        cp.AddChild(cv);
                        cv.AddChild(UI.MakeLabel(def.Name, 13, col));
                        cv.AddChild(UI.MakeLabel(def.Description, 10, UI.TextDim));
                        cardRow.AddChild(cp);
                    }
                    vbox.AddChild(cardRow);
                }
            }

            var continueBtn = UI.MakeButton("Continue →", UI.AccentFire);
            continueBtn.CustomMinimumSize = new Vector2(180, 48);
            continueBtn.Pressed += () => GameState.Singleton.ConfirmEvolution();
            vbox.AddChild(continueBtn);
        }
    }
}
