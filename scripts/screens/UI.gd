extends Node

const BG_DARK:    Color = Color("#1a1a2e")
const BG_PANEL:   Color = Color("#16213e")
const BG_CARD:    Color = Color("#0f3460")
const TEXT_LIGHT:  Color = Color("#eaeaea")
const TEXT_DIM:    Color = Color("#9090a0")
const ACCENT_FIRE: Color = Color("#e85d04")
const ACCENT_GOLD: Color = Color("#ffba08")
const HP_GREEN:    Color = Color("#40916c")
const HP_RED:      Color = Color("#d00000")
const BLOCK_BLUE:  Color = Color("#4895ef")

func creature_color(creature_id: int) -> Color:
	match creature_id:
		Enums.CreatureId.KINDLPUP:  return Color("#e85d04")
		Enums.CreatureId.MOSSCUB:   return Color("#2d6a4f")
		Enums.CreatureId.SPARKWISP: return Color("#7b2d8b")
		_: return Color("#aaaaaa")

func make_panel(bg: Color, radius: int = 8) -> Panel:
	var p = Panel.new()
	var style = StyleBoxFlat.new()
	style.bg_color = bg
	style.set_corner_radius_all(radius)
	p.add_theme_stylebox_override("panel", style)
	return p

func make_label(text: String, size: int = 14, color: Color = Color("#eaeaea")) -> Label:
	var l = Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	return l

func make_button(text: String, bg: Color = Color(0, 0, 0, 0)) -> Button:
	var b = Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(120, 36)
	if bg.a > 0.0:
		var style = StyleBoxFlat.new()
		style.bg_color = bg
		style.set_corner_radius_all(6)
		b.add_theme_stylebox_override("normal", style)
		var hover = StyleBoxFlat.new()
		hover.bg_color = bg.lightened(0.15)
		hover.set_corner_radius_all(6)
		b.add_theme_stylebox_override("hover", hover)
	return b

func make_bar(value: float, max_val: float, fill: Color, height: int = 10) -> ProgressBar:
	var bar = ProgressBar.new()
	bar.min_value = 0.0
	bar.max_value = max_val
	bar.value = value
	bar.custom_minimum_size = Vector2(0, height)
	bar.show_percentage = false
	var fill_style = StyleBoxFlat.new()
	fill_style.bg_color = fill
	var bg_style = StyleBoxFlat.new()
	bg_style.bg_color = Color("#333355")
	bar.add_theme_stylebox_override("fill", fill_style)
	bar.add_theme_stylebox_override("background", bg_style)
	return bar

func fill_rect(node: Control) -> void:
	node.set_anchors_preset(Control.PRESET_FULL_RECT)

func make_bg_panel(parent: Control) -> Panel:
	var bg = make_panel(BG_DARK, 0)
	fill_rect(bg)
	parent.add_child(bg)
	return bg

func make_vbox(separation: int = 8) -> VBoxContainer:
	var v = VBoxContainer.new()
	v.add_theme_constant_override("separation", separation)
	return v

func make_hbox(separation: int = 8) -> HBoxContainer:
	var h = HBoxContainer.new()
	h.add_theme_constant_override("separation", separation)
	return h
