using Godot;
using System;
using System.Collections.Generic;
using System.Linq;

namespace BondBound
{
    public partial class DraftScreen : Control
    {
        private readonly Random _rng = new();

        public override void _Ready()
        {
            UI.MakeBgPanel(this);

            var gs = GameState.Singleton;
            bool deckFull = gs.Deck.Count >= 20;

            var center = new CenterContainer();
            UI.FillRect(center);
            AddChild(center);

            var vbox = UI.MakeVBox(20);
            vbox.CustomMinimumSize = new Vector2(600, 0);
            vbox.Alignment = BoxContainer.AlignmentMode.Center;
            center.AddChild(vbox);

            var title = UI.MakeLabel("📦 Draft a Card", 30, UI.AccentGold, true);
            title.HorizontalAlignment = HorizontalAlignment.Center;
            vbox.AddChild(title);

            var deckLabel = UI.MakeLabel($"Deck: {gs.Deck.Count}/20 cards", 14, deckFull ? new Color("#cc4444") : UI.TextDim);
            deckLabel.HorizontalAlignment = HorizontalAlignment.Center;
            vbox.AddChild(deckLabel);

            if (deckFull)
            {
                vbox.AddChild(UI.MakeLabel("Deck is full — you may skip only.", 14, UI.TextDim));
            }
            else
            {
                var offers = PickDraftOffers(gs, 3);
                var cardRow = UI.MakeHBox(16);
                cardRow.Alignment = BoxContainer.AlignmentMode.Center;

                foreach (var def in offers)
                {
                    var col = def.Owner.HasValue ? UI.CreatureColor(def.Owner.Value) : UI.BgCard;
                    var panel = UI.MakePanel(UI.BgCard);
                    panel.CustomMinimumSize = new Vector2(150, 200);

                    var cv = UI.MakeVBox(8);
                    cv.SetAnchorsPreset(Control.LayoutPreset.FullRect);
                    cv.AddThemeConstantOverride("margin_left",  10);
                    cv.AddThemeConstantOverride("margin_right", 10);
                    cv.AddThemeConstantOverride("margin_top",   10);
                    cv.AddThemeConstantOverride("margin_bottom",10);
                    panel.AddChild(cv);

                    // Cost
                    cv.AddChild(UI.MakeLabel($"Cost: {def.EnergyCost}", 12, UI.AccentGold));
                    // Name
                    cv.AddChild(UI.MakeLabel(def.Name, 14, col));
                    // Rarity
                    cv.AddChild(UI.MakeLabel(def.Rarity.ToString(), 11, UI.TextDim));
                    // Description
                    var desc = UI.MakeLabel(def.Description, 11, UI.TextDim);
                    desc.AutowrapMode = TextServer.AutowrapMode.Word;
                    desc.SizeFlagsVertical = Control.SizeFlags.Expand | Control.SizeFlags.Fill;
                    cv.AddChild(desc);

                    var defId = def.Id;
                    var btn = UI.MakeButton("Pick", col);
                    btn.CustomMinimumSize = new Vector2(120, 34);
                    btn.Pressed += () => GameState.Singleton.AfterDraft(defId);
                    cv.AddChild(btn);

                    cardRow.AddChild(panel);
                }

                vbox.AddChild(cardRow);
            }

            var skipBtn = UI.MakeButton("Skip →");
            skipBtn.CustomMinimumSize = new Vector2(140, 40);
            skipBtn.Pressed += () => GameState.Singleton.AfterDraft(null);
            vbox.AddChild(skipBtn);
        }

        private List<CardDefinition> PickDraftOffers(GameState gs, int count)
        {
            var pool = new List<CardDefinition>();
            var allGeneric = CardDB.Singleton.GetGenericCards();

            // Add generic cards weighted by rarity
            foreach (var def in allGeneric)
            {
                int weight = def.Rarity switch
                {
                    Rarity.Common   => 3,
                    Rarity.Uncommon => 2,
                    Rarity.Rare     => 1,
                    _               => 0
                };
                for (int i = 0; i < weight; i++) pool.Add(def);
            }

            // Add signature cards at current creature stage
            foreach (var creature in gs.Creatures)
            {
                var sigs = CardDB.Singleton.GetSignatureCards(creature.Id, creature.Stage);
                foreach (var def in sigs)
                    pool.Add(def); // Signature cards get weight 1
            }

            // Shuffle and pick unique
            var shuffled = pool.OrderBy(_ => _rng.Next()).ToList();
            var seen = new System.Collections.Generic.HashSet<string>();
            var result = new List<CardDefinition>();
            foreach (var def in shuffled)
            {
                if (seen.Add(def.Id))
                {
                    result.Add(def);
                    if (result.Count == count) break;
                }
            }
            return result;
        }
    }
}
