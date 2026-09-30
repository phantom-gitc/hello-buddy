const { INTERVIEW_STATUS } = require('../../constants/interviewTypes');
const ApiError = require('../../utils/ApiError');

const interviewEngine = {
  /**
   * Validates state transition
   */
  assertTransition(currentStatus, allowedPreviousStatuses, targetStatus) {
    if (!allowedPreviousStatuses.includes(currentStatus)) {
      throw ApiError.badRequest(
        `Invalid interview state transition from ${currentStatus} to ${targetStatus}`,
        'INVALID_STATE_TRANSITION'
      );
    }
  },

  /**
   * Transition to READY once plan is generated
   */
  toReady(interview) {
    this.assertTransition(interview.status, [INTERVIEW_STATUS.CREATED], INTERVIEW_STATUS.READY);
    interview.status = INTERVIEW_STATUS.READY;
  },

  /**
   * Transition to IN_PROGRESS and start first question
   */
  toInProgress(interview) {
    this.assertTransition(interview.status, [INTERVIEW_STATUS.READY], INTERVIEW_STATUS.IN_PROGRESS);
    interview.status = INTERVIEW_STATUS.WAITING_FOR_ANSWER;
    interview.startedAt = new Date();
  },

  /**
   * Transition to EVALUATING
   */
  toEvaluating(interview) {
    this.assertTransition(
      interview.status,
      [INTERVIEW_STATUS.WAITING_FOR_ANSWER, INTERVIEW_STATUS.IN_PROGRESS],
      INTERVIEW_STATUS.EVALUATING
    );
    interview.status = INTERVIEW_STATUS.EVALUATING;
  },

  /**
   * Transition to COMPLETED
   */
  toCompleted(interview) {
    interview.status = INTERVIEW_STATUS.COMPLETED;
    interview.completedAt = new Date();
  },

  /**
   * Transition to REPORT_GENERATED
   */
  toReportGenerated(interview) {
    interview.status = INTERVIEW_STATUS.REPORT_GENERATED;
  },
};

module.exports = interviewEngine;
