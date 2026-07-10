class_name VictoryScreen
extends Control

func _ready() -> void:
	UI.make_bg_panel(self)

	var center = CenterContainer.new()
	UI.fill_rect(center)
	add_child(center)

	var vbox = UI.make_vbox(20)
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_child(vbox)

	var title = UI.make_label("🏆 Victory!", 52, UI.ACCENT_GOLD)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title)

	var msg = UI.make_label(
		"You defeated the Void Architect!\nThe bond between you and your creatures is unbreakable.",
		18, UI.TEXT_DIM)
	msg.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	msg.autowrap_mode = TextServer.AUTOWRAP_WORD
	vbox.add_child(msg)

	var play_btn = UI.make_button("↩  Play Again", UI.ACCENT_FIRE)
	play_btn.custom_minimum_size = Vector2(200, 48)
	play_btn.pressed.connect(func(): GameState.start_new_run())
	vbox.add_child(play_btn)

	var menu_btn = UI.make_button("Main Menu")
	menu_btn.custom_minimum_size = Vector2(200, 40)
	menu_btn.pressed.connect(func(): GameState.go_to_main_menu())
	vbox.add_child(menu_btn)
