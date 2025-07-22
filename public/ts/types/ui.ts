type SnackBarStatus = 'success' | 'danger' | 'warning' | 'info' | 'primary';

type SnackBarTextColor = 'white' | 'dark';
interface SnackBarOptions {
  duration?: number;
  header?: string;
  autoHide?: boolean;
}

type AlertTextColor = 'white' | 'dark';
type AlertStatus = 'success' | 'danger' | 'warning' | 'info' | 'primary';

export { SnackBarStatus, SnackBarTextColor, SnackBarOptions, AlertStatus };
