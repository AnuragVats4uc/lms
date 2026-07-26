"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import {
  Button,
  Card,
  Text,
  XStack,
  YStack,
} from "@repo/ui";

interface PaginatedResult<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface Field<T> {
  label: string;
  render: (item: T) => ReactNode;
}

interface DomainListPageProps<T> {
  description: string;
  emptyLabel: string;
  fields: Field<T>[];
  queryFn: () => Promise<PaginatedResult<T>>;
  queryKey: readonly unknown[];
  title: string;
}

export function   DomainListPage<T>({
  description,
  emptyLabel,
  fields,
  queryFn,
  queryKey,
  title,
}: DomainListPageProps<T>) {
  const query = useQuery({
    queryFn,
    queryKey,
  });
  const data = query.data;

  return (
    <YStack gap="$4">
      <XStack
        gap="$3"
        style={{
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <YStack>
          <Text
            color="#172033"
            fontSize={26}
            fontWeight="700"
          >
            {title}
          </Text>
          <Text color="#647084" fontSize={14}>
            {description}
          </Text>
        </YStack>

        <Button
          disabled={query.isFetching}
          onPress={() => query.refetch()}
          style={{ borderRadius: 8 }}
        >
          <RefreshCw
            aria-hidden="true"
            size={16}
            strokeWidth={2.2}
          />
          <Button.Text>Refresh</Button.Text>
        </Button>
      </XStack>

      <Card
        borderColor="#DFE6EE"
        borderRadius={8}
        borderWidth={1}
        backgroundColor="#FFFFFF"
        padding="$4"
      >
        <XStack
          pb="$3"
          style={{
            alignItems: "center",
            borderBottomColor: "#E8EDF3",
            borderBottomWidth: 1,
            justifyContent: "space-between",
          }}
        >
          <Text color="#172033" fontWeight="700">
            {data?.meta.total ?? 0} records
          </Text>
          <Text color="#647084" fontSize={13}>
            Page {data?.meta.page ?? 1} of{" "}
            {data?.meta.totalPages ?? 1}
          </Text>
        </XStack>

        {query.isLoading ? (
          <Text color="#647084" style={{ paddingTop: 16 }}>
            Loading records...
          </Text>
        ) : query.isError ? (
          <Text color="#B42318" style={{ paddingTop: 16 }}>
            Unable to load records.
          </Text>
        ) : !data || data.items.length === 0 ? (
          <Text color="#647084" style={{ paddingTop: 16 }}>
            {emptyLabel}
          </Text>
        ) : (
          <YStack gap="$3" style={{ paddingTop: 12 }}>
            {data.items.map((item, index) => (
              <Card
                key={index}
                borderColor="#E8EDF3"
                borderRadius={8}
                borderWidth={1}
                backgroundColor="#FBFCFE"
                padding="$3"
              >
                <XStack flexWrap="wrap" gap="$4">
                  {fields.map((field) => (
                    <YStack
                      key={field.label}
                      flex={1}
                      gap="$1"
                      style={{ minWidth: 160 }}
                    >
                      <Text
                        color="#647084"
                        fontSize={12}
                        fontWeight="700"
                      >
                        {field.label}
                      </Text>
                      <Text color="#263244" fontSize={14}>
                        {field.render(item)}
                      </Text>
                    </YStack>
                  ))}
                </XStack>
              </Card>
            ))}
          </YStack>
        )}
      </Card>
    </YStack>
  );
}
