using Godot;
using System.Collections.Generic;
using System.Linq;

namespace BondBound
{
    public partial class MapScreen : Control
    {
        private MapCanvas? _canvas;

        public override void _Ready()
        {
            UI.MakeBgPanel(this);

            // Top bar
            var topBar = new Panel();
            topBar.CustomMinimumSize = new Vector2(0, 48);
            topBar.SetAnchorsAndOffsetsPreset(Control.LayoutPreset.TopWide);
            AddChild(topBar);
            var tbStyle = new StyleBoxFlat { BgColor = UI.BgPanel };
            topBar.AddThemeStyleboxOverride("panel", tbStyle);

            var topHbox = UI.MakeHBox(16);
            topHbox.SetAnchorsPreset(Control.LayoutPreset.FullRect);
            topHbox.AddThemeConstantOverride("margin_left", 16);
            topBar.AddChild(topHbox);

            var gs = GameState.Singleton;
            topHbox.AddChild(UI.MakeLabel($"Act {gs.Map.CurrentAct}  —  BondBound", 18, UI.AccentGold));
            topHbox.AddChild(new Control { SizeFlagsHorizontal = Control.SizeFlags.Expand });
            topHbox.AddChild(UI.MakeLabel($"💰 {gs.Gold}", 16));
            foreach (var c in gs.Creatures)
                topHbox.AddChild(UI.MakeLabel($"{c.Emoji} {c.CurrentHp}/{c.MaxHp}", 14, UI.CreatureColor(c.Id)));

            // Map area
            var scroll = new ScrollContainer();
            scroll.SetAnchorsAndOffsetsPreset(Control.LayoutPreset.FullRect);
            scroll.OffsetTop = 48;
            AddChild(scroll);

            _canvas = new MapCanvas(gs.Map, OnNodeClick);
            _canvas.CustomMinimumSize = new Vector2(700, 660);
            scroll.AddChild(_canvas);
        }

        private void OnNodeClick(string nodeId) => GameState.Singleton.EnterNode(nodeId);

        // ── Inner canvas ──────────────────────────────────────────────────────

        private partial class MapCanvas : Control
        {
            private readonly MapState _map;
            private readonly System.Action<string> _onClick;
            private readonly Dictionary<string, Vector2> _pos = new();
            private readonly List<MapNode> _allNodes = new();

            public MapCanvas(MapState map, System.Action<string> onClick)
            {
                _map = map;
                _onClick = onClick;
                ClipChildren = ClipChildrenMode.Only;
            }

            public override void _Ready()
            {
                int actIdx = _map.CurrentAct - 1;
                if (actIdx < 0 || actIdx >= _map.Acts.Count) return;

                var actNodes = _map.Acts[actIdx];
                _allNodes.AddRange(actNodes);

                foreach (var node in actNodes)
                {
                    var p = NodePos(node.Row, node.Col);
                    _pos[node.Id] = p;

                    bool available = _map.AvailableNodeIds.Contains(node.Id);
                    bool cleared   = node.Cleared;
                    bool isCurrent = node.Id == _map.CurrentNodeId;

                    var btn = new Button
                    {
                        Text = NodeEmoji(node.Type),
                        TooltipText = node.Type.ToString(),
                        CustomMinimumSize = new Vector2(48, 48)
                    };
                    btn.Position = p - new Vector2(24, 24);

                    Color bg = isCurrent  ? UI.AccentGold
                             : available  ? new Color("#2a5298")
                             : cleared    ? new Color("#1a3030")
                                          : new Color("#111122");
                    var style = new StyleBoxFlat { BgColor = bg };
                    style.SetCornerRadiusAll(24);
                    btn.AddThemeStyleboxOverride("normal", style);

                    if (available && !isCurrent)
                    {
                        var hover = new StyleBoxFlat { BgColor = bg.Lightened(0.2f) };
                        hover.SetCornerRadiusAll(24);
                        btn.AddThemeStyleboxOverride("hover", hover);
                        var nodeId = node.Id;
                        btn.Pressed += () => _onClick(nodeId);
                    }
                    else
                    {
                        btn.Disabled = true;
                    }

                    AddChild(btn);
                }

                QueueRedraw();
            }

            public override void _Draw()
            {
                var lineColor = new Color(0.2f, 0.25f, 0.4f, 0.8f);
                foreach (var node in _allNodes)
                {
                    if (!_pos.TryGetValue(node.Id, out var from)) continue;
                    foreach (var connId in node.Connections)
                    {
                        if (!_pos.TryGetValue(connId, out var to)) continue;
                        DrawLine(from, to, lineColor, 2f);
                    }
                }
            }

            private static Vector2 NodePos(int row, int col) =>
                new(80 + col * 270, 600 - row * 58);

            private static string NodeEmoji(NodeType t) => t switch
            {
                NodeType.Battle => "⚔️",
                NodeType.Elite  => "💀",
                NodeType.Shop   => "🛒",
                NodeType.Rest   => "🏕️",
                NodeType.Event  => "❓",
                NodeType.Boss   => "👑",
                _               => "?"
            };
        }
    }
}
