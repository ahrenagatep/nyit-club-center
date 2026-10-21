import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0B55B7",
        tabBarInactiveTintColor: "#000000",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
        },
      }}
    >  {/*This makes names for tabs appear on the bottom of the app*/}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
        }}
      />
      <Tabs.Screen
        name="skill-exchange"
        options={{
          title: "Skill Exchnange",
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
        }}  
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: "Chats"  //recent added tab
        }}
      />  


      <Tabs.Screen
        name="more"
        options={{
          title: "More",
        }}
      />  
    </Tabs>
  );
}