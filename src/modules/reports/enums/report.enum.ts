export enum ReportReason {
  SPAM = 'SPAM',
  ABUSIVE = 'ABUSIVE',
  INAPPROPRIATE = 'INAPPROPRIATE',
  MISINFORMATION = 'MISINFORMATION',
  COPYRIGHT = 'COPYRIGHT',
  OTHER = 'OTHER',
}

export const REPORT_REASONS = Object.values(ReportReason);

export enum ReportTargetType {
  BLOG = 'BLOG',
  BLOG_COMMENT = 'BLOG_COMMENT',
  FORUM = 'FORUM',
  FORUM_COMMENT = 'FORUM_COMMENT',
}

export const REPORT_TARGET_TYPES = Object.values(ReportTargetType);

export enum ReportStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export const REPORT_STATUSES = Object.values(ReportStatus);
