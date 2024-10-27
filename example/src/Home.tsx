import React, {memo} from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView} from 'react-native';
import {FastUpdateProvider} from 'react-native-fast-update';

interface HomeProps {}

const Home: React.FC<HomeProps> = ({}) => {
  return (
    <FastUpdateProvider>
      <SafeAreaView>
        <ScrollView>
          <View>
            <Text>Home</Text>
            <View style={styles.box} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </FastUpdateProvider>
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
