class_name EvolutionScreen
extends Control

func _ready() -> void:
	UI.make_bg_panel(self)

	var creature_id = GameState.just_evolved_creature
	var creature: CreatureStats = null
	for c in GameState.creatures:
		if c.id == creature_id:
			creature = c
			break

	var center = CenterContainer.new()
	UI.fill_rect(center)
	add_child(center)

	var vbox = UI.make_vbox(24)
	vbox.custom_minimum_size = Vector2(500, 0)
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_child(vbox)

	var burst = UI.make_label("✨", 72)
	burst.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(burst)

	var evo_title = UI.make_label("Evolution!", 40, UI.ACCENT_GOLD)
	evo_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(evo_title)

	if creature != null:
		var col = UI.creature_color(creature.id)

		var name_lbl = UI.make_label("%s %s" % [creature.emoji, creature.name], 32, col)
		name_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vbox.add_child(name_lbl)

		var stage_lbl = UI.make_label("Stage %d achieved!" % creature.stage, 18, UI.TEXT_DIM)
		stage_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vbox.add_child(stage_lbl)

		var new_cards = CardDB.get_signature_cards(creature.id, creature.stage)
		if new_cards.size() > 0:
			vbox.add_child(UI.make_label("Upgraded signature cards:", 14, UI.TEXT_DIM))
			var card_row = UI.make_hbox(8)
			card_row.alignment = BoxContainer.ALIGNMENT_CENTER
			for def in new_cards:
				var cp = UI.make_panel(UI.BG_CARD)
				cp.custom_minimum_size = Vector2(130, 80)
				var cv = UI.make_vbox(4)
				cv.set_anchors_preset(Control.PRESET_FULL_RECT)
				cv.add_theme_constant_override("margin_left",   8)
				cv.add_theme_constant_override("margin_right",  8)
				cv.add_theme_constant_override("margin_top",    8)
				cv.add_theme_constant_override("margin_bottom", 8)
				cp.add_child(cv)
				cv.add_child(UI.make_label(def.name, 13, col))
				var desc = UI.make_label(def.description, 10, UI.TEXT_DIM)
				desc.autowrap_mode = TextServer.AUTOWRAP_WORD
				cv.add_child(desc)
				card_row.add_child(cp)
			vbox.add_child(card_row)

	var continue_btn = UI.make_button("Continue →", UI.ACCENT_FIRE)
	continue_btn.custom_minimum_size = Vector2(180, 48)
	continue_btn.pressed.connect(func(): GameState.confirm_evolution())
	vbox.add_child(continue_btn)
