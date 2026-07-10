class_name ShopScreen
extends Control

func _ready() -> void:
	UI.make_bg_panel(self)

	var center = CenterContainer.new()
	UI.fill_rect(center)
	add_child(center)

	var vbox = UI.make_vbox(16)
	vbox.custom_minimum_size = Vector2(640, 0)
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_child(vbox)

	# Header
	var hdr = UI.make_hbox(16)
	hdr.alignment = BoxContainer.ALIGNMENT_CENTER
	hdr.add_child(UI.make_label("🛒 Shop", 28, UI.ACCENT_GOLD))
	var hdr_spc = Control.new()
	hdr_spc.custom_minimum_size = Vector2(40, 0)
	hdr.add_child(hdr_spc)
	hdr.add_child(UI.make_label("💰 %d Gold" % GameState.gold, 20, UI.ACCENT_GOLD))
	vbox.add_child(hdr)

	# Cards for sale
	vbox.add_child(UI.make_label("Cards for sale:", 16, UI.TEXT_DIM))

	var card_row = UI.make_hbox(12)
	card_row.alignment = BoxContainer.ALIGNMENT_CENTER

	for offer in _pick_shop_offers(3):
		var def: CardDefinition = offer[0]
		var price: int = offer[1]
		var col = UI.creature_color(def.owner) if def.owner != -1 else UI.BG_CARD
		var panel = UI.make_panel(UI.BG_CARD)
		panel.custom_minimum_size = Vector2(150, 190)

		var cv = UI.make_vbox(6)
		cv.set_anchors_preset(Control.PRESET_FULL_RECT)
		cv.add_theme_constant_override("margin_left",   10)
		cv.add_theme_constant_override("margin_right",  10)
		cv.add_theme_constant_override("margin_top",    10)
		cv.add_theme_constant_override("margin_bottom", 10)
		panel.add_child(cv)

		cv.add_child(UI.make_label(def.name, 14, col))
		cv.add_child(UI.make_label(_rarity_name(def.rarity), 11, UI.TEXT_DIM))
		var desc = UI.make_label(def.description, 10, UI.TEXT_DIM)
		desc.autowrap_mode = TextServer.AUTOWRAP_WORD
		desc.size_flags_vertical = Control.SIZE_EXPAND_FILL
		cv.add_child(desc)

		var can_buy = GameState.gold >= price and GameState.deck.size() < 20
		var price_lbl = UI.make_label(
			"💰 %d" % price, 13, UI.ACCENT_GOLD if can_buy else Color("#cc4444"))
		price_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		cv.add_child(price_lbl)

		var def_id = def.id
		var buy_btn = UI.make_button("Buy", UI.HP_GREEN if can_buy else UI.TEXT_DIM)
		buy_btn.disabled = not can_buy
		buy_btn.custom_minimum_size = Vector2(120, 32)
		buy_btn.pressed.connect(func(): GameState.buy_card(def_id, price); GameState.after_shop())
		cv.add_child(buy_btn)

		card_row.add_child(panel)

	vbox.add_child(card_row)

	# Card removal
	vbox.add_child(UI.make_label("Remove a card from deck (75 Gold):", 14, UI.TEXT_DIM))

	var can_remove = GameState.gold >= 75 and GameState.deck.size() > 0
	if can_remove:
		var remove_row = UI.make_hbox(8)
		remove_row.alignment = BoxContainer.ALIGNMENT_CENTER
		var shown = 0
		for card in GameState.deck:
			if shown >= 5:
				break
			var def = CardDB.get_card(card.definition_id)
			var inst_id = card.instance_id
			var remove_btn = UI.make_button(def.name, Color("#552222"))
			remove_btn.tooltip_text = def.description
			remove_btn.pressed.connect(
				func(): GameState.remove_card(inst_id, 75); GameState.after_shop())
			remove_row.add_child(remove_btn)
			shown += 1
		vbox.add_child(remove_row)

	# Items section
	vbox.add_child(UI.make_label("Items:", 16, UI.TEXT_DIM))

	var item_row = UI.make_hbox(12)
	item_row.alignment = BoxContainer.ALIGNMENT_CENTER

	var shard_def = GameState.get_item_def("revive_shard")
	var shard_count = 0
	for item in GameState.items:
		if item.definition_id == "revive_shard":
			shard_count += 1
	var can_buy_shard = GameState.gold >= shard_def["shop_cost"] and shard_count < 2

	var shard_panel = UI.make_panel(UI.BG_CARD)
	shard_panel.custom_minimum_size = Vector2(200, 120)
	var sv = UI.make_vbox(6)
	sv.set_anchors_preset(Control.PRESET_FULL_RECT)
	sv.add_theme_constant_override("margin_left",   10)
	sv.add_theme_constant_override("margin_right",  10)
	sv.add_theme_constant_override("margin_top",    10)
	sv.add_theme_constant_override("margin_bottom", 10)
	shard_panel.add_child(sv)

	sv.add_child(UI.make_label(
		"%s %s" % [shard_def["emoji"], shard_def["name"]], 14, Color("#aaaaff")))
	sv.add_child(UI.make_label("Owned: %d" % shard_count, 11, UI.TEXT_DIM))
	var shard_desc = UI.make_label(shard_def["description"], 10, UI.TEXT_DIM)
	shard_desc.autowrap_mode = TextServer.AUTOWRAP_WORD
	shard_desc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	sv.add_child(shard_desc)

	var shard_price_lbl = UI.make_label(
		"💰 %d" % shard_def["shop_cost"], 13,
		UI.ACCENT_GOLD if can_buy_shard else Color("#cc4444"))
	shard_price_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	sv.add_child(shard_price_lbl)

	var shard_btn = UI.make_button("Buy", UI.HP_GREEN if can_buy_shard else UI.TEXT_DIM)
	shard_btn.disabled = not can_buy_shard
	shard_btn.custom_minimum_size = Vector2(160, 32)
	shard_btn.pressed.connect(func(): GameState.buy_item("revive_shard"))
	sv.add_child(shard_btn)

	item_row.add_child(shard_panel)
	vbox.add_child(item_row)

	# Leave
	var leave_btn = UI.make_button("Leave →", UI.ACCENT_FIRE)
	leave_btn.custom_minimum_size = Vector2(160, 44)
	leave_btn.pressed.connect(func(): GameState.after_shop())
	vbox.add_child(leave_btn)

func _pick_shop_offers(count: int) -> Array:
	var all: Array = []
	for def in CardDB.get_generic_cards():
		all.append(def)
	for creature in GameState.creatures:
		for def in CardDB.get_signature_cards(creature.id, creature.stage):
			all.append(def)

	all.shuffle()
	var result: Array = []
	var seen: Dictionary = {}
	for def in all:
		if def.id not in seen:
			seen[def.id] = true
			var price: int
			match def.rarity:
				Enums.Rarity.COMMON:    price = 45
				Enums.Rarity.UNCOMMON:  price = 65
				Enums.Rarity.RARE:      price = 90
				Enums.Rarity.SIGNATURE: price = 75
				_: price = 50
			result.append([def, price])
			if result.size() == count:
				break
	return result

func _rarity_name(rarity: int) -> String:
	match rarity:
		Enums.Rarity.COMMON:    return "Common"
		Enums.Rarity.UNCOMMON:  return "Uncommon"
		Enums.Rarity.RARE:      return "Rare"
		Enums.Rarity.SIGNATURE: return "Signature"
		_: return "Unknown"
