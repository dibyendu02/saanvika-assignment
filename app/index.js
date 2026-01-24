import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Register background handler - MUST be at top level
// Since we are removing Notifee, we keep this as a minimal placeholder if needed,
// but Firebase handles background notifications automatically when they have a 'notification' property.
messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('📬 Background notification received (FCM):', remoteMessage);
    return Promise.resolve();
});

AppRegistry.registerComponent(appName, () => App);
