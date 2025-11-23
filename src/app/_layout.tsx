import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="Home">
        <Label>Home</Label>
        <Icon sf="house.fill" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="Bookings">
        <Icon sf="calendar" drawable="custom_settings_drawable" />
        <Label>Bookings</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Favorites">
        <Icon sf="heart" drawable="custom_settings_drawable" />
        <Label>Bookings</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Settings">
        <Icon sf="gear" drawable="custom_settings_drawable" />
        <Label>Bookings</Label>
      </NativeTabs.Trigger>


    </NativeTabs>
  );
}
