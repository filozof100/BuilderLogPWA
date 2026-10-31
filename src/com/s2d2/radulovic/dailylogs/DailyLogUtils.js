import Truck from '../machines/Truck.js';
import Excavator from '../machines/Excavator.js';
import TruckLog from '../attendances/TruckLog.js';
import ExcavatorLog from '../attendances/ExcavatorLog.js';
import SubcontractorAttendance from '../attendances/SubcontractorAttendance.js';
import WorkerAttendance from '../attendances/WorkerAttendance.js';
import DailyLog from './DailyLog.js';
import Session from '../network/Session.js';
import WebUtils from '../network/WebUtils.js';

export default class DailyLogUtils {
  /**
   * @typedef {Object} DailyLogCallback
   * @property {(dailyLog: DailyLog) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} WorkerAttendanceCallback
   * @property {(attendance: WorkerAttendance) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} SubcontractorAttendanceCallback
   * @property {(attendance: SubcontractorAttendance) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} ExcavatorLogCallback
   * @property {(excavatorLog: ExcavatorLog) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} TruckLogCallback
   * @property {(truckLog: TruckLog) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} MachineAdvancesCallback
   * @property {(advancesByAssignment: Map<number, string>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  static getMachineAdvancesForDailyLog(dailyLog, role, callback) {
    const endpoint = 'daily-logs/' + dailyLog.getDailyLogId() + '/worker-attendances?role=' + role;

    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.getSessionToken() }, {
      onSuccess(responseBody) {
        try {
          const attendances = JSON.parse(responseBody).data;
          const advances = new Map();
          for (const attendance of attendances) {
            if (attendance.machine_assignment_id != null) {
              advances.set(attendance.machine_assignment_id, String(attendance.advance_payment));
            }
          }
          callback.onSuccess(advances);
        } catch (exception) {
          callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAllPlainWorkersWithAttendance(dailyLog, callback) {
    Session.getAllPlainWorkersFromServer({
      onSuccess(workers) {
        DailyLogUtils.getWorkersAttendanceFromServer(dailyLog, {
          onSuccess() {
            callback.onSuccess(workers);
          },
          onFailure(exception) {
            callback.onFailure(exception);
          },
        });
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getSubcontractorsWithAttendance(dailyLog, callback) {
    Session.getAllSubcontractorsFromServer({
      onSuccess(subcontractors) {
        DailyLogUtils.getSubcontractorAttendancesFromServer(dailyLog, {
          onSuccess() {
            callback.onSuccess(subcontractors);
          },
          onFailure(exception) {
            callback.onFailure(exception);
          },
        });
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static createOrUpdateDailyLog(constructionSite, date, callback) {
    const cachedDailyLog = Session.sessionDailyLogs.find(dailyLog =>
      dailyLog.getConstructionSiteId() === constructionSite.getId()
      && dailyLog.getDailyLogDate() === date);
    if (cachedDailyLog != null) {
      callback.onSuccess(cachedDailyLog);
      return;
    }

    DailyLogUtils.#checkIfDailyLogExists(date, constructionSite, {
      onResult(exists, dailyLogId) {
        if (exists) {
          const existingDailyLog = new DailyLog(dailyLogId, constructionSite.getId(), Session.getCurrentUser().getId(), date);
          if (!Session.sessionDailyLogs.some(dailyLog => dailyLog.getDailyLogId() === existingDailyLog.getDailyLogId())) {
            Session.sessionDailyLogs.push(existingDailyLog);
          }
          callback.onSuccess(existingDailyLog);
        } else {
          DailyLogUtils.#createDailyLog(date, constructionSite, callback);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static #createDailyLog(date, constructionSite, dailyLogCallback) {
    const endpoint = 'daily-logs';
    let body;
    try {
      body = JSON.stringify({
        company_id: 1,
        date,
        construction_site_id: constructionSite.getId(),
        site_manager_id: Session.getCurrentUser().getId(),
      });
    } catch (exception) {
      dailyLogCallback.onFailure(exception);
      return;
    }

    WebUtils.sendPOSTRequest(endpoint, body, { Authorization: Session.getSessionToken() }, {
      onSuccess(responseBody) {
        try {
          const dailyLogId = JSON.parse(responseBody).data.id;
          const newDailyLog = new DailyLog(dailyLogId, constructionSite.getId(), Session.getCurrentUser().getId(), date);
          if (!Session.sessionDailyLogs.some(dailyLog => dailyLog.getDailyLogId() === newDailyLog.getDailyLogId())) {
            Session.sessionDailyLogs.push(newDailyLog);
          }
          dailyLogCallback.onSuccess(newDailyLog);
        } catch (exception) {
          dailyLogCallback.onFailure(exception);
        }
      },
      onFailure(exception) {
        dailyLogCallback.onFailure(exception);
      },
    });
  }

  static #checkIfDailyLogExists(date, constructionSite, callback) {
    if (date == null) {
      callback.onFailure(new Error('Session date is not initialized'));
      return;
    }
    if (constructionSite == null) {
      callback.onFailure(new Error('Active construction site is not selected'));
      return;
    }
    if (Session.getCurrentUser() == null) {
      callback.onFailure(new Error('Current user is not initialized'));
      return;
    }

    const endpoint = 'daily-logs?date=' + date + '&construction_site_id=' + constructionSite.getId()
      + '&site_manager_id=' + Session.getCurrentUser().getId();
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.getSessionToken() }, {
      onSuccess(responseBody) {
        try {
          const dailyLogs = JSON.parse(responseBody).data;
          const exists = dailyLogs.length > 0;
          const dailyLogId = exists ? dailyLogs[0].id : -1;
          callback.onResult(exists, dailyLogId);
        } catch (exception) {
          callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static createWorkerAttendance(dailyLog, worker, startedAt, finishedAt, advancePayment, callback) {
    const endpoint = 'daily-logs/' + dailyLog.getDailyLogId() + '/worker-attendances';
    const body = {};
    try {
      body.worker_id = worker.getId();
      body.hourly_rate = worker.getHourlyRate();
      body.started_at = startedAt === '-' ? null : dailyLog.getDailyLogDate() + ' ' + startedAt;
      body.finished_at = finishedAt === '-' ? null : dailyLog.getDailyLogDate() + ' ' + finishedAt;
      const normalizedAdvance = advancePayment == null ? '' : advancePayment.trim().replaceAll('.', '');
      body.advance_payment = normalizedAdvance === '' || normalizedAdvance === '-' ? 0 : Number(normalizedAdvance);
    } catch (exception) {
      callback.onFailure(exception);
      return;
    }

    WebUtils.sendPOSTRequest(endpoint, JSON.stringify(body), { Authorization: Session.getSessionToken() }, {
      onSuccess(responseBody) {
        try {
          const data = JSON.parse(responseBody).data;
          const attendance = new WorkerAttendance(
            data.id, dailyLog.getDailyLogId(), worker.getId(),
            worker.getFirstName(), worker.getLastName(),
            data.started_at ?? 'null', data.finished_at ?? 'null',
            Number(data.advance_payment) === 0 ? '0' : String(data.advance_payment),
          );
          callback.onSuccess(attendance);
        } catch (exception) {
          callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static updateWorkerAttendance(dailyLog, workerAttendanceId, startedAt, finishedAt, advancePayment, callback) {
    const endpoint = 'daily-logs/' + dailyLog.getDailyLogId() + '/worker-attendances/' + workerAttendanceId;
    const body = {};
    try {
      body.started_at = DailyLogUtils.#isEmptyMachineValue(startedAt)
        ? null : dailyLog.getDailyLogDate() + ' ' + startedAt.trim();
      body.finished_at = DailyLogUtils.#isEmptyMachineValue(finishedAt)
        ? null : dailyLog.getDailyLogDate() + ' ' + finishedAt.trim();
      body.advance_payment = DailyLogUtils.#parseAdvancePayment(advancePayment);
    } catch (exception) {
      callback.onFailure(exception);
      return;
    }

    WebUtils.sendPATCHRequest(endpoint, JSON.stringify(body), { Authorization: Session.getSessionToken() }, {
      onSuccess(responseBody) {
        callback.onSuccess();
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getWorkersAttendanceFromServer(dailyLog, callback) {
    const endpoint = 'daily-logs/' + dailyLog.getDailyLogId() + '/worker-attendances?role=worker';

    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.getSessionToken() }, {
      onSuccess(responseBody) {
        try {
          const attendances = [];
          for (const data of JSON.parse(responseBody).data) {
            attendances.push(new WorkerAttendance(
              data.id, data.daily_log_id, data.worker_id,
              data.worker.first_name, data.worker.last_name,
              data.started_at, data.finished_at, String(data.advance_payment),
            ));
          }
          for (const worker of Session.getAllWorkers()) {
            worker.removeAttendance(dailyLog.getDailyLogId());
          }
          for (const attendance of attendances) {
            for (const worker of Session.getAllWorkers()) {
              if (worker.getId() === attendance.getWorkerId()) {
                worker.setAttendance(dailyLog.getDailyLogId(), attendance);
                break;
              }
            }
          }
          callback.onSuccess();
        } catch (exception) {
          callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static createSubcontractorAttendance(dailyLog, subcontractorId, startedAt, finishedAt, numberOfWorkers, note, callback) {
    const endpoint = 'daily-logs/' + dailyLog.getDailyLogId() + '/subcontractors';
    const body = {};
    try {
      body.subcontractor_id = subcontractorId;
      body.worker_count = numberOfWorkers === '-' ? 0 : Number.parseInt(numberOfWorkers, 10);
      body.started_at = startedAt === '-' ? null : dailyLog.getDailyLogDate() + ' ' + startedAt;
      body.finished_at = finishedAt === '-' ? null : dailyLog.getDailyLogDate() + ' ' + finishedAt;
      body.note = note.trim() === '' ? null : note;
    } catch (exception) {
      callback.onFailure(exception);
      return;
    }

    WebUtils.sendPOSTRequest(endpoint, JSON.stringify(body), { Authorization: Session.getSessionToken() }, {
      onSuccess(responseBody) {
        try {
          const data = JSON.parse(responseBody).data;
          const attendance = new SubcontractorAttendance(
            data.id, data.daily_log_id, data.subcontractor_id,
            data.started_at, data.finished_at, data.worker_count ?? 0, data.note ?? '',
          );
          callback.onSuccess(attendance);
        } catch (exception) {
          callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static updateSubcontractorAttendance(dailyLog, subcontractorAttendanceId, startedAt, finishedAt, numberOfWorkers, note, callback) {
    const endpoint = 'daily-logs/' + dailyLog.getDailyLogId() + '/subcontractors' + '/' + subcontractorAttendanceId;
    const body = {};
    try {
      body.worker_count = numberOfWorkers === '-' ? 0 : Number.parseInt(numberOfWorkers, 10);
      body.started_at = startedAt === '-' ? null : dailyLog.getDailyLogDate() + ' ' + startedAt;
      body.finished_at = finishedAt === '-' ? null : dailyLog.getDailyLogDate() + ' ' + finishedAt;
      body.note = note.trim() === '' ? null : note;
      body.reason = 'Korisnički update';
    } catch (exception) {
      callback.onFailure(exception);
      return;
    }

    WebUtils.sendPATCHRequest(endpoint, JSON.stringify(body), { Authorization: Session.getSessionToken() }, {
      onSuccess(responseBody) {
        callback.onSuccess();
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getSubcontractorAttendancesFromServer(dailyLog, callback) {
    const endpoint = 'subcontractor-logs?daily_log_id=' + dailyLog.getDailyLogId();

    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.getSessionToken() }, {
      onSuccess(responseBody) {
        try {
          const attendances = [];
          for (const data of JSON.parse(responseBody).data) {
            attendances.push(new SubcontractorAttendance(
              data.id, data.daily_log_id, data.subcontractor_id,
              data.started_at, data.finished_at, data.worker_count ?? 0, data.note ?? '',
            ));
          }
          for (const subcontractor of Session.getAllSubcontractors()) {
            subcontractor.removeAttendance(dailyLog.getDailyLogId());
          }
          for (const attendance of attendances) {
            for (const subcontractor of Session.getAllSubcontractors()) {
              if (subcontractor.getSubcontractorId() === attendance.getSubcontractorId()) {
                subcontractor.setAttendance(dailyLog.getDailyLogId(), attendance);
                break;
              }
            }
          }
          callback.onSuccess();
        } catch (exception) {
          callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAdminSubcontractorAttendancesFromServer(subcontractorId, dateFrom, dateTo, callback) {
    const endpoint = 'subcontractor-logs?subcontractor_id=' + subcontractorId + '&start_date=' + dateFrom + '&end_date=' + dateTo + '&sort=date&direction=desc';

    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.getSessionToken() }, {
      onSuccess(responseBody) {
        try {
          const attendances = [];
          const attendancesPerSite = new Map();
          for (const data of JSON.parse(responseBody).data) {
            const manager = data.site_manager;
            const constructionSiteName = data.construction_site.name;
            const managerName = manager.first_name + ' ' + manager.last_name;
            const attendance = new SubcontractorAttendance(
              data.id, data.subcontractor_id, data.started_at, data.finished_at,
              data.worker_count ?? 0, data.note ?? '', data.date, constructionSiteName, managerName,
            );
            attendances.push(attendance);
            if (!attendancesPerSite.has(constructionSiteName)) {
              attendancesPerSite.set(constructionSiteName, []);
            }
            attendancesPerSite.get(constructionSiteName).push(attendance);
          }
          callback.onSuccess(attendances, attendancesPerSite);
        } catch (exception) {
          callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static createExcavatorLogManager(dailyLog, machine, workerId, startedAt, finishedAt, note, advancePayment, callback) {
    const endpoint = 'excavator-logs/daily-logs/' + dailyLog.getDailyLogId();
    const body = {};
    try {
      body.machine_id = machine.getMachineId();
      body.worker_id = workerId;
      body.advance_payment = DailyLogUtils.#parseAdvancePayment(advancePayment);
      body.site_manager_started_at = startedAt === '-' ? null : dailyLog.getDailyLogDate() + ' ' + startedAt;
      body.site_manager_finished_at = finishedAt === '-' ? null : dailyLog.getDailyLogDate() + ' ' + finishedAt;
      body.note_site_manager = note.trim() === '' ? null : note;
    } catch (exception) {
      callback.onFailure(exception);
      return;
    }

    WebUtils.sendPOSTRequest(endpoint, JSON.stringify(body), { Authorization: Session.getSessionToken() }, {
      onSuccess(responseBody) {
        try {
          const data = JSON.parse(responseBody).data;
          const newMachine = new Excavator(machine);
          const log = new ExcavatorLog(
            data.id, workerId, dailyLog.getConstructionSiteId(), newMachine,
            data.site_manager_started_at, data.site_manager_finished_at,
            data.note_site_manager, data.machine_assignment_id,
          );
          callback.onSuccess(log);
        } catch (exception) {
          callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static updateExcavatorLogManager(dailyLog, excavatorLogId, oldStartedAt, newStartedAt, oldFinishedAt, newFinishedAt, oldNote, newNote, oldAdvance, newAdvance, callback) {
    const endpoint = 'excavator-logs/' + excavatorLogId;
    const body = {};
    try {
      if (DailyLogUtils.#parseAdvancePayment(oldAdvance) !== DailyLogUtils.#parseAdvancePayment(newAdvance)) {
        body.advance_payment = DailyLogUtils.#parseAdvancePayment(newAdvance);
      }
      if (DailyLogUtils.#normalizeMachineValue(oldStartedAt) !== DailyLogUtils.#normalizeMachineValue(newStartedAt)) {
        body.site_manager_started_at = DailyLogUtils.#isEmptyMachineValue(newStartedAt)
          ? null : dailyLog.getDailyLogDate() + ' ' + newStartedAt.trim();
      }
      if (DailyLogUtils.#normalizeMachineValue(oldFinishedAt) !== DailyLogUtils.#normalizeMachineValue(newFinishedAt)) {
        body.site_manager_finished_at = DailyLogUtils.#isEmptyMachineValue(newFinishedAt)
          ? null : dailyLog.getDailyLogDate() + ' ' + newFinishedAt.trim();
      }
      if (DailyLogUtils.#normalizeMachineValue(oldNote) !== DailyLogUtils.#normalizeMachineValue(newNote)) {
        body.note_site_manager = DailyLogUtils.#isEmptyMachineValue(newNote) ? null : newNote.trim();
      }
    } catch (exception) {
      callback.onFailure(exception);
      return;
    }

    if (Object.keys(body).length === 0) {
      callback.onSuccess();
      return;
    }

    WebUtils.sendPATCHRequest(endpoint, JSON.stringify(body), { Authorization: Session.getSessionToken() }, {
      onSuccess(responseBody) {
        callback.onSuccess();
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static createTruckLogManager(dailyLog, truck, workerId, startedAt, finishedAt, note, advancePayment, callback) {
    const endpoint = 'truck-logs/daily-logs/' + dailyLog.getDailyLogId();
    const body = {};
    try {
      body.machine_id = truck.getMachineId();
      body.worker_id = workerId;
      body.advance_payment = DailyLogUtils.#parseAdvancePayment(advancePayment);
      body.site_manager_started_at = startedAt === '-' ? null : dailyLog.getDailyLogDate() + ' ' + startedAt;
      body.site_manager_finished_at = finishedAt === '-' ? null : dailyLog.getDailyLogDate() + ' ' + finishedAt;
      body.note_site_manager = note.trim() === '' ? null : note;
    } catch (exception) {
      callback.onFailure(exception);
      return;
    }

    WebUtils.sendPOSTRequest(endpoint, JSON.stringify(body), { Authorization: Session.getSessionToken() }, {
      onSuccess(responseBody) {
        try {
          const data = JSON.parse(responseBody).data;
          const newMachine = new Truck(truck);
          const log = new TruckLog(
            data.id, workerId, dailyLog.getConstructionSiteId(), newMachine,
            data.site_manager_started_at, data.site_manager_finished_at,
            data.note_site_manager, data.machine_assignment_id ?? null,
          );
          callback.onSuccess(log);
        } catch (exception) {
          callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static updateTruckLogManager(dailyLog, truckLogId, oldStartedAt, newStartedAt, oldFinishedAt, newFinishedAt, oldNote, newNote, oldAdvance, newAdvance, callback) {
    const endpoint = 'truck-logs/' + truckLogId;
    const body = {};
    try {
      if (DailyLogUtils.#parseAdvancePayment(oldAdvance) !== DailyLogUtils.#parseAdvancePayment(newAdvance)) {
        body.advance_payment = DailyLogUtils.#parseAdvancePayment(newAdvance);
      }
      if (DailyLogUtils.#normalizeMachineValue(oldStartedAt) !== DailyLogUtils.#normalizeMachineValue(newStartedAt)) {
        body.site_manager_started_at = DailyLogUtils.#isEmptyMachineValue(newStartedAt)
          ? null : dailyLog.getDailyLogDate() + ' ' + newStartedAt.trim();
      }
      if (DailyLogUtils.#normalizeMachineValue(oldFinishedAt) !== DailyLogUtils.#normalizeMachineValue(newFinishedAt)) {
        body.site_manager_finished_at = DailyLogUtils.#isEmptyMachineValue(newFinishedAt)
          ? null : dailyLog.getDailyLogDate() + ' ' + newFinishedAt.trim();
      }
      if (DailyLogUtils.#normalizeMachineValue(oldNote) !== DailyLogUtils.#normalizeMachineValue(newNote)) {
        body.note_site_manager = DailyLogUtils.#isEmptyMachineValue(newNote) ? null : newNote.trim();
      }
    } catch (exception) {
      callback.onFailure(exception);
      return;
    }

    if (Object.keys(body).length === 0) {
      callback.onSuccess();
      return;
    }

    WebUtils.sendPATCHRequest(endpoint, JSON.stringify(body), { Authorization: Session.getSessionToken() }, {
      onSuccess(responseBody) {
        callback.onSuccess();
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static #parseAdvancePayment(value) {
    return DailyLogUtils.#isEmptyMachineValue(value) ? 0 : Number(value.trim().replaceAll('.', ''));
  }

  static #isEmptyMachineValue(value) {
    return value == null || value.trim() === '' || value.trim() === '-';
  }

  static #normalizeMachineValue(value) {
    return DailyLogUtils.#isEmptyMachineValue(value) ? '' : value.trim();
  }
}
