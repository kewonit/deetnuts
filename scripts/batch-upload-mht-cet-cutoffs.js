"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var pocketbase_1 = require("pocketbase");
var fs_1 = require("fs");
var csv_parse_1 = require("csv-parse");
var path = require("path");
var dotenv = require("dotenv");
// Load environment variables
dotenv.config();
var BatchMHTCETCutoffUploader = /** @class */ (function () {
    function BatchMHTCETCutoffUploader() {
        this.collectionName = '2024_mht_cet_round_three_cutoffs';
        this.batchSize = 500; // Reduced batch size for better reliability
        this.maxConcurrentBatches = 5; // Reduced concurrent batches to prevent auto-cancellation issues
        // Initialize PocketBase
        var pbUrl = process.env.POCKETBASE_URL || 'https://api.deetnuts.com';
        this.pb = new pocketbase_1.default(pbUrl);
        // Disable auto-cancellation to prevent concurrent batch requests from being cancelled
        this.pb.autoCancellation(false);
        // Set CSV file path
        this.csvFilePath = path.join(__dirname, 'combined_cutoffs.csv');
    }
    BatchMHTCETCutoffUploader.prototype.authenticateWithToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                token = process.env.POCKETBASE_AUTH_TOKEN;
                if (token) {
                    console.log('🔑 Using auth token...');
                    this.pb.authStore.save(token);
                    return [2 /*return*/, true];
                }
                return [2 /*return*/, false];
            });
        });
    };
    BatchMHTCETCutoffUploader.prototype.authenticateWithCredentials = function () {
        return __awaiter(this, void 0, void 0, function () {
            var adminEmail, adminPassword, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
                        adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;
                        if (!adminEmail || !adminPassword) {
                            console.error('❌ Missing admin credentials in environment variables');
                            return [2 /*return*/, false];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        console.log('🔑 Authenticating with credentials...');
                        return [4 /*yield*/, this.pb.admins.authWithPassword(adminEmail, adminPassword)];
                    case 2:
                        _a.sent();
                        console.log('✅ Successfully authenticated as admin');
                        return [2 /*return*/, true];
                    case 3:
                        error_1 = _a.sent();
                        console.error('❌ Authentication failed:', error_1);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BatchMHTCETCutoffUploader.prototype.readCSVData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var records = [];
                        (0, fs_1.createReadStream)(_this.csvFilePath)
                            .pipe((0, csv_parse_1.parse)({
                            columns: true,
                            skip_empty_lines: true,
                            trim: true
                        }))
                            .on('data', function (row) {
                            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                            var record = {
                                college_code: ((_a = row.college_code) === null || _a === void 0 ? void 0 : _a.toString()) || '',
                                college_name: ((_b = row.college_name) === null || _b === void 0 ? void 0 : _b.toString()) || '',
                                course_code: ((_c = row.course_code) === null || _c === void 0 ? void 0 : _c.toString()) || '',
                                course_name: ((_d = row.course_name) === null || _d === void 0 ? void 0 : _d.toString()) || '',
                                category: ((_e = row.category) === null || _e === void 0 ? void 0 : _e.toString()) || '',
                                seat_allocation_section: ((_f = row.seat_allocation_section) === null || _f === void 0 ? void 0 : _f.toString()) || '',
                                cutoff_score: ((_g = row.cutoff_score) === null || _g === void 0 ? void 0 : _g.toString()) || '',
                                last_rank: ((_h = row.last_rank) === null || _h === void 0 ? void 0 : _h.toString()) || '',
                                total_admitted: parseInt(row.total_admitted) || 0,
                                status: ((_j = row.status) === null || _j === void 0 ? void 0 : _j.toString()) || '',
                                home_university: ((_k = row.home_university) === null || _k === void 0 ? void 0 : _k.toString()) || ''
                            };
                            records.push(record);
                        })
                            .on('end', function () {
                            console.log("\uD83D\uDCCA Read ".concat(records.length, " records from CSV"));
                            resolve(records);
                        })
                            .on('error', reject);
                    })];
            });
        });
    };
    BatchMHTCETCutoffUploader.prototype.createBatch = function (records, batchId) {
        return __awaiter(this, void 0, void 0, function () {
            var batch, _i, records_1, record;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        batch = this.pb.createBatch();
                        for (_i = 0, records_1 = records; _i < records_1.length; _i++) {
                            record = records_1[_i];
                            batch.collection(this.collectionName).create(record);
                        }
                        return [4 /*yield*/, batch.send({ requestKey: "batch_create_".concat(batchId) })];
                    case 1: 
                    // Add unique request key to prevent auto-cancellation
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BatchMHTCETCutoffUploader.prototype.upsertBatch = function (records, batchId) {
        return __awaiter(this, void 0, void 0, function () {
            var batch, _i, records_2, record, upsertRecord;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        batch = this.pb.createBatch();
                        for (_i = 0, records_2 = records; _i < records_2.length; _i++) {
                            record = records_2[_i];
                            upsertRecord = __assign(__assign({}, record), { id: "".concat(record.college_code, "_").concat(record.course_code, "_").concat(record.category, "_").concat(record.seat_allocation_section) });
                            batch.collection(this.collectionName).upsert(upsertRecord);
                        }
                        return [4 /*yield*/, batch.send({ requestKey: "batch_upsert_".concat(batchId) })];
                    case 1: 
                    // Add unique request key to prevent auto-cancellation
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BatchMHTCETCutoffUploader.prototype.processBatchesConcurrently = function (batches_1) {
        return __awaiter(this, arguments, void 0, function (batches, operation) {
            var batchPromises, completedBatches, _loop_1, this_1, i;
            var _this = this;
            if (operation === void 0) { operation = 'create'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        batchPromises = [];
                        completedBatches = 0;
                        _loop_1 = function (i) {
                            var concurrentBatches, concurrentPromises;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        concurrentBatches = batches.slice(i, i + this_1.maxConcurrentBatches);
                                        concurrentPromises = concurrentBatches.map(function (batch, index) { return __awaiter(_this, void 0, void 0, function () {
                                            var actualIndex, batchId, startTime, result, endTime, duration, error_2;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        actualIndex = i + index;
                                                        batchId = "".concat(Date.now(), "_").concat(actualIndex);
                                                        _a.label = 1;
                                                    case 1:
                                                        _a.trys.push([1, 6, , 7]);
                                                        startTime = Date.now();
                                                        result = void 0;
                                                        if (!(operation === 'upsert')) return [3 /*break*/, 3];
                                                        return [4 /*yield*/, this.upsertBatch(batch, batchId)];
                                                    case 2:
                                                        result = _a.sent();
                                                        return [3 /*break*/, 5];
                                                    case 3: return [4 /*yield*/, this.createBatch(batch, batchId)];
                                                    case 4:
                                                        result = _a.sent();
                                                        _a.label = 5;
                                                    case 5:
                                                        endTime = Date.now();
                                                        duration = endTime - startTime;
                                                        completedBatches++;
                                                        console.log("\u2705 Batch ".concat(actualIndex + 1, " completed in ").concat(duration, "ms (").concat(batch.length, " records) - ").concat(completedBatches, "/").concat(batches.length, " batches done"));
                                                        return [2 /*return*/, result];
                                                    case 6:
                                                        error_2 = _a.sent();
                                                        console.error("\u274C Batch ".concat(actualIndex + 1, " failed:"), error_2);
                                                        throw error_2;
                                                    case 7: return [2 /*return*/];
                                                }
                                            });
                                        }); });
                                        return [4 /*yield*/, Promise.all(concurrentPromises)];
                                    case 1:
                                        _b.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < batches.length)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(i)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        i += this.maxConcurrentBatches;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BatchMHTCETCutoffUploader.prototype.uploadData = function () {
        return __awaiter(this, arguments, void 0, function (operation) {
            var authenticated, _a, records, batches, i, startTime, endTime, totalDuration, recordsPerSecond, error_3;
            if (operation === void 0) { operation = 'create'; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 6, , 7]);
                        console.log('🚀 Starting batch upload process...');
                        return [4 /*yield*/, this.authenticateWithToken()];
                    case 1:
                        _a = (_b.sent());
                        if (_a) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.authenticateWithCredentials()];
                    case 2:
                        _a = (_b.sent());
                        _b.label = 3;
                    case 3:
                        authenticated = _a;
                        if (!authenticated) {
                            throw new Error('Authentication failed');
                        }
                        return [4 /*yield*/, this.readCSVData()];
                    case 4:
                        records = _b.sent();
                        if (records.length === 0) {
                            console.log('⚠️  No records found in CSV file');
                            return [2 /*return*/];
                        }
                        batches = [];
                        for (i = 0; i < records.length; i += this.batchSize) {
                            batches.push(records.slice(i, i + this.batchSize));
                        }
                        console.log("\uD83D\uDCE6 Created ".concat(batches.length, " batches of ").concat(this.batchSize, " records each"));
                        console.log("\u26A1 Processing ".concat(this.maxConcurrentBatches, " batches concurrently for maximum speed"));
                        startTime = Date.now();
                        // Process batches concurrently
                        return [4 /*yield*/, this.processBatchesConcurrently(batches, operation)];
                    case 5:
                        // Process batches concurrently
                        _b.sent();
                        endTime = Date.now();
                        totalDuration = endTime - startTime;
                        recordsPerSecond = Math.round((records.length / totalDuration) * 1000);
                        console.log("\uD83C\uDF89 Successfully ".concat(operation === 'upsert' ? 'upserted' : 'created', " ").concat(records.length, " records!"));
                        console.log("\u23F1\uFE0F  Total time: ".concat(totalDuration, "ms (").concat(Math.round(totalDuration / 1000), "s)"));
                        console.log("\uD83D\uDE80 Speed: ".concat(recordsPerSecond, " records/second"));
                        return [3 /*break*/, 7];
                    case 6:
                        error_3 = _b.sent();
                        console.error('❌ Upload failed:', error_3);
                        throw error_3;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    BatchMHTCETCutoffUploader.prototype.clearCollection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var authenticated, _a, page, hasMore, totalDeleted, result, batch, _i, _b, record, error_4;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 8, , 9]);
                        console.log('🧹 Clearing existing records...');
                        return [4 /*yield*/, this.authenticateWithToken()];
                    case 1:
                        _a = (_c.sent());
                        if (_a) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.authenticateWithCredentials()];
                    case 2:
                        _a = (_c.sent());
                        _c.label = 3;
                    case 3:
                        authenticated = _a;
                        if (!authenticated) {
                            throw new Error('Authentication failed');
                        }
                        page = 1;
                        hasMore = true;
                        totalDeleted = 0;
                        _c.label = 4;
                    case 4:
                        if (!hasMore) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.pb.collection(this.collectionName).getList(page, 500)];
                    case 5:
                        result = _c.sent();
                        if (result.items.length === 0) {
                            hasMore = false;
                            return [3 /*break*/, 7];
                        }
                        batch = this.pb.createBatch();
                        for (_i = 0, _b = result.items; _i < _b.length; _i++) {
                            record = _b[_i];
                            batch.collection(this.collectionName).delete(record.id);
                        }
                        return [4 /*yield*/, batch.send({ requestKey: "batch_delete_".concat(page, "_").concat(Date.now()) })];
                    case 6:
                        _c.sent();
                        totalDeleted += result.items.length;
                        console.log("\uD83D\uDDD1\uFE0F  Deleted ".concat(result.items.length, " records (").concat(totalDeleted, " total)"));
                        page++;
                        hasMore = result.items.length === 500; // Continue if we got a full page
                        return [3 /*break*/, 4];
                    case 7:
                        console.log("\u2705 Successfully deleted ".concat(totalDeleted, " records"));
                        return [3 /*break*/, 9];
                    case 8:
                        error_4 = _c.sent();
                        console.error('❌ Clear collection failed:', error_4);
                        throw error_4;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    return BatchMHTCETCutoffUploader;
}());
// Command line interface
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var uploader, command, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    uploader = new BatchMHTCETCutoffUploader();
                    command = process.argv[2];
                    _a = command;
                    switch (_a) {
                        case 'create': return [3 /*break*/, 1];
                        case 'upsert': return [3 /*break*/, 3];
                        case 'clear': return [3 /*break*/, 5];
                        case 'replace': return [3 /*break*/, 7];
                    }
                    return [3 /*break*/, 10];
                case 1:
                    console.log('📝 Creating new records...');
                    return [4 /*yield*/, uploader.uploadData('create')];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 11];
                case 3:
                    console.log('🔄 Upserting records...');
                    return [4 /*yield*/, uploader.uploadData('upsert')];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 11];
                case 5:
                    console.log('🧹 Clearing collection...');
                    return [4 /*yield*/, uploader.clearCollection()];
                case 6:
                    _b.sent();
                    return [3 /*break*/, 11];
                case 7:
                    console.log('🔄 Replacing all records (clear + create)...');
                    return [4 /*yield*/, uploader.clearCollection()];
                case 8:
                    _b.sent();
                    return [4 /*yield*/, uploader.uploadData('create')];
                case 9:
                    _b.sent();
                    return [3 /*break*/, 11];
                case 10:
                    console.log('📋 Usage:');
                    console.log('  npm run batch-upload create  - Create new records');
                    console.log('  npm run batch-upload upsert  - Upsert records (create or update)');
                    console.log('  npm run batch-upload clear   - Clear all records');
                    console.log('  npm run batch-upload replace - Clear and create (full replace)');
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    });
}
if (require.main === module) {
    main().catch(console.error);
}
exports.default = BatchMHTCETCutoffUploader;
