using Godot;
using System.Collections.Generic;

namespace BondBound
{
    public partial class CreatureDB : Node
    {
        public static CreatureDB Singleton { get; private set; } = null!;

        private static readonly Dictionary<(CreatureId, EvolutionStage), CreatureStats> _base = new();

        public override void _Ready()
        {
            Singleton = this;
            Register(CreatureId.Kindlpup, EvolutionStage.Stage0, "Kindlpup",   "🔥", "#e85d04", 55);
            Register(CreatureId.Kindlpup, EvolutionStage.Stage1, "Emberwolf",  "🔥", "#f48c06", 80);
            Register(CreatureId.Kindlpup, EvolutionStage.Stage2, "Direstorm",  "🔥", "#ffba08", 110);
            Register(CreatureId.Mosscub,  EvolutionStage.Stage0, "Mosscub",    "🌿", "#2d6a4f", 75);
            Register(CreatureId.Mosscub,  EvolutionStage.Stage1, "Bramblbear", "🌿", "#52b788", 100);
            Register(CreatureId.Mosscub,  EvolutionStage.Stage2, "Grizzquake", "🌿", "#74c69d", 130);
            Register(CreatureId.Sparkwisp,EvolutionStage.Stage0, "Sparkwisp",  "⚡", "#7b2d8b", 45);
            Register(CreatureId.Sparkwisp,EvolutionStage.Stage1, "Arcgeist",   "⚡", "#9b59b6", 65);
            Register(CreatureId.Sparkwisp,EvolutionStage.Stage2, "Wraithbolt", "⚡", "#d7bde2", 90);
        }

        private static void Register(CreatureId id, EvolutionStage stage, string name, string emoji, string color, int maxHp)
        {
            _base[(id, stage)] = new CreatureStats
            {
                Id = id, Name = name, Emoji = emoji, Color = color,
                Stage = stage, MaxHp = maxHp, CurrentHp = maxHp
            };
        }

        public CreatureStats GetBase(CreatureId id, EvolutionStage stage) =>
            _base[(id, stage)].Clone();

        public CreatureStats CreateFresh(CreatureId id) =>
            GetBase(id, EvolutionStage.Stage0);

        public string GetName(CreatureId id, EvolutionStage stage) =>
            _base[(id, stage)].Name;
    }
}
