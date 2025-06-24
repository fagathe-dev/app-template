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
Object.defineProperty(exports, "__esModule", { value: true });
const DATA_FILES_STORAGE_KEY = 'ffr__logfile';
const getURLParams = () => {
    const params = Object.fromEntries(new URL(window.location.href).searchParams.entries());
    return params || {};
};
class UIGrid {
    constructor(dates) {
        this.init();
        this.dates = dates || [];
        // @ts-ignore
        this.urlParams = getURLParams();
    }
    setUpSelection() {
        console.log('Selection set');
    }
    init() {
        this.setUpSelection();
        console.log(this.urlParams);
    }
}
const getData = () => __awaiter(void 0, void 0, void 0, function* () {
    let data;
    if (localStorage.getItem(DATA_FILES_STORAGE_KEY)) {
        data = JSON.parse(localStorage.getItem(DATA_FILES_STORAGE_KEY) || '{}');
    }
    else {
        // @ts-ignore
        data = (yield fetchJSON(API_LOG_FILES_GET, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        }));
        // localStorage.setItem(DATA_FILES_STORAGE_KEY, JSON.stringify(data));
        console.log('Data fetched from API and stored in localStorage');
    }
    return data;
});
const displayFiles = () => __awaiter(void 0, void 0, void 0, function* () {
    const { files, dates } = yield getData();
    const front = new UIGrid();
    console.log({ dates });
    for (const key in files) {
        if (Object.prototype.hasOwnProperty.call(files, key)) {
            const element = files[key];
            if (Array.isArray(element)) {
                for (let i = 0; i < element.length; i++) {
                    console.log(`Array[${i}] :`, element[i]);
                }
            }
            else {
                console.log('Object :', element);
            }
        }
    }
});
displayFiles();
const setUpDate = (event) => {
    const target = event.target;
    const url = new URL(window.location.href);
    const urlParams = url.searchParams;
    urlParams.set('logDay', target.value);
    window.history.pushState({}, '', url);
    // displayFiles();
};
