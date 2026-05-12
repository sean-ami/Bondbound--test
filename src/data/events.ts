export interface EventOutcome {
  label: string
  description: string
  effect: 'gold' | 'hp' | 'bond' | 'card' | 'damage'
  value: number
}

export interface GameEvent {
  id: string
  title: string
  flavor: string
  options: [EventOutcome, EventOutcome]
}

export const EVENTS: GameEvent[] = [
  {
    id: 'ancient_shrine',
    title: 'Ancient Shrine',
    flavor: 'You find a crumbling shrine covered in glowing runes. Something stirs within your companions.',
    options: [
      { label: 'Offer gold (30)', description: 'Spend 30 gold to receive a Bond boost for all creatures.', effect: 'bond', value: 8 },
      { label: 'Leave it', description: 'Nothing happens. You move on.', effect: 'gold', value: 0 },
    ],
  },
  {
    id: 'wandering_merchant',
    title: 'Wandering Merchant',
    flavor: 'A cloaked merchant appears on the path, offering something unusual.',
    options: [
      { label: 'Buy rare card (60g)', description: 'Pay 60 gold to add a random rare card to your deck.', effect: 'card', value: 60 },
      { label: 'Ignore', description: 'You keep moving.', effect: 'gold', value: 0 },
    ],
  },
  {
    id: 'cursed_spring',
    title: 'Cursed Spring',
    flavor: 'A shimmering spring sits in a clearing. The water glows — but something feels wrong.',
    options: [
      { label: 'Drink (risk)', description: 'Restore 20% HP to all creatures, but take 10 damage.', effect: 'hp', value: 20 },
      { label: 'Ignore', description: 'You resist temptation and move on safely.', effect: 'gold', value: 0 },
    ],
  },
  {
    id: 'battle_trophy',
    title: 'Battle Trophy',
    flavor: 'You discover the remains of a defeated monster with a valuable item still on it.',
    options: [
      { label: 'Take the gold', description: 'Gain 45 gold.', effect: 'gold', value: 45 },
      { label: 'Study the creature', description: 'Gain 5 Bond for all creatures.', effect: 'bond', value: 5 },
    ],
  },
  {
    id: 'injured_traveler',
    title: 'Injured Traveler',
    flavor: 'A wounded adventurer asks for help. Your creatures instinctively step forward.',
    options: [
      { label: 'Help them (20 HP)', description: 'Sacrifice 20 HP (distributed across creatures) to gain 50 gold.', effect: 'damage', value: 7 },
      { label: 'Offer bond support', description: 'Spend time comforting them. Gain 10 Bond for a chosen creature.', effect: 'bond', value: 10 },
    ],
  },
  {
    id: 'training_grounds',
    title: 'Abandoned Training Grounds',
    flavor: 'Ancient practice dummies and obstacle courses — your creatures could train here.',
    options: [
      { label: 'Train rigorously', description: 'Gain 12 Bond split across all creatures, but lose 15% HP each.', effect: 'bond', value: 12 },
      { label: 'Light warm-up', description: 'Gain 5 Bond split across all creatures with no downside.', effect: 'bond', value: 5 },
    ],
  },
]
