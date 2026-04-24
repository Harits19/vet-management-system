"use strict";
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
var fs = require("fs");
var BASE_URL = "https://app.aplikasir.com/a/app/sales_data?278311db8";
var HEADERS = {
    accept: "application/json, text/javascript, */*; q=0.01",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    "x-requested-with": "XMLHttpRequest",
    // 🔥 isi dari browser kamu
    cookie: "sess=ikuce7nsbb0980upd6p3ftsj0l4l87ie; storename3=wedianimalcare; cf_clearance=6bVnm2qvpKaaV7GF_VkYwy7rixeLrWyx8wzwMzOFUgs-1777004972-1.2.1.1-_czqoQzl8IW.DY.j93oRvg0IB8sNeg9L6uuJFaczFt6xBLZObp2eW6XgwMzjaUaPvIVasd0UjNp4Y2oDIfBAzSBVtHXtrMLrQNPyUM.E3r4htlWdAPhoI2J_89L5x1WAcfNDfiTLSSPsamk643PYGkyoL3ptbH9vfADkZ24RF38rOiLn8DW33pRVVWe9noeqhVdqzwwKYlzBHZ4ZETOnEmwKXXDm00U32uq3IDEQMR53C15sykbp.lSZjLR6c7y0nM2ISMS3s2diPGUqgxI6gZXE905ZPwcjgQvJ8ypNQo2q4W7SNDhxU8QjY1q9ZCBP9ER61Ppjlb2VI9ujr0pz_A",
};
var PAGE_SIZE = 50;
function fetchAllData() {
    return __awaiter(this, void 0, void 0, function () {
        var start, total, allData, body, res, json, rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    start = 0;
                    total = 0;
                    allData = [];
                    _a.label = 1;
                case 1:
                    body = new URLSearchParams({
                        draw: "1",
                        start: String(start),
                        length: String(PAGE_SIZE),
                        "search[value]": "",
                        "search[regex]": "false",
                    });
                    return [4 /*yield*/, fetch(BASE_URL, {
                            method: "POST",
                            headers: HEADERS,
                            body: body,
                        })];
                case 2:
                    res = _a.sent();
                    if (!res.ok) {
                        throw new Error("HTTP ".concat(res.status));
                    }
                    return [4 /*yield*/, res.json()];
                case 3:
                    json = _a.sent();
                    total = json.recordsTotal;
                    rows = json.data || [];
                    console.log("Fetch ".concat(start, " \u2192 ").concat(start + rows.length));
                    allData.push.apply(allData, rows);
                    start += PAGE_SIZE;
                    // optional delay
                    return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 300); })];
                case 4:
                    // optional delay
                    _a.sent();
                    _a.label = 5;
                case 5:
                    if (allData.length < total) return [3 /*break*/, 1];
                    _a.label = 6;
                case 6: return [2 /*return*/, allData];
            }
        });
    });
}
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var data, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fetchAllData()];
            case 1:
                data = _a.sent();
                console.log("TOTAL:", data.length);
                fs.writeFileSync("sales.json", JSON.stringify(data, null, 2), // 🔥 pretty JSON
                "utf-8");
                console.log("✅ JSON saved: sales.json");
                return [3 /*break*/, 3];
            case 2:
                err_1 = _a.sent();
                console.error(err_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); })();
