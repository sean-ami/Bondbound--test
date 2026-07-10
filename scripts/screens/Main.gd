extends Control

var _current: Control = null

func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	GameState.phase_changed.connect(_on_phase_changed)
	_show_screen(MainMenuScreen.new())

func _on_phase_changed(phase: int) -> void:
	var screen: Control
	match phase:
		Enums.GamePhase.MAIN_MENU:    screen = MainMenuScreen.new()
		Enums.GamePhase.MAP:          screen = MapScreen.new()
		Enums.GamePhase.COMBAT:       screen = BattleScreen.new()
		Enums.GamePhase.BOND_SUMMARY: screen = BondScreen.new()
		Enums.GamePhase.EVOLUTION:    screen = EvolutionScreen.new()
		Enums.GamePhase.DRAFT:        screen = DraftScreen.new()
		Enums.GamePhase.SHOP:         screen = ShopScreen.new()
		Enums.GamePhase.REST:         screen = RestScreen.new()
		Enums.GamePhase.EVENT:        screen = EventScreen.new()
		Enums.GamePhase.VICTORY:      screen = VictoryScreen.new()
		Enums.GamePhase.GAME_OVER:    screen = GameOverScreen.new()
		_:                            screen = MainMenuScreen.new()
	_show_screen(screen)

func _show_screen(screen: Control) -> void:
	if _current:
		_current.queue_free()
	screen.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(screen)
	_current = screen
