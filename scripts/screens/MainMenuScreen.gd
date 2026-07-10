class_name MainMenuScreen
extends Control

func _ready() -> void:
	UI.make_bg_panel(self)

	var center = CenterContainer.new()
	UI.fill_rect(center)
	add_child(center)

	var vbox = UI.make_vbox(24)
	vbox.custom_minimum_size = Vector2(400, 0)
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_child(vbox)

	var title = UI.make_label("🔥 BondBound ⚡", 48, UI.ACCENT_FIRE)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title)

	var sub = UI.make_label("Creature Deckbuilder Roguelike", 18, UI.TEXT_DIM)
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(sub)

	var spacer = Control.new()
	spacer.custom_minimum_size = Vector2(0, 20)
	vbox.add_child(spacer)

	var start_btn = UI.make_button("▶  New Run", UI.ACCENT_FIRE)
	start_btn.custom_minimum_size = Vector2(220, 52)
	start_btn.pressed.connect(func(): GameState.start_new_run())
	vbox.add_child(start_btn)

	var creatures = UI.make_label("🔥 Kindlpup  •  🌿 Mosscub  •  ⚡ Sparkwisp", 14, UI.TEXT_DIM)
	creatures.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(creatures)
