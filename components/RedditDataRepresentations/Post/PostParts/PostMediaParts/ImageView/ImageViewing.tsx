import React, { ComponentType, useCallback, useRef, useEffect } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
  VirtualizedList,
  ModalProps,
  Modal,
} from "react-native";

import { ImageSource } from "./@types";
import ImageDefaultHeader from "./components/ImageDefaultHeader";
import ImageItem from "./components/ImageItem/ImageItem";
import StatusBarManager from "./components/StatusBarManager";
import useAnimatedComponents from "./hooks/useAnimatedComponents";
import useImageIndexChange from "./hooks/useImageIndexChange";
import useRequestClose from "./hooks/useRequestClose";

type Props = {
  images: ImageSource[];
  keyExtractor?: (imageSrc: ImageSource, index: number) => string;
  imageIndex: number;
  visible: boolean;
  onRequestClose: () => void;
  onLongPress?: (image: ImageSource) => void;
  onImageIndexChange?: (imageIndex: number) => void;
  presentationStyle?: ModalProps["presentationStyle"];
  animationType?: ModalProps["animationType"];
  backgroundColor?: string;
  swipeToCloseEnabled?: boolean;
  doubleTapToZoomEnabled?: boolean;
  delayLongPress?: number;
  HeaderComponent?: ComponentType<{ imageIndex: number }>;
  FooterComponent?: ComponentType<{ imageIndex: number }>;
};

const DEFAULT_ANIMATION_TYPE = "fade";
const DEFAULT_DELAY_LONG_PRESS = 800;
const SCREEN = Dimensions.get("screen");
const SCREEN_WIDTH = SCREEN.width;

function ImageViewing({
  images,
  keyExtractor,
  imageIndex,
  visible,
  onRequestClose,
  onLongPress = () => {},
  onImageIndexChange,
  animationType = DEFAULT_ANIMATION_TYPE,
  presentationStyle,
  swipeToCloseEnabled,
  doubleTapToZoomEnabled,
  delayLongPress = DEFAULT_DELAY_LONG_PRESS,
  HeaderComponent,
  FooterComponent,
}: Props) {
  const imageList = useRef<VirtualizedList<ImageSource>>(null);
  const [_opacity, onRequestCloseEnhanced] = useRequestClose(onRequestClose);
  const [currentImageIndex, onScroll] = useImageIndexChange(imageIndex, SCREEN);
  const [headerTransform, footerTransform, toggleBarsVisible] =
    useAnimatedComponents();

  useEffect(() => {
    if (onImageIndexChange) {
      onImageIndexChange(currentImageIndex);
    }
  }, [currentImageIndex]);

  const onZoom = useCallback(
    (isScaled: boolean) => {
      // @ts-ignore
      imageList?.current?.setNativeProps({ scrollEnabled: !isScaled });
      toggleBarsVisible(!isScaled);
    },
    [imageList],
  );

  if (!visible) {
    return null;
  }

  return (
    <View
      onMoveShouldSetResponder={() => true}
      onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => {
        /* Prevents views underneath the modal from taking over */
        return false;
      }}
    >
      <Modal
        transparent={presentationStyle === "overFullScreen"}
        visible={visible}
        presentationStyle={presentationStyle}
        animationType={animationType}
        onRequestClose={onRequestCloseEnhanced}
        supportedOrientations={["portrait"]}
        hardwareAccelerated
      >
        <StatusBarManager presentationStyle={presentationStyle} />
        <View style={styles.container}>
          <Animated.View
            style={[styles.header, { transform: headerTransform }]}
          >
            {typeof HeaderComponent !== "undefined" ? (
              React.createElement(HeaderComponent, {
                imageIndex: currentImageIndex,
              })
            ) : (
              <ImageDefaultHeader onRequestClose={onRequestCloseEnhanced} />
            )}
          </Animated.View>
          <VirtualizedList
            ref={imageList}
            data={images}
            horizontal
            pagingEnabled
            windowSize={3}
            initialNumToRender={2}
            maxToRenderPerBatch={100}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            initialScrollIndex={imageIndex}
            getItem={(_: ImageSource[], index: number) => images[index]}
            getItemCount={() => images.length}
            getItemLayout={(_: ImageSource, index: number) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            renderItem={({ item: imageSrc }: { item: ImageSource }) => (
              <ImageItem
                onZoom={onZoom}
                imageSrc={imageSrc}
                onRequestClose={onRequestCloseEnhanced}
                onLongPress={onLongPress}
                delayLongPress={delayLongPress}
                swipeToCloseEnabled={swipeToCloseEnabled}
                doubleTapToZoomEnabled={doubleTapToZoomEnabled}
              />
            )}
            onMomentumScrollEnd={onScroll}
            //@ts-ignore
            keyExtractor={(imageSrc, index) =>
              keyExtractor
                ? keyExtractor(imageSrc, index)
                : typeof imageSrc === "number"
                  ? `${imageSrc}`
                  : imageSrc.uri
            }
          />
          {typeof FooterComponent !== "undefined" && (
            <Animated.View
              style={[styles.footer, { transform: footerTransform }]}
            >
              {React.createElement(FooterComponent, {
                imageIndex: currentImageIndex,
              })}
            </Animated.View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  header: {
    position: "absolute",
    width: "100%",
    zIndex: 1,
    top: 0,
  },
  footer: {
    position: "absolute",
    width: "100%",
    zIndex: 1,
    bottom: 0,
  },
});

const EnhancedImageViewing = (props: Props) => (
  <ImageViewing key={props.imageIndex} {...props} />
);

export default EnhancedImageViewing;