using Godot;

namespace BondBound
{
    public partial class MainMenuScreen : Control
    {
        public override void _Ready()
        {
            UI.MakeBgPanel(this);

            var center = new CenterContainer();
            UI.FillRect(center);
            AddChild(center);

            var vbox = UI.MakeVBox(24);
            vbox.CustomMinimumSize = new Vector2(400, 0);
            vbox.Alignment = BoxContainer.AlignmentMode.Center;
            center.AddChild(vbox);

            var title = UI.MakeLabel("🔥 BondBound ⚡", 48, UI.AccentFire, true);
            title.HorizontalAlignment = HorizontalAlignment.Center;
            vbox.AddChild(title);

            var sub = UI.MakeLabel("Creature Deckbuilder Roguelike", 18, UI.TextDim);
            sub.HorizontalAlignment = HorizontalAlignment.Center;
            vbox.AddChild(sub);

            var spacer = new Control { CustomMinimumSize = new Vector2(0, 20) };
            vbox.AddChild(spacer);

            var startBtn = UI.MakeButton("▶  New Run", UI.AccentFire);
            startBtn.CustomMinimumSize = new Vector2(220, 52);
            startBtn.Pressed += () => GameState.Singleton.StartNewRun();
            vbox.AddChild(startBtn);

            var creatures = UI.MakeLabel("🔥 Kindlpup  •  🌿 Mosscub  •  ⚡ Sparkwisp", 14, UI.TextDim);
            creatures.HorizontalAlignment = HorizontalAlignment.Center;
            vbox.AddChild(creatures);
        }
    }
}
