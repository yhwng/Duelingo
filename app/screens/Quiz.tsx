import {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import {Button, Text, Portal, Dialog} from 'react-native-paper';
import {EventArg, NavigationAction} from '@react-navigation/native';
import {getQuiz} from '../utils/database';

import Theme from '../common/constants/theme.json';
import CustomStatusBar from '../common/CustomStatusBar';
import QuizButtons from '../common/QuizButtons';
import Constants from '../common/constants/Constants';
import QuizHeader from '../common/QuizHeader';
import QuizFooter from '../common/QuizFooter';
import useTimeElapsed from '../common/useTimeElapsed';

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
  const language: string = route.params.language;
  const difficulty: string = route.params.difficulty;
  const questionNo: number = route.params.questionNo;
  const [lives, setLives] = useState(5);

  //To keep track of the time spent in the quiz
  const startTime = route.params.timeElapsed;
  const {timePassed, stopTimer} = useTimeElapsed(startTime);

  //Remaining number of questions, used to update the progress bar
  const [remaining, setRemaining] = useState(route.params.remaining);

  //To keep track of the users score
  const score = route.params.score;
  const totalQuestions = route.params.totalQuestions;

  //Selected answer
  const [answer, setAnswer] = useState('');
  //Keeps track of whether the user as submitted the answer
  const [submit, setSubmit] = useState(false);
  //Decides whether to show the progress won't be saved dialog
  const [dialogVisible, setDialogVisible] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: [],
    correct_answer: '',
    explanation: '',
  });

  //call API to retrieve questions from database
  const getQuizDetails = async () => {
    let currentQuiz: any = await getQuiz(language);
    currentQuiz = currentQuiz.data()[difficulty][questionNo];
    setCurrentQuestion({...currentQuiz});
  };

  useEffect(() => {
    getQuizDetails();
  }, []);

  //Need to standardise the formatting of the questions for this to work properly.
  //Right now it extracts the text contained within "" and puts it into a box
  //And replaces the text with "the following"
  const parseQuestion = (question: string, type: 'header' | 'box') => {
    if (question.includes('"')) {
      if (type === 'header') {
        return (
          question.split('"')[0] + 'the following' + question.split('"')[2]
        );
      } else return question.split('"')[1];
    } else if (type === 'header') {
      return question;
    } else return null;
  };

  const headerQuestion = parseQuestion(currentQuestion.question, 'header');
  const boxQuestion = parseQuestion(currentQuestion.question, 'box');

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

  const handleSubmit = () => {
    //Navigates to end screen after remaining questions reach 0, else go to next question
    if (submit) {
      if (remaining === 0) {
        stopTimer();
        navigation.navigate('QuizEnd', {
          timeElapsed: timePassed,
          multiplayer: false,
          totalQuestions: totalQuestions,
          score: answer === currentQuestion.correct_answer ? score + 1 : score,
        });
      } else {
        stopTimer();
        navigation.push('Quiz', {
          language: language,
          difficulty: difficulty,
          questionNo: questionNo + 1,
          remaining: remaining,
          totalQuestions: totalQuestions,
          timeElapsed: timePassed,
          score: answer === currentQuestion.correct_answer ? score + 1 : score,
        });
      }
      //Plays the animation upon submitting
    } else {
      LayoutAnimation.configureNext({
        duration: 300,
        update: {type: 'spring', springDamping: 100},
      });
      setSubmit(true);
      setRemaining(remaining - 1);
      if (answer !== currentQuestion.correct_answer) {
        setLives(lives - 1);
      }
    }
  };

  return (
    <View style={styles.mainContainer}>
      <CustomStatusBar backgroundColor={Theme.colors.elevation.level1} />
      <QuizHeader
        questionsRemaining={remaining}
        totalQuestions={totalQuestions}
        singleplayer={{lives: lives}}
        // multiplayer={{onEndTime: () => setSubmit(true), timer: true}}
        onPress={() => setDialogVisible(true)}
      />
      <View style={styles.questionContainer}>
        <Text variant={'headlineSmall'}>{headerQuestion}</Text>
        {boxQuestion && (
          <View style={styles.innerContainer}>
            <Text variant={'headlineSmall'}>{boxQuestion}</Text>
          </View>
        )}
        <QuizButtons
          question={currentQuestion}
          backgroundColor={styles.mainContainer.backgroundColor}
          reveal={submit}
          selected={answer}
          onSelect={ans => setAnswer(ans)}
        />
      </View>
      <QuizFooter
        correct={answer === currentQuestion.correct_answer}
        explanation={currentQuestion.explanation}
        selected={answer === ''}
        submit={submit}
        handleSubmit={handleSubmit}
      />
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
            <Button mode="text" onPress={() => navigation.navigate('Home')}>
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
  title: {
    textAlign: 'center',
  },
});
