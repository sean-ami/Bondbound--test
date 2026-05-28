using Godot;

namespace BondBound
{
    // Shared UI helpers for all screens
    public static class UI
    {
        public static readonly Color BgDark    = new("#1a1a2e");
        public static readonly Color BgPanel   = new("#16213e");
        public static readonly Color BgCard    = new("#0f3460");
        public static readonly Color TextLight  = new("#eaeaea");
        public static readonly Color TextDim    = new("#9090a0");
        public static readonly Color AccentFire = new("#e85d04");
        public static readonly Color AccentGold = new("#ffba08");
        public static readonly Color HpGreen    = new("#40916c");
        public static readonly Color HpRed      = new("#d00000");
        public static readonly Color BlockBlue  = new("#4895ef");

        public static Color CreatureColor(CreatureId id) => id switch
        {
            CreatureId.Kindlpup  => new Color("#e85d04"),
            CreatureId.Mosscub   => new Color("#2d6a4f"),
            CreatureId.Sparkwisp => new Color("#7b2d8b"),
            _                    => new Color("#aaaaaa")
        };

        public static Panel MakePanel(Color bg, int radius = 8)
        {
            var p = new Panel();
            var style = new StyleBoxFlat { BgColor = bg };
            style.SetCornerRadiusAll(radius);
            p.AddThemeStyleboxOverride("panel", style);
            return p;
        }

        public static Label MakeLabel(string text, int size = 14, Color? color = null, bool bold = false)
        {
            var l = new Label { Text = text };
            l.AddThemeFontSizeOverride("font_size", size);
            l.AddThemeColorOverride("font_color", color ?? TextLight);
            if (bold) l.AddThemeFontSizeOverride("font_size", size);
            return l;
        }

        public static Button MakeButton(string text, Color? bg = null)
        {
            var b = new Button { Text = text };
            b.CustomMinimumSize = new Vector2(120, 36);
            if (bg.HasValue)
            {
                var style = new StyleBoxFlat { BgColor = bg.Value };
                style.SetCornerRadiusAll(6);
                b.AddThemeStyleboxOverride("normal", style);
                var hover = new StyleBoxFlat { BgColor = bg.Value.Lightened(0.15f) };
                hover.SetCornerRadiusAll(6);
                b.AddThemeStyleboxOverride("hover", hover);
            }
            return b;
        }

        public static ProgressBar MakeBar(float value, float max, Color fill, int height = 10)
        {
            var bar = new ProgressBar
            {
                MinValue = 0, MaxValue = max, Value = value,
                CustomMinimumSize = new Vector2(0, height),
                ShowPercentage = false
            };
            var fillStyle = new StyleBoxFlat { BgColor = fill };
            var bgStyle   = new StyleBoxFlat { BgColor = new Color("#333355") };
            bar.AddThemeStyleboxOverride("fill", fillStyle);
            bar.AddThemeStyleboxOverride("background", bgStyle);
            return bar;
        }

        public static void FillRect(Control node)
        {
            node.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        }

        public static Panel MakeBgPanel(Control parent)
        {
            var bg = MakePanel(BgDark, 0);
            FillRect(bg);
            parent.AddChild(bg);
            return bg;
        }

        public static VBoxContainer MakeVBox(int separation = 8)
        {
            var v = new VBoxContainer();
            v.AddThemeConstantOverride("separation", separation);
            return v;
        }

        public static HBoxContainer MakeHBox(int separation = 8)
        {
            var h = new HBoxContainer();
            h.AddThemeConstantOverride("separation", separation);
            return h;
        }
    }
}
