extends Node

var _defs: Dictionary = {}

func _ready() -> void:
	_register_all()

func _register_all() -> void:
	_reg(_make("slimeling", "Slimeling", "🟢", 50, [1], false, false, [
		_act(Enums.EnemyIntentType.ATTACK, 7),
		_act(Enums.EnemyIntentType.ATTACK, 7),
		_act(Enums.EnemyIntentType.BLOCK,  6),
	]))
	_reg(_make("stone_brute", "Stone Brute", "🪨", 82, [1], false, false, [
		_act(Enums.EnemyIntentType.BLOCK,  9),
		_act(Enums.EnemyIntentType.ATTACK, 14),
		_act(Enums.EnemyIntentType.BLOCK,  9),
		_act(Enums.EnemyIntentType.ATTACK, 14),
	]))
	_reg(_make("flame_sprite", "Flame Sprite", "🔥", 62, [1, 2], false, false, [
		_acts(Enums.EnemyIntentType.BURN,   6,  Enums.StatusType.BURN, 2),
		_act(Enums.EnemyIntentType.ATTACK,  9),
		_acts(Enums.EnemyIntentType.BURN,   4,  Enums.StatusType.BURN, 1),
		_act(Enums.EnemyIntentType.ATTACK, 11),
	]))
	_reg(_make("storm_crow", "Storm Crow", "🦅", 72, [2], false, false, [
		_acts(Enums.EnemyIntentType.SHOCK,       8,  Enums.StatusType.SHOCK, 2),
		_act(Enums.EnemyIntentType.ATTACK,      10),
		_actm(Enums.EnemyIntentType.MULTI_ATTACK, 5, 2),
	]))
	_reg(_make("earth_golem", "Earth Golem", "🗿", 120, [1, 2], true, false, [
		_act(Enums.EnemyIntentType.BLOCK,      12),
		_act(Enums.EnemyIntentType.BIG_ATTACK, 18),
		_act(Enums.EnemyIntentType.BLOCK,      12),
		_act(Enums.EnemyIntentType.BIG_ATTACK, 22),
	]))
	_reg(_make("shadow_wraith", "Shadow Wraith", "👻", 100, [2, 3], true, false, [
		_acts(Enums.EnemyIntentType.SHOCK,   0,  Enums.StatusType.SHOCK, 3),
		_acts(Enums.EnemyIntentType.ATTACK, 12,  Enums.StatusType.SHOCK, 1),
		_act(Enums.EnemyIntentType.ATTACK,  14),
		_act(Enums.EnemyIntentType.BLOCK,    8),
	]))
	_reg(_make("cinder_warden", "Cinder Warden", "🦁", 160, [1], false, true, [
		_act(Enums.EnemyIntentType.ATTACK,    14),
		_acts(Enums.EnemyIntentType.BURN,      8,  Enums.StatusType.BURN, 2),
		_act(Enums.EnemyIntentType.BLOCK,     10),
		_act(Enums.EnemyIntentType.BIG_ATTACK, 22),
		_acts(Enums.EnemyIntentType.BURN,     12,  Enums.StatusType.BURN, 3),
	]))
	_reg(_make("inferno_drake", "Inferno Drake", "🐉", 200, [2], false, true, [
		_acts(Enums.EnemyIntentType.BURN,          8,  Enums.StatusType.BURN, 3),
		_act(Enums.EnemyIntentType.BIG_ATTACK,    20),
		_actm(Enums.EnemyIntentType.MULTI_ATTACK,  8, 2),
		_act(Enums.EnemyIntentType.BLOCK,         10),
		_act(Enums.EnemyIntentType.BIG_ATTACK,    24),
	]))
	_reg(_make("void_architect", "Void Architect", "🌀", 260, [3], false, true, [
		_acts(Enums.EnemyIntentType.SHOCK,         0,  Enums.StatusType.SHOCK, 4),
		_act(Enums.EnemyIntentType.ATTACK,        15),
		_act(Enums.EnemyIntentType.BUFF,           0),
		_act(Enums.EnemyIntentType.BIG_ATTACK,    26),
		_actm(Enums.EnemyIntentType.MULTI_ATTACK, 10, 3),
		_act(Enums.EnemyIntentType.BLOCK,         16),
	]))

func _make(id: String, p_name: String, emoji: String, base_hp: int, acts: Array,
		is_elite: bool, is_boss: bool, pattern: Array) -> EnemyDefinition:
	var d = EnemyDefinition.new()
	d.id = id; d.name = p_name; d.emoji = emoji; d.base_hp = base_hp
	d.acts = acts; d.is_elite = is_elite; d.is_boss = is_boss; d.pattern = pattern
	return d

func _act(type: int, value: int) -> EnemyAction:
	var a = EnemyAction.new(); a.type = type; a.value = value; return a

func _actm(type: int, value: int, hits: int) -> EnemyAction:
	var a = EnemyAction.new(); a.type = type; a.value = value; a.hits = hits; return a

func _acts(type: int, value: int, status: int, stacks: int) -> EnemyAction:
	var a = EnemyAction.new(); a.type = type; a.value = value
	a.status_to_apply = status; a.status_stacks = stacks; return a

func _reg(def: EnemyDefinition) -> void:
	_defs[def.id] = def

func get_def(id: String) -> EnemyDefinition:
	return _defs[id]

func get_for_node(act: int, is_elite: bool, is_boss: bool) -> Array:
	var result = []
	for def in _defs.values():
		if act in def.acts and def.is_elite == is_elite and def.is_boss == is_boss:
			result.append(def)
	return result

func create_instance(definition_id: String, instance_id: String) -> EnemyState:
	var def = get_def(definition_id)
	var state = EnemyState.new()
	state.definition_id = definition_id
	state.instance_id   = instance_id
	state.name          = def.name
	state.emoji         = def.emoji
	state.max_hp        = def.base_hp
	state.current_hp    = def.base_hp
	state.intent        = build_intent(def, 0)
	return state

func build_intent(def: EnemyDefinition, pattern_index: int) -> EnemyIntent:
	var action = def.pattern[pattern_index % def.pattern.size()]
	var label = ""
	match action.type:
		Enums.EnemyIntentType.ATTACK:       label = "⚔️ %d" % action.value
		Enums.EnemyIntentType.BIG_ATTACK:   label = "💥 %d" % action.value
		Enums.EnemyIntentType.MULTI_ATTACK: label = "⚔️×%d %d" % [action.hits, action.value]
		Enums.EnemyIntentType.BLOCK:        label = "🛡 %d" % action.value
		Enums.EnemyIntentType.BURN:         label = "🔥 %d Burn" % action.status_stacks
		Enums.EnemyIntentType.SHOCK:        label = "⚡ %d Shock" % action.status_stacks
		Enums.EnemyIntentType.BUFF:         label = "✨ Buff"
		_:                                  label = "?"
	var intent = EnemyIntent.new()
	intent.type = action.type; intent.value = action.value
	intent.hits = action.hits; intent.label = label
	return intent
