class_name BondScreen
extends Control

var _vbox: VBoxContainer

func _ready() -> void:
	UI.make_bg_panel(self)

	var center = CenterContainer.new()
	UI.fill_rect(center)
	add_child(center)

	_vbox = UI.make_vbox(16)
	_vbox.custom_minimum_size = Vector2(520, 0)
	_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_child(_vbox)

	GameState.state_updated.connect(_build_ui)
	_build_ui()

func _exit_tree() -> void:
	GameState.state_updated.disconnect(_build_ui)

func _build_ui() -> void:
	for child in _vbox.get_children():
		child.queue_free()

	var result = GameState.last_battle_result

	var title = UI.make_label("🏅 Bond Summary", 32, UI.ACCENT_GOLD)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_vbox.add_child(title)

	if result != null:
		var breakdown = UI.make_panel(UI.BG_PANEL)
		breakdown.custom_minimum_size = Vector2(380, 0)
		var bv = UI.make_vbox(6)
		bv.set_anchors_preset(Control.PRESET_FULL_RECT)
		bv.add_theme_constant_override("margin_left",   12)
		bv.add_theme_constant_override("margin_right",  12)
		bv.add_theme_constant_override("margin_top",    12)
		bv.add_theme_constant_override("margin_bottom", 12)
		breakdown.add_child(bv)

		bv.add_child(_bond_row("Base", result.bond_base))
		for bonus in result.bond_bonuses:
			bv.add_child(_bond_row(bonus.label, bonus.amount))
		bv.add_child(HSeparator.new())
		var total_lbl = UI.make_label("Total Bond: +%d" % result.bond_total, 18, UI.ACCENT_GOLD)
		total_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		bv.add_child(total_lbl)

		bv.add_child(HSeparator.new())
		var gold_row = UI.make_hbox(8)
		gold_row.add_child(UI.make_label("💰 Gold Earned", 13))
		var gs_spc = Control.new()
		gs_spc.size_flags_horizontal = Control.SIZE_EXPAND
		gold_row.add_child(gs_spc)
		gold_row.add_child(UI.make_label("+%d" % result.gold_earned, 13, UI.ACCENT_GOLD))
		bv.add_child(gold_row)
		var bd_lbl = UI.make_label(result.gold_breakdown, 11, UI.TEXT_DIM)
		bd_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		bv.add_child(bd_lbl)

		_vbox.add_child(breakdown)

		# Revive Shard section
		var has_shard = false
		for item in GameState.items:
			if item.definition_id == "revive_shard":
				has_shard = true
				break
		var any_ko = false
		for c in GameState.creatures:
			if c.is_knocked_out:
				any_ko = true
				break

		if has_shard and any_ko:
			_vbox.add_child(UI.make_label("💎 Use Revive Shard:", 15, Color("#aaaaff")))
			var revive_row = UI.make_hbox(10)
			revive_row.alignment = BoxContainer.ALIGNMENT_CENTER
			for creature in GameState.creatures:
				if creature.is_knocked_out:
					var col = UI.creature_color(creature.id)
					var c_id = creature.id
					var btn = UI.make_button(
						"Revive %s %s" % [creature.emoji, creature.name], col)
					btn.custom_minimum_size = Vector2(160, 36)
					btn.pressed.connect(func(): GameState.use_revive_shard(c_id))
					revive_row.add_child(btn)
			_vbox.add_child(revive_row)

	_vbox.add_child(UI.make_label("Allocate Bond to:", 16, UI.TEXT_DIM))

	var creatures_row = UI.make_hbox(12)
	creatures_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_vbox.add_child(creatures_row)

	for creature in GameState.creatures:
		var col = UI.creature_color(creature.id)
		var panel = UI.make_panel(UI.BG_PANEL)
		panel.custom_minimum_size = Vector2(148, 128)

		var cv = UI.make_vbox(6)
		cv.set_anchors_preset(Control.PRESET_FULL_RECT)
		cv.add_theme_constant_override("margin_left",   10)
		cv.add_theme_constant_override("margin_right",  10)
		cv.add_theme_constant_override("margin_top",    10)
		cv.add_theme_constant_override("margin_bottom", 10)
		panel.add_child(cv)

		cv.add_child(UI.make_label("%s %s" % [creature.emoji, creature.name], 14, col))

		var threshold = 70 if creature.stage == Enums.EvolutionStage.STAGE0 else 135
		var earned = result.bond_total if result != null else 0
		var new_total = creature.bond_accumulated + earned
		cv.add_child(UI.make_label(
			"Bond: %d → %d" % [creature.bond_accumulated, new_total], 11, UI.TEXT_DIM))
		cv.add_child(UI.make_bar(min(new_total, threshold), threshold, col, 8))

		if new_total >= threshold and creature.stage != Enums.EvolutionStage.STAGE2:
			var el = UI.make_label("✨ Evolves!", 11, UI.ACCENT_GOLD)
			el.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			cv.add_child(el)

		if creature.is_knocked_out:
			var ko = UI.make_label("💀 KO'd", 11, Color("#cc4444"))
			ko.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			cv.add_child(ko)

		var c_id = creature.id
		var btn = UI.make_button("Choose", col)
		btn.custom_minimum_size = Vector2(120, 32)
		btn.pressed.connect(func(): GameState.allocate_bond(c_id))
		cv.add_child(btn)

		creatures_row.add_child(panel)

func _bond_row(label: String, amount: int) -> HBoxContainer:
	var h = UI.make_hbox(8)
	h.add_child(UI.make_label(label, 13))
	var s = Control.new()
	s.size_flags_horizontal = Control.SIZE_EXPAND
	h.add_child(s)
	h.add_child(UI.make_label("+%d" % amount, 13, UI.ACCENT_GOLD))
	return h
