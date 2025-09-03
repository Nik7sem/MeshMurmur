import {Box} from '@chakra-ui/react';
import React, {useState, useRef, TouchEvent, ReactNode, FC} from 'react';

interface Props {
  onSwipe: () => void;
  children: ReactNode;
  swipeThreshold?: number;
  maxSwipeDistance?: number;
  direction?: 'left' | 'right';
  enableDoubleClick?: boolean;
}

const Swipeable: FC<Props> = ({
                                onSwipe,
                                children,
                                swipeThreshold = 60,
                                maxSwipeDistance = 80,
                                direction = 'left',
                                enableDoubleClick = true,
                              }) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);

  const absThreshold = Math.abs(swipeThreshold);
  const absMaxDistance = Math.abs(maxSwipeDistance);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isSwiping) return;

    const currentX = e.touches[0].clientX;
    const deltaX = currentX - touchStartX.current;

    if (direction === 'left' && deltaX < 0) {
      setSwipeOffset(Math.max(deltaX, -absMaxDistance));
    } else if (direction === 'right' && deltaX > 0) {
      setSwipeOffset(Math.min(deltaX, absMaxDistance));
    }
  };

  const handleTouchEnd = () => {
    const shouldTrigger = direction === 'left'
      ? swipeOffset <= -absThreshold
      : swipeOffset >= absThreshold;

    if (shouldTrigger) onSwipe();

    setSwipeOffset(0);
    setIsSwiping(false);
  };

  const handleDoubleClick = () => {
    if (enableDoubleClick) {
      onSwipe();
    }
  };

  return (
    <Box
      width="100%"
      onDoubleClick={handleDoubleClick}
      style={{touchAction: 'pan-y'}}
    >
      <Box
        transform={`translateX(${swipeOffset}px)`}
        transition={isSwiping ? 'none' : 'transform 0.2s ease'}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Swipeable;