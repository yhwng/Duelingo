import {View, StyleSheet} from 'react-native';
import {Button, Dialog, Portal, Text} from 'react-native-paper';
import React, {useState} from 'react';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

import CustomStatusBar from '../common/CustomStatusBar';
import Constants from '../common/constants/Constants';
import useCountdown from '../utils/useCountdown';

interface ChallengePlayerProps {
  route: any;
  navigation: any;
}

const ChallengePlayer = (props: ChallengePlayerProps) => {
  const {route, navigation} = props;
  const [lobbyId, setLobbyId] = useState('ChallengeTest');
  const [language, setLanguage] = useState('chinese');
  const [difficulty, setDifficulty] = useState('easy');
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeClash, setChallengeClash] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [timeout, setTimeout] = useState<number | null>(null);

  const userId = auth().currentUser?.uid as string;
  const [playerId, setPlayerId] = useState('');

  const randomQuestion = (count: number, max: number) => {
    if (count > max) return;
    const qns = [];
    while (qns.length < count) {
      const no = Math.floor(Math.random() * max);
      if (qns.indexOf(no) === -1) {
        qns.push(no);
      }
    }
    return qns;
  };

  const generateCode = (length: number) => {
    return Array(length)
      .fill('x')
      .join('')
      .replace(/x/g, () => {
        return String.fromCharCode(Math.floor(Math.random() * 26) + 65);
      });
  };

  useCountdown(timeout, setTimeout, () => {
    setTimedOut(true);
    resetListeners();
    setChallengeActive(false);
    database()
      .ref('/games/' + lobbyId)
      .remove();
    database()
      .ref('/challenge/' + playerId)
      .update({status: false});
  });

  const resetListeners = () => {
    setTimeout(null);
    database()
      .ref('/challenge/' + playerId)
      .off();
    database()
      .ref('/games/' + lobbyId + '/isWaiting')
      .off();
    database()
      .ref('/users/' + playerId)
      .off();
  };

  const handleChallenge = (player: string) => {
    setPlayerId(player);
    database()
      .ref('/challenge/')
      .equalTo(player)
      .limitToFirst(1)
      .once('value', async snapshot => {
        if (snapshot.val() !== null) {
          //Challenge already exists
          setChallengeClash(true);
        } else {
          setChallengeActive(true);
          var lobby = generateCode(6);
          setLobbyId(lobby);
          //Create challenge record
          await database()
            .ref('/challenge/' + player)
            .set({
              language: language,
              difficulty: difficulty,
              lobbyId: lobby,
              challenger: 'Lance', //TODO Get username from database
              isRematch: false,
              status: true,
            });
          //Create lobby
          await database()
            .ref('/games/' + lobby)
            .set({
              isWaiting: {[userId]: true},
              startTimestamp: 0,
              questions: randomQuestion(5, 9),
              points: {[userId]: 0},
            });
          setTimeout(30);
          //Checks if the other player joins the lobby
          database()
            .ref('/games/' + lobby + '/isWaiting')
            .on('value', snapshot => {
              if (snapshot.val() && Object.keys(snapshot.val()).length > 1) {
                resetListeners();
                setChallengeActive(false);
                navigation.navigate('Multiplayer', {
                  gameId: lobby,
                  host: true,
                  language: language,
                  difficulty: difficulty,
                });
              }
            });
          //Checks if the other player declines
          database()
            .ref('/challenge/' + player)
            .on('value', snapshot => {
              if (!snapshot.val()) {
                resetListeners();
                setChallengeActive(false);
                setDeclined(true);
              }
            });
          //Checks if the player goes offline
          database()
            .ref('/users/' + player)
            .on('value', snapshot => {
              if (!snapshot.val()) {
                resetListeners();
                setChallengeActive(false);
                setDeclined(true);
              }
            });
        }
      });
  };

  return (
    <View style={styles.mainContainer}>
      <CustomStatusBar />
      <View style={styles.container}>
        <Text variant={'headlineLarge'}>Challenge Screen</Text>
        <Button
          mode="outlined"
          onPress={() => {
            handleChallenge('ytnv4Xn4FYVNY6V53a5ded7DiI32');
          }}>
          Challenge
        </Button>
      </View>
      <Portal>
        <Dialog
          visible={challengeActive}
          dismissable={false}
          dismissableBackButton={false}>
          <Dialog.Icon icon={'karate'} />
          <Dialog.Title style={styles.title}>Challenge requested!</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">Waiting for player to respond...</Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.actions}>
            <Button
              mode="text"
              onPress={() => {
                setChallengeActive(false);
                resetListeners();
                database()
                  .ref('/challenge/' + playerId)
                  .update({status: false});
                database()
                  .ref('/games/' + lobbyId)
                  .remove();
              }}>
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={timedOut}
          dismissable={false}
          dismissableBackButton={false}>
          <Dialog.Title>Challenge timed out.</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              The player has taken too long to respond to the challenge and the
              request has been automatically declined.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              mode="text"
              onPress={() => {
                setTimedOut(false);
              }}>
              Ok
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={challengeClash}
          dismissable={false}
          dismissableBackButton={false}>
          <Dialog.Title>Challenge already exists.</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Another player has already challenged this player to a duel,
              please wait before issuing another challenge.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              mode="text"
              onPress={() => {
                setChallengeClash(false);
              }}>
              Ok
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={declined}
          dismissable={false}
          dismissableBackButton={false}>
          <Dialog.Title>Challenge declined.</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              The other player has declined the challenge request.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              mode="text"
              onPress={() => {
                setDeclined(false);
                database()
                  .ref('/games/' + lobbyId)
                  .remove();
              }}>
              Ok
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

export default ChallengePlayer;

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
  title: {
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'column',
    gap: Constants.mediumGap,
  },
});
