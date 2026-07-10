class_name CardDefinition

var id: String = ""
var name: String = ""
var owner: int = -1        # -1 = generic; otherwise Enums.CreatureId
var stage: int = -1        # -1 = any stage; otherwise Enums.EvolutionStage
var energy_cost: int = 0
var rarity: int = 0        # Enums.Rarity
var description: String = ""
var tags: Array = []       # Array of Enums.CardTag ints
var effect: Callable
