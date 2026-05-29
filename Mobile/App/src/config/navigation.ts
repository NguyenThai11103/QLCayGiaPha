export type RootStackParamList = {
  Onboarding      : undefined;
  GetStarted      : undefined;
  Login           : undefined;
  Register        : undefined;
  Main            : undefined;
  Home            : undefined;
  QRScan          : undefined;
  Notifications   : undefined;
  MoPhan          : undefined;
  LichAm          : undefined;
  ForgotPassword  : undefined;
  Settings        : undefined;
  Help            : undefined;
  TaiLieu         : undefined;
  ChangePassword  : undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
