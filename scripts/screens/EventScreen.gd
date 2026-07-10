class_name EventScreen
extends Control

func _ready() -> void:
	UI.make_bg_panel(self)

	var evt = _pick_event()

	var center = CenterContainer.new()
	UI.fill_rect(center)
	add_child(center)

	var vbox = UI.make_vbox(20)
	vbox.custom_minimum_size = Vector2(500, 0)
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_child(vbox)

	var title = UI.make_label("❓ %s" % evt["title"], 28, UI.ACCENT_GOLD)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title)

	var body = UI.make_label(evt["body"], 15, UI.TEXT_LIGHT)
	body.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	body.autowrap_mode = TextServer.AUTOWRAP_WORD
	vbox.add_child(body)

	for choice in evt["choices"]:
		var btn = UI.make_button(choice["label"], UI.ACCENT_FIRE)
		btn.custom_minimum_size = Vector2(300, 44)
		var action: Callable = choice["action"]
		btn.pressed.connect(func():
			action.call()
			GameState.after_event()
		)
		vbox.add_child(btn)

func _pick_event() -> Dictionary:
	var events = [
		{
			"title": "Ancient Bond Stone",
			"body": "You find a glowing stone resonating with bond energy. It pulses with connection.",
			"choices": [
				{"label": "✨ Absorb (+10 Bond to Kindlpup)",
					"action": func(): GameState.event_grant_bond(Enums.CreatureId.KINDLPUP, 10)},
				{"label": "✨ Absorb (+10 Bond to Mosscub)",
					"action": func(): GameState.event_grant_bond(Enums.CreatureId.MOSSCUB, 10)},
				{"label": "✨ Absorb (+10 Bond to Sparkwisp)",
					"action": func(): GameState.event_grant_bond(Enums.CreatureId.SPARKWISP, 10)},
				{"label": "→ Leave it", "action": func(): pass},
			]
		},
		{
			"title": "Wandering Medic",
			"body": "A traveling healer offers aid to your creatures before the next trial.",
			"choices": [
				{"label": "💚 Heal all creatures (15 HP)",
					"action": func(): GameState.event_heal_all(15)},
				{"label": "→ Decline", "action": func(): pass},
			]
		},
		{
			"title": "Storm Echo",
			"body": "A residual energy storm crackles around you. It feels volatile but invigorating.",
			"choices": [
				{"label": "⚡ Embrace (+15 Bond to Sparkwisp, take 5 dmg)",
					"action": func():
						GameState.event_grant_bond(Enums.CreatureId.SPARKWISP, 15)
						for c in GameState.creatures:
							c.current_hp = max(1, c.current_hp - 5)
				},
				{"label": "→ Pass through safely", "action": func(): pass},
			]
		},
		{
			"title": "Forest Shrine",
			"body": "A mossy shrine glows with ancient natural energy. Offerings are welcomed.",
			"choices": [
				{"label": "🌿 Offer gold (+15 Bond to Mosscub, -30 Gold)",
					"action": func():
						if GameState.gold >= 30:
							GameState.gold -= 30
							GameState.event_grant_bond(Enums.CreatureId.MOSSCUB, 15)
				},
				{"label": "💰 Take a donation (+20 Gold, Mosscub -5 Bond)",
					"action": func():
						for c in GameState.creatures:
							if c.id == Enums.CreatureId.MOSSCUB:
								c.bond_accumulated = max(0, c.bond_accumulated - 5)
								GameState.gold += 20
								break
				},
				{"label": "→ Move on", "action": func(): pass},
			]
		},
	]
	return events[randi() % events.size()]
