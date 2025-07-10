type SnackBarStatus = 'success' | 'danger' | 'warning' | 'info' | 'primary';

type SnackBarTextColor = 'white' | 'dark';
interface SnackBarOptions {
  duration?: number;
  header?: string;
  autoHide?: boolean;
}

export { SnackBarStatus, SnackBarTextColor, SnackBarOptions };
