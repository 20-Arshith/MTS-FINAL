import React from 'react';
import { View } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const ShadowIconBox = ({
  icon,
  color,
  size = 62,
  iconSize = 28,
  radius = 18,
  iconFamily = 'MaterialIcons',
}) => {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: color,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: color,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.95,
        shadowRadius: 32,
        elevation: 24,
      }}
    >
      {iconFamily === 'Ionicons' ? (
        <Ionicons name={icon} size={iconSize} color="#FFFFFF" />
      ) : (
        <MaterialIcons name={icon} size={iconSize} color="#FFFFFF" />
      )}
    </View>
  );
};

export default ShadowIconBox;
