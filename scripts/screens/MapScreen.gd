class_name MapScreen
extends Control

var _canvas: Control = null

func _ready() -> void:
	UI.make_bg_panel(self)

	var top_bar = Panel.new()
	top_bar.custom_minimum_size = Vector2(0, 48)
	top_bar.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	add_child(top_bar)
	var tb_style = StyleBoxFlat.new()
	tb_style.bg_color = UI.BG_PANEL
	top_bar.add_theme_stylebox_override("panel", tb_style)

	var top_hbox = UI.make_hbox(16)
	top_hbox.set_anchors_preset(Control.PRESET_FULL_RECT)
	top_hbox.add_theme_constant_override("margin_left", 16)
	top_bar.add_child(top_hbox)

	top_hbox.add_child(UI.make_label("Act %d  —  BondBound" % GameState.map.current_act, 18, UI.ACCENT_GOLD))
	var spacer = Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND
	top_hbox.add_child(spacer)
	top_hbox.add_child(UI.make_label("💰 %d" % GameState.gold, 16))
	for c in GameState.creatures:
		top_hbox.add_child(UI.make_label(
			"%s %d/%d" % [c.emoji, c.current_hp, c.max_hp], 14, UI.creature_color(c.id)))

	var scroll = ScrollContainer.new()
	scroll.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	scroll.offset_top = 48
	add_child(scroll)

	_canvas = MapCanvas.new(GameState.map, func(node_id): GameState.enter_node(node_id))
	_canvas.custom_minimum_size = Vector2(700, 660)
	scroll.add_child(_canvas)


class MapCanvas extends Control:
	var _map: MapState
	var _on_click: Callable
	var _pos: Dictionary = {}
	var _all_nodes: Array = []

	func _init(map: MapState, on_click: Callable) -> void:
		_map = map
		_on_click = on_click
		clip_children = Control.CLIP_CHILDREN_ONLY

	func _ready() -> void:
		var act_idx = _map.current_act - 1
		if act_idx < 0 or act_idx >= _map.acts.size():
			return

		var act_nodes = _map.acts[act_idx]
		_all_nodes.assign(act_nodes)

		for node in act_nodes:
			var p = _node_pos(node.row, node.col)
			_pos[node.id] = p

			var available = node.id in _map.available_node_ids
			var is_current = node.id == _map.current_node_id

			var btn = Button.new()
			btn.text = _node_emoji(node.type)
			btn.tooltip_text = _node_type_name(node.type)
			btn.custom_minimum_size = Vector2(48, 48)
			btn.position = p - Vector2(24, 24)

			var bg: Color
			if is_current:
				bg = UI.ACCENT_GOLD
			elif available:
				bg = Color("#2a5298")
			elif node.cleared:
				bg = Color("#1a3030")
			else:
				bg = Color("#111122")

			var style = StyleBoxFlat.new()
			style.bg_color = bg
			style.set_corner_radius_all(24)
			btn.add_theme_stylebox_override("normal", style)

			if available and not is_current:
				var hover = StyleBoxFlat.new()
				hover.bg_color = bg.lightened(0.2)
				hover.set_corner_radius_all(24)
				btn.add_theme_stylebox_override("hover", hover)
				var nid = node.id
				btn.pressed.connect(func(): _on_click.call(nid))
			else:
				btn.disabled = true

			add_child(btn)

		queue_redraw()

	func _draw() -> void:
		var line_color = Color(0.2, 0.25, 0.4, 0.8)
		for node in _all_nodes:
			if node.id not in _pos:
				continue
			var from_pos: Vector2 = _pos[node.id]
			for conn_id in node.connections:
				if conn_id not in _pos:
					continue
				draw_line(from_pos, _pos[conn_id], line_color, 2.0)

	static func _node_pos(row: int, col: int) -> Vector2:
		return Vector2(80 + col * 270, 600 - row * 58)

	static func _node_emoji(t: int) -> String:
		match t:
			Enums.NodeType.BATTLE: return "⚔️"
			Enums.NodeType.ELITE:  return "💀"
			Enums.NodeType.SHOP:   return "🛒"
			Enums.NodeType.REST:   return "🏕️"
			Enums.NodeType.EVENT:  return "❓"
			Enums.NodeType.BOSS:   return "👑"
			_: return "?"

	static func _node_type_name(t: int) -> String:
		match t:
			Enums.NodeType.BATTLE: return "Battle"
			Enums.NodeType.ELITE:  return "Elite"
			Enums.NodeType.SHOP:   return "Shop"
			Enums.NodeType.REST:   return "Rest"
			Enums.NodeType.EVENT:  return "Event"
			Enums.NodeType.BOSS:   return "Boss"
			_: return "Unknown"
