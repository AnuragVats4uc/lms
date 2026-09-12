import { Text, XStack } from "@repo/ui";

export const Badge = ({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "blue" | "gray" | "green";
}) => {
  const styles = {
    blue: { background: "#EFF6FF", color: "#1D4ED8" },
    gray: { background: "#F1F5F9", color: "#52627A" },
    green: { background: "#DDF4E7", color: "#047857" },
  }[tone];

  return (
    <XStack
      px="$3"
      py="$1"
      rounded="$6"
      style={{
        alignItems: "center",
        backgroundColor: styles.background,
        flexShrink: 0,
      }}
    >
      <Text color={styles.color as never} fontSize={11} fontWeight="$button">
        {children}
      </Text>
    </XStack>
  );
};
