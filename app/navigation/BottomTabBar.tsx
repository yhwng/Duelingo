import * as React from 'react';
import {BottomNavigation, Text} from 'react-native-paper';
import Home from '../screens/Home';
import Leaderboard from '../screens/Leaderboard';
import Challenge from '../screens/Challenge';
import Profile from '../screens/Profile';
import Filter from '../screens/Filter';

const HomeRoute = () => <Home route={undefined} navigation={undefined} />;

const LeaderboardRoute = () => (
  <Leaderboard route={undefined} navigation={undefined} />
);

const ChallengeRoute = () => (
  <Challenge route={undefined} navigation={undefined} />
);

const ProfileRoute = () => <Profile route={undefined} navigation={undefined} />;

const FilterRoute = () => <Filter route={undefined} navigation={undefined} />;

const BottomTabBar = () => {
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    {key: 'home', title: 'Home', focusedIcon: 'home-outline'},
    {key: 'leaderboard', title: 'Leaderboard', focusedIcon: 'medal-outline'},
    // {key: 'challenge', title: 'Challenge', focusedIcon: 'trophy-outline'},
    {key: 'filter', title: 'Filter', focusedIcon: 'trophy-outline'},
    {key: 'profile', title: 'Profile', focusedIcon: 'account-outline'},
  ]);

  const renderScene = BottomNavigation.SceneMap({
    home: HomeRoute,
    leaderboard: LeaderboardRoute,
    // challenge: ChallengeRoute,
    filter: FilterRoute,
    profile: ProfileRoute,
  });

  return (
    <BottomNavigation
      navigationState={{index, routes}}
      onIndexChange={setIndex}
      renderScene={renderScene}
    />
  );
};

export default BottomTabBar;
