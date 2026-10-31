import getSharedPreferences from '../utils/SharedPreferences.js';
import TimeUtils from '../utils/TimeUtils.js';
import Truck from '../machines/Truck.js';
import Excavator from '../machines/Excavator.js';
import WorkerTask from '../tasks/WorkerTask.js';
import ManagerTask from '../tasks/ManagerTask.js';
import GeneralTask from '../tasks/GeneralTask.js';
import ConstructionSiteTask from '../tasks/ConstructionSiteTask.js';
import WorkerSalaryBalance from '../expenses/WorkerSalaryBalance.js';
import WorkerSalary from '../expenses/WorkerSalary.js';
import WorkerPayment from '../expenses/WorkerPayment.js';
import ManagerExpense from '../expenses/ManagerExpense.js';
import ExpensesSummary from '../expenses/ExpensesSummary.js';
import ConstructionSiteSummarizedExpenses from '../expenses/ConstructionSiteSummarizedExpenses.js';
import Advance from '../expenses/Advance.js';
import AdminExpense from '../expenses/AdminExpense.js';
import Manager from '../employee/Manager.js';
import TruckLog from '../attendances/TruckLog.js';
import ExcavatorLog from '../attendances/ExcavatorLog.js';
import DailyLogUtils from '../dailylogs/DailyLogUtils.js';
import Supplier from '../deliverynotes/Supplier.js';
import Subcontractor from '../subcontractors/Subcontractor.js';
import Note from '../notes/Note.js';
import ManagerDetailsForAdmin from '../expenses/ManagerDetailsForAdmin.js';
import Document from '../documents/Document.js';
import DeliveryNote from '../deliverynotes/DeliveryNote.js';
import Attachment from '../notes/Attachment.js';
import ConstructionSite from '../constructionsites/ConstructionSite.js';
import Machine from '../machines/Machine.js';
import WorkerAttendance from '../attendances/WorkerAttendance.js';
import WebUtils from './WebUtils.js';
import TruckDriver from '../employee/TruckDriver.js';
import Operator from '../employee/Operator.js';
import PlainWorker from '../employee/PlainWorker.js';
import Role from '../employee/Role.js';
import Worker from '../employee/Worker.js';

/**
 * @typedef {import('../dailylogs/DailyLog.js').default} DailyLog
 * @typedef {import('../attendances/SubcontractorAttendance.js').default} SubcontractorAttendance
 */

// Callback typedefs describe plain objects; they do not create runtime classes.

export default class Session {
  /** @type {Worker | null} */
  static #currentUser = null;
  /** @type {ConstructionSite | null} */
  static #defaultConstructionConstructionSite = null;
  /** @type {string | null} */
  static #sessionDateString = null;
  /** @type {Array<DailyLog>} */
  static sessionDailyLogs = [];
  /** @type {DailyLog | null} */
  static #defaultDailyLog = null;
  /** @type {string | null} */
  static #sessionToken = null;
  /** @type {Array<Subcontractor>} */
  static #allSubcontractors = Object.freeze([]);
  /** @type {Array<PlainWorker>} */
  static #allWorkers = Object.freeze([]);
  /** @type {ExpensesSummary | null} */
  static #expensesSummary = null;

  static getExpensesSummary() {
    return Session.#expensesSummary;
  }

  /**
   * @typedef {Object} WorkerDetailsCallback
   * @property {(worker: Worker) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} WorkerAttendancesCallback
   * @property {(attendances: Array<WorkerAttendance>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} LiveWorkerAttendancesPerSiteCallback
   * @property {(attendances: Array<WorkerAttendance>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} LiveWorkerAttendancesAllSitesCallback
   * @property {(attendances: Map<number, Array<WorkerAttendance>>, absentWorkers: Array<Worker>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} AbsentWorkersAllSitesCallback
   * @property {(absentWorkers: Array<Worker>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} WorkerPaymentsCallback
   * @property {(payments: Array<WorkerPayment>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} ManagerDetailsCallback
   * @property {(managerDetails: Array<ManagerDetailsForAdmin>, cashAdvancesTotal: number) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} AllWorkersCallback
   * @property {(workers: Array<Worker>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} PlainWorkersCallback
   * @property {(workers: Array<PlainWorker>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} ManagersCallback
   * @property {(workers: Array<Manager>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} OperatorsCallback
   * @property {(workers: Array<Operator>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} TruckDriversCallback
   * @property {(workers: Array<TruckDriver>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} AssignedSitesCallback
   * @property {(constructionSites: Array<ConstructionSite>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} SelectedSiteCallback
   * @property {(constructionSite: ConstructionSite) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} AllSitesCallback
   * @property {(constructionSites: Array<ConstructionSite>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} ExcavatorsCallback
   * @property {(sites: Array<Machine>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} TrucksCallback
   * @property {(sites: Array<Truck>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} TruckLogsCallback
   * @property {(truckLogs: Array<TruckLog>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} AssignedExcavatorCallback
   * @property {(excavatorLog: ExcavatorLog) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} OccupiedExcavatorsCallback
   * @property {(excavatorLogs: Array<ExcavatorLog>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} ExcavatorDriverLogsCallback
   * @property {(excavatorLogs: Array<ExcavatorLog>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} ExcavatorLogsCallback
   * @property {(excavatorLogs: Array<ExcavatorLog>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} TruckDriverLogsCallback
   * @property {(excavatorLogs: Array<TruckLog>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} OccupiedTrucksCallback
   * @property {(truckLogs: Array<TruckLog>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} AssignedTruckCallback
   * @property {(truckLog: TruckLog) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} SubcontractorsCallback
   * @property {(subcontractors: Array<Subcontractor>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} SuppliersCallback
   * @property {(suppliers: Array<Supplier>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} ManagerExpensesCallback
   * @property {(expenses: Array<ManagerExpense>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} AdminExpensesCallback
   * @property {(expenses: Array<AdminExpense>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} WorkerSalariesCallback
   * @property {(expenses: Array<WorkerSalary>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} WorkerSalaryBalanceCallback
   * @property {(balance: WorkerSalaryBalance) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} ConstructionSiteExpensesCallback
   * @property {(adminExpenses: Array<AdminExpense>, managerExpenses: Array<ManagerExpense>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} AllSitesExpensesCallback
   * @property {(totalExpenses: Map<{ first: number, second: string }, ConstructionSiteSummarizedExpenses>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} ManagerAdvancesCallback
   * @property {(advances: Array<Advance>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} DeliveryNotesCallback
   * @property {(deliveryNotes: Array<DeliveryNote>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} NotesCallback
   * @property {(notes: Array<Note>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} NoteCallback
   * @property {(note: Note) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} DailyLogExistsCallback
   * @property {(exists: boolean, dailyLogId: number) => void} onResult
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} WorkersAttendanceCallback
   * @property {() => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} SubcontractorsAttendanceCallback
   * @property {() => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} AdminSubcontractorsAttendanceCallback
   * @property {(attendances: Array<SubcontractorAttendance>, attendancesPerSite: Map<string, Array<SubcontractorAttendance>>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} ExcavatorLogManagerCallback
   * @property {() => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} TruckLogManagerCallback
   * @property {() => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} TasksCallback
   * @property {(generalTasks: Array<GeneralTask>, managerTasks: Array<ManagerTask>, constructionSiteTasks: Array<ConstructionSiteTask>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} ConstructionSiteTasksCallback
   * @property {(constructionSiteTasks: Array<ConstructionSiteTask>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} NewTasksCountCallback
   * @property {(count: number) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} DocumentsCallback
   * @property {(documents: Array<Document>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  /**
   * @typedef {Object} AdminTasksCallback
   * @property {(generalTasks: Array<GeneralTask>, workerTasks: Array<WorkerTask>, constructionSiteTasks: Array<ConstructionSiteTask>) => void} onSuccess
   * @property {(exception: Error) => void} onFailure
   */

  static #findRole(role) {
    switch (role) {
      case 'admin':
        return Role.ADMIN;
      case 'site_manager':
        return Role.SITE_MANAGER;
      case 'operator':
        return Role.OPERATOR;
      case 'driver':
        return Role.TRUCK_DRIVER;
      case 'worker':
        return Role.WORKER;
    }
    return null;
  }

  static createUser(response) {
    try {
      const data = new JSONObject(response).getJSONObject('data');
      const token = data.getString('token');
      Session.#sessionToken = 'Bearer ' + token;
      const worker = data.getJSONObject('worker');
      Session.#currentUser = new Worker(worker.getInt('id'), worker.getString('first_name'), worker.getString('last_name'),
        Session.#findRole(worker.getString('role')), worker.optBoolean('is_active', true),
        worker.getString('username'), worker.optString('email', ''), worker.optString('phone', ''));
      Session.#saveToken();
    } catch (exception) {
      throw new Error(exception.message, { cause: exception });
    }
  }

  static #saveToken() {
    getSharedPreferences('com.s2d2.radulovic.SESSION_TOKEN')
      .edit().putString('SESSION_TOKEN', Session.#sessionToken).apply();
  }

  static loadToken() {
    Session.#sessionToken = getSharedPreferences('com.s2d2.radulovic.SESSION_TOKEN')
      .getString('SESSION_TOKEN', null);
    return Session.#sessionToken != null;
  }

  static restoreCurrentUser(callback) {
    if (Session.#sessionToken == null || Session.#sessionToken.trim() === '') {
      callback.onFailure(new Error('No saved session token'));
      return;
    }
    WebUtils.sendGETRequest('me', {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        let restoredUser;
        try {
          const worker = new JSONObject(responseBody).getJSONObject('data');
          restoredUser = new Worker(
            worker.getInt('id'), worker.getString('first_name'), worker.getString('last_name'),
            Session.#findRole(worker.getString('role')), worker.optBoolean('is_active', true),
            worker.getString('username'), worker.isNull('email') ? '' : worker.getString('email'),
            worker.isNull('phone') ? '' : worker.getString('phone'),
          );
        } catch (exception) {
          callback.onFailure(exception);
          return;
        }
        Session.#currentUser = restoredUser;
        callback.onSuccess(restoredUser);
      },
      onFailure(exception) { callback.onFailure(exception); },
    });
  }

  static getCurrentUser() {
    return Session.#currentUser;
  }

  static clearSession() {
    getSharedPreferences('com.s2d2.radulovic.SESSION_TOKEN').edit().remove('SESSION_TOKEN').apply();
    Session.#currentUser = null;
    Session.#sessionToken = null;
    Session.#defaultConstructionConstructionSite = null;
    Session.#sessionDateString = null;
    Session.#defaultDailyLog = null;
    Session.sessionDailyLogs = [];
    Session.#allSubcontractors = Object.freeze([]);
    Session.#allWorkers = Object.freeze([]);
    Session.#expensesSummary = null;
  }

  static getDefaultConstructionSite() {
    return Session.#defaultConstructionConstructionSite;
  }

  static getWorkerDetailsAdmin(workerId, callback) {
    const endpoint = 'workers/' + workerId;

    WebUtils.sendGETRequest(
      endpoint,
      {},
      { Authorization: Session.#sessionToken },
      {
        onSuccess(responseBody) {
        try {
            let worker ;

            let workerJSON = new JSONObject(responseBody).getJSONObject("data");

            worker = new Worker(workerJSON.getInt("id"), workerJSON.getString("first_name"),
                    workerJSON.getString("last_name"), Session.#findRole(workerJSON.getString("role")),
                    workerJSON.getBoolean("is_active"), workerJSON.getString("username"),
                    workerJSON.isNull("email") ? "" : workerJSON.getString("email"),
                    workerJSON.isNull("phone") ? "" : workerJSON.getString("phone"));

            if (worker.getRole() == Role.WORKER) {
                worker = new PlainWorker(
                        worker.getId(), worker.getFirstName(), worker.getLastName(),
                        worker.getRole(), workerJSON.optBoolean("is_available"),
                        worker.isActive(), worker.getUsername(), worker.getEmail(),
                        worker.getPhoneNumber(), workerJSON.getString("hourly_rate"));
            } else if (worker.getRole() == Role.OPERATOR) {
                worker = new Operator(
                        worker.getId(), worker.getFirstName(), worker.getLastName(),
                        worker.getRole(), workerJSON.optBoolean("is_available"),
                        worker.isActive(), worker.getUsername(), worker.getEmail(),
                        worker.getPhoneNumber(), workerJSON.getString("hourly_rate"));
            } else if (worker.getRole() == Role.TRUCK_DRIVER) {
                worker = new TruckDriver(
                        worker.getId(), worker.getFirstName(), worker.getLastName(),
                        worker.getRole(), workerJSON.optBoolean("is_available"),
                        worker.isActive(), worker.getUsername(), worker.getEmail(),
                        worker.getPhoneNumber(), workerJSON.getString("hourly_rate"));
            }

            callback.onSuccess(worker);
        } catch (exception) {
            callback.onFailure(exception);
        }
      },

        onFailure(exception) {
          console.error('URL RESPONSE', 'failure get all workers' + exception.message);
          callback.onFailure(exception);
        },
      },
    );
  }

  static getWorkerAttendancesAdmin(workerId, dateFrom, dateTo, callback) {
    const endpoint = 'worker-attendances?worker_id=' + workerId + '&date_from=' + dateFrom + '&date_to=' + dateTo + '&sort=date&direction=desc';

    WebUtils.sendGETRequest(
      endpoint,
      {},
      { Authorization: Session.#sessionToken },
      {
        onSuccess(responseBody) {
        try {
            let attendances = [];

            let attendancesJSON = new JSONObject(responseBody).getJSONArray("data");

            let n = attendancesJSON.length();

            for (let i = 0; i < n; i++) {
                let attendance = attendancesJSON.getJSONObject(i);
                let workerJSON = attendance.getJSONObject("worker");

                attendances.push(new WorkerAttendance(attendance.getInt("id"), attendance.getInt("worker_id"),
                        workerJSON.getString("first_name"), workerJSON.getString("last_name"),
                        attendance.getString("started_at"), attendance.getString("finished_at"),
                        attendance.getString("advance_payment"), attendance.getInt("construction_site_id"),
                        attendance.getJSONObject("construction_site").getString("name"), attendance.getString("date"),
                        attendance.isNull("machine_assignment_id") ? null : attendance.getInt("machine_assignment_id"),
                        Session.#parseAttendanceMachine(attendance)));
            }

            callback.onSuccess(attendances);
        } catch (exception) {
            callback.onFailure(exception);
        }
      },

        onFailure(exception) {
          console.error('URL RESPONSE', 'failure get all workers' + exception.message);
          callback.onFailure(exception);
        },
      },
    );
  }

  static getLiveWorkerAttendancesPerSite(date, constructionSiteId, callback) {
    const endpoint = 'worker-attendances?date=' + date + '&construction_site_id=' + constructionSiteId;
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let attendances = [];

            let dataJSON = new JSONObject(responseBody).getJSONArray("data");

            let n = dataJSON.length();

            for (let i = 0; i < n; i++) {
                let attendance = dataJSON.getJSONObject(i);
                let workerJSON = attendance.getJSONObject("worker");

                attendances.push(new WorkerAttendance(attendance.getInt("id"), workerJSON.getInt("id"),
                        workerJSON.getString("first_name"), workerJSON.getString("last_name"),
                        attendance.getString("started_at"), attendance.getString("finished_at"),
                        attendance.getString("advance_payment"), attendance.getInt("construction_site_id"),
                        attendance.getJSONObject("construction_site").getString("name"),
                        attendance.getString("date"),
                        attendance.isNull("machine_assignment_id") ? null : attendance.getInt("machine_assignment_id"),
                        Session.#parseAttendanceMachine(attendance)));
            }

            callback.onSuccess(attendances);
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getLiveWorkerAttendancesAllSites(date, callback) {
    const endpoint = 'worker-attendances?date=' + date;
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let attendances = new Map();

            let dataJSON = new JSONObject(responseBody).getJSONArray("data");

            let n = dataJSON.length();

            for (let i = 0; i < n; i++) {
                let attendance = dataJSON.getJSONObject(i);

                let constructionSiteId = attendance.getInt("construction_site_id");

                if (!attendances.has(constructionSiteId)) {
                    attendances.set(constructionSiteId, []);
                }

                let workerJSON = attendance.getJSONObject("worker");

                attendances.get(constructionSiteId).push(
                        new WorkerAttendance(attendance.getInt("id"), workerJSON.getInt("id"),
                        workerJSON.getString("first_name"), workerJSON.getString("last_name"),
                        attendance.getString("started_at"), attendance.getString("finished_at"),
                        attendance.getString("advance_payment"), constructionSiteId,
                        attendance.getJSONObject("construction_site").getString("name"),
                        attendance.getString("date"),
                        attendance.isNull("machine_assignment_id") ? null : attendance.getInt("machine_assignment_id"),
                        Session.#parseAttendanceMachine(attendance)));
            }

            Session.getAbsentWorkersAllSites(date, {
                onSuccess(absentWorkers) {
                    callback.onSuccess(attendances, absentWorkers);
                },

                onFailure(exception) {
                    callback.onFailure(exception);
                }
            });
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAbsentWorkersAllSites(date, callback) {
    const endpoint = 'worker-attendances/absent?date_from=' + date + '&date_to=' + date;
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let workers = [];

            let dataJSON = new JSONObject(responseBody).getJSONArray("data");
            let absentJSON = dataJSON.getJSONObject(0).getJSONArray("absent_workers");

            let n = absentJSON.length();

            for (let i = 0; i < n; i++) {
                let workerJSON = absentJSON.getJSONObject(i);

                workers.push(new Worker(workerJSON.getInt("id"), workerJSON.getString("first_name"), workerJSON.getString("last_name"),
                        Session.#findRole(workerJSON.getString("role"))));
            }

            callback.onSuccess(workers);
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static #parseAttendanceMachine(attendance) {
    const machine = attendance.optJSONObject('machine');
    if (machine == null) return null;
    return new Machine(machine.getInt('id'), machine.getString('name'), machine.getString('type'),
      machine.isNull('license_plate') ? null : machine.getString('license_plate'), null);
  }

  static getWorkerSalaryAdmin(workerId, callback) {
    const endpoint = 'workers/' + workerId + '/salary';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let data = new JSONObject(responseBody).getJSONObject("data");

            callback.onSuccess(new WorkerSalaryBalance(
                    data.getString("earned"), data.getString("advances"),
                    data.getString("payments"), data.getString("outstanding"),
                    data.getBoolean("has_estimated_hours"), data.getInt("estimated_attendances"),
                    data.getBoolean("has_missing_hourly_rates"), data.getInt("missing_hourly_rate_attendances")));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getWorkerPayments(dateFrom, dateTo, workerId, callback) {
    const endpoint = 'worker-payments?worker_id=' + workerId + '&date_from=' + dateFrom + '&date_to=' + dateTo + '&sort=date&direction=desc';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let payments = [];

            let dataJSON = new JSONObject(responseBody).getJSONArray("data");

            let n = dataJSON.length();

            for (let i = 0; i < n; i++) {
                let payment = dataJSON.getJSONObject(i);

                payments.push(new WorkerPayment(payment.getInt("id"), payment.getString("amount"),
                                payment.getString("date"), payment.getString("note")));
            }

            callback.onSuccess(payments);
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAllPlainWorkersFromServer(callback) {
    const endpoint = 'workers?role=worker&sort=first_name';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {


        try {
            let workers = [];
            let workersJSON = new JSONObject(responseBody).getJSONArray("data");
            let n = workersJSON.length();

            for (let i = 0; i < n; i++) {
                let worker = workersJSON.getJSONObject(i);
                workers.push(new PlainWorker(worker.getInt("id"), worker.getString("first_name"),
                        worker.getString("last_name"), Session.#findRole(worker.getString("role")),
                        worker.getBoolean("is_available"), worker.getBoolean("is_active"), worker.getString("username"),
                        worker.isNull("email") ? "" : worker.getString("email"),
                        worker.isNull("phone") ? "" : worker.getString("phone"),
                        worker.getString("hourly_rate")));
            }

            Session.#allWorkers = workers;
            callback.onSuccess(Object.freeze([...workers]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAllWorkersFromServerAdmin(callback) {
    const endpoint = 'workers?sort=first_name';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {


        try {
            let workers = [];
            let workersJSON = new JSONObject(responseBody).getJSONArray("data");
            let n = workersJSON.length();

            for (let i = 0; i < n; i++) {
                let worker = workersJSON.getJSONObject(i);

                let role = Session.#findRole(worker.getString("role"));
                let parsedWorker = null;

                if (role == Role.SITE_MANAGER) {
                    parsedWorker = new Manager(worker.getInt("id"), worker.getString("first_name"),
                            worker.getString("last_name"), role, worker.getBoolean("is_active"),
                            worker.isNull("username") ? null : worker.getString("username"),
                            worker.isNull("email") ? "" : worker.getString("email"),
                            worker.isNull("phone") ? "" : worker.getString("phone"));
                } else if (role == Role.WORKER) {
                    parsedWorker = new PlainWorker(worker.getInt("id"), worker.getString("first_name"),
                            worker.getString("last_name"), role, worker.getBoolean("is_available"),
                            worker.getBoolean("is_active"), worker.getString("username"),
                            worker.isNull("email") ? "" : worker.getString("email"),
                            worker.isNull("phone") ? "" : worker.getString("phone"),
                            worker.getString("hourly_rate"));
                } else if (role == Role.OPERATOR) {

                    parsedWorker = new Operator(worker.getInt("id"), worker.getString("first_name"),
                            worker.getString("last_name"), role, worker.getBoolean("is_available"),
                            worker.getBoolean("is_active"), worker.getString("username"),
                            worker.isNull("email") ? "" : worker.getString("email"),
                            worker.isNull("phone") ? "" : worker.getString("phone"),
                            worker.getString("hourly_rate"));

                } else if (role == Role.TRUCK_DRIVER) {
                    parsedWorker = new TruckDriver(worker.getInt("id"), worker.getString("first_name"),
                            worker.getString("last_name"), role, worker.getBoolean("is_available"),
                            worker.getBoolean("is_active"), worker.getString("username"),
                            worker.isNull("email") ? "" : worker.getString("email"),
                            worker.isNull("phone") ? "" : worker.getString("phone"),
                            worker.getString("hourly_rate"));
                }

                if (parsedWorker != null) {
                    workers.push(parsedWorker);
                }
            }

            callback.onSuccess(Object.freeze([...workers]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAllManagersFromServer(callback) {
    const endpoint = 'workers?role=site_manager&sort=first_name';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {


        try {
            let managers = [];
            let workersJSON = new JSONObject(responseBody).getJSONArray("data");
            let n = workersJSON.length();

            for (let i = 0; i < n; i++) {
                let manager = workersJSON.getJSONObject(i);
                managers.push(new Manager(manager.getInt("id"), manager.getString("first_name"),
                        manager.getString("last_name"), Session.#findRole(manager.getString("role")),
                        manager.getBoolean("is_active"), manager.getString("username"),
                        manager.isNull("email") ? "" : manager.getString("email"),
                        manager.isNull("phone") ? "" : manager.getString("phone")));
            }

            callback.onSuccess(Object.freeze([...managers]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAllOperatorsFromServer(callback) {
    const endpoint = 'workers?role=operator&sort=first_name';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {


        try {
            let workers = [];
            let operatorsJSON = new JSONObject(responseBody).getJSONArray("data");
            let n = operatorsJSON.length();

            for (let i = 0; i < n; i++) {
                let worker = operatorsJSON.getJSONObject(i);
                workers.push(new Operator(worker.getInt("id"), worker.getString("first_name"),
                        worker.getString("last_name"), Session.#findRole(worker.getString("role")),
                        worker.getBoolean("is_available"), worker.getBoolean("is_active"), worker.getString("username"),
                        worker.isNull("email") ? "" : worker.getString("email"),
                        worker.isNull("phone") ? "" : worker.getString("phone"),
                        worker.getString("hourly_rate")));
            }

            callback.onSuccess(Object.freeze([...workers]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAllDriversFromServer(callback) {
    const endpoint = 'workers?role=driver&sort=first_name';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {


        try {
            let workers = [];
            let operatorsJSON = new JSONObject(responseBody).getJSONArray("data");
            let n = operatorsJSON.length();

            for (let i = 0; i < n; i++) {
                let worker = operatorsJSON.getJSONObject(i);
                workers.push(new TruckDriver(worker.getInt("id"), worker.getString("first_name"),
                        worker.getString("last_name"), Session.#findRole(worker.getString("role")),
                        worker.getBoolean("is_available"), worker.getBoolean("is_active"), worker.getString("username"),
                        worker.isNull("email") ? "" : worker.getString("email"),
                        worker.isNull("phone") ? "" : worker.getString("phone"),
                        worker.getString("hourly_rate")));
            }

            callback.onSuccess(Object.freeze([...workers]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getSelectedSelectionSiteFromSever(callback) {
    Session.getSessionDate();
    const endpoint = 'daily-logs?date=' + Session.#sessionDateString + '&site_manager_id=' + Session.#currentUser.getId() + '&sort=created_at';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {


        try {
            let dailyLogsJson = new JSONObject(responseBody).getJSONArray("data");

            if (dailyLogsJson.length() == 0) {
                callback.onSuccess(null);
                return;
            }

            let constructionSiteJson = dailyLogsJson.getJSONObject(0).getJSONObject("construction_site");
            let selectedConstructionSite = new ConstructionSite(constructionSiteJson.getInt("id"), constructionSiteJson.getString("name"),
                    constructionSiteJson.getString("description"), true,
                    (constructionSiteJson.getString("status") === "active"));

            callback.onSuccess(selectedConstructionSite);
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAssignedSitesFromServer(callback) {
    const endpoint = 'construction-sites';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {


        try {
            let constructionSites = [];
            let sitesJSON = new JSONObject(responseBody).getJSONArray("data");
            let n = sitesJSON.length();

            for (let i = 0; i < n; i++) {
                let site = sitesJSON.getJSONObject(i);
                constructionSites.push(new ConstructionSite(site.getInt("id"), site.getString("name"),
                        site.getString("description"), site.getBoolean("can_select"),
                        (site.getString("status") === "active")));
            }

            callback.onSuccess(Object.freeze([...constructionSites]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAssignedSitesForManager(managerId, callback) {
    const endpoint = 'site-managers/' + managerId + '/assigned-sites';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {


        try {
            let constructionSites = [];
            let sitesJSON = new JSONObject(responseBody).getJSONArray("data");
            let n = sitesJSON.length();

            for (let i = 0; i < n; i++) {
                let site = sitesJSON.getJSONObject(i);
                constructionSites.push(new ConstructionSite(site.getInt("id"), site.getString("name"),
                        site.getString("description"), true, (site.getString("status") === "active")));
            }

            callback.onSuccess(Object.freeze([...constructionSites]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAllSitesFromServer(callback) {
    const endpoint = 'construction-sites?sort=name';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {


        try {
            let constructionSites = [];
            let sitesJSON = new JSONObject(responseBody).getJSONArray("data");

            let n = sitesJSON.length();

            for (let i = 0; i < n; i++) {
                let site = sitesJSON.getJSONObject(i);

                let assignedManagersJSON = site.getJSONArray("site_managers");
                let assignedManagers = [];

                for (let j = 0; j < assignedManagersJSON.length(); j++) {
                    let assignedManagerJSON = assignedManagersJSON.getJSONObject(j);
                    assignedManagers.push(new Manager(assignedManagerJSON.getInt("id"),
                            assignedManagerJSON.getString("first_name"), assignedManagerJSON.getString("last_name")));
                }

                constructionSites.push(new ConstructionSite(site.getInt("id"), site.getString("name"),
                        site.getString("description"), true, (site.getString("status") === "active"),
                        assignedManagers));
            }

            callback.onSuccess(Object.freeze([...constructionSites]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAllNotesFromServer(dailyLog, callback) {
    const endpoint = 'daily-logs/' + dailyLog.getDailyLogId() + '/notes' + '?sort=date&direction=desc';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let notes = [];
            let notesJSON = new JSONObject(responseBody).getJSONArray("data");

            for (let i = 0; i < notesJSON.length(); i++) {
                let noteJSON = notesJSON.getJSONObject(i);
                let attachments = [];
                let attachmentsJSON = noteJSON.optJSONArray("attachments");

                if (attachmentsJSON != null) {
                    for (let j = 0; j < attachmentsJSON.length(); j++) {
                        let attachmentJSON = attachmentsJSON.getJSONObject(j);
                        attachments.push(new Attachment(attachmentJSON.getInt("id"), attachmentJSON.getString("download_url")));
                    }
                }

                notes.push(new Note(noteJSON.getInt("id"), noteJSON.optString("note", ""), attachments, dailyLog,
                        noteJSON.getInt("worker_count")));
            }

            callback.onSuccess(Object.freeze([...notes]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAllNotesForAdminFromServer(dateFrom, dateTo, constructionSite, callback) {
    let endpoint = 'notes?date_created_from=' + dateFrom + '&date_created_to=' + dateTo + '&sort=date&direction=desc';
    if (constructionSite != null) endpoint += '&construction_site_id=' + constructionSite.getId();
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let notes = [];
            let notesJSON = new JSONObject(responseBody).getJSONArray("data");

            for (let i = 0; i < notesJSON.length(); i++) {
                let noteJSON = notesJSON.getJSONObject(i);
                let attachments = [];
                let attachmentsJSON = noteJSON.optJSONArray("attachments");

                if (attachmentsJSON != null) {
                    for (let j = 0; j < attachmentsJSON.length(); j++) {
                        let attachmentJSON = attachmentsJSON.getJSONObject(j);
                        attachments.push(new Attachment(attachmentJSON.getInt("id"), attachmentJSON.getString("download_url")));
                    }
                }

                let date = noteJSON.getString("date");
                let managerJSON = noteJSON.getJSONObject("site_manager");
                let manager = managerJSON.getString("first_name") + " " + managerJSON.getString("last_name");
                let constructionSiteName = noteJSON.optString("construction_site_name", "");
                let constructionSiteJSON = noteJSON.optJSONObject("construction_site");
                let dailyLogJSON = noteJSON.optJSONObject("daily_log");

                if (constructionSiteJSON == null && dailyLogJSON != null) {
                    constructionSiteJSON = dailyLogJSON.optJSONObject("construction_site");
                }
                if ((constructionSiteName.length === 0) && constructionSiteJSON != null) {
                    constructionSiteName = constructionSiteJSON.optString("name", "");
                }
                if ((constructionSiteName.length === 0) && dailyLogJSON != null) {
                    constructionSiteName = dailyLogJSON.optString("construction_site_name", "");
                }

                notes.push(new Note(noteJSON.getInt("id"), noteJSON.optString("note", ""), attachments,
                        date, manager, constructionSiteName, noteJSON.getInt("worker_count")));
            }

            callback.onSuccess(Object.freeze([...notes]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getNoteFromServer(noteId, callback) {
    const endpoint = 'notes?id=' + noteId;
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let noteJSON = new JSONObject(responseBody).getJSONArray("data").getJSONObject(0);

            let attachments = [];
            let attachmentsJSON = noteJSON.optJSONArray("attachments");

            if (attachmentsJSON != null) {
                for (let j = 0; j < attachmentsJSON.length(); j++) {
                    let attachmentJSON = attachmentsJSON.getJSONObject(j);
                    attachments.push(new Attachment(attachmentJSON.getInt("id"), attachmentJSON.getString("download_url")));
                }
            }

            let date = noteJSON.getString("date");
            let managerJSON = noteJSON.getJSONObject("site_manager");
            let manager = managerJSON.getString("first_name") + " " + managerJSON.getString("last_name");
            let constructionSiteName = noteJSON.optString("construction_site_name", "");
            let constructionSiteJSON = noteJSON.optJSONObject("construction_site");
            let dailyLogJSON = noteJSON.optJSONObject("daily_log");

            if (constructionSiteJSON == null && dailyLogJSON != null) {
                constructionSiteJSON = dailyLogJSON.optJSONObject("construction_site");
            }
            if ((constructionSiteName.length === 0) && constructionSiteJSON != null) {
                constructionSiteName = constructionSiteJSON.optString("name", "");
            }
            if ((constructionSiteName.length === 0) && dailyLogJSON != null) {
                constructionSiteName = dailyLogJSON.optString("construction_site_name", "");
            }

            let note = new Note(noteJSON.getInt("id"), noteJSON.optString("note", ""), attachments,
                    date, manager, constructionSiteName, noteJSON.getInt("worker_count"));

            callback.onSuccess(note);
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAllTasksFromServer(callback) {
    const endpoint = 'my/tasks' + '?sort=date&direction=desc';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {


        try {
            let generalTasks = [];
            let managerTasks = [];
            let constructionSiteTasks = [];

            let tasksJSON = new JSONObject(responseBody).getJSONArray("data");
            let n = tasksJSON.length();

            for (let i = 0; i < n; i++) {
                let task = tasksJSON.getJSONObject(i);

                let id = task.getInt("id");
                let title = task.getString("title");
                let description = task.getString("description");
                let dateCreated = task.getString("created_at");
                let isVisited = task.getBoolean("notification_is_read");
                let isCompleted = task.getBoolean("is_completed");

                let managerId = task.isNull("worker_id") ? null : task.getInt("worker_id");
                let constructionSiteId = task.isNull("construction_site_id") ? null : task.getInt("construction_site_id");

                let managerCompletedBy = null;
                let managerCompletedByJSON = task.isNull("completed_by") ? null : task.getJSONObject("completed_by");
                if (managerCompletedByJSON != null) {
                    managerCompletedBy = new Manager(
                            managerCompletedByJSON.getInt("id"),
                            managerCompletedByJSON.getString("first_name"),
                            managerCompletedByJSON.getString("last_name"),
                            Role.SITE_MANAGER, managerCompletedByJSON.getBoolean("is_active"),
                            managerCompletedByJSON.getString("username"),
                            managerCompletedByJSON.isNull("email") ? "" : managerCompletedByJSON.getString("email"),
                            managerCompletedByJSON.isNull("phone") ? "" : managerCompletedByJSON.getString("phone")
                    );
                }
                let dateCompleted = task.isNull("completed_at")
                        ? ""
                        : task.optString("completed_at", "");

                if (managerId == null && constructionSiteId == null) {
                    let generalTask = new GeneralTask(
                            id, title, description, dateCreated, isVisited, isCompleted,
                            managerCompletedBy, dateCompleted
                    );
                    generalTasks.push(generalTask);
                } else if (constructionSiteId == null) {
                    let managerAssignedTo = task.getJSONObject("worker");
                    let assignedTo = new Manager(managerAssignedTo.getInt("id"), managerAssignedTo.getString("first_name"),
                            managerAssignedTo.getString("last_name"), Role.SITE_MANAGER,
                            managerAssignedTo.getBoolean("is_active"),
                            managerAssignedTo.getString("username"),
                            managerAssignedTo.isNull("email") ? "" : managerAssignedTo.getString("email"),
                            managerAssignedTo.isNull("phone") ? "" : managerAssignedTo.getString("phone"));
                    let managerTask = new ManagerTask(
                            id, title, description, dateCreated, isVisited, isCompleted,
                            assignedTo, managerCompletedBy, dateCompleted
                    );
                    managerTasks.push(managerTask);
                } else if (managerId == null) {
                    let constructionSiteTask = new ConstructionSiteTask(
                            id, title, description, dateCreated, isVisited, isCompleted,
                            constructionSiteId, managerCompletedBy, dateCompleted
                    );
                    constructionSiteTasks.push(constructionSiteTask);
                }
            }

            callback.onSuccess(
                    Object.freeze([...generalTasks]),
                    Object.freeze([...managerTasks]),
                    Object.freeze([...constructionSiteTasks])
            );
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAllTasksFromServerAdmin(worker, constructionSite, callback) {
    const endpoint = 'tasks' + '?sort=date&direction=desc';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {


        try {
            let generalTasks = [];
            let workerTasks = [];
            let constructionSiteTasks = [];

            let tasksJSON = new JSONObject(responseBody).getJSONArray("data");
            let n = tasksJSON.length();

            for (let i = 0; i < n; i++) {
                let task = tasksJSON.getJSONObject(i);

                let id = task.getInt("id");
                let title = task.getString("title");
                let description = task.getString("description");
                let dateCreated = task.getString("created_at");
                let isVisited = task.getBoolean("is_read");
                let isCompleted = task.getBoolean("is_completed");

                let workerId = task.isNull("worker_id") ? null : task.getInt("worker_id");
                let constructionSiteId = task.isNull("construction_site_id") ? null : task.getInt("construction_site_id");

                let managerCompletedBy = null;
                let managerCompletedByJSON = task.isNull("completed_by") ? null : task.getJSONObject("completed_by");
                if (managerCompletedByJSON != null && workerId == null) {
                    managerCompletedBy = new Manager(managerCompletedByJSON.getInt("id"),
                            managerCompletedByJSON.getString("first_name"),
                            managerCompletedByJSON.getString("last_name"), Role.SITE_MANAGER,
                            managerCompletedByJSON.getBoolean("is_active"),
                            managerCompletedByJSON.getString("username"),
                            managerCompletedByJSON.isNull("email") ? "" : managerCompletedByJSON.getString("email"),
                            managerCompletedByJSON.isNull("phone") ? "" : managerCompletedByJSON.getString("phone")
                    );
                }

                let dateCompleted = task.isNull("completed_at")
                        ? ""
                        : task.optString("completed_at", "");

                if (workerId == null && constructionSiteId == null) {
                    let generalTask = new GeneralTask(id, title, description, dateCreated, isVisited, isCompleted,
                            managerCompletedBy, dateCompleted);
                    generalTasks.push(generalTask);
                } else if (constructionSiteId == null && worker != null && workerId != null && workerId == worker.getId()) {
                    let completedBy = managerCompletedByJSON == null ? null : new Worker(
                            managerCompletedByJSON.getInt("id"),
                            managerCompletedByJSON.getString("first_name"),
                            managerCompletedByJSON.getString("last_name"));
                    workerTasks.push(new WorkerTask(id, title, description, dateCreated,
                            isVisited, isCompleted, worker, completedBy, dateCompleted));
                } else if (workerId == null && constructionSite != null && constructionSiteId != null && constructionSiteId == constructionSite.getId()) {
                    let constructionSiteTask = new ConstructionSiteTask(id, title, description, dateCreated, isVisited, isCompleted,
                            constructionSiteId, managerCompletedBy, dateCompleted);
                    constructionSiteTasks.push(constructionSiteTask);
                }
            }

            callback.onSuccess(generalTasks, workerTasks, constructionSiteTasks);
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getConstructionSiteTasksFromServerAdmin(constructionSiteId, callback) {
    const endpoint = 'tasks?construction_site_id=' + constructionSiteId + '&sort=date&direction=desc';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {


        try {
            let constructionSiteTasks = [];

            let tasksJSON = new JSONObject(responseBody).getJSONArray("data");
            let n = tasksJSON.length();

            for (let i = 0; i < n; i++) {
                let task = tasksJSON.getJSONObject(i);

                let id = task.getInt("id");
                let title = task.getString("title");
                let description = task.getString("description");
                let dateCreated = task.getString("created_at");
                let isVisited = task.getBoolean("is_read");
                let isCompleted = task.getBoolean("is_completed");

                let managerCompletedBy = null;
                let managerCompletedByJSON = task.isNull("completed_by") ? null : task.getJSONObject("completed_by");
                if (managerCompletedByJSON != null) {
                    managerCompletedBy = new Manager(managerCompletedByJSON.getInt("id"),
                            managerCompletedByJSON.getString("first_name"),
                            managerCompletedByJSON.getString("last_name"), Role.SITE_MANAGER,
                            managerCompletedByJSON.getBoolean("is_active"),
                            managerCompletedByJSON.getString("username"),
                            managerCompletedByJSON.isNull("email") ? "" : managerCompletedByJSON.getString("email"),
                            managerCompletedByJSON.isNull("phone") ? "" : managerCompletedByJSON.getString("phone")
                    );
                }

                let dateCompleted = task.isNull("completed_at")
                        ? ""
                        : task.optString("completed_at", "");

                constructionSiteTasks.push(new ConstructionSiteTask(id, title, description, dateCreated, isVisited, isCompleted,
                        constructionSiteId, managerCompletedBy, dateCompleted));
            }

            callback.onSuccess(constructionSiteTasks);
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getNewTasksCountFromServer(callback) {
    const endpoint = 'notifications/unread-count';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let response = new JSONObject(responseBody);

            let count = response.getJSONObject("data").getInt("count");
            callback.onSuccess(count);
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAllOperatingExcavatorsFromServer(callback) {
    const endpoint = 'machines?type=excavator&status=active';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let machines = [];
            let machinesJSON = new JSONObject(responseBody).getJSONArray("data");
            let n = machinesJSON.length();

            for (let i = 0; i < n; i++) {
                let machine = machinesJSON.getJSONObject(i);
                machines.push(new Machine(machine.getInt("id"), machine.getString("name"),
                        machine.getString("type"), machine.getString("license_plate"),
                        machine.getString("status")));
            }

            callback.onSuccess(Object.freeze([...machines]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAllMachinesFromServer(callback) {
    const endpoint = 'machines';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let machines = [];
            let machinesJSON = new JSONObject(responseBody).getJSONArray("data");
            let n = machinesJSON.length();

            for (let i = 0; i < n; i++) {
                let machine = machinesJSON.getJSONObject(i);

                if ((machine.getString("type") === "truck")) {
                    machines.push(new Truck(machine.getInt("id"), machine.getString("name"),
                            machine.getString("type"), machine.getString("license_plate"),
                            machine.getString("status")));
                } else if ((machine.getString("type") === "excavator")) {
                    machines.push(new Excavator(machine.getInt("id"), machine.getString("name"),
                            machine.getString("type"), machine.getString("license_plate"),
                            machine.getString("status")));
                }
            }

            machines = machines.sort((a, b) => a.getName() < b.getName() ? -1 : a.getName() > b.getName() ? 1 : 0);
            callback.onSuccess(Object.freeze([...machines]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAllTrucksFromServer(callback) {
    const endpoint = 'machines?type=truck&status=active';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let trucks = [];
            let trucksJSON = new JSONObject(responseBody).getJSONArray("data");
            let n = trucksJSON.length();

            for (let i = 0; i < n; i++) {
                let machine = trucksJSON.getJSONObject(i);
                trucks.push(new Truck(machine.getInt("id"), machine.getString("name"),
                        machine.getString("type"), machine.getString("license_plate"),
                        machine.getString("status")));
            }

            callback.onSuccess(Object.freeze([...trucks]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAvailableTrucksFromServer(callback) {
    const endpoint = 'truck-logs/available';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let trucks = [];
            let trucksJSON = new JSONObject(responseBody).getJSONArray("data");

            let n = trucksJSON.length();

            for (let i = 0; i < n; i++) {
                let machine = trucksJSON.getJSONObject(i);
                trucks.push(new Truck(machine.getInt("id"), machine.getString("name"),
                        machine.getString("type"), machine.getString("license_plate"),
                        machine.getString("status")));
            }

            callback.onSuccess(Object.freeze([...trucks]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAssignedTruck(callback) {
    Session.getSessionDate();
    const endpoint = 'machine-assignments/current';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let response = new JSONObject(responseBody);
            let dataJson = response.isNull("data") ? null : response.getJSONObject("data");

            if (dataJson == null) {
                callback.onSuccess(null);
                return;
            }

            let truckLogJSON = dataJson.getJSONObject("truck_log");
            let truckJSON = dataJson.getJSONObject("machine");

            let truck = new Truck(truckJSON.getInt("id"), truckJSON.getString("name"), truckJSON.getString("type"),
                    truckJSON.getString("license_plate"), truckJSON.getString("status"));

            let startedAt = truckLogJSON.isNull("operator_started_at") ? null
                    : truckLogJSON.getString("operator_started_at");

            let finishedAt = truckLogJSON.isNull("operator_finished_at") ? null
                    : truckLogJSON.getString("operator_finished_at");

            let managerStartedAt = truckLogJSON.isNull("site_manager_started_at") ? null
                    : truckLogJSON.getString("site_manager_started_at");

            let managerFinishedAt = truckLogJSON.isNull("site_manager_finished_at") ? null
                    : truckLogJSON.getString("site_manager_finished_at");

            let startKm = truckLogJSON.isNull("start_mileage") ? null
                    : truckLogJSON.getString("start_mileage");

            let endKm = truckLogJSON.isNull("end_mileage") ? null
                    : truckLogJSON.getString("end_mileage");

            let note = truckLogJSON.isNull("note_operator") ? null
                    : truckLogJSON.getString("note_operator");

            let fuelAdded = truckLogJSON.isNull("fuel_added") ? null
                    : truckLogJSON.getInt("fuel_added");

            let fuelRemaining = truckLogJSON.isNull("fuel_remaining") ? null
                    : truckLogJSON.getString("fuel_remaining");

            let truckLog = new TruckLog(truckLogJSON.getInt("id"), truck, startedAt, finishedAt,
                    startKm, endKm, note, fuelAdded, fuelRemaining, managerStartedAt, managerFinishedAt);

            callback.onSuccess(truckLog);
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAvailableExcavatorsFromServer(callback) {
    const endpoint = 'excavator-logs/available';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let excavators = [];
            let excavatorsJSON = new JSONObject(responseBody).getJSONArray("data");

            let n = excavatorsJSON.length();

            for (let i = 0; i < n; i++) {
                let machine = excavatorsJSON.getJSONObject(i);
                excavators.push(new Excavator(machine.getInt("id"), machine.getString("name"),
                        machine.getString("type"), machine.getString("license_plate"),
                        machine.getString("status")));
            }

            callback.onSuccess(Object.freeze([...excavators]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAssignedExcavator(callback) {
    Session.getSessionDate();
    const endpoint = 'machine-assignments/current';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let response = new JSONObject(responseBody);
            let dataJson = response.isNull("data") ? null : response.getJSONObject("data");

            if (dataJson == null) {
                callback.onSuccess(null);
                return;
            }

            let excavatorLogJSON = dataJson.getJSONObject("excavator_log");
            let excavatorJSON = dataJson.getJSONObject("machine");
            let constructionSiteJSON = dataJson.getJSONObject("construction_site");

            if (!(excavatorJSON.getString("type") === "excavator")) {
                throw new Error("Greska, nije u pitanju bager! Obratite se adminu!");
            }

            let excavator = new Excavator(excavatorJSON.getInt("id"), excavatorJSON.getString("name"),
                    excavatorJSON.getString("type") , excavatorJSON.getString("license_plate"),
                    excavatorJSON.getString("status"));

            let startedAt = excavatorLogJSON.isNull("operator_started_at") ? null
                    : excavatorLogJSON.getString("operator_started_at");

            let finishedAt = excavatorLogJSON.isNull("operator_finished_at") ? null
                    : excavatorLogJSON.getString("operator_finished_at");

            let startHours = excavatorLogJSON.isNull("start_work_hours") ? null
                    : String(parseDoubleInt(excavatorLogJSON.getString("start_work_hours")));

            let endHours = excavatorLogJSON.isNull("finish_work_hours") ? null
                    : String(parseDoubleInt(excavatorLogJSON.getString("finish_work_hours")));

            let note = excavatorLogJSON.isNull("note_operator") ? null
                    : excavatorLogJSON.getString("note_operator");

            let excavatorLog = new ExcavatorLog(excavatorLogJSON.getInt("id"), Session.#currentUser.getId(),
                    constructionSiteJSON.getInt("id"), excavator, startedAt, finishedAt, startHours, endHours,
                    constructionSiteJSON.getString("name"), note);

            callback.onSuccess(excavatorLog);
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAllAssignedExcavatorsForDateFromServer(callback, date) {
    const endpoint = 'machine-assignments?date=' + date + '&type=excavator';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let data = new JSONObject(responseBody).getJSONArray("data");
            let assignedMachines = [];

            let n = data.length();
            for (let i = 0; i < n; i++) {
                let machineAssignment = data.getJSONObject(i);
                let excavatorJSON = machineAssignment.getJSONObject("machine");
                let constructionSiteJSON = machineAssignment.getJSONObject("construction_site");
                let excavatorLogJSON = machineAssignment.getJSONObject("excavator_log");
                let operatorJSON = machineAssignment.getJSONObject("worker");

                let excavator = new Excavator(excavatorJSON.getInt("id"), excavatorJSON.getString("name"),
                        excavatorJSON.getString("type"), excavatorJSON.getString("license_plate"),
                        excavatorJSON.getString("status"));

                let startedAt = excavatorLogJSON.isNull("site_manager_started_at") ? null
                        : excavatorLogJSON.getString("site_manager_started_at");

                let finishedAt = excavatorLogJSON.isNull("site_manager_finished_at") ? null
                        : excavatorLogJSON.getString("site_manager_finished_at");

                let note = excavatorLogJSON.isNull("note_site_manager") ? null
                        : excavatorLogJSON.getString("note_site_manager");

                assignedMachines.push(new ExcavatorLog(excavatorLogJSON.getInt("id"), operatorJSON.getInt("id"),
                        constructionSiteJSON.getInt("id"), excavator, startedAt, finishedAt, note, machineAssignment.getInt("id")));
            }

            callback.onSuccess(assignedMachines);
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAllOccupiedExcavatorsFromServer(callback) {
    const endpoint = 'excavator-logs/occupied';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let data = new JSONObject(responseBody).getJSONArray("data");
            let assignedMachines = [];

            let n = data.length();
            for (let i = 0; i < n; i++) {
                let machineAssignment = data.getJSONObject(i);
                let excavatorJSON = machineAssignment.getJSONObject("machine");
                let constructionSiteJSON = machineAssignment.getJSONObject("construction_site");
                let excavatorLogJSON = machineAssignment.getJSONObject("excavator_log");
                let operatorJSON = machineAssignment.getJSONObject("worker");

                let excavator = new Excavator(excavatorJSON.getInt("id"), excavatorJSON.getString("name"),
                        excavatorJSON.getString("type"), excavatorJSON.getString("license_plate"),
                        excavatorJSON.getString("status"));

                let startedAt = excavatorLogJSON.isNull("site_manager_started_at") ? null
                        : excavatorLogJSON.getString("site_manager_started_at");

                let finishedAt = excavatorLogJSON.isNull("site_manager_finished_at") ? null
                        : excavatorLogJSON.getString("site_manager_finished_at");

                let note = excavatorLogJSON.isNull("note_site_manager") ? null
                        : excavatorLogJSON.getString("note_site_manager");

                assignedMachines.push(new ExcavatorLog(excavatorLogJSON.getInt("id"), operatorJSON.getInt("id"),
                        constructionSiteJSON.getInt("id"), excavator, startedAt, finishedAt, note, machineAssignment.getInt("id")));
            }

            callback.onSuccess(assignedMachines);
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getExcavatorDriverLogsAdmin(operatorId, dateFrom, dateTo, callback) {
    const endpoint = 'workers/' + operatorId + '/work-history?date_from=' + dateFrom + '&date_to=' + dateTo + '&sort=date&direction=desc';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let data = new JSONObject(responseBody).getJSONObject("data");
            let excavatorLogs = [];

            let excavatorLogsJSON = data.getJSONArray("history");

            let n = excavatorLogsJSON.length();

            for (let i = 0; i < n; i++) {
                let excavatorLog = excavatorLogsJSON.getJSONObject(i);
                let machineAssignment = excavatorLog.getJSONObject("machine_assignment");
                let constructionSite = machineAssignment.getJSONObject("construction_site");

                excavatorLogs.push(new ExcavatorLog(excavatorLog.getInt("id"), excavatorLog.getInt("worker_id"),
                        constructionSite.getInt("id"), excavatorLog.getString("operator_started_at"),
                        excavatorLog.getString("operator_finished_at"),
                        excavatorLog.getString("site_manager_started_at"),
                        excavatorLog.getString("site_manager_finished_at"), constructionSite.getString("name"),
                        machineAssignment.getString("date")));
            }

            callback.onSuccess(excavatorLogs);
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getExcavatorLogsAdmin(truckId, dateFrom, dateTo, callback) {
    const endpoint = 'machine-assignments?machine_type=excavator&machine_id=' + truckId + '&date_from=' + dateFrom + '&date_to=' + dateTo + '&sort=date&direction=desc';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let excavatorLogs = [];

            let dataJSON = new JSONObject(responseBody).getJSONArray("data");

            let n = dataJSON.length();

            for (let i = 0; i < n; i++) {
                let assignmentJSON = dataJSON.getJSONObject(i);
                let driverJSON = assignmentJSON.getJSONObject("worker");
                let constructionSiteJSON = assignmentJSON.getJSONObject("construction_site");
                let excavatorLogJSON = assignmentJSON.getJSONObject("excavator_log");

                let operatorName = driverJSON.getString("first_name") + " " + driverJSON.getString("last_name");

                excavatorLogs.push(new ExcavatorLog(
                        assignmentJSON.getInt("id"),
                        excavatorLogJSON.isNull("start_work_hours") ? null : excavatorLogJSON.getString("start_work_hours"),
                        excavatorLogJSON.isNull("finish_work_hours") ? null : excavatorLogJSON.getString("finish_work_hours"),
                        assignmentJSON.getString("date"),
                        excavatorLogJSON.isNull("note_site_manager") ? null : excavatorLogJSON.getString("note_site_manager"),
                        operatorName, constructionSiteJSON.getString("name")
                ));
            }

            callback.onSuccess(excavatorLogs);
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getTruckLogsAdmin(truckId, dateFrom, dateTo, callback) {
    const endpoint = 'machine-assignments?machine_type=truck&machine_id=' + truckId + '&date_from=' + dateFrom + '&date_to=' + dateTo + '&sort=date&direction=desc';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let truckLogs = [];

            let dataJSON = new JSONObject(responseBody).getJSONArray("data");

            let n = dataJSON.length();

            for (let i = 0; i < n; i++) {
                let assignmentJSON = dataJSON.getJSONObject(i);
                let driverJSON = assignmentJSON.getJSONObject("worker");
                let truckLogJSON = assignmentJSON.getJSONObject("truck_log");

                let driverName = driverJSON.getString("first_name") + " " + driverJSON.getString("last_name");

                truckLogs.push(new TruckLog(
                        truckLogJSON.getInt("id"),
                        truckLogJSON.isNull("start_mileage") ? null : truckLogJSON.getString("start_mileage"),
                        truckLogJSON.isNull("end_mileage") ? null : truckLogJSON.getString("end_mileage"),
                        assignmentJSON.getString("date"),
                        truckLogJSON.isNull("note_site_manager") ? null : truckLogJSON.getString("note_site_manager"),
                        truckLogJSON.isNull("fuel_added") ? null : truckLogJSON.getInt("fuel_added"),
                        truckLogJSON.isNull("fuel_remaining") ? null : truckLogJSON.getString("fuel_remaining"),
                        driverName,
                        assignmentJSON.getJSONObject("construction_site").optString("name", "")
                ));
            }

            callback.onSuccess(truckLogs);
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAllOccupiedTrucksFromServer(callback) {
    const endpoint = 'truck-logs/occupied';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let data = new JSONObject(responseBody).getJSONArray("data");
            let assignedMachines = [];

            let n = data.length();
            for (let i = 0; i < n; i++) {
                let machineAssignment = data.getJSONObject(i);
                let truckJSON = machineAssignment.getJSONObject("machine");
                let constructionSiteJSON = machineAssignment.getJSONObject("construction_site");
                let truckLogJSON = machineAssignment.getJSONObject("truck_log");
                let driverJSON = machineAssignment.getJSONObject("worker");

                let truck = new Truck(truckJSON.getInt("id"), truckJSON.getString("name"),
                        truckJSON.getString("type"), truckJSON.getString("license_plate"),
                        truckJSON.getString("status"));

                let startedAt = truckLogJSON.isNull("site_manager_started_at") ? null
                        : truckLogJSON.getString("site_manager_started_at");

                let finishedAt = truckLogJSON.isNull("site_manager_finished_at") ? null
                        : truckLogJSON.getString("site_manager_finished_at");

                let note = truckLogJSON.isNull("note_site_manager") ? null
                        : truckLogJSON.getString("note_site_manager");

                assignedMachines.push(new TruckLog(truckLogJSON.getInt("id"), driverJSON.getInt("id"),
                        constructionSiteJSON.getInt("id"), truck, startedAt, finishedAt, note, machineAssignment.getInt("id")));
            }

            callback.onSuccess(assignedMachines);
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAllAssignedTrucksForDateFromServer(callback, date) {
    const endpoint = 'machine-assignments?date=' + date + '&machine_type=truck';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let data = new JSONObject(responseBody).getJSONArray("data");
            let assignedMachines = [];

            let n = data.length();
            for (let i = 0; i < n; i++) {
                let machineAssignment = data.getJSONObject(i);
                let truckJSON = machineAssignment.getJSONObject("machine");
                let constructionSiteJSON = machineAssignment.getJSONObject("construction_site");
                let truckLogJSON = machineAssignment.getJSONObject("truck_log");
                let driverJSON = machineAssignment.getJSONObject("worker");

                let truck = new Truck(truckJSON.getInt("id"), truckJSON.getString("name"),
                        truckJSON.getString("type"), truckJSON.getString("license_plate"),
                        truckJSON.getString("status"));

                let startedAt = truckLogJSON.isNull("site_manager_started_at") ? null
                        : truckLogJSON.getString("site_manager_started_at");

                let finishedAt = truckLogJSON.isNull("site_manager_finished_at") ? null
                        : truckLogJSON.getString("site_manager_finished_at");

                let note = truckLogJSON.isNull("note_site_manager") ? null
                        : truckLogJSON.getString("note_site_manager");

                assignedMachines.push(new TruckLog(truckLogJSON.getInt("id"), driverJSON.getInt("id"),
                        constructionSiteJSON.getInt("id"), truck, startedAt, finishedAt, note, machineAssignment.getInt("id")));
            }

            callback.onSuccess(assignedMachines);
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getTruckDriverLogsAdmin(driverId, dateFrom, dateTo, callback) {
    const endpoint = 'workers/' + driverId + '/work-history?date_from=' + dateFrom + '&date_to=' + dateTo + '&sort=date&direction=desc';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {

            let data = new JSONObject(responseBody).getJSONObject("data");
            let truckLogs = [];

            let truckLogsJSON = data.getJSONArray("history");

            let n = truckLogsJSON.length();

            for (let i = 0; i < n; i++) {
                let truckLog = truckLogsJSON.getJSONObject(i);

                truckLogs.push(new TruckLog(truckLog.getInt("id"), truckLog.getString("operator_started_at"),
                        truckLog.getString("operator_finished_at"), truckLog.getString("start_mileage"),
                        truckLog.getString("end_mileage"), truckLog.getJSONObject("machine_assignment").
                        getString("date"), truckLog.getString("site_manager_started_at"),
                        truckLog.getString("site_manager_finished_at")));

            }

            callback.onSuccess(truckLogs);
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getManagerDetailsAdmin(managerId, dateFrom, dateTo, callback) {
    const endpoint = 'site-managers/' + managerId + '/overall?date_created_from=' + dateFrom + '&date_created_to=' + dateTo + '&sort=date&direction=desc';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let managerDetailsForAdmin = [];

            let data = new JSONObject(responseBody).getJSONArray("data");

            let n = data.length();

            let cashAdvance = 0;

            for (let i = 0; i < n; i++) {
                let detailsJSON = data.getJSONObject(i);
                let constructionSiteJSON = detailsJSON.getJSONObject("construction_site");
                let expensesJSON = detailsJSON.getJSONArray("expenses");
                let advancesJSON = detailsJSON.getJSONArray("worker_attendance");
                let expenses = [];
                let advances = [];
                cashAdvance = parseDoubleInt(detailsJSON.getString("cash_advance_total"));

                let numberOfExpenses = expensesJSON.length();

                for (let j = 0; j < numberOfExpenses; j++) {
                    let expenseJSON = expensesJSON.getJSONObject(j);
                    let attachments = expenseJSON.getJSONArray("attachments");

                    let url = "";

                    if (attachments.length() > 0) {
                        url = attachments.getJSONObject(0).getString("download_url");
                    }
                    expenses.push(new ManagerExpense(expenseJSON.getInt("id"), expenseJSON.getString("title"),
                            expenseJSON.getString("description"), expenseJSON.getString("amount"),
                            expenseJSON.getString("date"), url, constructionSiteJSON.getInt("id"),
                            constructionSiteJSON.getString("name")));

                }

                let numberOfAdvances = advancesJSON.length();

                for (let j = 0; j < numberOfAdvances; j++) {
                    let advanceJSON = advancesJSON.getJSONObject(j);
                    let workerJSON = advanceJSON.getJSONObject("worker");
                    let workerName = workerJSON.getString("first_name") + " " + workerJSON.getString("last_name");
                    advances.push(new Advance(advanceJSON.getInt("id"),
                            advanceJSON.getString("date"), advanceJSON.getString("advance_payment"),
                            workerName));
                }

                let detailsForAdmin = new ManagerDetailsForAdmin(constructionSiteJSON.getInt("id"),
                        constructionSiteJSON.getString("name"), expenses, advances);
                managerDetailsForAdmin.push(detailsForAdmin);
            }

            callback.onSuccess(managerDetailsForAdmin, cashAdvance);
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAllSubcontractorsFromServer(callback) {
    const endpoint = 'subcontractors?sort=name';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let subcontractors = [];
            let subcontractorsJSON = new JSONObject(responseBody).getJSONArray("data");
            let n = subcontractorsJSON.length();

            for (let i = 0; i < n; i++) {
                let subcontractor = subcontractorsJSON.getJSONObject(i);
                subcontractors.push(new Subcontractor(
                        subcontractor.getInt("id"),
                        subcontractor.getString("name"),
                        subcontractor.getBoolean("is_active"),
                        subcontractor.isNull("phone") ? "" : subcontractor.getString("phone"),
                        subcontractor.isNull("email") ? "" : subcontractor.getString("email")
                ));
            }

            Session.#allSubcontractors = subcontractors;
            callback.onSuccess(Object.freeze([...subcontractors]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAllSuppliersFromServer(callback) {
    const endpoint = 'suppliers?sort=name';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let suppliers = [];
            let suppliersJSON = new JSONObject(responseBody).getJSONArray("data");

            for (let i = 0; i < suppliersJSON.length(); i++) {
                let supplier = suppliersJSON.getJSONObject(i);
                suppliers.push(new Supplier(supplier.getInt("id"), supplier.getString("name"), supplier.getBoolean("is_active")));
            }

            callback.onSuccess(Object.freeze([...suppliers]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getManagerExpensesForConstructionSite(dailyLog, callback) {
    const endpoint = 'daily-logs/' + dailyLog.getDailyLogId() + '/expenses/history' + '?sort=date&direction=desc';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let expenses = [];
            let response = new JSONObject(responseBody);
            let expensesJSON = response.getJSONObject("data").getJSONArray("expenses");

            for (let i = 0; i < expensesJSON.length(); i++) {
                let expense = expensesJSON.getJSONObject(i);
                let attachments = expense.getJSONArray("attachments");
                let constructionSiteJson = expense.getJSONObject("construction_site");

                let url = "";

                if (attachments.length() > 0) {
                    url = attachments.getJSONObject(0).getString("download_url");
                }
                expenses.push(new ManagerExpense(expense.getInt("id"), expense.getString("title"),
                        expense.getString("description"), expense.getString("amount"), expense.getString("date"),
                        url, dailyLog, constructionSiteJson.getInt("id"), constructionSiteJson.getString("name")));
            }

            let summary = response.getJSONObject("data").getJSONObject("summary");
            Session.#expensesSummary = new ExpensesSummary(summary.getInt("advanced"), summary.getInt("spent"), summary.getInt("remaining"));

            let cacheAdvances = response.getJSONObject("data").getJSONArray("cash_advances");

            for (let i = 0; i < cacheAdvances.length(); i++) {
                let advance = cacheAdvances.getJSONObject(i);
                Session.#expensesSummary.addAdvance(advance.getString("date"), advance.getString("amount"));
            }

            callback.onSuccess(Object.freeze([...expenses]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAdvancesForManager(managerId, dateFrom, dateTo, callback) {
    const endpoint = 'cash-advances?site_manager_id=' + managerId + '&date_from=' + dateFrom + '&date_to=' + dateTo + '&sort=date&direction=desc';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let advances = [];
            let response = new JSONObject(responseBody);
            let advancesJSON = response.getJSONArray("data");

            for (let i = 0; i < advancesJSON.length(); i++) {
                let advance = advancesJSON.getJSONObject(i);
                advances.push(new Advance(
                        advance.getInt("id"),
                        advance.getString("date"),
                        advance.getString("amount")
                ));
            }

            callback.onSuccess(Object.freeze([...advances]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getExpensesForManager(managerId, dateFrom, dateTo, callback) {
    const endpoint = 'expenses?site_manager_id=' + managerId + '&date_from=' + dateFrom + '&date_to=' + dateTo + '&sort=date&direction=desc';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let expenses = [];
            let response = new JSONObject(responseBody);
            let expensesJSON = response.getJSONArray("data");

            for (let i = 0; i < expensesJSON.length(); i++) {
                let expense = expensesJSON.getJSONObject(i);
                let attachments = expense.getJSONArray("attachments");
                let constructionSiteJson = expense.getJSONObject("construction_site");

                let url = "";

                if (attachments.length() > 0) {
                    url = attachments.getJSONObject(0).getString("download_url");
                }
                expenses.push(new ManagerExpense(expense.getInt("id"), expense.getString("title"),
                        expense.getString("description"), expense.getString("amount"), expense.getString("date"),
                        url, constructionSiteJson.getInt("id"), constructionSiteJson.getString("name")));
            }

            callback.onSuccess(Object.freeze([...expenses]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getExpensesForConstructionSite(constructionSiteId, dateFrom, dateTo, callback) {
    const endpoint = 'construction-sites/' + constructionSiteId + '/financial-summary?date_from=' + dateFrom + '&date_to=' + dateTo + '&sort=date&direction=desc';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let adminExpenses = [];
            let managerExpenses = [];

            let response = new JSONObject(responseBody);
            let data = response.optJSONObject("data");
            let payload = data == null ? response : data;
            let expensesJSON = payload.getJSONArray("expenses");

            for (let i = 0; i < expensesJSON.length(); i++) {
                let expense = expensesJSON.getJSONObject(i);
                let attachments = expense.getJSONArray("attachments");
                let constructionSiteJson = expense.getJSONObject("construction_site");
                let managerJSON = expense.isNull("site_manager") ? null : expense.getJSONObject("site_manager");

                if (managerJSON != null) {
                    let manager = new Manager(managerJSON.getInt("id"), managerJSON.getString("first_name"),
                            managerJSON.getString("last_name"), Role.SITE_MANAGER,
                            managerJSON.getBoolean("is_active"), managerJSON.getString("username"),
                            managerJSON.isNull("email") ? "" : managerJSON.getString("email"),
                            managerJSON.isNull("phone") ? "" : managerJSON.getString("phone"));

                    let url = "";
                    if (attachments.length() > 0) {
                        url = attachments.getJSONObject(0).getString("download_url");
                    }

                    managerExpenses.push(new ManagerExpense(expense.getInt("id"), expense.getString("title"),
                            expense.getString("description"), expense.getString("amount"), expense.getString("date"),
                            url, constructionSiteJson.getInt("id"), constructionSiteJson.getString("name"), manager));
                } else {
                    adminExpenses.push(new AdminExpense(expense.getInt("id"), expense.getString("title"),
                            expense.getString("description"), expense.getString("amount"), expense.getString("date"),
                            constructionSiteJson.getInt("id"), constructionSiteJson.getString("name")));
                }
            }

            callback.onSuccess(Object.freeze([...adminExpenses]), Object.freeze([...managerExpenses]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getExpensesForAllSitesSite(dateFrom, dateTo, callback) {
    const endpoint = 'admin/construction-financial-summary?date_from=' + dateFrom + '&date_to=' + dateTo;
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let totalExpenses = new Map();

            let response = new JSONObject(responseBody);
            let data = response.getJSONObject("data");
            let perSiteJSON = data.getJSONArray("by_construction_site");

            for (let i = 0; i < perSiteJSON.length(); i++) {
                let siteJSON = perSiteJSON.getJSONObject(i);
                let constructionSiteId = siteJSON.getInt("construction_site_id");
                let constructionSiteName = siteJSON.getString("construction_site_name");

                let expensesJSON = siteJSON.getJSONObject("expenses");
                let constructionSiteSummarizedExpenses =
                        new ConstructionSiteSummarizedExpenses(parseDoubleInt(siteJSON.getJSONObject("worker_salaries").getString("earned")),
                                parseDoubleInt(expensesJSON.getString("site_managers")),
                                parseDoubleInt(expensesJSON.getString("admin")));

                setPair(totalExpenses, constructionSiteId, constructionSiteName, constructionSiteSummarizedExpenses);
            }

            callback.onSuccess(totalExpenses);
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getAdminExpensesFromServer(dateFrom, dateTo, callback) {
    const endpoint = 'admin/expenses?date_from=' + dateFrom + '&date_to=' + dateTo + '&sort=date&direction=desc';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let expenses = [];
            let response = new JSONObject(responseBody);
            let expensesJSON = response.getJSONObject("data").getJSONArray("expenses");

            for (let i = 0; i < expensesJSON.length(); i++) {
                let expense = expensesJSON.getJSONObject(i);
                let constructionSiteJson = expense.getJSONObject("construction_site");

                expenses.push(new AdminExpense(expense.getInt("id"), expense.getString("title"),
                        expense.getString("description"), expense.getString("amount"),
                        expense.getString("date"), constructionSiteJson.getInt("id"),
                        constructionSiteJson.getString("name")));
            }

            callback.onSuccess(Object.freeze([...expenses]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getWorkerSalariesFromServer(dateFrom, dateTo, constructionSiteId, callback) {
    const endpoint = 'admin/worker-salaries?date_from=' + dateFrom + '&date_to=' + dateTo + '&construction_site_id=' + constructionSiteId;
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let salaries = [];
            let response = new JSONObject(responseBody);
            let salariesJSON = response.getJSONObject("data").getJSONArray("workers");

            for (let i = 0; i < salariesJSON.length(); i++) {
                let salary = salariesJSON.getJSONObject(i);

                let worker = new Worker(salary.getInt("worker_id"), salary.getString("first_name"),
                        salary.getString("last_name"));

                salaries.push(new WorkerSalary(salary.getJSONObject("period").getString("earned"), worker));
            }

            callback.onSuccess(Object.freeze([...salaries]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getDeliveryNotesForDailyLog(dailylog, callback) {
    const endpoint = 'daily-logs/' + dailylog.getDailyLogId() + '/delivery-notes' + '?sort=date&direction=desc';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let deliveryNotes = [];
            let deliveryNotesJSON = new JSONObject(responseBody).getJSONArray("data");

            for (let i = 0; i < deliveryNotesJSON.length(); i++) {
                let deliveryNote = deliveryNotesJSON.getJSONObject(i);

                let id = deliveryNote.getInt("id");
                let name = deliveryNote.getString("name");
                let description = deliveryNote.getString("description");
                let date = deliveryNote.getString("date");
                let supplierId = deliveryNote.getJSONObject("supplier").getInt("id");
                let supplierName = deliveryNote.getJSONObject("supplier").getString("name");

                let attachments = deliveryNote.optJSONArray("attachments");
                let downloadUrl = "";

                if (attachments != null && attachments.length() > 0) {
                    downloadUrl = attachments.getJSONObject(0).getString("download_url");
                }

                deliveryNotes.push(new DeliveryNote(id, name, description, supplierId, supplierName, date, downloadUrl, dailylog));
            }

            callback.onSuccess(Object.freeze([...deliveryNotes]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getDeliveryNotesAdmin(constructionSite, dateFrom, dateTo, callback) {
    let endpoint = 'delivery-notes?date_from=' + dateFrom + '&date_to=' + dateTo + '&sort=date&direction=desc';
    if (constructionSite != null) endpoint += '&construction_site_id=' + constructionSite.getId();
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {
        try {
            let deliveryNotes = [];
            let deliveryNotesJSON = new JSONObject(responseBody).getJSONArray("data");

            for (let i = 0; i < deliveryNotesJSON.length(); i++) {
                let deliveryNote = deliveryNotesJSON.getJSONObject(i);

                let id = deliveryNote.getInt("id");
                let name = deliveryNote.getString("name");
                let description = deliveryNote.getString("description");
                let date = deliveryNote.getString("date");
                let supplierId = deliveryNote.getJSONObject("supplier").getInt("id");
                let supplierName = deliveryNote.getJSONObject("supplier").getString("name");
                let constructionSiteName = deliveryNote.optString("construction_site_name", "");
                let constructionSiteJSON = deliveryNote.optJSONObject("construction_site");
                let dailyLogJSON = deliveryNote.optJSONObject("daily_log");
                let managerJSON = deliveryNote.optJSONObject("site_manager");

                if (constructionSiteJSON == null && dailyLogJSON != null) {
                    constructionSiteJSON = dailyLogJSON.optJSONObject("construction_site");
                }
                if ((constructionSiteName.length === 0) && constructionSiteJSON != null) {
                    constructionSiteName = constructionSiteJSON.optString("name", "");
                }
                if ((constructionSiteName.length === 0) && dailyLogJSON != null) {
                    constructionSiteName = dailyLogJSON.optString("construction_site_name", "");
                }
                if ((constructionSiteName.length === 0) && constructionSite != null) {
                    constructionSiteName = constructionSite.getName();
                }

                let attachments = deliveryNote.optJSONArray("attachments");
                let downloadUrl = "";

                if (attachments != null && attachments.length() > 0) {
                    downloadUrl = attachments.getJSONObject(0).getString("download_url");
                }

                let managerName = managerJSON.getString("first_name") + " " + managerJSON.getString("last_name");

                deliveryNotes.push(new DeliveryNote(id, name, description, supplierId, supplierName, date,
                        downloadUrl, constructionSiteName, managerName));
            }

            callback.onSuccess(Object.freeze([...deliveryNotes]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static createDefaultDailyLog(callback = { onSuccess() {}, onFailure() {} }) {
    DailyLogUtils.createOrUpdateDailyLog(Session.#defaultConstructionConstructionSite, Session.#sessionDateString, {
      onSuccess(dailyLog) {
        Session.#defaultDailyLog = dailyLog;
        callback.onSuccess(dailyLog);
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }

  static getSessionDate() {
    Session.#sessionDateString = TimeUtils.formatDate(new Date());
  }

  static getSessionDateString() {
    return Session.#sessionDateString;
  }

  static getDefaultDailyLog() {
    return Session.#defaultDailyLog;
  }

  static getSessionToken() {
    return Session.#sessionToken;
  }

  static getAllSubcontractors() {
    return Session.#allSubcontractors;
  }

  static getAllWorkers() {
    return Session.#allWorkers;
  }

  static setDefaultConstructionSite(constructionSite) {
    Session.#defaultConstructionConstructionSite = constructionSite;
  }

  static getAllDocumentsFromServer(constructionSiteOrId, callback) {
    const constructionSiteId = typeof constructionSiteOrId === 'number'
      ? constructionSiteOrId : constructionSiteOrId.getId();
    const endpoint = 'documents?construction_site_id=' + constructionSiteId + '&sort=date&direction=desc';
    WebUtils.sendGETRequest(endpoint, {}, { Authorization: Session.#sessionToken }, {
      onSuccess(responseBody) {


        try {
            let documents = [];
            let documentsJSON = new JSONObject(responseBody).getJSONArray("data");
            let n = documentsJSON.length();

            for (let i = 0; i < n; i++) {
                let document = documentsJSON.getJSONObject(i);
                let originalName = document.optString("original_name", "");
                documents.push(new Document(
                        document.getInt("id"),
                        document.optString("name", originalName),
                        document.getString("type"),
                        document.getString("created_at"),
                        document.getString("download_url"),
                        document.optString("description", "")
                ));
            }

            callback.onSuccess(Object.freeze([...documents]));
        } catch (exception) {
            callback.onFailure(exception);
        }
      },
      onFailure(exception) {
        callback.onFailure(exception);
      },
    });
  }
}

// Android org.json getters used by Session. Keep conversion here so every
// endpoint follows the same required/optional-field rules as Session.java.
const jsonKeyOrder = Symbol('jsonKeyOrder');

class JsonNumber {
  constructor(value) { this.value = value; }
}

function intValue(value) {
  if (Number.isNaN(value)) return 0;
  return Math.trunc(Math.max(-2147483648, Math.min(2147483647, value))) || 0;
}

function parseJavaDouble(value) {
  const text = value.replace(/^[\x00-\x20]+|[\x00-\x20]+$/g, '');
  if (/^[+-]?(?:NaN|Infinity)$/.test(text)) return Number(text.replace(/^\+/, '').replace(/^-NaN$/, 'NaN'));
  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?[fFdD]?$/.test(text)) return Number(text.replace(/[fFdD]$/, ''));
  const hex = /^([+-]?)0[xX]([\da-fA-F]+(?:\.[\da-fA-F]*)?|\.[\da-fA-F]+)[pP]([+-]?\d+)[fFdD]?$/.exec(text);
  if (!hex) throw new TypeError('Invalid double: ' + value);
  const [whole, fraction = ''] = hex[2].split('.');
  const mantissa = BigInt('0x' + whole + fraction);
  const exponent = Number(hex[3]) - 4 * fraction.length;
  if (mantissa === 0n) return hex[1] === '-' ? -0 : 0;
  const bits = mantissa.toString(2).length;
  if (exponent + bits > 1025) return hex[1] === '-' ? -Infinity : Infinity;
  if (exponent + bits < -1074) return hex[1] === '-' ? -0 : 0;
  const shift = Math.max(0, bits - 53, -1074 - exponent);
  let rounded = mantissa >> BigInt(shift);
  if (shift > 0) {
    const remainder = mantissa - (rounded << BigInt(shift));
    const half = 1n << BigInt(shift - 1);
    if (remainder > half || (remainder === half && (rounded & 1n) === 1n)) rounded++;
  }
  return (hex[1] === '-' ? -1 : 1) * Number(rounded) * 2 ** (exponent + shift);
}

function parseDoubleInt(value) { return intValue(parseJavaDouble(value)); }

function javaNumberText(value, json = false) {
  if (typeof value === 'bigint') return String(value);
  if (Object.is(value, -0)) return json ? '-0' : '-0.0';
  if (!Number.isFinite(value)) return String(value);
  if (json && Number.isInteger(value) && value >= -9223372036854775808 && value <= 9223372036854775808) return value === 9223372036854775808 ? '9223372036854775807' : BigInt(value).toString();
  const scientific = value !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000000);
  if (scientific) {
    const shortest = value.toExponential();
    const [mantissa, exponent] = (shortest.split('e')[0].includes('.') ? shortest : value.toExponential(1)).split('e');
    return (mantissa.includes('.') ? mantissa : mantissa + '.0') + 'E' + Number(exponent);
  }
  const text = String(value);
  return text.includes('.') ? text : text + '.0';
}

function jsonText(value) {
  if (value instanceof JsonNumber) {
    if (typeof value.value === 'number' && !Number.isFinite(value.value)) throw new TypeError('Non-finite JSON number');
    return javaNumberText(value.value, true);
  }
  if (typeof value === 'string') return JSON.stringify(value).replace(/\//g, '\\/');
  if (Array.isArray(value)) return '[' + value.map(jsonText).join(',') + ']';
  if (value != null && typeof value === 'object') return '{' + (value[jsonKeyOrder] ?? Object.keys(value)).map(key => jsonText(key) + ':' + jsonText(value[key])).join(',') + '}';
  return JSON.stringify(value);
}

function stringValue(value) {
  if (value === undefined) return undefined;
  if (value instanceof JsonNumber) return javaNumberText(value.value);
  if (value != null && typeof value === 'object') {
    try { return jsonText(value); } catch { return undefined; }
  }
  return String(value);
}

function booleanValue(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string' && /^(true|false)$/i.test(value)) return value.toLowerCase() === 'true';
  return undefined;
}

function wrapJsonNumbers(value) {
  if (typeof value === 'number') return new JsonNumber(Number.isInteger(value) && Number.isSafeInteger(value) ? BigInt(value) : value);
  if (Array.isArray(value)) return value.map(wrapJsonNumbers);
  if (value != null && typeof value === 'object' && !(value instanceof JsonNumber)) {
    const keys = value[jsonKeyOrder] ?? Object.keys(value);
    const object = Object.fromEntries(keys.map(key => [key, wrapJsonNumbers(value[key])]));
    Object.defineProperty(object, jsonKeyOrder, { value: keys });
    return object;
  }
  return value;
}

class JSONObject {
  constructor(value) {
    this.value = typeof value === 'string' ? parseAndroidJson(value) : wrapJsonNumbers(value);
    if (!isJsonObject(this.value)) throw new TypeError('Expected JSONObject');
  }
  get(key) {
    if (!Object.hasOwn(this.value, key) || this.value[key] === undefined) throw new TypeError('No value for ' + key);
    return this.value[key];
  }
  opt(key) { return Object.hasOwn(this.value, key) ? this.value[key] : undefined; }
  isNull(key) { return this.opt(key) == null; }
  getInt(key) {
    const value = this.get(key);
    if (value instanceof JsonNumber) return typeof value.value === 'bigint' ? Number(BigInt.asIntN(32, value.value)) : intValue(value.value);
    if (typeof value === 'string') return parseDoubleInt(value);
    throw new TypeError('Expected int for ' + key);
  }
  getBoolean(key) {
    const value = booleanValue(this.get(key));
    if (value === undefined) throw new TypeError('Expected boolean for ' + key);
    return value;
  }
  optBoolean(key, fallback = false) { return booleanValue(this.opt(key)) ?? fallback; }
  getString(key) {
    const value = stringValue(this.get(key));
    if (value === undefined) throw new TypeError('Expected string for ' + key);
    return value;
  }
  optString(key, fallback = '') { return stringValue(this.opt(key)) ?? fallback; }
  getJSONObject(key) {
    const value = this.optJSONObject(key);
    if (value == null) throw new TypeError('Expected JSONObject for ' + key);
    return value;
  }
  optJSONObject(key) {
    const value = this.opt(key);
    return isJsonObject(value) ? new JSONObject(value) : null;
  }
  getJSONArray(key) {
    const value = this.optJSONArray(key);
    if (value == null) throw new TypeError('Expected JSONArray for ' + key);
    return value;
  }
  optJSONArray(key) { return Array.isArray(this.opt(key)) ? new JSONArray(this.opt(key)) : null; }
}

function isJsonObject(value) { return value != null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof JsonNumber); }
class JSONArray {
  constructor(value) { this.value = value; }
  length() { return this.value.length; }
  getJSONObject(index) {
    if (!isJsonObject(this.value[index])) throw new TypeError('Expected JSONObject at ' + index);
    return new JSONObject(this.value[index]);
  }
}

function setPair(map, first, second, value) {
  const key = [...map.keys()].find(key => key.first === first && key.second === second) ?? Object.freeze({ first, second });
  map.set(key, value);
}

// Preserve Integer/Long versus Double tokens (and long precision), which
// JSON.parse would otherwise lose before Android's getInt/getString conversion.
function parseAndroidJson(source) {
  let pos = source.charCodeAt(0) === 0xfeff ? 1 : 0;
  const fail = () => { throw new SyntaxError('Invalid JSON at ' + pos); };
  function clean() {
    while (pos < source.length) {
      const c = source[pos++];
      if (' \t\r\n'.includes(c)) continue;
      if (c === '/' && source[pos] === '*') {
        const end = source.indexOf('*/', pos + 1);
        if (end < 0) fail();
        pos = end + 2; continue;
      }
      if (c === '#' || (c === '/' && source[pos] === '/')) {
        while (pos < source.length && !'\r\n'.includes(source[pos])) pos++;
        continue;
      }
      return c;
    }
    return '';
  }
  function next() {
    const c = clean();
    if (!c) fail();
    if (c === '"' || c === "'") {
      let text = '';
      while (pos < source.length) {
        let char = source[pos++];
        if (char === c) return text;
        if (char === '\\') {
          if (pos === source.length) fail();
          char = source[pos++];
          if (char === 'u') {
            const hex = source.slice(pos, pos + 4);
            if (!/^[\da-fA-F]{4}$/.test(hex)) fail();
            text += String.fromCharCode(parseInt(hex, 16)); pos += 4; continue;
          }
          char = ({b:'\b',f:'\f',n:'\n',r:'\r',t:'\t'})[char] ?? char;
        }
        text += char;
      }
      fail();
    }
    if (c === '{') {
      const object = Object.create(null);
      Object.defineProperty(object, jsonKeyOrder, { value: [] });
      const first = clean();
      if (first === '}') return object;
      if (first) pos--;
      while (true) {
        const key = next();
        if (typeof key !== 'string') fail();
        if (![':', '='].includes(clean())) fail();
        if (source[pos] === '>') pos++;
        const value = next();
        if (value instanceof JsonNumber && typeof value.value === 'number' && !Number.isFinite(value.value)) fail();
        if (!Object.hasOwn(object, key)) object[jsonKeyOrder].push(key);
        object[key] = value;
        const separator = clean();
        if (separator === '}') return object;
        if (separator !== ',' && separator !== ';') fail();
      }
    }
    if (c === '[') {
      const array = []; let trailing = false;
      while (true) {
        const first = clean();
        if (!first) fail();
        if (first === ']') { if (trailing) array.push(null); return array; }
        if (first === ',' || first === ';') { array.push(null); trailing = true; continue; }
        pos--; array.push(next());
        const separator = clean();
        if (separator === ']') return array;
        if (separator !== ',' && separator !== ';') fail();
        trailing = true;
      }
    }
    pos--;
    const start = pos;
    while (pos < source.length && !'{}[]/\\:,=;# \t\f\r\n'.includes(source[pos])) pos++;
    const literal = source.slice(start, pos);
    if (!literal) fail();
    if (/^null$/i.test(literal)) return null;
    if (/^(true|false)$/i.test(literal)) return literal.toLowerCase() === 'true';
    if (!literal.includes('.')) {
      let integral;
      try {
        if (/^0[xX][\da-fA-F]+$/.test(literal)) integral = BigInt(literal);
        else if (/^0[0-7]+$/.test(literal)) integral = BigInt('0o' + literal.slice(1));
        else if (/^[+-]?\d+$/.test(literal) && !/^0\d/.test(literal)) integral = BigInt(literal);
        if (integral !== undefined && integral >= -9223372036854775808n && integral <= 9223372036854775807n) return new JsonNumber(integral);
      } catch { /* Fall through to Double, as JSONTokener does. */ }
    }
    try { return new JsonNumber(parseJavaDouble(literal)); } catch { return literal; }
  }
  return next();
}
