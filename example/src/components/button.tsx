import React, {memo} from 'react';
import {Pressable} from 'react-native';

interface ButtonProps extends React.ComponentProps<typeof Pressable> {}

const Button: React.FC<React.PropsWithChildren<ButtonProps>> = ({
  children,
  ...rest
}) => {
  return <Pressable {...rest}>{children}</Pressable>;
};

export default memo(Button);
