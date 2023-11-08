import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import {
  Button,
  Text,
  Portal,
  Dialog,
  ActivityIndicator,
} from 'react-native-paper';
import {EventArg, NavigationAction} from '@react-navigation/native';

import Theme from '../common/constants/theme.json';
import CustomStatusBar from '../common/CustomStatusBar';
import QuizButtons from '../common/QuizButtons';
import TeachingButtons from '../common/TeachingButton';
import DuoButton from '../common/DuoButton';
import Constants from '../common/constants/Constants';
import Questions from '../data/Translation Questions.json';
import QuizHeader from '../common/QuizHeader';
import QuizFooter from '../common/QuizFooter';
import useTimeElapsed from '../utils/useTimeElapsed';
import {getQuiz} from '../utils/database';
import {getQuestions} from '../utils/firestore';
import firestore from '@react-native-firebase/firestore';

interface QuizProps {
  route: any;
  navigation: any;
}

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const Quiz = (props: QuizProps) => {
  const {route, navigation} = props;
  // const language: keyof typeof Questions = route.params.language;
  const language = route.params.language;
  const module = route.params.module;
  const topic = route.params.topic;
  const isLastCompletedTopic = route.params.isLastCompletedTopic;

  const [isLoading, setIsLoading] = useState(true);
  const [questionNo, setQuestionNo] = useState(1);
  const [questions, setQuestions] = useState<Record<string, any>[]>([]);
  // const [question, setQuestion] = useState<Record<string, any>>({});
  // const [gameFormat, setGameFormat] = useState(0);
  const [questionTotal, setQuestionTotal] = useState(-1);
  const [scoreableQns, setScoreableQns] = useState(0);
  const [lives, setLives] = useState(5);

  //To keep track of the time spent in the quiz
  const {timePassed, stopTimer} = useTimeElapsed(0);

  //To keep track of number of correct questions
  const [score, setScore] = useState(0);

  //Selected answer
  const [answer, setAnswer] = useState('');
  //Keeps track of whether the user as submitted the answer
  const [submit, setSubmit] = useState(false);
  //Decides whether to show the progress won't be saved dialog
  const [dialogVisible, setDialogVisible] = useState(false);

  const loadQuestions = async () => {
    console.log('Heloo');
    var tempScoreQns = 0;
    var numQns = 0;
    var qns: Record<string, any>[] = [];
    const collecton = await firestore()
      .collection('Quiz')
      .doc(language)
      .collection('Modules')
      .doc(module)
      .collection('Topics')
      .doc(topic)
      .collection('Questions')
      .get();
    collecton.forEach(documentSnapshot => {
      numQns = numQns + 1;
      qns.push(documentSnapshot.data());
      if (documentSnapshot.data().gameFormat === 1) {
        tempScoreQns = tempScoreQns + 1;
      }
    });
    console.log(qns);
    setQuestions(qns);
    setScoreableQns(tempScoreQns);
    setQuestionTotal(numQns);
    setIsLoading(false);
  };

  //Need to standardise the formatting of the questions for this to work properly.
  //Right now it extracts the text contained within "" and puts it into a box
  //And replaces the text with "the following"
  // const parseQuestion = (question: string, type: 'header' | 'box') => {
  //   if (question.includes('"')) {
  //     if (type === 'header') {
  //       return (
  //         question.split('"')[0] + 'the following' + question.split('"')[2]
  //       );
  //     } else return question.split('"')[1];
  //   } else if (type === 'header') {
  //     return question;
  //   } else return null;
  // };

  // const headerQuestion = parseQuestion(question.question, 'header');
  // const boxQuestion = parseQuestion(question.question, 'box');

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

  useEffect(() => {
    if (questions.length === 0) loadQuestions();
  });

  const handleSubmit = () => {
    //Animates the diff
    LayoutAnimation.configureNext({
      duration: 300,
      create: {type: 'easeOut', property: 'opacity'},
      update: {type: 'spring', springDamping: 100},
      delete: {type: 'easeOut', property: 'opacity'},
    });
    //Navigates to end screen after remaining questions reach 0, else go to next question
    if (submit) {
      //Quiz end
      if (questionNo === questionTotal) {
        stopTimer();
        navigation.navigate('QuizEnd', {
          timeElapsed: timePassed,
          totalScoreableQuestions: scoreableQns,
          score:
            answer === questions[questionNo - 1].correct_answer
              ? score + 1
              : score,
          isLastCompletedTopic: isLastCompletedTopic,
          language: language,
        });
      } else {
        //Next question
        if (
          questions[questionNo - 1].gameFormat === 1 &&
          answer === questions[questionNo - 1].correct_answer
        ) {
          setScore(score + 1);
        }
        setSubmit(false);
        setQuestionNo(questionNo + 1);
        setAnswer('');
        // navigation.push('Quiz', {
        //   language: language,
        //   difficulty: difficulty,
        //   questionNo: questionNo + 1,
        //   remaining: remaining,
        //   totalQuestions: totalQuestions,
        //   timeElapsed: timePassed,
        //   score: answer === question.correct_answer ? score + 1 : score,
        // });
      }
    } else {
      //Go to submitted state
      setSubmit(true);
      //if the current question has a gameFormat of 0, questionNo = questionNo + 1
      if (questions[questionNo - 1].gameFormat === 0) {
        setQuestionNo(questionNo + 1);
        //if the next question has a gameFormat of 1, set submit to false
        if (questions[questionNo].gameFormat === 1) {
          setSubmit(false);
        }
      } else {
        if (answer !== questions[questionNo - 1].correct_answer) {
          setLives(lives - 1);
        }
      }
    }
  };

  return (
    <View style={styles.mainContainer}>
      <CustomStatusBar backgroundColor={Theme.colors.elevation.level1} />
      {isLoading ? (
        <View>
          <ActivityIndicator />
        </View>
      ) : (
        <>
          <QuizHeader
            questionsRemaining={questionTotal - questionNo}
            totalQuestions={questionTotal}
            singleplayer={{lives: lives}}
            onPress={() => setDialogVisible(true)}
          />
          <View style={styles.questionContainer}>
            {questions[questionNo - 1].gameFormat === 1 ? (
              <>
                <Text variant={'headlineSmall'}>
                  {questions[questionNo - 1].question}
                </Text>
                <QuizButtons
                  question={questions[questionNo - 1]}
                  backgroundColor={styles.mainContainer.backgroundColor}
                  reveal={submit}
                  selected={answer}
                  onSelect={ans => setAnswer(ans)}
                />
              </>
            ) : (
              <TeachingButtons
                question={questions[questionNo - 1]}
                backgroundColor={styles.mainContainer.backgroundColor}
                onSelect={ans => setAnswer(ans)}
              />
            )}
          </View>

          {questions[questionNo - 1].gameFormat === 1 ? (
            <QuizFooter
              correct={answer === questions[questionNo - 1].correct_answer}
              explanation={questions[questionNo - 1].explanation}
              selected={answer !== ''}
              submit={submit}
              handleSubmit={handleSubmit}
            />
          ) : (
            <View style={styles.bottomContainer}>
              <DuoButton
                filled={true}
                inactive={false}
                backgroundColor={Theme.colors.primary}
                backgroundDark={Theme.colors.primaryDark}
                onPress={handleSubmit}
                stretch={true}
                textColor={Theme.colors.onPrimary}>
                Next
              </DuoButton>
            </View>
          )}
          {/* {boxQuestion && (
          <View style={styles.innerContainer}>
            <Text variant={'headlineSmall'}>{boxQuestion}</Text>
          </View>
        )} */}
        </>
      )}

      <Portal>
        <Dialog
          visible={dialogVisible}
          dismissable={false}
          dismissableBackButton={false}>
          <Dialog.Icon icon={'alert-circle-outline'} />
          <Dialog.Title style={styles.title}>
            Your progress will be lost.
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Your progress will not be saved if you choose to leave now. Are
              you sure you want to leave?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button mode="text" onPress={() => setDialogVisible(false)}>
              Cancel
            </Button>
            <Button mode="text" onPress={() => navigation.navigate('Debug')}>
              Leave
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

export default Quiz;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
  },
  questionContainer: {
    padding: Constants.edgePadding,
    gap: Constants.defaultGap,
  },
  innerContainer: {
    gap: Constants.defaultGap,
    paddingVertical: Constants.edgePadding * 2,
    paddingHorizontal: Constants.edgePadding * 2,
    borderRadius: Constants.radiusLarge,
    backgroundColor: Theme.colors.elevation.level2,
  },

  bottomContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Constants.edgePadding,
    paddingTop: Constants.edgePadding,
    paddingBottom: 2 * Constants.edgePadding,
  },
  title: {
    textAlign: 'center',
  },
});
