class_name EnemyState

var definition_id: String = ""
var instance_id: String = ""
var name: String = ""
var emoji: String = ""
var max_hp: int = 0
var current_hp: int = 0
var block: int = 0
var statuses: Array = []   # Array[StatusStack]
var intent: EnemyIntent = null
var pattern_index: int = 0

func _init() -> void:
	intent = EnemyIntent.new()

func clone() -> EnemyState:
	var e = EnemyState.new()
	e.definition_id = definition_id
	e.instance_id = instance_id
	e.name = name
	e.emoji = emoji
	e.max_hp = max_hp
	e.current_hp = current_hp
	e.block = block
	e.pattern_index = pattern_index
	e.intent = EnemyIntent.new()
	e.intent.type = intent.type
	e.intent.value = intent.value
	e.intent.hits = intent.hits
	e.intent.label = intent.label
	for s in statuses:
		e.statuses.append(s.clone())
	return e
