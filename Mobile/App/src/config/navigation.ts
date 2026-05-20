export type RootStackParamList = {
  Onboarding : undefined;
  GetStarted : undefined;
  Login      : undefined;
  Register   : undefined;
  Main       : undefined;
  Home       : undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
