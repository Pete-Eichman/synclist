import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ListItem } from '../services/api';
import { colors } from '../theme/colors';
import { ItemRow } from './ItemRow';

const ITEM_HEIGHT = 48;

interface Props {
  items: ListItem[];
  deviceId: string;
  onReorder: (updates: { id: string; position: number }[]) => void;
  onToggle: (itemId: string, checked: boolean) => void;
  onDelete: (itemId: string) => void;
}

export function DraggableItemList({ items, deviceId, onReorder, onToggle, onDelete }: Props) {
  const activeIndex = useSharedValue(-1);
  const translateY = useSharedValue(0);
  const hoverIndex = useSharedValue(-1);

  const commitReorder = (fromIndex: number, toIndex: number) => {
    const reordered = [...items];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const updates = reordered.map((item, idx) => ({ id: item.id, position: idx }));
    onReorder(updates);
  };

  return (
    <View>
      {items.map((item, index) => (
        <DraggableRow
          key={item.id}
          item={item}
          index={index}
          count={items.length}
          isOwn={item.created_by === deviceId}
          activeIndex={activeIndex}
          translateY={translateY}
          hoverIndex={hoverIndex}
          onReorder={commitReorder}
          onToggle={() => onToggle(item.id, item.checked)}
          onDelete={() => onDelete(item.id)}
        />
      ))}
    </View>
  );
}

interface RowProps {
  item: ListItem;
  index: number;
  count: number;
  isOwn: boolean;
  activeIndex: SharedValue<number>;
  translateY: SharedValue<number>;
  hoverIndex: SharedValue<number>;
  onReorder: (from: number, to: number) => void;
  onToggle: () => void;
  onDelete: () => void;
}

function DraggableRow({
  item,
  index,
  count,
  isOwn,
  activeIndex,
  translateY,
  hoverIndex,
  onReorder,
  onToggle,
  onDelete,
}: RowProps) {
  const pan = Gesture.Pan()
    .onStart(() => {
      'worklet';
      activeIndex.value = index;
      translateY.value = 0;
      hoverIndex.value = index;
    })
    .onChange((e) => {
      'worklet';
      translateY.value = e.translationY;
      hoverIndex.value = Math.max(
        0,
        Math.min(count - 1, Math.round(index + e.translationY / ITEM_HEIGHT)),
      );
    })
    .onEnd(() => {
      'worklet';
      const from = activeIndex.value;
      const to = hoverIndex.value;
      if (from !== to) {
        translateY.value = withSpring((to - from) * ITEM_HEIGHT, { damping: 20 }, () => {
          translateY.value = 0;
          activeIndex.value = -1;
          hoverIndex.value = -1;
          runOnJS(onReorder)(from, to);
        });
      } else {
        translateY.value = withSpring(0);
        activeIndex.value = -1;
        hoverIndex.value = -1;
      }
    });

  const animStyle = useAnimatedStyle(() => {
    const ai = activeIndex.value;
    const hi = hoverIndex.value;

    if (ai === index) {
      return {
        transform: [{ translateY: translateY.value }],
        zIndex: 100,
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        backgroundColor: colors.surfaceRaised,
      };
    }

    if (ai === -1) {
      return { transform: [{ translateY: 0 }], zIndex: 0 };
    }

    let shift = 0;
    if (ai < hi && index > ai && index <= hi) shift = -ITEM_HEIGHT;
    else if (ai > hi && index < ai && index >= hi) shift = ITEM_HEIGHT;

    return {
      transform: [{ translateY: withSpring(shift, { damping: 20, stiffness: 250 }) }],
      zIndex: 0,
    };
  });

  return (
    <Animated.View style={[styles.rowWrapper, animStyle]}>
      <GestureDetector gesture={pan}>
        <View style={styles.handle} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
          <Text style={styles.handleIcon}>≡</Text>
        </View>
      </GestureDetector>
      <View style={styles.itemContent}>
        <ItemRow
          item={item}
          isOwn={isOwn}
          dimmed={false}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  rowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  handle: {
    width: 32,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleIcon: {
    color: colors.textDisabled,
    fontSize: 18,
    lineHeight: 22,
  },
  itemContent: {
    flex: 1,
  },
});
