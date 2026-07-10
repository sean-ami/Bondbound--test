extends Node

signal combat_ended(victory: bool)
signal state_changed

var state: CombatState = null

var _rng: RandomNumberGenerator = RandomNumberGenerator.new()
var _combat_over: bool = false
var _last_card_instance_id: String = ""

func _ready() -> void:
	pass

# ── Init ──────────────────────────────────────────────────────────────────────

func init_combat(creatures: Array, deck: Array, defs: Array) -> void:
	_combat_over = false
	_last_card_instance_id = ""

	state = CombatState.new()
	state.phase     = Enums.CombatPhase.PLAYER_TURN
	state.turn      = 0
	state.max_energy = 3
	state.creatures = creatures

	for card in deck:
		state.draw_pile.append(CardInstance.new(card.instance_id, card.definition_id))
	state.draw_pile.shuffle()

	var idx = 0
	for def in defs:
		state.enemies.append(EnemyDB.create_instance(def.id, "e%d" % idx))
		idx += 1

	_start_player_turn()

# ── Player turn ───────────────────────────────────────────────────────────────

func _start_player_turn() -> void:
	state.phase = Enums.CombatPhase.PLAYER_TURN
	state.turn += 1

	for c in state.creatures:
		if not c.is_knocked_out:
			c.block = 0

	_tick_creature_statuses()

	state.energy = state.max_energy \
		+ (1 if state.momentum_carryover else 0) \
		+ state.bonus_energy_next_turn
	state.momentum_carryover    = false
	state.bonus_energy_next_turn  = 0
	state.cards_played_this_turn  = 0
	state.combo_active            = false
	state.heat_aura_used_this_turn = false
	state.arc_aura_used_this_turn  = false
	state.last_card_played_id     = ""

	_draw_cards(5)
	state_changed.emit()

func play_card(instance_id: String, target_enemy_id: String) -> void:
	if state.phase != Enums.CombatPhase.PLAYER_TURN or _combat_over:
		return

	var card = null
	for c in state.hand:
		if c.instance_id == instance_id:
			card = c
			break
	if card == null:
		return

	var def = CardDB.get_card(card.definition_id)

	var cost = def.energy_cost
	if state.next_card_free:
		cost = 0
		state.next_card_free = false
	elif _is_arc_aura_card():
		cost = 0
		state.arc_aura_used_this_turn = true

	if state.energy < cost:
		return

	state.energy -= cost
	state.hand.erase(card)

	var should_repeat = state.repeat_next_card
	state.repeat_next_card = false

	var source = def.owner if def.owner != -1 else _infer_source()
	var ctx = _build_context(source, target_enemy_id)
	def.effect.call(ctx)

	state.cards_played_this_turn += 1
	if state.cards_played_this_turn >= 3:
		state.combo_active = true
	state.last_card_played_id = card.definition_id
	_last_card_instance_id = card.instance_id

	if Enums.CardTag.BLOCK in def.tags:
		_eval_mosscub_block_aura()
	_eval_mosscub_thorns_aura(def)

	if Enums.CardTag.EXHAUST in def.tags:
		state.exhausted_pile.append(card)
		_log("%s exhausted." % def.name)
	else:
		state.discard_pile.append(card)

	if should_repeat:
		var rctx = _build_context(source, target_enemy_id)
		def.effect.call(rctx)
		state.cards_played_this_turn += 1

	_check_end_conditions()
	state_changed.emit()

func end_turn() -> void:
	if state.phase != Enums.CombatPhase.PLAYER_TURN or _combat_over:
		return

	state.cards_played_last_turn = state.cards_played_this_turn

	for c in state.hand:
		state.discard_pile.append(c)
	state.hand.clear()
	state.phase = Enums.CombatPhase.ENEMY_TURN
	state_changed.emit()

	_execute_enemy_turn()

# ── Enemy turn ────────────────────────────────────────────────────────────────

func _execute_enemy_turn() -> void:
	for enemy in state.enemies.duplicate():
		if enemy.current_hp <= 0:
			continue

		var def = EnemyDB.get_def(enemy.definition_id)
		var action = def.pattern[enemy.pattern_index % def.pattern.size()]

		match action.type:
			Enums.EnemyIntentType.ATTACK, Enums.EnemyIntentType.BIG_ATTACK:
				_enemy_hit_random_creature(action.value, 1)
			Enums.EnemyIntentType.MULTI_ATTACK:
				_enemy_hit_random_creature(action.value, action.hits)
			Enums.EnemyIntentType.BLOCK:
				enemy.block += action.value
			Enums.EnemyIntentType.BURN:
				_enemy_apply_status_all(Enums.StatusType.BURN, action.status_stacks)
				if action.value > 0:
					_enemy_hit_random_creature(action.value, 1)
			Enums.EnemyIntentType.SHOCK:
				_enemy_apply_status_all(Enums.StatusType.SHOCK, action.status_stacks)
				if action.value > 0:
					_enemy_hit_random_creature(action.value, 1)
			Enums.EnemyIntentType.BUFF:
				enemy.current_hp = min(enemy.max_hp, enemy.current_hp + int(enemy.max_hp * 0.1))

		enemy.pattern_index += 1
		enemy.intent = EnemyDB.build_intent(def, enemy.pattern_index % def.pattern.size())

	_tick_enemy_statuses()
	_check_end_conditions()

	if not _combat_over:
		_start_player_turn()

func _enemy_hit_random_creature(dmg: int, hits: int) -> void:
	var alive = []
	for c in state.creatures:
		if not c.is_knocked_out:
			alive.append(c)
	if alive.size() == 0:
		return

	var target = alive[_rng.randi_range(0, alive.size() - 1)]

	for _h in range(hits):
		var thorn_stacks = _get_status(target.statuses, Enums.StatusType.THORNS)
		if thorn_stacks > 0:
			for en in state.enemies:
				if en.current_hp > 0:
					_apply_damage_to_enemy(en, thorn_stacks)

		var mult = 1.0
		if _get_status(target.statuses, Enums.StatusType.VULNERABLE) > 0:
			mult *= 1.5

		var final_dmg = max(0, int(dmg * mult) - target.block)
		target.block = max(0, target.block - int(dmg * mult))
		target.current_hp -= final_dmg

		if target.current_hp <= 0:
			target.current_hp = 0
			target.is_knocked_out = true
			_log("%s is knocked out!" % target.name)
			_suspend_creature_cards(target.id)

func _enemy_apply_status_all(type: int, stacks: int) -> void:
	for c in state.creatures:
		if not c.is_knocked_out:
			_add_status(c.statuses, type, stacks)

# ── CardEffectContext builder ──────────────────────────────────────────────────

func _build_context(source: int, target_enemy_id: String) -> CardEffectContext:
	var ctx = CardEffectContext.new()
	ctx.state               = state
	ctx.source              = source
	ctx.target_enemy_id     = target_enemy_id
	ctx.cards_played_this_turn = state.cards_played_this_turn
	ctx.last_card_played_id = state.last_card_played_id
	ctx.combo_active        = state.combo_active

	ctx.deal_damage = func(t_id: String, amount: int, is_multi: bool, hit_idx: int) -> void:
		var bonus = 0
		var kindl = _find_alive(Enums.CreatureId.KINDLPUP)
		if kindl != null and not state.heat_aura_used_this_turn:
			bonus = 2
			state.heat_aura_used_this_turn = true
		if state.bonus_next_attack > 0:
			bonus += state.bonus_next_attack
			state.bonus_next_attack = 0
		var mult = 1.0
		var src_c = _find_creature(source)
		if src_c != null and _get_status(src_c.statuses, Enums.StatusType.WEAK) > 0:
			mult *= 0.75
		var enemy = _find_enemy(t_id)
		if enemy == null: return
		if _get_status(enemy.statuses, Enums.StatusType.VULNERABLE) > 0:
			mult *= 1.5
		var total = int((amount + bonus) * mult)
		_apply_damage_to_enemy(enemy, total)
		_log("Dealt %d to %s" % [total, enemy.name])

	ctx.deal_damage_all_enemies = func(amount: int) -> void:
		var mult = 1.0
		var src_c = _find_creature(source)
		if src_c != null and _get_status(src_c.statuses, Enums.StatusType.WEAK) > 0:
			mult *= 0.75
		for en in state.enemies:
			if en.current_hp > 0:
				_apply_damage_to_enemy(en, int(amount * mult))

	ctx.gain_block = func(target: String, amount: int) -> void:
		if target == "all":
			for c in state.creatures:
				if not c.is_knocked_out: c.block += amount
		else:
			var cid = _creature_name_to_id(target)
			if cid >= 0:
				var c = _find_alive(cid)
				if c != null: c.block += amount

	ctx.apply_status_to_enemy = func(enemy_id: String, type: int, stacks: int) -> void:
		var en = _find_enemy(enemy_id)
		if en != null: _add_status(en.statuses, type, stacks)

	ctx.apply_status_to_all_enemies = func(type: int, stacks: int) -> void:
		for en in state.enemies:
			if en.current_hp > 0: _add_status(en.statuses, type, stacks)

	ctx.apply_status_to_creature = func(cid: int, type: int, stacks: int) -> void:
		var c = _find_alive(cid)
		if c != null: _add_status(c.statuses, type, stacks)

	ctx.draw_cards = func(count: int) -> void: _draw_cards(count)

	ctx.gain_energy = func(amount: int) -> void:
		state.energy = min(state.energy + amount, state.max_energy + 3)

	ctx.gain_bonus_energy_next_turn = func(amount: int) -> void:
		state.bonus_energy_next_turn += amount

	ctx.set_next_card_free = func() -> void: state.next_card_free = true

	ctx.set_repeat_next_card = func() -> void: state.repeat_next_card = true

	ctx.detonate_all_shock = func() -> void:
		for en in state.enemies.duplicate():
			if en.current_hp <= 0: continue
			var stacks = _get_status(en.statuses, Enums.StatusType.SHOCK)
			if stacks > 0:
				_apply_damage_to_enemy(en, stacks * 3)
				_remove_status(en.statuses, Enums.StatusType.SHOCK)
				_log("Detonated %d Shock on %s for %d dmg" % [stacks, en.name, stacks * 3])

	ctx.trigger_all_passives = func() -> void:
		_eval_kindlpup_aura()
		_eval_mosscub_aura()
		_eval_sparkwisp_aura()

	ctx.heal_creature = func(cid: int, amount: int) -> void:
		var c = _find_creature(cid)
		if c != null and not c.is_knocked_out:
			c.current_hp = min(c.max_hp, c.current_hp + amount)

	ctx.add_bond_multiplier = func(amount: float) -> void:
		state.bond_multiplier += amount

	ctx.repeat_last_card = func(half_value: bool) -> void:
		if state.last_card_played_id == "": return
		var last_def = CardDB.get_card(state.last_card_played_id)
		var rctx = _build_context(last_def.owner if last_def.owner != -1 else source, target_enemy_id)
		if half_value:
			var orig_dmg = rctx.deal_damage
			rctx.deal_damage = func(t: String, amt: int, m: bool, i: int) -> void:
				orig_dmg.call(t, amt / 2, m, i)
		last_def.effect.call(rctx)

	return ctx

# ── Passive auras ──────────────────────────────────────────────────────────────

func _eval_kindlpup_aura() -> void:
	if _find_alive(Enums.CreatureId.KINDLPUP) == null: return
	state.heat_aura_used_this_turn = false
	state.bonus_next_attack += 3

func _eval_mosscub_aura() -> void:
	for c in state.creatures:
		if not c.is_knocked_out: c.block += 5

func _eval_mosscub_block_aura() -> void:
	var mosscub = _find_alive(Enums.CreatureId.MOSSCUB)
	if mosscub != null and mosscub.stage >= Enums.EvolutionStage.STAGE1:
		for c in state.creatures:
			if not c.is_knocked_out: c.block += 2

func _eval_sparkwisp_aura() -> void:
	if _find_alive(Enums.CreatureId.SPARKWISP) == null: return
	_draw_cards(1)
	if state.combo_active:
		state.energy = min(state.energy + 1, state.max_energy + 3)

func _eval_mosscub_thorns_aura(def: CardDefinition) -> void:
	var mosscub = _find_alive(Enums.CreatureId.MOSSCUB)
	if mosscub != null and mosscub.stage == Enums.EvolutionStage.STAGE2 \
			and Enums.CardTag.BLOCK in def.tags:
		_add_status(mosscub.statuses, Enums.StatusType.THORNS, 1)

func _is_arc_aura_card() -> bool:
	var sw = _find_alive(Enums.CreatureId.SPARKWISP)
	return sw != null and sw.stage >= Enums.EvolutionStage.STAGE1 \
		and not state.arc_aura_used_this_turn \
		and state.cards_played_this_turn + 1 >= 5

func _infer_source() -> int:
	for c in state.creatures:
		if not c.is_knocked_out: return c.id
	return Enums.CreatureId.KINDLPUP

# ── Status tick ───────────────────────────────────────────────────────────────

func _tick_creature_statuses() -> void:
	for c in state.creatures:
		if c.is_knocked_out: continue
		var burn = _find_status(c.statuses, Enums.StatusType.BURN)
		if burn != null:
			c.current_hp -= burn.stacks
			if c.current_hp <= 0:
				c.current_hp = 0
				c.is_knocked_out = true
				_log("%s is knocked out by Burn!" % c.name)
				_suspend_creature_cards(c.id)
			burn.stacks -= 1
			if burn.stacks <= 0: c.statuses.erase(burn)
		var regen = _find_status(c.statuses, Enums.StatusType.REGEN)
		if regen != null:
			c.current_hp = min(c.max_hp, c.current_hp + regen.stacks)
			regen.stacks -= 1
			if regen.stacks <= 0: c.statuses.erase(regen)

func _tick_enemy_statuses() -> void:
	for en in state.enemies.duplicate():
		if en.current_hp <= 0: continue
		var burn = _find_status(en.statuses, Enums.StatusType.BURN)
		if burn != null:
			_apply_damage_to_enemy(en, burn.stacks)
			burn.stacks -= 1
			if burn.stacks <= 0: en.statuses.erase(burn)

# ── Damage helpers ────────────────────────────────────────────────────────────

func _apply_damage_to_enemy(enemy: EnemyState, amount: int) -> void:
	var after_block = max(0, amount - enemy.block)
	enemy.block = max(0, enemy.block - amount)
	enemy.current_hp -= after_block
	if enemy.current_hp < 0: enemy.current_hp = 0

# ── Status helpers ────────────────────────────────────────────────────────────

func _add_status(statuses: Array, type: int, stacks: int) -> void:
	var existing = _find_status(statuses, type)
	if existing != null:
		existing.stacks += stacks
	else:
		statuses.append(StatusStack.new(type, stacks))

func _remove_status(statuses: Array, type: int) -> void:
	for i in range(statuses.size() - 1, -1, -1):
		if statuses[i].type == type:
			statuses.remove_at(i)

func _get_status(statuses: Array, type: int) -> int:
	var s = _find_status(statuses, type)
	return s.stacks if s != null else 0

func _find_status(statuses: Array, type: int):
	for s in statuses:
		if s.type == type: return s
	return null

# ── KO suspension ─────────────────────────────────────────────────────────────

func _suspend_creature_cards(creature_id: int) -> void:
	for pile in [state.hand, state.draw_pile, state.discard_pile]:
		var owned = []
		for c in pile:
			var def = CardDB.get_card(c.definition_id)
			if def.owner == creature_id:
				owned.append(c)
		for c in owned:
			pile.erase(c)
			state.suspended_cards.append(c)
	_log("%d's cards suspended." % creature_id)

# ── Draw pile ─────────────────────────────────────────────────────────────────

func _draw_cards(count: int) -> void:
	for _i in range(count):
		if state.draw_pile.size() == 0:
			if state.discard_pile.size() == 0: break
			state.draw_pile = state.discard_pile.duplicate()
			state.discard_pile.clear()
			state.draw_pile.shuffle()
		var card = state.draw_pile[0]
		state.draw_pile.remove_at(0)
		state.hand.append(card)

# ── End conditions ────────────────────────────────────────────────────────────

func _check_end_conditions() -> void:
	if _combat_over: return
	var all_dead = true
	for e in state.enemies:
		if e.current_hp > 0: all_dead = false; break
	var all_ko = true
	for c in state.creatures:
		if not c.is_knocked_out: all_ko = false; break

	if all_dead:
		_combat_over = true
		state.phase = Enums.CombatPhase.VICTORY
		state_changed.emit()
		combat_ended.emit(true)
	elif all_ko:
		_combat_over = true
		state.phase = Enums.CombatPhase.DEFEAT
		state_changed.emit()
		combat_ended.emit(false)

# ── Utilities ─────────────────────────────────────────────────────────────────

func _find_alive(creature_id: int):
	for c in state.creatures:
		if c.id == creature_id and not c.is_knocked_out: return c
	return null

func _find_creature(creature_id: int):
	for c in state.creatures:
		if c.id == creature_id: return c
	return null

func _find_enemy(instance_id: String):
	for e in state.enemies:
		if e.instance_id == instance_id and e.current_hp > 0: return e
	return null

func _creature_name_to_id(name: String) -> int:
	match name.to_lower():
		"kindlpup": return Enums.CreatureId.KINDLPUP
		"mosscub":  return Enums.CreatureId.MOSSCUB
		"sparkwisp": return Enums.CreatureId.SPARKWISP
	return -1

func _log(msg: String) -> void:
	state.log.append(msg)
