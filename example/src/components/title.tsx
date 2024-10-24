import React, {memo} from 'react';
import {View, Text} from 'react-native';

interface TitleProps {}

const Title: React.FC<TitleProps> = ({}) => {
  return (
    <View>
      <Text>text</Text>
    </View>
  );
};

export default memo(Title);
