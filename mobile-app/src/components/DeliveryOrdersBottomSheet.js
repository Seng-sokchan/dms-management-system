import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

export const DELIVERY_SHEET_PEEK_HEIGHT = 56;
const PEEK_HEIGHT = DELIVERY_SHEET_PEEK_HEIGHT;
const EXPANDED_SCREEN_RATIO = 0.52;
const SNAP_VELOCITY = 0.35;

/**
 * Bottom sheet for delivery order list. Collapsed by default so the map stays fullscreen.
 * Swipe up/down on the handle (or tap the bar) to expand/collapse.
 */
export function DeliveryOrdersBottomSheet({
  expanded,
  onExpandedChange,
  peekTitle,
  peekSubtitle,
  children,
}) {
  const { colors, radii, shadows, spacing, typography } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        sheet: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.surface,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          ...shadows.card,
        },
        handleZone: {
          paddingTop: spacing.xs,
          paddingBottom: spacing.xs,
          paddingHorizontal: spacing.md,
        },
        handlePressable: {
          alignItems: "center",
        },
        handle: {
          width: 40,
          height: 4,
          borderRadius: radii.pill,
          backgroundColor: colors.border,
          marginBottom: spacing.sm,
        },
        peekTitle: {
          fontSize: typography.body,
          fontWeight: "700",
          color: colors.textPrimary,
          textAlign: "center",
        },
        peekSubtitle: {
          marginTop: 2,
          fontSize: typography.caption,
          color: colors.textSecondary,
          textAlign: "center",
        },
        hint: {
          marginTop: spacing.xs,
          fontSize: typography.caption,
          color: colors.textMuted,
          textAlign: "center",
        },
        peekCollapsed: {
          fontSize: typography.caption,
          fontWeight: "600",
          color: colors.textSecondary,
          textAlign: "center",
        },
        body: {
          flex: 1,
          paddingHorizontal: spacing.lg,
        },
      }),
    [colors, radii, shadows, spacing, typography],
  );
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get("window").height;
  const expandedHeight = useMemo(
    () => Math.round(screenHeight * EXPANDED_SCREEN_RATIO),
    [screenHeight],
  );
  const hiddenOffset = expandedHeight - PEEK_HEIGHT;

  const translateY = useRef(new Animated.Value(hiddenOffset)).current;
  const positionRef = useRef(hiddenOffset);
  const dragStartY = useRef(hiddenOffset);
  const expandedRef = useRef(expanded);
  expandedRef.current = expanded;

  useEffect(() => {
    const id = translateY.addListener(({ value }) => {
      positionRef.current = value;
    });
    return () => translateY.removeListener(id);
  }, [translateY]);

  const snapTo = useCallback(
    (toExpanded, { animated = true } = {}) => {
      const toValue = toExpanded ? 0 : hiddenOffset;
      positionRef.current = toValue;
      dragStartY.current = toValue;
      if (animated) {
        Animated.spring(translateY, {
          toValue,
          useNativeDriver: true,
          damping: 22,
          stiffness: 220,
        }).start();
      } else {
        translateY.setValue(toValue);
      }
      if (expandedRef.current !== toExpanded) {
        onExpandedChange?.(toExpanded);
      }
    },
    [hiddenOffset, onExpandedChange, translateY],
  );

  useEffect(() => {
    snapTo(expanded, { animated: true });
  }, [expanded, snapTo]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderGrant: () => {
        dragStartY.current = positionRef.current;
      },
      onPanResponderMove: (_, gesture) => {
        const next = Math.min(hiddenOffset, Math.max(0, dragStartY.current + gesture.dy));
        translateY.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        translateY.stopAnimation((value) => {
          const openProgress = 1 - value / hiddenOffset;
          const shouldExpand =
            gesture.vy < -SNAP_VELOCITY ||
            (Math.abs(gesture.vy) <= SNAP_VELOCITY && openProgress > 0.45);
          snapTo(shouldExpand);
        });
      },
    }),
  ).current;

  const toggleExpanded = useCallback(() => {
    snapTo(!expandedRef.current);
  }, [snapTo]);

  return (
    <Animated.View
      pointerEvents={expanded ? "auto" : "box-none"}
      style={[
        styles.sheet,
        {
          height: expandedHeight + insets.bottom,
          paddingBottom: insets.bottom,
          transform: [{ translateY }],
          zIndex: 10,
          elevation: 10,
        },
      ]}
    >
      <View {...panResponder.panHandlers} style={styles.handleZone} pointerEvents="auto">
        <Pressable onPress={toggleExpanded} style={styles.handlePressable}>
          <View style={styles.handle} />
          {expanded ? (
            <>
              <Text style={styles.peekTitle}>{peekTitle}</Text>
              {peekSubtitle ? <Text style={styles.peekSubtitle}>{peekSubtitle}</Text> : null}
              <Text style={styles.hint}>Swipe down for full map</Text>
            </>
          ) : (
            <Text style={styles.peekCollapsed} numberOfLines={1}>
              {peekTitle} · swipe up
            </Text>
          )}
        </Pressable>
      </View>
      <View style={styles.body} pointerEvents={expanded ? "auto" : "none"}>
        {children}
      </View>
    </Animated.View>
  );
}
