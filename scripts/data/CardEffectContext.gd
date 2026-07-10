class_name CardEffectContext

var state: CombatState
var source: int = 0              # Enums.CreatureId
var target_enemy_id: String = ""
var cards_played_this_turn: int = 0
var last_card_played_id: String = ""
var combo_active: bool = false

var deal_damage: Callable
var deal_damage_all_enemies: Callable
var gain_block: Callable
var apply_status_to_enemy: Callable
var apply_status_to_all_enemies: Callable
var apply_status_to_creature: Callable
var draw_cards: Callable
var gain_energy: Callable
var gain_bonus_energy_next_turn: Callable
var set_next_card_free: Callable
var set_repeat_next_card: Callable
var detonate_all_shock: Callable
var trigger_all_passives: Callable
var heal_creature: Callable
var add_bond_multiplier: Callable
var repeat_last_card: Callable
