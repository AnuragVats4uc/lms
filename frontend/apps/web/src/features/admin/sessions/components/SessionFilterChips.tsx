import { XStack } from "@repo/ui";
import { Button, Text } from "@repo/ui";

export function SessionFilterChips({
  chips,
  onClear,
  onRemove,
}: {
  chips: Array<{ id: string; label: string }>;
  onClear: () => void;
  onRemove: (id: string) => void;
}) {
  if (!chips.length) return null;
  return (
    <XStack gap="$2" style={{ alignItems: "center", flexWrap: "wrap" }}>
      {chips.map((chip) => <Button background="#DDF4E7" borderColor="#B7E4CB" borderWidth={1} height={30} key={chip.id} onPress={() => onRemove(chip.id)} rounded="$4"><Text color="#047857" fontSize="$caption">{chip.label} ×</Text></Button>)}
      <Button background="transparent" chromeless height={30} onPress={onClear}><Text color="#52627A" fontSize="$caption">Clear all</Text></Button>
    </XStack>
  );
}
