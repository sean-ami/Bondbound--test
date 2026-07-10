class_name BattleScreen
extends Control

var _root: VBoxContainer
var _selected_card_id: String = ""

func _ready() -> void:
	UI.make_bg_panel(self)

	_root = UI.make_vbox(4)
	_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	_root.add_theme_constant_override("margin_left",   8)
	_root.add_theme_constant_override("margin_right",  8)
	_root.add_theme_constant_override("margin_top",    8)
	_root.add_theme_constant_override("margin_bottom", 8)
	add_child(_root)

	CombatManager.state_changed.connect(_rebuild)
	_rebuild()

func _exit_tree() -> void:
	CombatManager.state_changed.disconnect(_rebuild)

func _rebuild() -> void:
	for child in _root.get_children():
		child.queue_free()

	var state = CombatManager.state

	_build_enemy_row(state)
	_root.add_child(HSeparator.new())
	_build_creature_row(state)
	_root.add_child(HSeparator.new())
	_build_hud(state)
	_root.add_child(HSeparator.new())
	_build_hand(state)
	_root.add_child(HSeparator.new())
	_build_log(state)

	if state.phase == Enums.CombatPhase.VICTORY:
		_build_overlay("⚔️ Victory!", UI.ACCENT_GOLD)
	elif state.phase == Enums.CombatPhase.DEFEAT:
		_build_overlay("💀 Defeat", Color("#cc0000"))

func _build_enemy_row(state: CombatState) -> void:
	var hbox = UI.make_hbox(12)
	hbox.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_root.add_child(hbox)
	var sl = Control.new()
	sl.size_flags_horizontal = Control.SIZE_EXPAND
	hbox.add_child(sl)
	for enemy in state.enemies:
		hbox.add_child(_enemy_panel(enemy))
	var sr = Control.new()
	sr.size_flags_horizontal = Control.SIZE_EXPAND
	hbox.add_child(sr)

func _enemy_panel(enemy: EnemyState) -> Control:
	var dead = enemy.current_hp <= 0
	var panel = UI.make_panel(Color("#111122") if dead else UI.BG_PANEL)
	panel.custom_minimum_size = Vector2(160, 150)
	panel.size_flags_horizontal = Control.SIZE_SHRINK_CENTER

	var vbox = UI.make_vbox(4)
	vbox.set_anchors_preset(Control.PRESET_FULL_RECT)
	vbox.add_theme_constant_override("margin_left",   8)
	vbox.add_theme_constant_override("margin_right",  8)
	vbox.add_theme_constant_override("margin_top",    8)
	vbox.add_theme_constant_override("margin_bottom", 8)
	panel.add_child(vbox)

	var name_label = UI.make_label("%s %s" % [enemy.emoji, enemy.name], 15,
		UI.TEXT_DIM if dead else UI.TEXT_LIGHT)
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(name_label)

	if dead:
		vbox.add_child(UI.make_label("Defeated", 12, UI.TEXT_DIM))
	else:
		vbox.add_child(UI.make_bar(enemy.current_hp, enemy.max_hp, UI.HP_RED, 8))
		var hp_label = UI.make_label("%d/%d HP" % [enemy.current_hp, enemy.max_hp], 11, UI.TEXT_DIM)
		hp_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vbox.add_child(hp_label)

		if enemy.block > 0:
			var blk = UI.make_label("🛡 %d" % enemy.block, 12, UI.BLOCK_BLUE)
			blk.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			vbox.add_child(blk)

		var intent_label = UI.make_label(enemy.intent.label, 12, UI.ACCENT_GOLD)
		intent_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		intent_label.autowrap_mode = TextServer.AUTOWRAP_WORD
		vbox.add_child(intent_label)

		if enemy.statuses.size() > 0:
			vbox.add_child(_status_row(enemy.statuses))

		if _selected_card_id != "" and _is_attack_card(_selected_card_id):
			var highlight = StyleBoxFlat.new()
			highlight.bg_color = Color("#1a3a1a")
			highlight.set_border_width_all(2)
			highlight.border_color = Color("#00ff66")
			highlight.set_corner_radius_all(8)
			panel.add_theme_stylebox_override("panel", highlight)

			var e_id = enemy.instance_id
			var card_id = _selected_card_id
			panel.gui_input.connect(func(event):
				if event is InputEventMouseButton \
						and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
					CombatManager.play_card(card_id, e_id)
					_selected_card_id = ""
			)
			panel.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND

	return panel

func _build_creature_row(state: CombatState) -> void:
	var hbox = UI.make_hbox(12)
	hbox.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_root.add_child(hbox)
	var sl = Control.new()
	sl.size_flags_horizontal = Control.SIZE_EXPAND
	hbox.add_child(sl)
	for c in state.creatures:
		hbox.add_child(_creature_panel(c))
	var sr = Control.new()
	sr.size_flags_horizontal = Control.SIZE_EXPAND
	hbox.add_child(sr)

func _creature_panel(c: CreatureStats) -> Control:
	var col = UI.creature_color(c.id)
	var bg_color = Color("#111122") if c.is_knocked_out else UI.BG_PANEL
	var panel = UI.make_panel(bg_color)
	panel.custom_minimum_size = Vector2(180, 130)

	var border = StyleBoxFlat.new()
	border.bg_color = bg_color
	border.border_color = col
	border.set_border_width_all(0)
	border.border_width_top = 3
	border.set_corner_radius_all(8)
	panel.add_theme_stylebox_override("panel", border)

	var vbox = UI.make_vbox(4)
	vbox.set_anchors_preset(Control.PRESET_FULL_RECT)
	vbox.add_theme_constant_override("margin_left",   8)
	vbox.add_theme_constant_override("margin_right",  8)
	vbox.add_theme_constant_override("margin_top",    8)
	vbox.add_theme_constant_override("margin_bottom", 8)
	panel.add_child(vbox)

	var name_row = UI.make_hbox(6)
	name_row.add_child(UI.make_label(c.emoji, 18))
	name_row.add_child(UI.make_label(c.name, 14, col))
	if c.is_knocked_out:
		name_row.add_child(UI.make_label("KO", 12, Color("#cc0000")))
	vbox.add_child(name_row)

	vbox.add_child(UI.make_bar(c.current_hp, c.max_hp, UI.HP_GREEN, 8))
	vbox.add_child(UI.make_label("HP %d/%d" % [c.current_hp, c.max_hp], 11, UI.TEXT_DIM))

	var bottom_row = UI.make_hbox(8)
	if c.block > 0:
		bottom_row.add_child(UI.make_label("🛡 %d" % c.block, 12, UI.BLOCK_BLUE))
	var bond_threshold = 70 if c.stage == Enums.EvolutionStage.STAGE0 else 135
	var bond_bar = UI.make_bar(c.bond_accumulated, bond_threshold, col, 6)
	bond_bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bond_bar.tooltip_text = "Bond %d/%d" % [c.bond_accumulated, bond_threshold]
	bottom_row.add_child(bond_bar)
	vbox.add_child(bottom_row)

	if c.statuses.size() > 0:
		vbox.add_child(_status_row(c.statuses))

	return panel

func _build_hud(state: CombatState) -> void:
	var hbox = UI.make_hbox(12)
	hbox.custom_minimum_size = Vector2(0, 48)
	_root.add_child(hbox)

	var energy_row = UI.make_hbox(4)
	for i in range(state.max_energy):
		energy_row.add_child(UI.make_label(
			"⬡" if i < state.energy else "⬢", 20,
			UI.ACCENT_GOLD if i < state.energy else UI.TEXT_DIM))
	hbox.add_child(energy_row)
	hbox.add_child(UI.make_label("Energy: %d/%d" % [state.energy, state.max_energy], 14))

	var combo_text = "Cards: %d" % state.cards_played_this_turn
	var combo_color = UI.TEXT_DIM
	if state.combo_active:
		combo_text += " ⚡ COMBO"
		combo_color = UI.ACCENT_GOLD
	hbox.add_child(UI.make_label(combo_text, 13, combo_color))

	var mid = Control.new()
	mid.size_flags_horizontal = Control.SIZE_EXPAND
	hbox.add_child(mid)

	hbox.add_child(UI.make_label("Draw: %d" % state.draw_pile.size(), 13, UI.TEXT_DIM))
	hbox.add_child(UI.make_label("Disc: %d" % state.discard_pile.size(), 13, UI.TEXT_DIM))

	var right = Control.new()
	right.size_flags_horizontal = Control.SIZE_EXPAND
	hbox.add_child(right)

	hbox.add_child(UI.make_label("Turn %d" % state.turn, 13, UI.TEXT_DIM))

	var is_player = state.phase == Enums.CombatPhase.PLAYER_TURN
	var end_btn = UI.make_button("End Turn ▶", UI.ACCENT_FIRE if is_player else UI.TEXT_DIM)
	end_btn.custom_minimum_size = Vector2(110, 40)
	end_btn.disabled = not is_player
	end_btn.pressed.connect(func():
		_selected_card_id = ""
		CombatManager.end_turn()
	)
	hbox.add_child(end_btn)

func _build_hand(state: CombatState) -> void:
	var scroll = ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_root.add_child(scroll)

	var hbox = UI.make_hbox(8)
	hbox.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	hbox.alignment = BoxContainer.ALIGNMENT_CENTER
	scroll.add_child(hbox)

	for card in state.hand:
		var def = CardDB.get_card(card.definition_id)
		hbox.add_child(_card_view(card, def, state))

func _card_view(card: CardInstance, def: CardDefinition, state: CombatState) -> Control:
	var is_selected = _selected_card_id == card.instance_id
	var can_play = state.phase == Enums.CombatPhase.PLAYER_TURN and state.energy >= def.energy_cost
	var card_color = UI.creature_color(def.owner) if def.owner != -1 else UI.BG_CARD
	var bg_color = card_color.lightened(0.3) if is_selected else UI.BG_CARD

	var panel = UI.make_panel(bg_color)
	panel.custom_minimum_size = Vector2(110, 150)

	if is_selected:
		var sel = StyleBoxFlat.new()
		sel.bg_color = bg_color
		sel.set_border_width_all(2)
		sel.border_color = UI.ACCENT_GOLD
		sel.set_corner_radius_all(8)
		panel.add_theme_stylebox_override("panel", sel)

	var vbox = UI.make_vbox(4)
	vbox.set_anchors_preset(Control.PRESET_FULL_RECT)
	vbox.add_theme_constant_override("margin_left",   6)
	vbox.add_theme_constant_override("margin_right",  6)
	vbox.add_theme_constant_override("margin_top",    6)
	vbox.add_theme_constant_override("margin_bottom", 6)
	panel.add_child(vbox)

	# Cost pip
	var cost_row = UI.make_hbox(4)
	var cost_pip = UI.make_panel(UI.ACCENT_GOLD if can_play else Color("#555555"), 12)
	cost_pip.custom_minimum_size = Vector2(22, 22)
	var cost_lbl = UI.make_label(str(def.energy_cost), 13, UI.BG_DARK)
	cost_lbl.set_anchors_preset(Control.PRESET_FULL_RECT)
	cost_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	cost_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	cost_pip.add_child(cost_lbl)
	cost_row.add_child(cost_pip)
	if def.owner != -1:
		var owner_name = CreatureDB.get_name(def.owner, Enums.EvolutionStage.STAGE0)
		cost_row.add_child(UI.make_label(owner_name[0], 12, card_color))
	vbox.add_child(cost_row)

	var name_lbl = UI.make_label(def.name, 12, UI.TEXT_LIGHT)
	name_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD
	name_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(name_lbl)

	var desc_lbl = UI.make_label(def.description, 10, UI.TEXT_DIM)
	desc_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD
	desc_lbl.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vbox.add_child(desc_lbl)

	var rarity_color: Color
	match def.rarity:
		Enums.Rarity.COMMON:    rarity_color = Color("#aaaaaa")
		Enums.Rarity.UNCOMMON:  rarity_color = Color("#4da6ff")
		Enums.Rarity.RARE:      rarity_color = Color("#cc44ff")
		Enums.Rarity.SIGNATURE: rarity_color = UI.ACCENT_GOLD
		_: rarity_color = UI.TEXT_DIM
	var rarity_dot = UI.make_label("●", 10, rarity_color)
	rarity_dot.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(rarity_dot)

	if not can_play:
		panel.modulate = Color(1, 1, 1, 0.5)
	else:
		panel.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		var card_ref = card
		var def_ref = def
		panel.gui_input.connect(func(event):
			if event is InputEventMouseButton \
					and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
				_on_card_click(card_ref, def_ref)
		)

	return panel

func _on_card_click(card: CardInstance, def: CardDefinition) -> void:
	if Enums.CardTag.ATTACK in def.tags:
		_selected_card_id = "" if _selected_card_id == card.instance_id else card.instance_id
		_rebuild()
	else:
		_selected_card_id = ""
		CombatManager.play_card(card.instance_id, "")

func _status_row(statuses: Array) -> HBoxContainer:
	var row = UI.make_hbox(4)
	for s in statuses:
		var emoji: String
		var tooltip: String
		match s.type:
			Enums.StatusType.BURN:
				emoji = "🔥"
				tooltip = "Burn: deals %d damage at start of turn, then decreases by 1" % s.stacks
			Enums.StatusType.SHOCK:
				emoji = "⚡"
				tooltip = "Shock: held until detonated by Wraith Pulse (3 dmg/stack)"
			Enums.StatusType.THORNS:
				emoji = "🌵"
				tooltip = "Thorns: reflects %d damage to attackers on each hit" % s.stacks
			Enums.StatusType.REGEN:
				emoji = "💚"
				tooltip = "Regen: restores %d HP at start of turn, then decreases by 1" % s.stacks
			Enums.StatusType.WEAK:
				emoji = "💀"
				tooltip = "Weak: this unit deals 25% less damage"
			Enums.StatusType.VULNERABLE:
				emoji = "🎯"
				tooltip = "Vulnerable: this unit takes 50% more damage"
			_:
				emoji = "?"
				tooltip = ""
		var lbl = UI.make_label("%s%d" % [emoji, s.stacks], 11, UI.TEXT_DIM)
		lbl.tooltip_text = tooltip
		row.add_child(lbl)
	return row

func _is_attack_card(instance_id: String) -> bool:
	var state = CombatManager.state
	var def_id = ""
	for c in state.hand:
		if c.instance_id == instance_id:
			def_id = c.definition_id
			break
	if def_id == "":
		return false
	return Enums.CardTag.ATTACK in CardDB.get_card(def_id).tags

func _build_log(state: CombatState) -> void:
	var log_box = UI.make_vbox(2)
	log_box.custom_minimum_size = Vector2(0, 60)
	_root.add_child(log_box)
	var start_idx = max(0, state.log.size() - 4)
	for i in range(start_idx, state.log.size()):
		var line = UI.make_label(state.log[i], 10, UI.TEXT_DIM)
		line.autowrap_mode = TextServer.AUTOWRAP_WORD
		log_box.add_child(line)

func _build_overlay(text: String, color: Color) -> void:
	var overlay = Panel.new()
	UI.fill_rect(overlay)
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0, 0, 0, 0.7)
	overlay.add_theme_stylebox_override("panel", style)
	add_child(overlay)

	var center = CenterContainer.new()
	UI.fill_rect(center)
	overlay.add_child(center)

	var lbl = UI.make_label(text, 56, color)
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center.add_child(lbl)
