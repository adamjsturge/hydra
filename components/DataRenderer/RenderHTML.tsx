import { Platform, ScrollView, ScrollViewProps, StyleSheet, Text, TextProps, TextStyle, View, ViewProps, ViewStyle } from 'react-native';
import { parseDocument, ElementType } from 'htmlparser2';
import React, { useContext } from 'react';
import { ThemeContext, t } from '../../contexts/ThemeContext';
import { AnyNode, Text as TextNode, Element as ElementNode } from 'domhandler';
import ImageViewer from './postParts/ImageViewer';

type InheritedStyles = ViewStyle & TextStyle;

export default function RenderHtml({ html }: {html: string}) {
    const theme = useContext(ThemeContext);

    const renderTextNode = (textNode: TextNode, index: number, inheritedStyles: InheritedStyles) => {
        const parent = textNode.parent as ElementNode;
        const grandParent = parent?.parent as ElementNode;
        const greatGrandParent = grandParent?.parent as ElementNode;
        let text = textNode.data;
        if (grandParent.name === 'li') {
            if (greatGrandParent.name === 'ol') {
                // @ts-ignore comment
                text = `${grandParent.index + 1}. ${text}`;
            }
            if (greatGrandParent.name === 'ul') {
                text = `• ${text}`;
            }
        }
        return (
            <Text
                key={index}
                style={t(styles.basicText, {
                    color: theme.subtleText,
                    ...inheritedStyles,
                })}
            >
                {text}
            </Text>
        );
    }

    const renderElement = (element: ElementNode, index: number, inheritedStyles: InheritedStyles) => {
        const [showSpoiler, setShowSpoiler] = React.useState(false);
        let Wrapper = View as React.ElementType;
        let wrapperProps: ViewProps & TextProps & ScrollViewProps = {};
        let wrapperStyles: ViewStyle & TextStyle = {};
        // @ts-ignore comment
        element.index = index;
        if (element.attribs.spoiler) {
            Wrapper = Text;
            inheritedStyles.color = showSpoiler ? theme.subtleText : theme.tint;
            wrapperStyles.paddingVertical = 2;
            wrapperStyles.paddingHorizontal = 5;
            wrapperStyles.backgroundColor = theme.tint;
            wrapperProps.onPress = () => setShowSpoiler(!showSpoiler);
        } else if (element.attribs.header) {
            Wrapper = Text;
            inheritedStyles.fontSize = 24;
            inheritedStyles.marginTop = 10;
            inheritedStyles.marginBottom = 4;
        } else if (element.name === 'div') {
            Wrapper = View;
            wrapperStyles.marginVertical = 5;
        } else if (element.name === 'pre') {
            Wrapper = (props) => (
                <ScrollView {...{ ...props, children: null }} horizontal={true}>
                    <View onStartShouldSetResponder={() => true}>
                        {props.children}
                    </View>
                </ScrollView>
            );
            wrapperStyles.padding = 10;
            wrapperStyles.backgroundColor = theme.tint;
        } else if (element.name === 'p') {
            Wrapper = Text;
            wrapperStyles.marginVertical = 5;
        } else if (element.name === 'hr') {
            Wrapper = View;
            wrapperStyles.borderBottomColor = theme.tint;
            wrapperStyles.borderBottomWidth = 1;
            wrapperStyles.marginVertical = 8;
        } else if (element.name === 'blockquote') {
            Wrapper = View;
            wrapperStyles.backgroundColor = theme.tint;
            wrapperStyles.marginLeft = 5;
            wrapperStyles.borderLeftColor = theme.subtleText;
            wrapperStyles.borderLeftWidth = 2;
            wrapperStyles.paddingLeft = 8;
            wrapperStyles.marginVertical = 2;
        } else if (element.name === 'span') {
            Wrapper = Text;
            wrapperStyles.marginVertical = 5;
        } else if (element.name === 'table') {
            Wrapper = View;
            wrapperStyles.flexDirection = 'column';
            wrapperStyles.margin = 5;
        } else if (element.name === 'thead') {
            Wrapper = View;
            wrapperStyles.flexDirection = 'column'
            inheritedStyles.fontWeight = 'bold';
        } else if (element.name === 'tbody') {
            Wrapper = View;
            wrapperStyles.flexDirection = 'column'
        } else if (element.name === 'tr') {
            Wrapper = View;
            wrapperStyles.flexDirection = 'row'
        } else if (['th', 'td'].includes(element.name)) {
            Wrapper = View;
            wrapperStyles.flexDirection = 'column'
            wrapperStyles.flex = 1;
            wrapperStyles.borderColor = theme.tint;
            wrapperStyles.borderWidth = 1;
        } else if (element.name === 'strong') {
            Wrapper = Text;
            inheritedStyles.fontWeight = 'bold';
        } else if (element.name === 'del') {
            Wrapper = Text;
            inheritedStyles.textDecorationLine = 'line-through';
            inheritedStyles.textDecorationStyle = 'solid';
        } else if (element.name === 'code') {
            Wrapper = Text;
            inheritedStyles.color = theme.text;
            inheritedStyles.fontFamily = Platform.OS === 'ios' ? 'Courier New' : 'monospace';
            wrapperStyles.backgroundColor = theme.tint;
        } else if (element.name === 'sup') {
            Wrapper = View;
            inheritedStyles.marginVertical = 0;
            inheritedStyles.paddingHorizontal = 0;
            inheritedStyles.fontSize = 11;
        } else if (element.name === 'a' && element.children[0]?.type === ElementType.Text) {
            Wrapper = Text;
            inheritedStyles.color = theme.buttonText;
            wrapperProps.onPress = () => {
                console.log('pressed link:', element.attribs.href);
            }
        } else if (element.name === 'em') {
            Wrapper = Text;
            inheritedStyles.fontStyle = 'italic';
        } else if (['ol', 'ul'].includes(element.name)) {
            Wrapper = View;
            wrapperStyles.marginHorizontal = 10;
        } else if (element.name === 'img') {
            Wrapper = (props) => (
                <View {...{ ...props, children: null }}>
                    <View onStartShouldSetResponder={() => true}>
                        <View style={styles.imageContainer}>
                            <ImageViewer images={[element.attribs.src]}/>
                        </View>
                        <View>
                            {props.children}
                        </View>
                    </View>
                </View>
            );
            wrapperStyles.marginVertical = 10;
            inheritedStyles.textAlign = 'center';
        }
        return Wrapper !== null ? (
            <Wrapper
                key={index}
                style={{
                    ...inheritedStyles,
                    ...wrapperStyles,
                }}
                {...wrapperProps}
            >
                {element.children.map((c, i) => renderNode(c, i, inheritedStyles))}
            </Wrapper>
        ) : null
    }

    const renderNode = (node: AnyNode, index: number, inheritedStyles: InheritedStyles = {}) => {
        switch (node.type) {
            case ElementType.Text:
                return renderTextNode(node, index, {...inheritedStyles});
            case ElementType.Tag:
                return renderElement(node, index, {...inheritedStyles});
        }
        return null;
    }


    const document = parseDocument(html);
    return (
        <View>
            {document.children.map((c, i) => renderNode(c, i))}
        </View>
    )
}

const styles = StyleSheet.create({
    basicText: {
      fontSize: 15,
      marginVertical: 10,
      paddingHorizontal: 15,
    },
    imageContainer: {
        height: 200,
        backgroundColor: 'red',
    },
});