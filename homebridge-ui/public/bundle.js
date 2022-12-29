(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
/* eslint-disable no-console */
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
exports.__esModule = true;
exports.closeModal = void 0;
//Intro Elements
var pageIntro = document.getElementById('pageIntro');
var introContinue = document.getElementById('introContinue');
//Settings Elements
var menuSettings = document.getElementById('menuSettings');
var pageSettings = document.getElementById('pageSettings');
//Devices Elements
var menuDevices = document.getElementById('menuDevices');
var pageDevices = document.getElementById('pageDevices');
//Miscellaneous Elements
var menuWrapper = document.getElementById('menuWrapper');
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var currentConfig, showIntro, showDevices_1, showSettings_1, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, 6, 7]);
                return [4 /*yield*/, homebridge.getPluginConfig()];
            case 1:
                currentConfig = _a.sent();
                showIntro = function () {
                    introContinue.addEventListener('click', function () {
                        homebridge.showSpinner();
                        pageIntro.style.display = 'none';
                        menuWrapper.style.display = 'inline-flex';
                        showSettings_1();
                        homebridge.hideSpinner();
                    });
                    pageIntro.style.display = 'block';
                };
                showDevices_1 = function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        homebridge.showSpinner();
                        menuDevices.classList.add('btn-elegant');
                        menuDevices.classList.remove('btn-primary');
                        menuSettings.classList.remove('btn-elegant');
                        menuSettings.classList.add('btn-primary');
                        pageDevices.style.display = 'block';
                        homebridge.hideSchemaForm();
                        pageSettings.style.display = 'none';
                        homebridge.hideSpinner();
                        return [2 /*return*/];
                    });
                }); };
                showSettings_1 = function () {
                    homebridge.showSpinner();
                    menuDevices.classList.remove('btn-elegant');
                    menuDevices.classList.add('btn-primary');
                    menuSettings.classList.add('btn-elegant');
                    menuSettings.classList.remove('btn-primary');
                    pageDevices.style.display = 'none';
                    homebridge.showSchemaForm();
                    pageSettings.style.display = 'block';
                    homebridge.hideSpinner();
                };
                menuDevices.addEventListener('click', function () { return showDevices_1(); });
                menuSettings.addEventListener('click', function () { return showSettings_1(); });
                if (!currentConfig.length) return [3 /*break*/, 2];
                menuWrapper.style.display = 'inline-flex';
                showSettings_1();
                return [3 /*break*/, 4];
            case 2:
                currentConfig.push({ name: 'iRobot' });
                return [4 /*yield*/, homebridge.updatePluginConfig(currentConfig)];
            case 3:
                _a.sent();
                showIntro();
                _a.label = 4;
            case 4: return [3 /*break*/, 7];
            case 5:
                err_1 = _a.sent();
                homebridge.toast.error(err_1.message, 'Error');
                return [3 /*break*/, 7];
            case 6:
                homebridge.hideSpinner();
                return [7 /*endfinally*/];
            case 7: return [2 /*return*/];
        }
    });
}); })();
function closeModal() {
    $('#deviceDetails').modal('hide');
}
exports.closeModal = closeModal;

},{}]},{},[1]);
