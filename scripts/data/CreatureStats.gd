class_name CreatureStats

var id: int = 0            # Enums.CreatureId
var name: String = ""
var emoji: String = ""
var color: String = "#ffffff"
var stage: int = 0         # Enums.EvolutionStage
var max_hp: int = 0
var current_hp: int = 0
var block: int = 0
var statuses: Array = []   # Array[StatusStack]
var bond_accumulated: int = 0
var is_knocked_out: bool = false

func clone() -> CreatureStats:
	var c = CreatureStats.new()
	c.id = id
	c.name = name
	c.emoji = emoji
	c.color = color
	c.stage = stage
	c.max_hp = max_hp
	c.current_hp = current_hp
	c.block = block
	c.bond_accumulated = bond_accumulated
	c.is_knocked_out = is_knocked_out
	for s in statuses:
		c.statuses.append(s.clone())
	return c
