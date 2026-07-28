"use client";

import type { ReactNode, ComponentProps } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Text, XStack, YStack } from "@repo/ui";
import React from "react";

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

type ButtonProps = Omit<ComponentProps<typeof Button>, "children" | "icon">;

export interface ActionButton extends ButtonProps {
  label: string;
  icon?: ReactNode;
  gradient?: boolean;
  onClick?: () => void;
}

interface DomainListPageProps<T> {
  description: string;
  emptyLabel: string;
  fields: Field<T>[];
  queryFn: () => Promise<PaginatedResult<T>>;
  queryKey: readonly unknown[];
  title: string;
  buttonGroup?: ActionButton[];
}

const GREEN_GRADIENT =
  "linear-gradient(135deg, #047857 0%, #059669 50%, #10B981 100%)";

const GREEN_GRADIENT_HOVER =
  "linear-gradient(135deg, #065F46 0%, #047857 50%, #059669 100%)";

const GREEN_GRADIENT_PRESS =
  "linear-gradient(135deg, #064E3B 0%, #047857 55%, #059669 100%)";

export function DomainListPage<T>({
  description,
  emptyLabel,
  fields,
  queryFn,
  queryKey,
  title,
  buttonGroup,
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
          <Text color="#172033" fontSize={26} fontWeight="700">
            {title}
          </Text>
          <Text color="#647084" fontSize={14}>
            {description}
          </Text>
        </YStack>
        <XStack gap="$3">
          {buttonGroup?.map(
            (
              {
                label,
                icon: buttonIcon,
                onClick,
                gradient = false,
                ...buttonProps
              },
              index,
            ) => {
              const isDisabled = query.isFetching || buttonProps.disabled;
              return (
                <Button
                  key={`${label}-${index}`}
                  {...buttonProps}
                  disabled={isDisabled}
                  onPress={onClick}
                  gap="$2"
                  {...(gradient && {
                    backgroundImage: GREEN_GRADIENT,
                    backgroundColor: "#059669",
                    borderWidth: 0,

                    shadowColor: "#047857",
                    shadowOpacity: 0.22,
                    shadowRadius: 8,
                    shadowOffset: {
                      width: 0,
                      height: 4,
                    },
                    elevation: 4,

                    hoverStyle: {
                      backgroundImage: GREEN_GRADIENT_HOVER,
                      scale: 1.01,
                    },

                    pressStyle: {
                      backgroundImage: GREEN_GRADIENT_PRESS,
                      scale: 0.98,
                    },

                    disabledStyle: {
                      opacity: 0.55,
                    },
                  })}
                >
                  {buttonIcon}

                  <Button.Text
                    color={gradient ? "#FFFFFF" : undefined}
                    fontWeight={gradient ? "600" : undefined}
                  >
                    {label}
                  </Button.Text>
                </Button>
              );
            },
          )}
        </XStack>
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
            Page {data?.meta.page ?? 1} of {data?.meta.totalPages ?? 1}
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
                      <Text color="#647084" fontSize={12} fontWeight="700">
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
