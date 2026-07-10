class_name RestScreen
extends Control

var _bond_mode: bool = false

func _ready() -> void:
	_build_ui()

func _build_ui() -> void:
	for child in get_children():
		child.queue_free()

	UI.make_bg_panel(self)

	var center = CenterContainer.new()
	UI.fill_rect(center)
	add_child(center)

	var vbox = UI.make_vbox(20)
	vbox.custom_minimum_size = Vector2(460, 0)
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_child(vbox)

	var title = UI.make_label("🏕️ Rest Site", 32, UI.ACCENT_GOLD)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title)

	if not _bond_mode:
		vbox.add_child(UI.make_label("Choose one:", 16, UI.TEXT_DIM))

		var heal_btn = UI.make_button("💚 Heal 30% HP", UI.HP_GREEN)
		heal_btn.custom_minimum_size = Vector2(220, 50)
		heal_btn.pressed.connect(func(): GameState.after_rest(true))
		vbox.add_child(heal_btn)

		var heal_desc = UI.make_label(
			"Restore 30% of each creature's max HP.", 13, UI.TEXT_DIM)
		heal_desc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vbox.add_child(heal_desc)

		var bond_btn = UI.make_button("✨ +5 Bond", Color("#7b2d8b"))
		bond_btn.custom_minimum_size = Vector2(220, 50)
		bond_btn.pressed.connect(func():
			_bond_mode = true
			_build_ui()
		)
		vbox.add_child(bond_btn)

		var bond_desc = UI.make_label(
			"Grant +5 Bond to a chosen creature.", 13, UI.TEXT_DIM)
		bond_desc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vbox.add_child(bond_desc)
	else:
		vbox.add_child(UI.make_label(
			"Choose a creature to grant +5 Bond:", 16, UI.TEXT_DIM))

		var row = UI.make_hbox(12)
		row.alignment = BoxContainer.ALIGNMENT_CENTER
		for creature in GameState.creatures:
			var col = UI.creature_color(creature.id)
			var btn = UI.make_button("%s %s" % [creature.emoji, creature.name], col)
			btn.custom_minimum_size = Vector2(140, 50)
			var c_id = creature.id
			btn.pressed.connect(func(): GameState.rest_grant_bond(c_id))
			row.add_child(btn)
		vbox.add_child(row)

		var back = UI.make_button("← Back")
		back.pressed.connect(func():
			_bond_mode = false
			_build_ui()
		)
		vbox.add_child(back)
