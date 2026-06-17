export interface FundraiserUpdates {
  onNewDonation: boolean;
}

export interface MobileUpdates {
  fundraiserCosignersNotification: boolean;
  fundraiserUpdates: boolean;
  payOutsUpdates: boolean;
}

export interface EmailUpdates {
  securityAlerts: boolean;
  fundraiserCosignersNotification: boolean;
  fundraiserUpdates: boolean;
  promotionalUpdates: boolean;
  accountUpdates: boolean;
}

export interface NotificationSettings {
  fundraiserUpdates: FundraiserUpdates;
  mobileUpdates: MobileUpdates;
  emailUpdates: EmailUpdates;
}

export interface AccountSecurity {
  twoFactorAuth: boolean;
  supportAccess: boolean;
}

export interface Settings {
  notifications: NotificationSettings;
  accountSecurity: AccountSecurity;
}

export const defaultSettings: Settings = {
  notifications: {
    fundraiserUpdates: {
      onNewDonation: true,
    },
    mobileUpdates: {
      fundraiserCosignersNotification: true,
      fundraiserUpdates: true,
      payOutsUpdates: true,
    },
    emailUpdates: {
      securityAlerts: true,
      fundraiserCosignersNotification: true,
      fundraiserUpdates: true,
      promotionalUpdates: true,
      accountUpdates: true,
    },
  },
  accountSecurity: {
    twoFactorAuth: true,
    supportAccess: false,
  },
};