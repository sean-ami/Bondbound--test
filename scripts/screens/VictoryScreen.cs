using Godot;

namespace BondBound
{
    public partial class VictoryScreen : Control
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

            var title = UI.MakeLabel("🏆 Victory!", 52, UI.AccentGold, true);
            title.HorizontalAlignment = HorizontalAlignment.Center;
            vbox.AddChild(title);

            var msg = UI.MakeLabel("You defeated the Void Architect!\nThe bond between you and your creatures is unbreakable.", 18, UI.TextDim);
            msg.HorizontalAlignment = HorizontalAlignment.Center;
            msg.AutowrapMode = TextServer.AutowrapMode.Word;
            vbox.AddChild(msg);

            var btn = UI.MakeButton("↩  Play Again", UI.AccentFire);
            btn.CustomMinimumSize = new Vector2(200, 48);
            btn.Pressed += () => GameState.Singleton.StartNewRun();
            vbox.AddChild(btn);

            var menu = UI.MakeButton("Main Menu");
            menu.CustomMinimumSize = new Vector2(200, 40);
            menu.Pressed += () => GameState.Singleton.GoToMainMenu();
            vbox.AddChild(menu);
        }
    }
}
