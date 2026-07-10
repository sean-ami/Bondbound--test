extends Node

var _cards: Dictionary = {}

func _ready() -> void:
	_register_all()

func get_card(id: String) -> CardDefinition:
	return _cards[id]

func get_signature_cards(creature_id: int, stage: int) -> Array:
	var result = []
	for c in _cards.values():
		if c.owner == creature_id and c.stage == stage:
			result.append(c)
	return result

func get_generic_cards() -> Array:
	var result = []
	for c in _cards.values():
		if c.owner == -1:
			result.append(c)
	return result

func get_evolution_id(base_id: String, new_stage: int) -> String:
	var last = base_id.rfind("_")
	if last < 0:
		return base_id
	var suffix = base_id.substr(last + 1)
	if suffix != "0" and suffix != "1" and suffix != "2":
		return base_id
	return base_id.substr(0, last) + "_" + str(new_stage)

func _reg(c: CardDefinition) -> void:
	_cards[c.id] = c

func _card(id: String, p_name: String, owner: int, stage: int, cost: int,
		rarity: int, desc: String, tags: Array, eff: Callable) -> CardDefinition:
	var c = CardDefinition.new()
	c.id = id; c.name = p_name; c.owner = owner; c.stage = stage
	c.energy_cost = cost; c.rarity = rarity; c.description = desc
	c.tags = tags; c.effect = eff
	return c

func _generic(id: String, p_name: String, cost: int, rarity: int,
		desc: String, tags: Array, eff: Callable) -> CardDefinition:
	return _card(id, p_name, -1, -1, cost, rarity, desc, tags, eff)

func _register_all() -> void:
	_register_kindlpup()
	_register_mosscub()
	_register_sparkwisp()
	_register_generic()

# ── Kindlpup ──────────────────────────────────────────────────────────────────

func _register_kindlpup() -> void:
	_reg(_card("primal_pounce_0", "Primal Pounce",
		Enums.CreatureId.KINDLPUP, Enums.EvolutionStage.STAGE0,
		1, Enums.Rarity.SIGNATURE,
		"Deal 8 damage. If first card this turn, deal 3 more.",
		[Enums.CardTag.ATTACK],
		func(ctx: CardEffectContext) -> void:
			var bonus = 3 if ctx.cards_played_this_turn == 0 else 0
			ctx.deal_damage.call(ctx.target_enemy_id, 8 + bonus, false, 0)
	))
	_reg(_card("ember_guard_0", "Ember Guard",
		Enums.CreatureId.KINDLPUP, Enums.EvolutionStage.STAGE0,
		1, Enums.Rarity.SIGNATURE,
		"Gain 8 Block. Apply 2 Burn to self.",
		[Enums.CardTag.BLOCK],
		func(ctx: CardEffectContext) -> void:
			ctx.gain_block.call("kindlpup", 8)
			ctx.apply_status_to_creature.call(Enums.CreatureId.KINDLPUP, Enums.StatusType.BURN, 2)
	))
	_reg(_card("instinct_howl_0", "Instinct Howl",
		Enums.CreatureId.KINDLPUP, Enums.EvolutionStage.STAGE0,
		1, Enums.Rarity.SIGNATURE,
		"Draw 2. If 3+ cards played this turn, gain 1 Energy.",
		[Enums.CardTag.DRAW, Enums.CardTag.ENERGY_GEN],
		func(ctx: CardEffectContext) -> void:
			ctx.draw_cards.call(2)
			if ctx.cards_played_this_turn >= 3:
				ctx.gain_energy.call(1)
	))
	_reg(_card("primal_pounce_1", "Ember Pounce",
		Enums.CreatureId.KINDLPUP, Enums.EvolutionStage.STAGE1,
		1, Enums.Rarity.SIGNATURE,
		"Deal 8 damage. Apply 2 Burn.",
		[Enums.CardTag.ATTACK],
		func(ctx: CardEffectContext) -> void:
			ctx.deal_damage.call(ctx.target_enemy_id, 8, false, 0)
			ctx.apply_status_to_enemy.call(ctx.target_enemy_id, Enums.StatusType.BURN, 2)
	))
	_reg(_card("ember_guard_1", "Flamehide",
		Enums.CreatureId.KINDLPUP, Enums.EvolutionStage.STAGE1,
		1, Enums.Rarity.SIGNATURE,
		"Gain 8 Block. Refund 1 Energy.",
		[Enums.CardTag.BLOCK, Enums.CardTag.ENERGY_GEN],
		func(ctx: CardEffectContext) -> void:
			ctx.gain_block.call("kindlpup", 8)
			ctx.gain_energy.call(1)
	))
	_reg(_card("instinct_howl_1", "Ember Howl",
		Enums.CreatureId.KINDLPUP, Enums.EvolutionStage.STAGE1,
		1, Enums.Rarity.SIGNATURE,
		"Draw 2. Apply 2 Vulnerable to target.",
		[Enums.CardTag.DRAW, Enums.CardTag.UTILITY],
		func(ctx: CardEffectContext) -> void:
			ctx.draw_cards.call(2)
			if ctx.target_enemy_id != "":
				ctx.apply_status_to_enemy.call(ctx.target_enemy_id, Enums.StatusType.VULNERABLE, 2)
	))
	_reg(_card("primal_pounce_2", "Dire Pounce",
		Enums.CreatureId.KINDLPUP, Enums.EvolutionStage.STAGE2,
		1, Enums.Rarity.SIGNATURE,
		"Deal 8 damage twice.",
		[Enums.CardTag.ATTACK, Enums.CardTag.MULTI_HIT],
		func(ctx: CardEffectContext) -> void:
			ctx.deal_damage.call(ctx.target_enemy_id, 8, true, 0)
			ctx.deal_damage.call(ctx.target_enemy_id, 8, true, 1)
	))
	_reg(_card("ember_guard_2", "Infernohide",
		Enums.CreatureId.KINDLPUP, Enums.EvolutionStage.STAGE2,
		1, Enums.Rarity.SIGNATURE,
		"Gain 8 Block. Apply 2 Burn to all enemies.",
		[Enums.CardTag.BLOCK],
		func(ctx: CardEffectContext) -> void:
			ctx.gain_block.call("kindlpup", 8)
			ctx.apply_status_to_all_enemies.call(Enums.StatusType.BURN, 2)
	))
	_reg(_card("instinct_howl_2", "Storm Howl",
		Enums.CreatureId.KINDLPUP, Enums.EvolutionStage.STAGE2,
		1, Enums.Rarity.SIGNATURE,
		"Draw 2. Automatically repeat the next card played this turn.",
		[Enums.CardTag.DRAW, Enums.CardTag.UTILITY],
		func(ctx: CardEffectContext) -> void:
			ctx.draw_cards.call(2)
			ctx.set_repeat_next_card.call()
	))

# ── Mosscub ───────────────────────────────────────────────────────────────────

func _register_mosscub() -> void:
	_reg(_card("bramble_bash_0", "Bramble Bash",
		Enums.CreatureId.MOSSCUB, Enums.EvolutionStage.STAGE0,
		1, Enums.Rarity.SIGNATURE,
		"Deal 7 damage. Gain 2 Thorns.",
		[Enums.CardTag.ATTACK],
		func(ctx: CardEffectContext) -> void:
			ctx.deal_damage.call(ctx.target_enemy_id, 7, false, 0)
			ctx.apply_status_to_creature.call(Enums.CreatureId.MOSSCUB, Enums.StatusType.THORNS, 2)
	))
	_reg(_card("moss_hide_0", "Moss Hide",
		Enums.CreatureId.MOSSCUB, Enums.EvolutionStage.STAGE0,
		1, Enums.Rarity.SIGNATURE,
		"Gain 10 Block and 2 Regen.",
		[Enums.CardTag.BLOCK],
		func(ctx: CardEffectContext) -> void:
			ctx.gain_block.call("mosscub", 10)
			ctx.apply_status_to_creature.call(Enums.CreatureId.MOSSCUB, Enums.StatusType.REGEN, 2)
	))
	_reg(_card("guardians_call_0", "Guardian's Call",
		Enums.CreatureId.MOSSCUB, Enums.EvolutionStage.STAGE0,
		1, Enums.Rarity.SIGNATURE,
		"All creatures gain 5 Block.",
		[Enums.CardTag.BLOCK, Enums.CardTag.UTILITY],
		func(ctx: CardEffectContext) -> void:
			ctx.gain_block.call("all", 5)
	))
	_reg(_card("bramble_bash_1", "Thorn Bash",
		Enums.CreatureId.MOSSCUB, Enums.EvolutionStage.STAGE1,
		1, Enums.Rarity.SIGNATURE,
		"Deal 7 damage. Deal 3 more if you have Block.",
		[Enums.CardTag.ATTACK],
		func(ctx: CardEffectContext) -> void:
			var mc = _find_creature(ctx.state.creatures, Enums.CreatureId.MOSSCUB)
			var bonus = 3 if mc != null and mc.block > 0 else 0
			ctx.deal_damage.call(ctx.target_enemy_id, 7 + bonus, false, 0)
	))
	_reg(_card("moss_hide_1", "Bramblehide",
		Enums.CreatureId.MOSSCUB, Enums.EvolutionStage.STAGE1,
		1, Enums.Rarity.SIGNATURE,
		"Gain 10 Block. Double current Regen stacks.",
		[Enums.CardTag.BLOCK],
		func(ctx: CardEffectContext) -> void:
			ctx.gain_block.call("mosscub", 10)
			var mc = _find_creature(ctx.state.creatures, Enums.CreatureId.MOSSCUB)
			if mc != null:
				var regen = _find_status(mc.statuses, Enums.StatusType.REGEN)
				if regen != null and regen.stacks > 0:
					ctx.apply_status_to_creature.call(Enums.CreatureId.MOSSCUB, Enums.StatusType.REGEN, regen.stacks)
	))
	_reg(_card("guardians_call_1", "Guardian's Roar",
		Enums.CreatureId.MOSSCUB, Enums.EvolutionStage.STAGE1,
		1, Enums.Rarity.SIGNATURE,
		"All creatures gain 5 Block. Apply 2 Weak to all enemies.",
		[Enums.CardTag.BLOCK, Enums.CardTag.UTILITY],
		func(ctx: CardEffectContext) -> void:
			ctx.gain_block.call("all", 5)
			ctx.apply_status_to_all_enemies.call(Enums.StatusType.WEAK, 2)
	))
	_reg(_card("bramble_bash_2", "Quake Bash",
		Enums.CreatureId.MOSSCUB, Enums.EvolutionStage.STAGE2,
		2, Enums.Rarity.SIGNATURE,
		"Deal damage to ALL enemies equal to your Thorns count.",
		[Enums.CardTag.ATTACK, Enums.CardTag.AOE],
		func(ctx: CardEffectContext) -> void:
			var mc = _find_creature(ctx.state.creatures, Enums.CreatureId.MOSSCUB)
			var thorns = 0
			if mc != null:
				var ts = _find_status(mc.statuses, Enums.StatusType.THORNS)
				if ts != null: thorns = ts.stacks
			ctx.deal_damage_all_enemies.call(thorns)
	))
	_reg(_card("moss_hide_2", "Earthheart Hide",
		Enums.CreatureId.MOSSCUB, Enums.EvolutionStage.STAGE2,
		2, Enums.Rarity.SIGNATURE,
		"Gain 10 Block. Convert 50% of Block to max HP (max +20).",
		[Enums.CardTag.BLOCK],
		func(ctx: CardEffectContext) -> void:
			ctx.gain_block.call("mosscub", 10)
			var mc = _find_creature(ctx.state.creatures, Enums.CreatureId.MOSSCUB)
			if mc != null:
				var gain = min(int(mc.block * 0.5), 20)
				mc.max_hp += gain
				mc.current_hp = min(mc.current_hp + gain, mc.max_hp)
	))
	_reg(_card("guardians_call_2", "Earthshatter Call",
		Enums.CreatureId.MOSSCUB, Enums.EvolutionStage.STAGE2,
		2, Enums.Rarity.SIGNATURE,
		"All creatures gain 5 Block. Apply 2 Weak + 2 Vulnerable to all enemies.",
		[Enums.CardTag.BLOCK, Enums.CardTag.UTILITY, Enums.CardTag.AOE],
		func(ctx: CardEffectContext) -> void:
			ctx.gain_block.call("all", 5)
			ctx.apply_status_to_all_enemies.call(Enums.StatusType.WEAK, 2)
			ctx.apply_status_to_all_enemies.call(Enums.StatusType.VULNERABLE, 2)
	))

# ── Sparkwisp ─────────────────────────────────────────────────────────────────

func _register_sparkwisp() -> void:
	_reg(_card("zap_flicker_0", "Zap Flicker",
		Enums.CreatureId.SPARKWISP, Enums.EvolutionStage.STAGE0,
		0, Enums.Rarity.SIGNATURE,
		"Deal 4 damage.",
		[Enums.CardTag.ATTACK],
		func(ctx: CardEffectContext) -> void:
			ctx.deal_damage.call(ctx.target_enemy_id, 4, false, 0)
	))
	_reg(_card("spark_battery_0", "Spark Battery",
		Enums.CreatureId.SPARKWISP, Enums.EvolutionStage.STAGE0,
		1, Enums.Rarity.SIGNATURE,
		"Gain +1 Energy next turn. Draw 1.",
		[Enums.CardTag.ENERGY_GEN, Enums.CardTag.DRAW],
		func(ctx: CardEffectContext) -> void:
			ctx.gain_bonus_energy_next_turn.call(1)
			ctx.draw_cards.call(1)
	))
	_reg(_card("chain_pulse_0", "Chain Pulse",
		Enums.CreatureId.SPARKWISP, Enums.EvolutionStage.STAGE0,
		2, Enums.Rarity.SIGNATURE,
		"If 4+ cards played this turn, repeat last card.",
		[Enums.CardTag.UTILITY],
		func(ctx: CardEffectContext) -> void:
			if ctx.cards_played_this_turn >= 4:
				ctx.repeat_last_card.call(false)
	))
	_reg(_card("zap_flicker_1", "Arc Flicker",
		Enums.CreatureId.SPARKWISP, Enums.EvolutionStage.STAGE1,
		0, Enums.Rarity.SIGNATURE,
		"Deal 4 damage. If 5th+ card this turn, gain 1 Energy.",
		[Enums.CardTag.ATTACK, Enums.CardTag.ENERGY_GEN],
		func(ctx: CardEffectContext) -> void:
			ctx.deal_damage.call(ctx.target_enemy_id, 4, false, 0)
			if ctx.cards_played_this_turn + 1 >= 5:
				ctx.gain_energy.call(1)
	))
	_reg(_card("spark_battery_1", "Arc Battery",
		Enums.CreatureId.SPARKWISP, Enums.EvolutionStage.STAGE1,
		1, Enums.Rarity.SIGNATURE,
		"Gain +1 Energy next turn. Draw 1. If combo active, gain 1 Energy now.",
		[Enums.CardTag.ENERGY_GEN, Enums.CardTag.DRAW],
		func(ctx: CardEffectContext) -> void:
			ctx.gain_bonus_energy_next_turn.call(1)
			ctx.draw_cards.call(1)
			if ctx.combo_active:
				ctx.gain_energy.call(1)
	))
	_reg(_card("chain_pulse_1", "Arc Pulse",
		Enums.CreatureId.SPARKWISP, Enums.EvolutionStage.STAGE1,
		2, Enums.Rarity.SIGNATURE,
		"If 4+ cards played this turn, repeat last card and apply 2 Shock.",
		[Enums.CardTag.UTILITY],
		func(ctx: CardEffectContext) -> void:
			if ctx.cards_played_this_turn >= 4:
				ctx.repeat_last_card.call(false)
				if ctx.target_enemy_id != "":
					ctx.apply_status_to_enemy.call(ctx.target_enemy_id, Enums.StatusType.SHOCK, 2)
	))
	_reg(_card("zap_flicker_2", "Wraith Flicker",
		Enums.CreatureId.SPARKWISP, Enums.EvolutionStage.STAGE2,
		0, Enums.Rarity.SIGNATURE,
		"Deal 4 damage. If 5th+ card, also hit a random enemy for 4.",
		[Enums.CardTag.ATTACK],
		func(ctx: CardEffectContext) -> void:
			ctx.deal_damage.call(ctx.target_enemy_id, 4, false, 0)
			if ctx.cards_played_this_turn + 1 >= 5:
				var live = []
				for e in ctx.state.enemies:
					if e.current_hp > 0: live.append(e)
				if live.size() > 0:
					ctx.deal_damage.call(live[randi_range(0, live.size() - 1)].instance_id, 4, false, 0)
	))
	_reg(_card("spark_battery_2", "Storm Battery",
		Enums.CreatureId.SPARKWISP, Enums.EvolutionStage.STAGE2,
		1, Enums.Rarity.SIGNATURE,
		"Gain +1 Energy next turn. Draw 1. If combo, gain 1 Energy and Shock all enemies.",
		[Enums.CardTag.ENERGY_GEN, Enums.CardTag.AOE],
		func(ctx: CardEffectContext) -> void:
			ctx.gain_bonus_energy_next_turn.call(1)
			ctx.draw_cards.call(1)
			if ctx.combo_active:
				ctx.gain_energy.call(1)
				ctx.apply_status_to_all_enemies.call(Enums.StatusType.SHOCK, 2)
	))
	_reg(_card("chain_pulse_2", "Wraith Pulse",
		Enums.CreatureId.SPARKWISP, Enums.EvolutionStage.STAGE2,
		2, Enums.Rarity.SIGNATURE,
		"If 4+ cards played, detonate ALL Shock stacks (3 dmg/stack).",
		[Enums.CardTag.ATTACK, Enums.CardTag.AOE],
		func(ctx: CardEffectContext) -> void:
			if ctx.cards_played_this_turn >= 4:
				ctx.detonate_all_shock.call()
	))

# ── Generic ───────────────────────────────────────────────────────────────────

func _register_generic() -> void:
	_reg(_generic("quick_block", "Quick Block", 1, Enums.Rarity.COMMON,
		"Gain 5 Block.", [Enums.CardTag.BLOCK],
		func(ctx: CardEffectContext) -> void: ctx.gain_block.call("all", 5)
	))
	_reg(_generic("strike_plus", "Strike+", 1, Enums.Rarity.COMMON,
		"Deal 7 damage.", [Enums.CardTag.ATTACK],
		func(ctx: CardEffectContext) -> void: ctx.deal_damage.call(ctx.target_enemy_id, 7, false, 0)
	))
	_reg(_generic("focus", "Focus", 1, Enums.Rarity.COMMON,
		"Draw 2 cards.", [Enums.CardTag.DRAW],
		func(ctx: CardEffectContext) -> void: ctx.draw_cards.call(2)
	))
	_reg(_generic("energy_spark", "Energy Spark", 0, Enums.Rarity.COMMON,
		"Gain +1 Energy this turn.", [Enums.CardTag.ENERGY_GEN],
		func(ctx: CardEffectContext) -> void: ctx.gain_energy.call(1)
	))
	_reg(_generic("guard_shift", "Guard Shift", 1, Enums.Rarity.COMMON,
		"All creatures gain 3 Block.", [Enums.CardTag.BLOCK, Enums.CardTag.UTILITY],
		func(ctx: CardEffectContext) -> void: ctx.gain_block.call("all", 3)
	))
	_reg(_generic("combo_step", "Combo Step", 1, Enums.Rarity.UNCOMMON,
		"Next card costs 0 if combo active.", [Enums.CardTag.UTILITY],
		func(ctx: CardEffectContext) -> void:
			if ctx.combo_active: ctx.set_next_card_free.call()
	))
	_reg(_generic("rooted_stance", "Rooted Stance", 1, Enums.Rarity.UNCOMMON,
		"Gain 8 Block and 2 Thorns.", [Enums.CardTag.BLOCK],
		func(ctx: CardEffectContext) -> void:
			ctx.gain_block.call("mosscub", 8)
			ctx.apply_status_to_creature.call(Enums.CreatureId.MOSSCUB, Enums.StatusType.THORNS, 2)
	))
	_reg(_generic("ignition", "Ignition", 1, Enums.Rarity.UNCOMMON,
		"Apply 3 Burn to target enemy.", [Enums.CardTag.ATTACK, Enums.CardTag.UTILITY],
		func(ctx: CardEffectContext) -> void:
			ctx.apply_status_to_enemy.call(ctx.target_enemy_id, Enums.StatusType.BURN, 3)
	))
	_reg(_generic("static_echo", "Static Echo", 2, Enums.Rarity.UNCOMMON,
		"Repeat the last card played at half value.", [Enums.CardTag.UTILITY],
		func(ctx: CardEffectContext) -> void: ctx.repeat_last_card.call(true)
	))
	_reg(_generic("team_guard", "Team Guard", 2, Enums.Rarity.UNCOMMON,
		"All creatures gain 4 Block.", [Enums.CardTag.BLOCK, Enums.CardTag.UTILITY],
		func(ctx: CardEffectContext) -> void: ctx.gain_block.call("all", 4)
	))
	_reg(_generic("synergy_pulse", "Synergy Pulse", 2, Enums.Rarity.RARE,
		"Trigger all passives: Kindlpup gains +3 on next attack, all creatures gain 5 Block, Sparkwisp draws 1 (and gains 1 Energy if combo active).",
		[Enums.CardTag.UTILITY],
		func(ctx: CardEffectContext) -> void: ctx.trigger_all_passives.call()
	))
	_reg(_generic("elemental_burst", "Elemental Burst", 2, Enums.Rarity.RARE,
		"Deal damage to all enemies equal to unique status types on them ×3.",
		[Enums.CardTag.ATTACK, Enums.CardTag.AOE],
		func(ctx: CardEffectContext) -> void:
			for e in ctx.state.enemies:
				if e.current_hp <= 0: continue
				var seen = {}
				for s in e.statuses: seen[s.type] = true
				if seen.size() > 0:
					ctx.deal_damage.call(e.instance_id, seen.size() * 3, false, 0)
	))
	_reg(_generic("bond_echo", "Bond Echo", 0, Enums.Rarity.RARE,
		"Exhaust. Double Bond earned from this battle.",
		[Enums.CardTag.UTILITY, Enums.CardTag.EXHAUST],
		func(ctx: CardEffectContext) -> void: ctx.add_bond_multiplier.call(1.0)
	))
	_reg(_generic("momentum_surge", "Momentum Surge", 2, Enums.Rarity.RARE,
		"Gain +2 Energy. Draw 2. Next turn starts with +1 Energy.",
		[Enums.CardTag.ENERGY_GEN, Enums.CardTag.DRAW],
		func(ctx: CardEffectContext) -> void:
			ctx.gain_energy.call(2)
			ctx.draw_cards.call(2)
			ctx.gain_bonus_energy_next_turn.call(1)
	))
	_reg(_generic("natures_blessing", "Nature's Blessing", 0, Enums.Rarity.RARE,
		"Fully restore the lowest-HP living creature's HP. Cannot target KO'd creatures.",
		[Enums.CardTag.UTILITY],
		func(ctx: CardEffectContext) -> void:
			var lowest = null
			for c in ctx.state.creatures:
				if c.is_knocked_out: continue
				if lowest == null or c.current_hp < lowest.current_hp:
					lowest = c
			if lowest != null:
				ctx.heal_creature.call(lowest.id, lowest.max_hp)
	))

# ── Helpers used by card lambdas ──────────────────────────────────────────────

static func _find_creature(creatures: Array, creature_id: int):
	for c in creatures:
		if c.id == creature_id:
			return c
	return null

static func _find_status(statuses: Array, status_type: int):
	for s in statuses:
		if s.type == status_type:
			return s
	return null
