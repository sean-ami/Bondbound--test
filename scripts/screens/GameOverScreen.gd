class_name GameOverScreen
extends Control

func _ready() -> void:
	UI.make_bg_panel(self)

	var center = CenterContainer.new()
	UI.fill_rect(center)
	add_child(center)

	var vbox = UI.make_vbox(20)
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_child(vbox)

	var title = UI.make_label("💀 Game Over", 48, Color("#d00000"))
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title)

	var msg = UI.make_label("All creatures were knocked out.", 18, UI.TEXT_DIM)
	msg.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(msg)

	var btn = UI.make_button("↩  Main Menu", UI.ACCENT_FIRE)
	btn.custom_minimum_size = Vector2(200, 48)
	btn.pressed.connect(func(): GameState.go_to_main_menu())
	vbox.add_child(btn)
