class_name StatusStack

var type: int
var stacks: int

func _init(p_type: int, p_stacks: int) -> void:
	type = p_type
	stacks = p_stacks

func clone() -> StatusStack:
	return StatusStack.new(type, stacks)
