using Godot;

namespace BondBound
{
    public partial class RestScreen : Control
    {
        private bool _bondMode;

        public override void _Ready()
        {
            UI.MakeBgPanel(this);
            BuildUI();
        }

        private void BuildUI()
        {
            foreach (Node child in GetChildren())
                child.QueueFree();

            UI.MakeBgPanel(this);

            var center = new CenterContainer();
            UI.FillRect(center);
            AddChild(center);

            var vbox = UI.MakeVBox(20);
            vbox.CustomMinimumSize = new Vector2(460, 0);
            vbox.Alignment = BoxContainer.AlignmentMode.Center;
            center.AddChild(vbox);

            vbox.AddChild(UI.MakeLabel("🏕️ Rest Site", 32, UI.AccentGold, true));

            if (!_bondMode)
            {
                vbox.AddChild(UI.MakeLabel("Choose one:", 16, UI.TextDim));

                var healBtn = UI.MakeButton("💚 Heal 30% HP", UI.HpGreen);
                healBtn.CustomMinimumSize = new Vector2(220, 50);
                healBtn.Pressed += () => GameState.Singleton.AfterRest(true);
                vbox.AddChild(healBtn);

                var healDesc = UI.MakeLabel("Restore 30% of each creature's max HP.", 13, UI.TextDim);
                healDesc.HorizontalAlignment = HorizontalAlignment.Center;
                vbox.AddChild(healDesc);

                var bondBtn = UI.MakeButton("✨ +5 Bond", new Color("#7b2d8b"));
                bondBtn.CustomMinimumSize = new Vector2(220, 50);
                bondBtn.Pressed += () => { _bondMode = true; BuildUI(); };
                vbox.AddChild(bondBtn);

                var bondDesc = UI.MakeLabel("Grant +5 Bond to a chosen creature.", 13, UI.TextDim);
                bondDesc.HorizontalAlignment = HorizontalAlignment.Center;
                vbox.AddChild(bondDesc);
            }
            else
            {
                vbox.AddChild(UI.MakeLabel("Choose a creature to grant +5 Bond:", 16, UI.TextDim));

                var row = UI.MakeHBox(12);
                row.Alignment = BoxContainer.AlignmentMode.Center;

                foreach (var creature in GameState.Singleton.Creatures)
                {
                    var col = UI.CreatureColor(creature.Id);
                    var btn = UI.MakeButton($"{creature.Emoji} {creature.Name}", col);
                    btn.CustomMinimumSize = new Vector2(140, 50);
                    var cId = creature.Id;
                    btn.Pressed += () => GameState.Singleton.RestGrantBond(cId);
                    row.AddChild(btn);
                }

                vbox.AddChild(row);

                var back = UI.MakeButton("← Back");
                back.Pressed += () => { _bondMode = false; BuildUI(); };
                vbox.AddChild(back);
            }
        }
    }
}
