extends Node

signal phase_changed(phase: int)
signal state_updated

var phase: int = Enums.GamePhase.MAIN_MENU
var creatures: Array = []
var deck: Array = []
var gold: int = 0
var map: MapState = MapState.new()
var last_battle_result: BattleResult = null
var pending_evolutions: Array = []
var just_evolved_creature: int = -1
var items: Array = []

var _rng: RandomNumberGenerator = RandomNumberGenerator.new()
var _instance_counter: int = 0
var _combat_connected: bool = false

static var _item_catalog: Dictionary = {
	"revive_shard": {
		"id": "revive_shard", "name": "Revive Shard", "emoji": "💎",
		"description": "Revive one KO'd creature with 25% of their max HP. Used between battles.",
		"shop_cost": 70
	}
}

func get_item_def(item_id: String) -> Dictionary:
	return _item_catalog.get(item_id, {})

static func get_all_item_defs() -> Dictionary:
	return _item_catalog

# ── Phase transitions ─────────────────────────────────────────────────────────

func start_new_run() -> void:
	_instance_counter = 0
	gold = 100
	pending_evolutions.clear()
	just_evolved_creature = -1
	last_battle_result = null
	items = []

	creatures = []
	for cid in [Enums.CreatureId.KINDLPUP, Enums.CreatureId.MOSSCUB, Enums.CreatureId.SPARKWISP]:
		creatures.append(CreatureDB.create_fresh(cid))

	deck = []
	for creature in creatures:
		for card_def in CardDB.get_signature_cards(creature.id, Enums.EvolutionStage.STAGE0):
			deck.append(_new_instance(card_def.id))

	_generate_map()
	_set_phase(Enums.GamePhase.MAP)

func enter_node(node_id: String) -> void:
	var node = _find_node(node_id)
	if node == null or not (node_id in map.available_node_ids):
		return

	map.current_node_id = node_id

	match node.type:
		Enums.NodeType.BATTLE, Enums.NodeType.ELITE, Enums.NodeType.BOSS:
			_start_battle(node)
		Enums.NodeType.SHOP:
			_set_phase(Enums.GamePhase.SHOP)
		Enums.NodeType.REST:
			_set_phase(Enums.GamePhase.REST)
		Enums.NodeType.EVENT:
			_set_phase(Enums.GamePhase.EVENT)

func _start_battle(node: MapNode) -> void:
	if not _combat_connected:
		CombatManager.combat_ended.connect(_on_combat_ended)
		_combat_connected = true

	var enemy_defs = _pick_enemies_for(node)
	var creature_clones = []
	for c in creatures:
		creature_clones.append(c.clone())
	var deck_copy = []
	for c in deck:
		deck_copy.append(CardInstance.new(c.instance_id, c.definition_id))

	CombatManager.init_combat(creature_clones, deck_copy, enemy_defs)
	_set_phase(Enums.GamePhase.COMBAT)

func _on_combat_ended(victory: bool) -> void:
	if not victory:
		_set_phase(Enums.GamePhase.GAME_OVER)
		return

	var combat_creatures = CombatManager.state.creatures
	for cc in combat_creatures:
		for gs_c in creatures:
			if gs_c.id == cc.id:
				gs_c.current_hp = cc.current_hp
				gs_c.is_knocked_out = cc.is_knocked_out
				gs_c.statuses = []
				for s in cc.statuses:
					gs_c.statuses.append(s.clone())

	var node = _find_node(map.current_node_id)
	if node != null:
		node.cleared = true

	_advance_available_nodes(node)
	if phase == Enums.GamePhase.VICTORY:
		return

	last_battle_result = _build_battle_result(node)
	_set_phase(Enums.GamePhase.BOND_SUMMARY)

func allocate_bond(target_id: int) -> void:
	if last_battle_result == null: return

	var creature = _find_creature(target_id)
	var earned = last_battle_result.bond_total
	creature.bond_accumulated += earned

	pending_evolutions.clear()
	if creature.stage == Enums.EvolutionStage.STAGE0 and creature.bond_accumulated >= 70:
		pending_evolutions.append(target_id)
	elif creature.stage == Enums.EvolutionStage.STAGE1 and creature.bond_accumulated >= 135:
		pending_evolutions.append(target_id)

	last_battle_result = null

	if pending_evolutions.size() > 0:
		var evolve_id = pending_evolutions[0]
		pending_evolutions.remove_at(0)
		_apply_evolution(evolve_id)
		_set_phase(Enums.GamePhase.EVOLUTION)
	else:
		_set_phase(Enums.GamePhase.DRAFT)

func confirm_evolution() -> void:
	if pending_evolutions.size() > 0:
		var evolve_id = pending_evolutions[0]
		pending_evolutions.remove_at(0)
		_apply_evolution(evolve_id)
		state_updated.emit()
	else:
		just_evolved_creature = -1
		_set_phase(Enums.GamePhase.DRAFT)

func after_draft(card_id: String) -> void:
	if card_id != "" and deck.size() < 20:
		deck.append(_new_instance(card_id))
	_set_phase(Enums.GamePhase.MAP)

func after_rest(heal: bool) -> void:
	if heal:
		for c in creatures:
			var heal_amt = int(c.max_hp * 0.30)
			c.current_hp = min(c.max_hp, c.current_hp + heal_amt)
	_mark_current_cleared()
	_set_phase(Enums.GamePhase.MAP)

func rest_grant_bond(target_id: int) -> void:
	_find_creature(target_id).bond_accumulated += 5
	_mark_current_cleared()
	_set_phase(Enums.GamePhase.MAP)

func after_shop() -> void:
	_mark_current_cleared()
	_set_phase(Enums.GamePhase.MAP)

func after_event() -> void:
	_mark_current_cleared()
	_set_phase(Enums.GamePhase.MAP)

func event_grant_bond(target_id: int, amount: int) -> void:
	_find_creature(target_id).bond_accumulated += amount

func event_heal_all(amount: int) -> void:
	for c in creatures:
		c.current_hp = min(c.max_hp, c.current_hp + amount)

func buy_card(card_id: String, cost: int) -> void:
	if gold >= cost and deck.size() < 20:
		gold -= cost
		deck.append(_new_instance(card_id))
		state_updated.emit()

func remove_card(instance_id: String, cost: int) -> void:
	if gold >= cost:
		gold -= cost
		for i in range(deck.size() - 1, -1, -1):
			if deck[i].instance_id == instance_id:
				deck.remove_at(i)
				break
		state_updated.emit()

func use_revive_shard(target_id: int) -> void:
	var creature = _find_creature(target_id)
	if creature == null or not creature.is_knocked_out: return
	var shard = null
	for item in items:
		if item.definition_id == "revive_shard":
			shard = item
			break
	if shard == null: return
	creature.is_knocked_out = false
	creature.current_hp = max(1, int(creature.max_hp * 0.25))
	items.erase(shard)
	state_updated.emit()

func buy_item(item_id: String) -> void:
	var def = _item_catalog.get(item_id, {})
	if def.is_empty(): return
	var shard_count = 0
	for item in items:
		if item.definition_id == item_id: shard_count += 1
	if gold < def["shop_cost"] or items.size() >= 6 or shard_count >= 2: return
	gold -= def["shop_cost"]
	var inst = ItemInstance.new()
	inst.definition_id = item_id
	items.append(inst)
	state_updated.emit()

func go_to_main_menu() -> void:
	_set_phase(Enums.GamePhase.MAIN_MENU)

# ── Map generation ────────────────────────────────────────────────────────────

func _generate_map() -> void:
	map = MapState.new()
	map.current_act = 1

	for act in range(1, 4):
		var act_nodes = []
		for row in range(10):
			for col in range(3):
				var node = MapNode.new()
				node.id  = "a%dr%dc%d" % [act, row, col]
				node.act = act; node.row = row; node.col = col
				node.type = Enums.NodeType.BATTLE if row == 0 \
						else Enums.NodeType.BOSS if row == 9 \
						else _roll_node_type()
				act_nodes.append(node)

		for row in range(9):
			var row_nodes  = act_nodes.filter(func(n): return n.row == row)
			var next_nodes = act_nodes.filter(func(n): return n.row == row + 1)
			for node in row_nodes:
				node.connections.append("a%dr%dc%d" % [act, row + 1, node.col])
				if _rng.randi_range(0, 99) < 40:
					var adj = node.col + (-1 if _rng.randi_range(0, 1) == 0 else 1)
					if adj >= 0 and adj <= 2:
						var adj_id = "a%dr%dc%d" % [act, row + 1, adj]
						if not (adj_id in node.connections):
							node.connections.append(adj_id)
			for next in next_nodes:
				var reachable = false
				for n in row_nodes:
					if next.id in n.connections: reachable = true; break
				if not reachable:
					var src = row_nodes[0]
					var best_dist = abs(row_nodes[0].col - next.col)
					for n in row_nodes:
						if abs(n.col - next.col) < best_dist:
							best_dist = abs(n.col - next.col)
							src = n
					if not (next.id in src.connections):
						src.connections.append(next.id)
		map.acts.append(act_nodes)

	map.available_node_ids = []
	for n in map.acts[0]:
		if n.row == 0:
			map.available_node_ids.append(n.id)

func _roll_node_type() -> int:
	var r = _rng.randi_range(0, 99)
	if r < 45: return Enums.NodeType.BATTLE
	elif r < 55: return Enums.NodeType.ELITE
	elif r < 70: return Enums.NodeType.SHOP
	elif r < 85: return Enums.NodeType.REST
	else: return Enums.NodeType.EVENT

# ── Helpers ───────────────────────────────────────────────────────────────────

func _find_node(id: String) -> MapNode:
	for act in map.acts:
		for node in act:
			if node.id == id: return node
	return null

func _find_creature(creature_id: int) -> CreatureStats:
	for c in creatures:
		if c.id == creature_id: return c
	return null

func _advance_available_nodes(cleared: MapNode) -> void:
	map.available_node_ids.clear()
	for conn_id in cleared.connections:
		map.available_node_ids.append(conn_id)

	if map.available_node_ids.size() == 0 and cleared.type == Enums.NodeType.BOSS:
		var next_act = cleared.act + 1
		if next_act <= 3:
			map.current_act = next_act
			for n in map.acts[next_act - 1]:
				if n.row == 0:
					map.available_node_ids.append(n.id)
		else:
			_set_phase(Enums.GamePhase.VICTORY)

func _mark_current_cleared() -> void:
	if map.current_node_id == "": return
	var node = _find_node(map.current_node_id)
	if node != null:
		node.cleared = true
		_advance_available_nodes(node)

func _pick_enemies_for(node: MapNode) -> Array:
	var is_elite = node.type == Enums.NodeType.ELITE
	var is_boss  = node.type == Enums.NodeType.BOSS
	var pool = EnemyDB.get_for_node(map.current_act, is_elite, is_boss)
	if pool.size() == 0: pool = EnemyDB.get_for_node(1, is_elite, is_boss)
	if pool.size() == 0: pool = EnemyDB.get_for_node(1, false, false)

	if is_boss or is_elite:
		return [pool[_rng.randi_range(0, pool.size() - 1)]]

	var count: int
	if node.row == 0:
		count = 1
	elif node.row <= 3:
		count = 1 if _rng.randi_range(0, 1) == 0 else 2
	elif node.row <= 6:
		count = 2
	else:
		count = 2 if _rng.randi_range(0, 9) < 6 else 3

	var result = []
	for _i in range(count):
		result.append(pool[_rng.randi_range(0, pool.size() - 1)])
	return result

func _build_battle_result(node: MapNode) -> BattleResult:
	var bond_base = 5
	var bonuses = []
	var mult = CombatManager.state.bond_multiplier

	var no_ko = true
	for c in creatures:
		if c.is_knocked_out: no_ko = false; break
	if no_ko:
		var b = BondBonus.new(); b.label = "No KO"; b.amount = 1; bonuses.append(b)

	var is_elite = node.type == Enums.NodeType.ELITE
	var is_boss  = node.type == Enums.NodeType.BOSS
	if is_elite or is_boss:
		var b = BondBonus.new()
		b.label = "Boss" if is_boss else "Elite"; b.amount = 3; bonuses.append(b)

	var amb = BondBonus.new(); amb.label = "Ambient"; amb.amount = 1; bonuses.append(amb)

	var bonus_sum = 0
	for b in bonuses: bonus_sum += b.amount
	var total = int((bond_base + bonus_sum) * mult)

	var base_gold  = 40 if is_boss else 26 if is_elite else 14
	var par_turns  = 12 if is_boss else 9 if is_elite else 7
	var perf_bonus = int(base_gold * 0.30) if CombatManager.state.turn <= par_turns else 0
	var total_gold = base_gold + perf_bonus
	gold += total_gold

	var result = BattleResult.new()
	result.victory = true
	result.bond_base = bond_base
	result.bond_bonuses = bonuses
	result.bond_total = total
	result.no_ko = no_ko
	result.was_elite = is_elite
	result.was_boss  = is_boss
	result.bond_multiplier = mult
	result.gold_earned = total_gold
	result.gold_breakdown = ("Base: %d + Performance: +%d" % [base_gold, perf_bonus]) \
		if perf_bonus > 0 else ("Base: %d" % base_gold)
	return result

func _apply_evolution(id: int) -> void:
	var creature = _find_creature(id)
	var old_stage = creature.stage
	var new_stage = Enums.EvolutionStage.STAGE1 if old_stage == Enums.EvolutionStage.STAGE0 \
		else Enums.EvolutionStage.STAGE2

	var new_base = CreatureDB.get_base(id, new_stage)
	var hp_fraction = float(creature.current_hp) / float(creature.max_hp)
	creature.stage     = new_stage
	creature.name      = new_base.name
	creature.max_hp    = new_base.max_hp
	creature.current_hp = max(1, int(new_base.max_hp * hp_fraction))

	for card in deck:
		var def = CardDB.get_card(card.definition_id)
		if def.owner != id: continue
		var upgraded = CardDB.get_evolution_id(card.definition_id, new_stage)
		if upgraded != card.definition_id:
			card.definition_id = upgraded

	just_evolved_creature = id

func _new_instance(definition_id: String) -> CardInstance:
	var inst = CardInstance.new("ci_%d" % _instance_counter, definition_id)
	_instance_counter += 1
	return inst

func _set_phase(p: int) -> void:
	phase = p
	phase_changed.emit(p)
