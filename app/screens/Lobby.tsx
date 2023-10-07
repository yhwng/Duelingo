import React, { useState, useEffect } from 'react';
import {View, TouchableOpacity, FlatList, KeyboardAvoidingView, StyleSheet} from 'react-native';
import {Button, Text, TextInput, Portal, Dialog} from 'react-native-paper';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import {EventArg, NavigationAction} from '@react-navigation/native';

import CustomStatusBar from '../common/CustomStatusBar';
import Constants from '../common/constants/Constants';
import DuoButton from '../common/DuoButton';
import theme from '../common/constants/theme.json';

interface LobbyProps {
    route: any;
    navigation: any;
}

const Lobby = (props: LobbyProps) => {
  const {route, navigation} = props;
  let [lobbyId, setLobbyId] = useState('')
  let [joinId, setJoinId] = useState('')
  let [newGameId, setGameId] = useState('')
  const userId = auth().currentUser.uid;
  //Decides whether to show the progress won't be saved dialog
  const [dialogVisible, setDialogVisible] = useState(false);
  //global variables
  global.joinId = joinId;
  global.lobbyId = lobbyId;
  global.newGameId = newGameId;

  const generateCode = length => {
    return Array(length).fill('x').join('').replace(/x/g, () => {
      return String.fromCharCode(Math.floor(Math.random() * 26) + 65)
    })
  }

  const CreateGame = async () => {
    database()
    .ref('/games/' + lobbyId)
    .set({
      gameId: newGameId,
      isPlaying: 'true',
      currentPlayer: '',
      round: '',
      status: '',
      timestamp: '',
      turnStartTimestamp: '',
      turnTime: '60000',
      host: userId,
      guest: ''
    })
    .then(() => navigation.navigate('Waiting'));
  }

  const CreateGameThings = () => {
    newGameId = generateCode(4);
    setGameId(newGameId);
    CreateGame();
  };
  useEffect(
    () =>
      navigation.addListener(
        'beforeRemove',
        (e: EventArg<'beforeRemove', true, {action: NavigationAction}>) => {
          if (e.data.action.type != 'GO_BACK') {
            return;
          }
          // Prevent default behavior of leaving the screen
          e.preventDefault();
          // Prompt the user before leaving the screen
          setDialogVisible(true);
        },
      ),
    [navigation],
  );

  const JoinGame = () => {
    database()
    .ref('/games/')
    .orderByKey()
    .equalTo(joinId)
    .limitToFirst(1)
    .once('value', snapshot => {
      if (snapshot.val()!==null) {
        database()
        .ref('/games/'+ joinId)
        .update({
          guest:userId
        })
        .then(() => navigation.navigate('Waiting'));
        console.log('Game joined.', snapshot.val());
      }
      else {
        console.log('Lobby Id does not exist.', snapshot.val());
        setDialogVisible(true)
      }
    })
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.container}>
        <Text variant={'headlineLarge'}>Lobby Screen</Text>
        <Button
          icon="map-marker-outline"
          mode="outlined"
          onPress={() => navigation.navigate('Home')}>
          Go to Home
        </Button>
        <View style={styles.rowContainer}>
          <KeyboardAvoidingView>
            <TextInput
              placeholder="New Lobby Id"
              value={lobbyId}
              activeOutlineColor={theme.colors.primary}
              autoCapitalize="none"
              onChangeText={lobbyId => setLobbyId(lobbyId)}
            />
            <Button
              icon="map-marker-outline"
              mode="outlined"
              onPress={CreateGameThings}>
              Create Game
            </Button>
            <TextInput
              placeholder="Join Lobby Id"
              value={joinId}
              activeOutlineColor={theme.colors.primary}
              autoCapitalize="none"
              onChangeText={joinId => setJoinId(joinId)}
            />
            <Button
              icon="map-marker-outline"
              mode="outlined"
              onPress={JoinGame}>
              Join Game
            </Button>
          </KeyboardAvoidingView>
          <Portal>
          <Dialog
            visible={dialogVisible}
            dismissable={false}
            dismissableBackButton={false}>
            <Dialog.Icon icon={'alert-circle-outline'} />
            <Dialog.Title style={styles.title}>
              No Lobby Found
            </Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">
                Please enter another lobby ID
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button mode="text" onPress={() => setDialogVisible(false)}>
                Exit
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        </View>
      </View>
    </View>
  )
}

export default Lobby;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Constants.defaultGap,
    paddingHorizontal: Constants.edgePadding,
  },
  rowContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Constants.mediumGap,
    justifyContent: 'center',
  },
  text:{
    color:'black',
    fontSize:20
  }
});
  