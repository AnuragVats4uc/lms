import { Text, XStack, YStack } from "@repo/ui";

export const IconBubble = ({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "blue" | "gray" | "green";
}) => {
  const styles = {
    blue: { background: "#EFF6FF", color: "#2563EB" },
    gray: { background: "#F1F5F9", color: "#52627A" },
    green: { background: "#DDF4E7", color: "#047857" },
  }[tone];

  return (
    <XStack
      rounded="$3"
      style={{
        alignItems: "center",
        backgroundColor: styles.background,
        color: styles.color,
        flexShrink: 0,
        height: 34,
        justifyContent: "center",
        width: 34,
      }}
    >
      {children}
    </XStack>
  );
};
