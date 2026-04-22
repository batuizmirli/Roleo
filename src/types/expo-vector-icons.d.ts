declare module '@expo/vector-icons' {
  import type { Component } from 'react';
  import type { StyleProp, TextStyle } from 'react-native';

  type IconProps = {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
  };

  export class MaterialIcons extends Component<IconProps> {}
}
