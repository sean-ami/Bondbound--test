using Godot;
using System;
using System.Collections.Generic;
using System.Linq;

namespace BondBound
{
    public partial class ShopScreen : Control
    {
        private readonly Random _rng = new();

        public override void _Ready()
        {
            UI.MakeBgPanel(this);

            var gs = GameState.Singleton;

            var center = new CenterContainer();
            UI.FillRect(center);
            AddChild(center);

            var vbox = UI.MakeVBox(16);
            vbox.CustomMinimumSize = new Vector2(640, 0);
            vbox.Alignment = BoxContainer.AlignmentMode.Center;
            center.AddChild(vbox);

            // Header
            var hdr = UI.MakeHBox(16);
            hdr.Alignment = BoxContainer.AlignmentMode.Center;
            hdr.AddChild(UI.MakeLabel("🛒 Shop", 28, UI.AccentGold, true));
            hdr.AddChild(new Control { CustomMinimumSize = new Vector2(40, 0) });
            hdr.AddChild(UI.MakeLabel($"💰 {gs.Gold} Gold", 20, UI.AccentGold));
            vbox.AddChild(hdr);

            // Cards for sale
            vbox.AddChild(UI.MakeLabel("Cards for sale:", 16, UI.TextDim));

            var cardRow = UI.MakeHBox(12);
            cardRow.Alignment = BoxContainer.AlignmentMode.Center;

            var offers = PickShopOffers(gs, 3);
            foreach (var (def, price) in offers)
            {
                var col = def.Owner.HasValue ? UI.CreatureColor(def.Owner.Value) : UI.BgCard;
                var panel = UI.MakePanel(UI.BgCard);
                panel.CustomMinimumSize = new Vector2(150, 190);

                var cv = UI.MakeVBox(6);
                cv.SetAnchorsPreset(Control.LayoutPreset.FullRect);
                cv.AddThemeConstantOverride("margin_left",  10);
                cv.AddThemeConstantOverride("margin_right", 10);
                cv.AddThemeConstantOverride("margin_top",   10);
                cv.AddThemeConstantOverride("margin_bottom",10);
                panel.AddChild(cv);

                cv.AddChild(UI.MakeLabel(def.Name, 14, col));
                cv.AddChild(UI.MakeLabel(def.Rarity.ToString(), 11, UI.TextDim));
                var desc = UI.MakeLabel(def.Description, 10, UI.TextDim);
                desc.AutowrapMode = TextServer.AutowrapMode.Word;
                desc.SizeFlagsVertical = Control.SizeFlags.Expand | Control.SizeFlags.Fill;
                cv.AddChild(desc);

                bool canBuy = gs.Gold >= price && gs.Deck.Count < 20;
                var priceLabel = UI.MakeLabel($"💰 {price}", 13, canBuy ? UI.AccentGold : new Color("#cc4444"));
                priceLabel.HorizontalAlignment = HorizontalAlignment.Center;
                cv.AddChild(priceLabel);

                var defId = def.Id;
                var buyBtn = UI.MakeButton("Buy", canBuy ? UI.HpGreen : UI.TextDim);
                buyBtn.Disabled = !canBuy;
                buyBtn.CustomMinimumSize = new Vector2(120, 32);
                buyBtn.Pressed += () => { gs.BuyCard(defId, price); gs.AfterShop(); };
                cv.AddChild(buyBtn);

                cardRow.AddChild(panel);
            }
            vbox.AddChild(cardRow);

            // Card removal
            vbox.AddChild(UI.MakeLabel("Remove a card from deck (75 Gold):", 14, UI.TextDim));

            bool canRemove = gs.Gold >= 75 && gs.Deck.Count > 0;
            if (canRemove)
            {
                var removeRow = UI.MakeHBox(8);
                removeRow.Alignment = BoxContainer.AlignmentMode.Center;

                // Show first 5 removable cards
                foreach (var card in gs.Deck.Take(5))
                {
                    var def = CardDB.Singleton.Get(card.DefinitionId);
                    var col = def.Owner.HasValue ? UI.CreatureColor(def.Owner.Value) : UI.TextDim;
                    var instId = card.InstanceId;

                    var removeBtn = UI.MakeButton(def.Name, new Color("#552222"));
                    removeBtn.TooltipText = def.Description;
                    removeBtn.Pressed += () => { gs.RemoveCard(instId, 75); gs.AfterShop(); };
                    removeRow.AddChild(removeBtn);
                }
                vbox.AddChild(removeRow);
            }

            // Items section
            vbox.AddChild(UI.MakeLabel("Items:", 16, UI.TextDim));

            var itemRow = UI.MakeHBox(12);
            itemRow.Alignment = BoxContainer.AlignmentMode.Center;

            var shardDef = GameState.ItemDefs["revive_shard"];
            int shardCount = gs.Items.Count(i => i.DefinitionId == "revive_shard");
            bool canBuyShard = gs.Gold >= shardDef.ShopCost && shardCount < 2;

            var shardPanel = UI.MakePanel(UI.BgCard);
            shardPanel.CustomMinimumSize = new Vector2(200, 120);
            var sv = UI.MakeVBox(6);
            sv.SetAnchorsPreset(Control.LayoutPreset.FullRect);
            sv.AddThemeConstantOverride("margin_left",   10);
            sv.AddThemeConstantOverride("margin_right",  10);
            sv.AddThemeConstantOverride("margin_top",    10);
            sv.AddThemeConstantOverride("margin_bottom", 10);
            shardPanel.AddChild(sv);

            sv.AddChild(UI.MakeLabel($"{shardDef.Emoji} {shardDef.Name}", 14, new Color("#aaaaff")));
            sv.AddChild(UI.MakeLabel($"Owned: {shardCount}", 11, UI.TextDim));
            var shardDesc = UI.MakeLabel(shardDef.Description, 10, UI.TextDim);
            shardDesc.AutowrapMode = TextServer.AutowrapMode.Word;
            shardDesc.SizeFlagsVertical = Control.SizeFlags.Expand | Control.SizeFlags.Fill;
            sv.AddChild(shardDesc);

            var shardPriceLabel = UI.MakeLabel($"💰 {shardDef.ShopCost}", 13,
                canBuyShard ? UI.AccentGold : new Color("#cc4444"));
            shardPriceLabel.HorizontalAlignment = HorizontalAlignment.Center;
            sv.AddChild(shardPriceLabel);

            var shardBtn = UI.MakeButton("Buy", canBuyShard ? UI.HpGreen : UI.TextDim);
            shardBtn.Disabled = !canBuyShard;
            shardBtn.CustomMinimumSize = new Vector2(160, 32);
            shardBtn.Pressed += () => gs.BuyItem("revive_shard");
            sv.AddChild(shardBtn);

            itemRow.AddChild(shardPanel);
            vbox.AddChild(itemRow);

            // Leave button
            var leaveBtn = UI.MakeButton("Leave →", UI.AccentFire);
            leaveBtn.CustomMinimumSize = new Vector2(160, 44);
            leaveBtn.Pressed += () => gs.AfterShop();
            vbox.AddChild(leaveBtn);
        }

        private List<(CardDefinition, int)> PickShopOffers(GameState gs, int count)
        {
            var all = CardDB.Singleton.GetGenericCards().Cast<CardDefinition>().ToList();
            foreach (var creature in gs.Creatures)
                all.AddRange(CardDB.Singleton.GetSignatureCards(creature.Id, creature.Stage));

            var shuffled = all.OrderBy(_ => _rng.Next()).ToList();
            var result = new List<(CardDefinition, int)>();
            var seen = new System.Collections.Generic.HashSet<string>();

            foreach (var def in shuffled)
            {
                if (!seen.Add(def.Id)) continue;
                int price = def.Rarity switch
                {
                    Rarity.Common    => 45,
                    Rarity.Uncommon  => 65,
                    Rarity.Rare      => 90,
                    Rarity.Signature => 75,
                    _                => 50
                };
                result.Add((def, price));
                if (result.Count == count) break;
            }
            return result;
        }
    }
}
