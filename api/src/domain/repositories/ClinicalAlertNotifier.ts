export interface ClinicalAlertNotifier {
  sendGenericClinicalAlert(userId: string, alertId: string): Promise<void>;
}
