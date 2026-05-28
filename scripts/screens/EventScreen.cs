using Godot;
using System;
using System.Collections.Generic;

namespace BondBound
{
    public partial class EventScreen : Control
    {
        private static readonly Random _rng = new();

        private record EventData(string Title, string Body, List<EventChoice> Choices);
        private record EventChoice(string Label, Action OnChoose);

        public override void _Ready()
        {
            UI.MakeBgPanel(this);

            var gs = GameState.Singleton;
            var evt = PickEvent(gs);

            var center = new CenterContainer();
            UI.FillRect(center);
            AddChild(center);

            var vbox = UI.MakeVBox(20);
            vbox.CustomMinimumSize = new Vector2(500, 0);
            vbox.Alignment = BoxContainer.AlignmentMode.Center;
            center.AddChild(vbox);

            var title = UI.MakeLabel($"❓ {evt.Title}", 28, UI.AccentGold, true);
            title.HorizontalAlignment = HorizontalAlignment.Center;
            vbox.AddChild(title);

            var body = UI.MakeLabel(evt.Body, 15, UI.TextLight);
            body.HorizontalAlignment = HorizontalAlignment.Center;
            body.AutowrapMode = TextServer.AutowrapMode.Word;
            vbox.AddChild(body);

            foreach (var choice in evt.Choices)
            {
                var btn = UI.MakeButton(choice.Label, UI.AccentFire);
                btn.CustomMinimumSize = new Vector2(300, 44);
                var action = choice.OnChoose;
                btn.Pressed += () =>
                {
                    action();
                    gs.AfterEvent();
                };
                vbox.AddChild(btn);
            }
        }

        private static EventData PickEvent(GameState gs)
        {
            var events = new List<EventData>
            {
                new("Ancient Bond Stone",
                    "You find a glowing stone resonating with bond energy. It pulses with connection.",
                    new List<EventChoice>
                    {
                        new("✨ Absorb (+10 Bond to Kindlpup)", () => gs.EventGrantBond(CreatureId.Kindlpup, 10)),
                        new("✨ Absorb (+10 Bond to Mosscub)",  () => gs.EventGrantBond(CreatureId.Mosscub,  10)),
                        new("✨ Absorb (+10 Bond to Sparkwisp)",() => gs.EventGrantBond(CreatureId.Sparkwisp, 10)),
                        new("→ Leave it", () => { })
                    }),

                new("Wandering Medic",
                    "A traveling healer offers aid to your creatures before the next trial.",
                    new List<EventChoice>
                    {
                        new("💚 Heal all creatures (15 HP)", () => gs.EventHealAll(15)),
                        new("→ Decline", () => { })
                    }),

                new("Storm Echo",
                    "A residual energy storm crackles around you. It feels volatile but invigorating.",
                    new List<EventChoice>
                    {
                        new("⚡ Embrace (+15 Bond to Sparkwisp, take 5 dmg)", () =>
                        {
                            gs.EventGrantBond(CreatureId.Sparkwisp, 15);
                            // Directly reduce creature HP
                            foreach (var c in gs.Creatures)
                                c.CurrentHp = Math.Max(1, c.CurrentHp - 5);
                        }),
                        new("→ Pass through safely", () => { })
                    }),

                new("Forest Shrine",
                    "A mossy shrine glows with ancient natural energy. Offerings are welcomed.",
                    new List<EventChoice>
                    {
                        new("🌿 Offer gold (+15 Bond to Mosscub, -30 Gold)", () =>
                        {
                            if (gs.Gold >= 30) gs.EventGrantBond(CreatureId.Mosscub, 15);
                        }),
                        new("💰 Take a donation (+20 Gold, Mosscub -5 Bond)", () =>
                        {
                            var m = null as CreatureStats;
                            foreach (var c in gs.Creatures)
                                if (c.Id == CreatureId.Mosscub) { m = c; break; }
                            if (m != null) m.BondAccumulated = Math.Max(0, m.BondAccumulated - 5);
                        }),
                        new("→ Move on", () => { })
                    }),
            };

            return events[_rng.Next(events.Count)];
        }
    }
}
