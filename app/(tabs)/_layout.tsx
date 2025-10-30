import { icons } from '@/constants/icons';
import { images } from '@/constants/images';
import { Tabs } from 'expo-router';
import React from 'react';
import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
const TabIcons = ({focused,icon,title}:any) =>  {

  if(focused){
  return(
     <ImageBackground
        source={images.highlight}
        className="flex flex-row items-center justify-center mt-4 min-w-[112px] min-h-16 rounded-full overflow-hidden"
      >
        <Image
          source={icon}
          tintColor={focused ? "#151312" : "#8E8E8E"}
          className="w-5 h-5 mr-1"
        />
        <Text className="text-sm font-medium text-[#151312]">{title}</Text>
      </ImageBackground>
  )
}
    return (
      <View className='justify-center items-center mt-4 rounded-full '>
        <Image source={icon} tintColor="#A8B5DB" 
        className='size-5 '/>
      </View>
    )
}

const TabsLayout = () => {

  return (
        <Tabs 
        screenOptions={{
          tabBarShowLabel:false,
          tabBarItemStyle:{
            width:'100%',
            height:'100%',
            justifyContent:'center',
            alignContent:'center'
          },
          tabBarStyle:{
            backgroundColor:"#0f0D23",
            borderRadius:50,
            marginHorizontal:20,
            marginBottom:20,
            height:52,
            position:'absolute',
            overflow:'hidden',
            borderWidth:1,
            borderColor:"#0f0D23"
          }
        }}
        >
         
         
         <Tabs.Screen
      name="index"
      options={{
        title: 'Home',
        headerShown: false,
        tabBarIcon: ({ focused }) => (
              <TabIcons
          focused={focused}
          icon={icons.home}
          title="Home"
        />

        ),
      }}
    />


      <Tabs.Screen 
      name='serach'
      options={{
        title:'search',
        headerShown:false,
         tabBarIcon: ({ focused }) => (
        <TabIcons
          focused={focused}
          icon={icons.search}
          title="search"
        />

        )
        
      }}
      />

           <Tabs.Screen 
      name='save'
      options={{
        title:'save',
        headerShown:false,
         tabBarIcon: ({ focused }) => (
        <TabIcons
          focused={focused}
          icon={icons.save}
          title="save"
        />

        )
      }}
      />

           <Tabs.Screen 
      name='profile'
      options={{
        title:'profile',
        headerShown:false,
         tabBarIcon: ({ focused }) => (
        <TabIcons
          focused={focused}
          icon={icons.person}
          title="profile"
        />

        )
      }}
      />
    </Tabs>
  );
};

export default TabsLayout;

const styles = StyleSheet.create({});
