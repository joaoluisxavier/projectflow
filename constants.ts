
import { ProjectStatus, AssistanceStatus } from './types';

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  ProjectStatus.PaymentMade,
  ProjectStatus.MeasurementDone,
  ProjectStatus.TechDrawingsApproved,
  ProjectStatus.ProductionStarted,
  ProjectStatus.DeliveryScheduled,
  ProjectStatus.DeliveryMade,
  ProjectStatus.AssemblyFinished,
  ProjectStatus.QualityControl,
  ProjectStatus.Completed,
];

export const ASSISTANCE_STATUS_ORDER: AssistanceStatus[] = [
  AssistanceStatus.Open,
  AssistanceStatus.InProgress,
  AssistanceStatus.Closed,
];