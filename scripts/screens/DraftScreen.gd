class_name DraftScreen
extends Control

func _ready() -> void:
	UI.make_bg_panel(self)

	var deck_full = GameState.deck.size() >= 20

	var center = CenterContainer.new()
	UI.fill_rect(center)
	add_child(center)

	var vbox = UI.make_vbox(20)
	vbox.custom_minimum_size = Vector2(600, 0)
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_child(vbox)

	var title = UI.make_label("📦 Draft a Card", 30, UI.ACCENT_GOLD)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title)

	var deck_lbl = UI.make_label(
		"Deck: %d/20 cards" % GameState.deck.size(), 14,
		Color("#cc4444") if deck_full else UI.TEXT_DIM)
	deck_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(deck_lbl)

	if deck_full:
		vbox.add_child(UI.make_label("Deck is full — you may skip only.", 14, UI.TEXT_DIM))
	else:
		var offers = _pick_draft_offers(3)
		var card_row = UI.make_hbox(16)
		card_row.alignment = BoxContainer.ALIGNMENT_CENTER

		for def in offers:
			var col = UI.creature_color(def.owner) if def.owner != -1 else UI.BG_CARD
			var panel = UI.make_panel(UI.BG_CARD)
			panel.custom_minimum_size = Vector2(150, 200)

			var cv = UI.make_vbox(8)
			cv.set_anchors_preset(Control.PRESET_FULL_RECT)
			cv.add_theme_constant_override("margin_left",   10)
			cv.add_theme_constant_override("margin_right",  10)
			cv.add_theme_constant_override("margin_top",    10)
			cv.add_theme_constant_override("margin_bottom", 10)
			panel.add_child(cv)

			cv.add_child(UI.make_label("Cost: %d" % def.energy_cost, 12, UI.ACCENT_GOLD))
			cv.add_child(UI.make_label(def.name, 14, col))
			cv.add_child(UI.make_label(_rarity_name(def.rarity), 11, UI.TEXT_DIM))
			var desc = UI.make_label(def.description, 11, UI.TEXT_DIM)
			desc.autowrap_mode = TextServer.AUTOWRAP_WORD
			desc.size_flags_vertical = Control.SIZE_EXPAND_FILL
			cv.add_child(desc)

			var def_id = def.id
			var btn = UI.make_button("Pick", col)
			btn.custom_minimum_size = Vector2(120, 34)
			btn.pressed.connect(func(): GameState.after_draft(def_id))
			cv.add_child(btn)

			card_row.add_child(panel)

		vbox.add_child(card_row)

	var skip_btn = UI.make_button("Skip →")
	skip_btn.custom_minimum_size = Vector2(140, 40)
	skip_btn.pressed.connect(func(): GameState.after_draft(""))
	vbox.add_child(skip_btn)

func _pick_draft_offers(count: int) -> Array:
	var pool: Array = []

	for def in CardDB.get_generic_cards():
		var weight = 0
		match def.rarity:
			Enums.Rarity.COMMON:   weight = 3
			Enums.Rarity.UNCOMMON: weight = 2
			Enums.Rarity.RARE:     weight = 1
		for i in range(weight):
			pool.append(def)

	for creature in GameState.creatures:
		for def in CardDB.get_signature_cards(creature.id, creature.stage):
			pool.append(def)

	pool.shuffle()
	var seen: Dictionary = {}
	var result: Array = []
	for def in pool:
		if def.id not in seen:
			seen[def.id] = true
			result.append(def)
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
