using Godot;

namespace BondBound
{
    public partial class GameOverScreen : Control
    {
        public override void _Ready()
        {
            UI.MakeBgPanel(this);

            var center = new CenterContainer();
            UI.FillRect(center);
            AddChild(center);

            var vbox = UI.MakeVBox(20);
            vbox.Alignment = BoxContainer.AlignmentMode.Center;
            center.AddChild(vbox);

            var title = UI.MakeLabel("💀 Game Over", 48, new Color("#d00000"), true);
            title.HorizontalAlignment = HorizontalAlignment.Center;
            vbox.AddChild(title);

            var msg = UI.MakeLabel("All creatures were knocked out.", 18, UI.TextDim);
            msg.HorizontalAlignment = HorizontalAlignment.Center;
            vbox.AddChild(msg);

            var btn = UI.MakeButton("↩  Main Menu", UI.AccentFire);
            btn.CustomMinimumSize = new Vector2(200, 48);
            btn.Pressed += () => GameState.Singleton.GoToMainMenu();
            vbox.AddChild(btn);
        }
    }
}
