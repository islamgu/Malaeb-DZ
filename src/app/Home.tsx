import "../../global.css"
import { Text, View } from 'react-native'
import React, { Component } from 'react'
import { SafeAreaView } from "react-native-safe-area-context"

export default function Home(){

    return (
      <SafeAreaView>

      <View>
        <Text className='text-3xl bg-red-500'>index</Text>
      </View>
      </SafeAreaView>
    )
}
  
  
