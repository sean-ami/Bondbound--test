extends Node

var _base: Dictionary = {}

func _ready() -> void:
	_reg(Enums.CreatureId.KINDLPUP,  Enums.EvolutionStage.STAGE0, "Kindlpup",    "🔥", "#e85d04", 55)
	_reg(Enums.CreatureId.KINDLPUP,  Enums.EvolutionStage.STAGE1, "Emberwolf",   "🔥", "#f48c06", 80)
	_reg(Enums.CreatureId.KINDLPUP,  Enums.EvolutionStage.STAGE2, "Direstorm",   "🔥", "#ffba08", 110)
	_reg(Enums.CreatureId.MOSSCUB,   Enums.EvolutionStage.STAGE0, "Mosscub",     "🌿", "#2d6a4f", 75)
	_reg(Enums.CreatureId.MOSSCUB,   Enums.EvolutionStage.STAGE1, "Bramblbear",  "🌿", "#52b788", 100)
	_reg(Enums.CreatureId.MOSSCUB,   Enums.EvolutionStage.STAGE2, "Grizzquake",  "🌿", "#74c69d", 130)
	_reg(Enums.CreatureId.SPARKWISP, Enums.EvolutionStage.STAGE0, "Sparkwisp",   "⚡", "#7b2d8b", 45)
	_reg(Enums.CreatureId.SPARKWISP, Enums.EvolutionStage.STAGE1, "Arcgeist",    "⚡", "#9b59b6", 65)
	_reg(Enums.CreatureId.SPARKWISP, Enums.EvolutionStage.STAGE2, "Wraithbolt",  "⚡", "#d7bde2", 90)

func _reg(creature_id: int, stage: int, p_name: String, emoji: String, color: String, max_hp: int) -> void:
	var s = CreatureStats.new()
	s.id = creature_id
	s.name = p_name
	s.emoji = emoji
	s.color = color
	s.stage = stage
	s.max_hp = max_hp
	s.current_hp = max_hp
	_base[Vector2i(creature_id, stage)] = s

func get_base(creature_id: int, stage: int) -> CreatureStats:
	return _base[Vector2i(creature_id, stage)].clone()

func create_fresh(creature_id: int) -> CreatureStats:
	return get_base(creature_id, Enums.EvolutionStage.STAGE0)

func get_name(creature_id: int, stage: int) -> String:
	return _base[Vector2i(creature_id, stage)].name
