using Godot;

namespace BondBound
{
    public partial class Main : Control
    {
        private Control? _current;

        public override void _Ready()
        {
            SetAnchorsPreset(Control.LayoutPreset.FullRect);
            GameState.Singleton.PhaseChanged += OnPhaseChanged;
            ShowScreen(new MainMenuScreen());
        }

        private void OnPhaseChanged(GamePhase phase)
        {
            Control screen = phase switch
            {
                GamePhase.MainMenu    => new MainMenuScreen(),
                GamePhase.Map         => new MapScreen(),
                GamePhase.Combat      => new BattleScreen(),
                GamePhase.BondSummary => new BondScreen(),
                GamePhase.Evolution   => new EvolutionScreen(),
                GamePhase.Draft       => new DraftScreen(),
                GamePhase.Shop        => new ShopScreen(),
                GamePhase.Rest        => new RestScreen(),
                GamePhase.Event       => new EventScreen(),
                GamePhase.Victory     => new VictoryScreen(),
                GamePhase.GameOver    => new GameOverScreen(),
                _                     => new MainMenuScreen()
            };
            ShowScreen(screen);
        }

        private void ShowScreen(Control screen)
        {
            _current?.QueueFree();
            screen.SetAnchorsPreset(Control.LayoutPreset.FullRect);
            AddChild(screen);
            _current = screen;
        }
    }
}
