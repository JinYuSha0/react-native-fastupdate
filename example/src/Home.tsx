import React, {memo} from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView} from 'react-native';

interface HomeProps {}

const Home: React.FC<HomeProps> = ({}) => {
  return (
    <SafeAreaView>
      <ScrollView>
        <View>
          <Text>Home</Text>
          <View style={styles.box} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  box: {
    width: 300,
    height: 3000,
    backgroundColor: 'red',
  },
});

export default memo(Home);
