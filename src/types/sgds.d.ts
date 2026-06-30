import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'sgds-badge': React.HTMLAttributes<HTMLElement> & {
        variant?: 'primary' | 'accent' | 'success' | 'danger' | 'warning' | 'cyan' | 'purple' | 'neutral' | 'white';
        outlined?: boolean;
        dismissible?: boolean;
        show?: boolean;
        fullWidth?: boolean;
        slot?: string;
      };
      'sgds-alert': React.HTMLAttributes<HTMLElement> & {
        show?: boolean;
        variant?: 'info' | 'success' | 'danger' | 'warning' | 'neutral';
        outlined?: boolean;
        dismissible?: boolean;
        title?: string;
        slot?: string;
      };
      'sgds-table': React.HTMLAttributes<HTMLElement> & {
        tableBorder?: boolean;
        headerBackground?: boolean;
        responsive?: 'sm' | 'md' | 'lg' | 'xl' | 'always';
        slot?: string;
      };
      'sgds-table-row': React.HTMLAttributes<HTMLElement> & { slot?: string };
      'sgds-table-head': React.HTMLAttributes<HTMLElement> & { slot?: string };
      'sgds-table-cell': React.HTMLAttributes<HTMLElement> & { slot?: string };
      'sgds-description-list-group': React.HTMLAttributes<HTMLElement> & {
        stacked?: boolean;
        bordered?: boolean;
        slot?: string;
      };
      'sgds-description-list': React.HTMLAttributes<HTMLElement> & {
        stacked?: boolean;
        bordered?: boolean;
        slot?: string;
      };
      'sgds-icon': React.HTMLAttributes<HTMLElement> & {
        name?: string;
        size?: 'sm' | 'md' | 'lg';
        slot?: string;
      };
    }
  }
}
