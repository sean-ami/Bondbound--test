class_name CombatState

var phase: int = 0         # Enums.CombatPhase.PLAYER_TURN
var turn: int = 1
var energy: int = 3
var max_energy: int = 3
var bonus_energy_next_turn: int = 0
var hand: Array = []
var draw_pile: Array = []
var discard_pile: Array = []
var exhausted_pile: Array = []
var suspended_cards: Array = []
var enemies: Array = []
var creatures: Array = []
var cards_played_this_turn: int = 0
var cards_played_last_turn: int = 0
var combo_active: bool = false
var last_card_played_id: String = ""
var next_card_free: bool = false
var repeat_next_card: bool = false
var heat_aura_used_this_turn: bool = false
var momentum_carryover: bool = false
var arc_aura_used_this_turn: bool = false
var bonus_next_attack: int = 0
var bond_multiplier: float = 1.0
var log: Array = []
